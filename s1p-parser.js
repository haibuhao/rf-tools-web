(function exposeTouchstoneS1p(global) {
  "use strict";

  const FREQUENCY_MULTIPLIERS = {
    hz: 1,
    khz: 1e3,
    mhz: 1e6,
    ghz: 1e9,
  };
  const DATA_FORMATS = new Set(["ri", "ma", "db"]);
  const PARAMETER_TYPES = new Set(["s", "y", "z", "h", "g"]);
  const DEFAULT_OPTIONS = {
    frequencyUnit: "ghz",
    parameter: "s",
    format: "ma",
    referenceOhms: 50,
  };
  const MAX_RAW_POINTS = 100000;

  class TouchstoneParseError extends Error {
    constructor(code, message, line = null) {
      super(line ? `第 ${line} 行：${message}` : message);
      this.name = "TouchstoneParseError";
      this.code = code;
      this.line = line;
    }
  }

  function parseNumber(token, lineNumber, label) {
    const normalized = token.replace(/d([+-]?\d+)$/i, "e$1");
    const value = Number(normalized);
    if (!Number.isFinite(value)) {
      throw new TouchstoneParseError(
        "INVALID_NUMBER",
        `${label}“${token}”不是有效数字`,
        lineNumber,
      );
    }
    return value;
  }

  function parseOptionLine(line, lineNumber) {
    const tokens = line.slice(1).trim().toLowerCase().split(/\s+/).filter(Boolean);
    const options = { ...DEFAULT_OPTIONS };

    for (let index = 0; index < tokens.length; index += 1) {
      const token = tokens[index];

      if (Object.prototype.hasOwnProperty.call(FREQUENCY_MULTIPLIERS, token)) {
        options.frequencyUnit = token;
      } else if (PARAMETER_TYPES.has(token)) {
        if (token !== "s") {
          throw new TouchstoneParseError(
            "UNSUPPORTED_PARAMETER",
            `当前匹配导入只支持 S 参数，不支持 ${token.toUpperCase()} 参数`,
            lineNumber,
          );
        }
        options.parameter = token;
      } else if (DATA_FORMATS.has(token)) {
        options.format = token;
      } else if (token === "r") {
        const referenceToken = tokens[index + 1];
        if (!referenceToken) {
          throw new TouchstoneParseError(
            "INVALID_REFERENCE",
            "R 后缺少参考阻抗",
            lineNumber,
          );
        }
        const referenceOhms = parseNumber(
          referenceToken,
          lineNumber,
          "参考阻抗",
        );
        if (!(referenceOhms > 0)) {
          throw new TouchstoneParseError(
            "INVALID_REFERENCE",
            "参考阻抗必须大于 0 Ω",
            lineNumber,
          );
        }
        options.referenceOhms = referenceOhms;
        index += 1;
      } else {
        throw new TouchstoneParseError(
          "INVALID_OPTION",
          `无法识别选项“${token}”`,
          lineNumber,
        );
      }
    }

    return options;
  }

  function sPairToComplex(value1, value2, format) {
    if (format === "ri") {
      return { re: value1, im: value2 };
    }

    const magnitude = format === "db" ? 10 ** (value1 / 20) : value1;
    const angleRad = value2 * Math.PI / 180;
    return {
      re: magnitude * Math.cos(angleRad),
      im: magnitude * Math.sin(angleRad),
    };
  }

  function reflectionToImpedance(gamma, referenceOhms) {
    const denominator = (1 - gamma.re) ** 2 + gamma.im ** 2;
    if (denominator <= 1e-24) {
      return { re: Infinity, im: Infinity };
    }

    return {
      re:
        referenceOhms *
        (1 - gamma.re * gamma.re - gamma.im * gamma.im) /
        denominator,
      im: referenceOhms * 2 * gamma.im / denominator,
    };
  }

  function parseTouchstoneS1p(text) {
    if (typeof text !== "string" || !text.trim()) {
      throw new TouchstoneParseError("EMPTY_FILE", "S1P 文件为空");
    }

    const lines = text.replace(/^\uFEFF/, "").replace(/\r/g, "").split("\n");
    let options = { ...DEFAULT_OPTIONS };
    let optionSeen = false;
    let previousFrequencyHz = -Infinity;
    let touchstoneVersion = "1.x";
    let isVersion2 = false;
    let networkDataSeen = false;
    let inNetworkData = true;
    let inInformationBlock = false;
    let declaredFrequencies = null;
    let idealOpenPointCount = 0;
    const points = [];
    const warnings = [];

    for (let index = 0; index < lines.length; index += 1) {
      const lineNumber = index + 1;
      const content = lines[index].split("!")[0].trim();
      if (!content) {
        continue;
      }

      if (content.startsWith("[")) {
        const keywordMatch = content.match(/^\[([^\]]+)\]\s*(.*)$/);
        if (!keywordMatch) {
          throw new TouchstoneParseError(
            "INVALID_KEYWORD",
            "Touchstone 2.x 关键字格式无效",
            lineNumber,
          );
        }

        const keyword = keywordMatch[1].trim().toLowerCase();
        const value = keywordMatch[2].trim();
        if (keyword === "version") {
          if (value !== "2.0" && value !== "2.1") {
            throw new TouchstoneParseError(
              "UNSUPPORTED_VERSION",
              `不支持 Touchstone ${value || "未知版本"}`,
              lineNumber,
            );
          }
          touchstoneVersion = value;
          isVersion2 = true;
          inNetworkData = false;
        } else if (keyword === "number of ports") {
          const portCount = parseNumber(value, lineNumber, "端口数量");
          if (portCount !== 1) {
            throw new TouchstoneParseError(
              "NOT_ONE_PORT",
              `当前只支持一端口 S1P，文件声明了 ${portCount} 个端口`,
              lineNumber,
            );
          }
        } else if (keyword === "number of frequencies") {
          declaredFrequencies = parseNumber(value, lineNumber, "频点数量");
          if (!Number.isInteger(declaredFrequencies) || declaredFrequencies < 0) {
            throw new TouchstoneParseError(
              "INVALID_FREQUENCY_COUNT",
              "频点数量必须是非负整数",
              lineNumber,
            );
          }
        } else if (keyword === "reference") {
          const referenceToken = value.split(/\s+/)[0];
          const referenceOhms = parseNumber(
            referenceToken,
            lineNumber,
            "参考阻抗",
          );
          if (!(referenceOhms > 0)) {
            throw new TouchstoneParseError(
              "INVALID_REFERENCE",
              "参考阻抗必须大于 0 Ω",
              lineNumber,
            );
          }
          options.referenceOhms = referenceOhms;
        } else if (keyword === "network data") {
          isVersion2 = true;
          networkDataSeen = true;
          inNetworkData = true;
        } else if (keyword === "noise data") {
          inNetworkData = false;
        } else if (keyword === "begin information") {
          inInformationBlock = true;
        } else if (keyword === "end information") {
          inInformationBlock = false;
        } else if (keyword === "end") {
          break;
        }
        continue;
      }

      if (content.startsWith("#")) {
        options = parseOptionLine(content, lineNumber);
        optionSeen = true;
        continue;
      }
      if (inInformationBlock) {
        continue;
      }
      if (isVersion2 && !inNetworkData) {
        throw new TouchstoneParseError(
          "DATA_BEFORE_NETWORK",
          "Touchstone 2.x 网络数据必须位于 [Network Data] 之后",
          lineNumber,
        );
      }

      const tokens = content.split(/\s+/);
      if (tokens.length !== 3) {
        throw new TouchstoneParseError(
          "INVALID_DATA_ROW",
          `一端口数据应为“频率 值1 值2”，当前有 ${tokens.length} 列`,
          lineNumber,
        );
      }

      const frequencyValue = parseNumber(tokens[0], lineNumber, "频率");
      const value1 = parseNumber(tokens[1], lineNumber, "S11 值1");
      const value2 = parseNumber(tokens[2], lineNumber, "S11 值2");
      const frequencyHz =
        frequencyValue * FREQUENCY_MULTIPLIERS[options.frequencyUnit];

      if (!Number.isFinite(frequencyHz) || !(frequencyHz > 0)) {
        throw new TouchstoneParseError(
          "NON_POSITIVE_FREQUENCY",
          "换算后的频率必须是有限且大于 0 的数值",
          lineNumber,
        );
      }
      if (frequencyHz <= previousFrequencyHz) {
        throw new TouchstoneParseError(
          "NON_INCREASING_FREQUENCY",
          "频率必须严格递增",
          lineNumber,
        );
      }

      if (options.format === "ma" && value1 < 0) {
        throw new TouchstoneParseError(
          "NEGATIVE_MAGNITUDE",
          "MA 格式的幅度不能为负数",
          lineNumber,
        );
      }

      const s11 = sPairToComplex(value1, value2, options.format);
      if (!Number.isFinite(s11.re) || !Number.isFinite(s11.im)) {
        throw new TouchstoneParseError(
          "S_PARAMETER_OVERFLOW",
          "S11 换算后超出浏览器可表示的数值范围",
          lineNumber,
        );
      }
      const impedanceOhms = reflectionToImpedance(
        s11,
        options.referenceOhms,
      );
      if (!Number.isFinite(impedanceOhms.re)) {
        idealOpenPointCount += 1;
      }

      points.push({
        frequencyHz,
        s11,
        impedanceOhms,
        sourceLine: lineNumber,
      });
      previousFrequencyHz = frequencyHz;

      if (points.length > MAX_RAW_POINTS) {
        throw new TouchstoneParseError(
          "TOO_MANY_POINTS",
          `原始数据超过 ${MAX_RAW_POINTS} 点`,
          lineNumber,
        );
      }
    }

    if (!points.length) {
      throw new TouchstoneParseError("NO_DATA", "没有找到有效的一端口数据");
    }
    if (isVersion2 && !networkDataSeen) {
      throw new TouchstoneParseError(
        "MISSING_NETWORK_DATA",
        "Touchstone 2.x 缺少 [Network Data] 段",
      );
    }
    if (!optionSeen) {
      warnings.push("未找到选项行，已按 Touchstone 默认值 GHz / S / MA / R 50 解析");
    }
    if (idealOpenPointCount) {
      warnings.push(
        `${idealOpenPointCount} 个理想开路点将在匹配计算时跳过`,
      );
    }
    if (
      declaredFrequencies !== null &&
      declaredFrequencies !== points.length
    ) {
      warnings.push(
        `文件声明 ${declaredFrequencies} 个频点，实际解析到 ${points.length} 个`,
      );
    }

    return {
      metadata: {
        version: touchstoneVersion,
        frequencyUnit: options.frequencyUnit.toUpperCase(),
        parameter: options.parameter.toUpperCase(),
        format: options.format.toUpperCase(),
        referenceOhms: options.referenceOhms,
      },
      points,
      warnings,
    };
  }

  function filterPointsByFrequency(points, minHz, maxHz) {
    return points.filter(
      (point) => point.frequencyHz >= minHz && point.frequencyHz <= maxHz,
    );
  }

  function sampleTouchstonePoints(points, maxPoints) {
    if (points.length <= maxPoints) {
      return points.slice();
    }
    if (!(maxPoints >= 2)) {
      throw new Error("maxPoints 必须至少为 2");
    }

    const sampled = [];
    const lastIndex = points.length - 1;
    for (let index = 0; index < maxPoints; index += 1) {
      const sourceIndex = Math.round(index * lastIndex / (maxPoints - 1));
      sampled.push(points[sourceIndex]);
    }
    return sampled;
  }

  function toMatcherPoints(points) {
    return points
      .filter(
        (point) =>
          Number.isFinite(point.impedanceOhms.re) &&
          Number.isFinite(point.impedanceOhms.im) &&
          point.impedanceOhms.re > 0,
      )
      .map((point) => ({
        fHz: point.frequencyHz,
        Z: {
          R: point.impedanceOhms.re,
          X: point.impedanceOhms.im,
        },
      }));
  }

  global.TouchstoneS1P = {
    TouchstoneParseError,
    filterPointsByFrequency,
    parseOptionLine,
    parseTouchstoneS1p,
    reflectionToImpedance,
    sPairToComplex,
    sampleTouchstonePoints,
    toMatcherPoints,
  };
})(window);
