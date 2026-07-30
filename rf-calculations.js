(function universalModule(root, factory) {
  const api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  } else {
    root.RFCalculations = api;
  }
})(
  typeof globalThis !== "undefined"
    ? globalThis
    : typeof self !== "undefined"
      ? self
      : this,
  function createRfCalculations() {
    "use strict";

    const SPEED_OF_LIGHT_M_S = 299792458;
    const DEFAULT_MICROSTRIP_MIN_WIDTH_TO_HEIGHT = 0.01;
    const DEFAULT_MICROSTRIP_MAX_WIDTH_TO_HEIGHT = 100;
    const DECIMAL_NUMBER_PATTERN =
      /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/;

    function fail(code, message, details) {
      const error = new Error(message);
      error.name = "RFCalculationError";
      error.code = code;
      if (details !== undefined) {
        error.details = details;
      }
      throw error;
    }

    /**
     * Parse a number without parseFloat's permissive trailing-text behavior.
     * Decimal and scientific notation are accepted; units, commas, hex,
     * Infinity, NaN, blank strings, and non-number values are rejected.
     */
    function parseStrictNumber(value, label = "数值") {
      if (typeof value === "number") {
        if (Number.isFinite(value)) {
          return value;
        }
        fail("INVALID_NUMBER", `${label}必须是有限数字。`, { value });
      }

      if (typeof value !== "string") {
        fail("INVALID_NUMBER", `${label}必须是数字或十进制数字字符串。`, {
          value,
        });
      }

      const text = value.trim();
      if (!text || !DECIMAL_NUMBER_PATTERN.test(text)) {
        fail("INVALID_NUMBER", `${label}格式无效。`, { value });
      }

      const number = Number(text);
      if (!Number.isFinite(number)) {
        fail("INVALID_NUMBER", `${label}必须是有限数字。`, { value });
      }
      return number;
    }

    function requireGreaterThan(value, lowerBound, label) {
      const number = parseStrictNumber(value, label);
      if (!(number > lowerBound)) {
        fail("OUT_OF_RANGE", `${label}必须大于 ${lowerBound}。`, {
          value: number,
          lowerBound,
        });
      }
      return number;
    }

    function requireAtLeast(value, lowerBound, label) {
      const number = parseStrictNumber(value, label);
      if (number < lowerBound) {
        fail("OUT_OF_RANGE", `${label}必须大于或等于 ${lowerBound}。`, {
          value: number,
          lowerBound,
        });
      }
      return number;
    }

    function requireBetween(value, lowerBound, upperBound, label) {
      const number = parseStrictNumber(value, label);
      if (number < lowerBound || number > upperBound) {
        fail(
          "OUT_OF_RANGE",
          `${label}必须位于 ${lowerBound} 到 ${upperBound} 之间。`,
          { value: number, lowerBound, upperBound },
        );
      }
      return number;
    }

    function finiteResult(value, label, options = {}) {
      const allowInfinity = options.allowInfinity === true;
      const allowZero = options.allowZero !== false;

      if (
        (!Number.isFinite(value) && !(allowInfinity && value === Infinity)) ||
        (!allowZero && value === 0)
      ) {
        fail("NUMERIC_OVERFLOW", `${label}超出可计算范围。`, { value });
      }
      return Object.is(value, -0) ? 0 : value;
    }

    function calculateWavelength(frequencyMHz) {
      const frequency = requireGreaterThan(
        frequencyMHz,
        0,
        "频率 (MHz)",
      );
      const wavelengthM = finiteResult(
        SPEED_OF_LIGHT_M_S / 1e6 / frequency,
        "波长",
        { allowZero: false },
      );
      const wavelengthMm = wavelengthM * 1000;

      return {
        frequencyMHz: frequency,
        wavelengthM,
        wavelengthMm,
        wavelengthCm: wavelengthMm / 10,
        halfWaveMm: wavelengthMm / 2,
        quarterWaveMm: wavelengthMm / 4,
      };
    }

    function calculateFspl(distanceM, frequencyMHz) {
      const distance = requireGreaterThan(distanceM, 0, "距离 (m)");
      const frequency = requireGreaterThan(
        frequencyMHz,
        0,
        "频率 (MHz)",
      );
      const unitConstantDb =
        20 * Math.log10((4 * Math.PI * 1e6) / SPEED_OF_LIGHT_M_S);
      const fsplDb = finiteResult(
        20 * Math.log10(distance) +
          20 * Math.log10(frequency) +
          unitConstantDb,
        "自由空间路径损耗",
      );

      return {
        distanceM: distance,
        frequencyMHz: frequency,
        fsplDb,
      };
    }

    function efficiencyDbToPercent(efficiencyDb) {
      const db = parseStrictNumber(efficiencyDb, "效率 (dB)");
      if (db > 0) {
        fail("OUT_OF_RANGE", "效率 (dB) 不能大于 0 dB。", { value: db });
      }
      return finiteResult(100 * 10 ** (db / 10), "效率百分比");
    }

    function efficiencyPercentToDb(efficiencyPercent) {
      const percent = requireBetween(
        efficiencyPercent,
        0,
        100,
        "效率 (%)",
      );
      return percent === 0 ? -Infinity : 10 * Math.log10(percent / 100);
    }

    function gainDbToLinear(gainDb) {
      const db = parseStrictNumber(gainDb, "增益 (dB)");
      return finiteResult(10 ** (db / 10), "线性增益");
    }

    function gainLinearToDb(linearGain) {
      const linear = requireAtLeast(linearGain, 0, "线性增益");
      return linear === 0 ? -Infinity : 10 * Math.log10(linear);
    }

    function dbmToWatts(powerDbm) {
      const dbm = parseStrictNumber(powerDbm, "功率 (dBm)");
      return finiteResult(10 ** ((dbm - 30) / 10), "功率 (W)");
    }

    function wattsToDbm(powerWatts) {
      const watts = requireAtLeast(powerWatts, 0, "功率 (W)");
      return watts === 0 ? -Infinity : 10 * Math.log10(watts) + 30;
    }

    function combineArrayGains(gainsDbi, options = {}) {
      if (!Array.isArray(gainsDbi) || gainsDbi.length === 0) {
        fail("INVALID_ARRAY", "天线增益必须是非空数组。", {
          value: gainsDbi,
        });
      }

      const gains = gainsDbi.map((gain, index) =>
        parseStrictNumber(gain, `第 ${index + 1} 路增益 (dBi)`),
      );
      const normalization = options.normalization || "fixed-total";
      if (
        normalization !== "fixed-total" &&
        normalization !== "per-element"
      ) {
        fail(
          "INVALID_OPTION",
          "normalization 只能是 fixed-total 或 per-element。",
          { normalization },
        );
      }

      // Log-domain accumulation avoids overflow for large dB values.
      const maximumGain = gains.reduce(
        (maximum, gain) => Math.max(maximum, gain),
        -Infinity,
      );
      const incoherentRelativePower = gains.reduce(
        (sum, gain) => sum + 10 ** ((gain - maximumGain) / 10),
        0,
      );
      const coherentRelativeVoltage = gains.reduce(
        (sum, gain) => sum + 10 ** ((gain - maximumGain) / 20),
        0,
      );
      const normalizationDb =
        normalization === "fixed-total" ? 10 * Math.log10(gains.length) : 0;
      const uncorrelatedDbi =
        maximumGain +
        10 * Math.log10(incoherentRelativePower) -
        normalizationDb;
      const coherentDbi =
        maximumGain +
        20 * Math.log10(coherentRelativeVoltage) -
        normalizationDb;

      return {
        count: gains.length,
        normalization,
        uncorrelatedDbi: finiteResult(
          uncorrelatedDbi,
          "非相干合成增益",
        ),
        coherentDbi: finiteResult(coherentDbi, "相干合成增益"),
      };
    }

    function requireEfficiencyDb(value, label = "总效率 (dB)") {
      const efficiency = parseStrictNumber(value, label);
      if (efficiency > 0) {
        fail("OUT_OF_RANGE", `${label}不能大于 0 dB。`, {
          value: efficiency,
        });
      }
      return efficiency;
    }

    function calculateDirectivity(realizedGainDbi, totalEfficiencyDb) {
      const gain = parseStrictNumber(
        realizedGainDbi,
        "峰值实现增益 (dBi)",
      );
      const efficiency = requireEfficiencyDb(totalEfficiencyDb);
      return finiteResult(gain - efficiency, "方向性");
    }

    function calculateEirp(conductedPowerDbm, realizedGainDbi) {
      const power = parseStrictNumber(conductedPowerDbm, "传导功率 (dBm)");
      const gain = parseStrictNumber(
        realizedGainDbi,
        "峰值实现增益 (dBi)",
      );
      return finiteResult(power + gain, "EIRP");
    }

    function calculateTrp(conductedPowerDbm, totalEfficiencyDb) {
      const power = parseStrictNumber(conductedPowerDbm, "传导功率 (dBm)");
      const efficiency = requireEfficiencyDb(totalEfficiencyDb);
      return finiteResult(power + efficiency, "TRP");
    }

    function calculateEis(conductedSensitivityDbm, realizedGainDbi) {
      const sensitivity = parseStrictNumber(
        conductedSensitivityDbm,
        "传导灵敏度 (dBm)",
      );
      const gain = parseStrictNumber(
        realizedGainDbi,
        "指定方向实现增益 (dBi)",
      );
      return finiteResult(sensitivity - gain, "EIS");
    }

    function calculateTis(conductedSensitivityDbm, totalEfficiencyDb) {
      const sensitivity = parseStrictNumber(
        conductedSensitivityDbm,
        "传导灵敏度 (dBm)",
      );
      const efficiency = requireEfficiencyDb(totalEfficiencyDb);
      return finiteResult(sensitivity - efficiency, "TIS");
    }

    function metricsFromReflectionCoefficient(reflectionCoefficient) {
      const gamma = requireBetween(
        reflectionCoefficient,
        0,
        1,
        "反射系数幅度",
      );
      const acceptedPowerFraction = (1 - gamma) * (1 + gamma);

      return {
        reflectionCoefficient: gamma,
        returnLossDb:
          gamma === 0 ? Infinity : -20 * Math.log10(gamma),
        vswr: gamma === 1 ? Infinity : (1 + gamma) / (1 - gamma),
        mismatchLossDb:
          gamma === 1
            ? Infinity
            : finiteResult(
                -10 * Math.log10(acceptedPowerFraction),
                "失配损耗",
              ),
        acceptedPowerPercent: 100 * acceptedPowerFraction,
      };
    }

    function metricsFromVswr(vswr) {
      const ratio = requireAtLeast(vswr, 1, "VSWR");
      const gamma = ratio === 1 ? 0 : (ratio - 1) / (ratio + 1);
      return metricsFromReflectionCoefficient(gamma);
    }

    function metricsFromReturnLoss(returnLossDb) {
      const loss = requireAtLeast(returnLossDb, 0, "回波损耗 RL (dB)");
      const gamma = loss === 0 ? 1 : 10 ** (-loss / 20);
      return metricsFromReflectionCoefficient(gamma);
    }

    function calculateFraunhoferDistance(diameterMm, frequencyMHz) {
      const diameter = requireGreaterThan(
        diameterMm,
        0,
        "天线最大尺寸 (mm)",
      );
      const wave = calculateWavelength(frequencyMHz);
      const diameterM = diameter / 1000;
      const distanceM = finiteResult(
        (2 * diameterM ** 2) / wave.wavelengthM,
        "Fraunhofer 距离",
        { allowZero: false },
      );
      const diameterToWavelengthRatio = diameterM / wave.wavelengthM;

      return {
        diameterMm: diameter,
        frequencyMHz: wave.frequencyMHz,
        wavelengthM: wave.wavelengthM,
        distanceM,
        distanceMm: distanceM * 1000,
        diameterToWavelengthRatio,
        isElectricallyLarge: diameterToWavelengthRatio >= 1,
      };
    }

    /**
     * Aligns the CRLH series and shunt resonance frequencies at f0:
     *   f_se = 1 / (2π√(L_R C_L))
     *   f_sh = 1 / (2π√(L_L C_R))
     * This is a balanced-unit-cell first estimate, not a complete antenna
     * or termination-dependent ZOR design.
     */
    function synthesizeBalancedCrlh(
      targetFrequencyMHz,
      hostShuntCapacitancePf,
      hostSeriesInductanceNh,
    ) {
      const frequency = requireGreaterThan(
        targetFrequencyMHz,
        0,
        "目标频率 (MHz)",
      );
      const crPf = requireGreaterThan(
        hostShuntCapacitancePf,
        0,
        "右手并联电容 CR (pF)",
      );
      const lrNh = requireGreaterThan(
        hostSeriesInductanceNh,
        0,
        "右手串联电感 LR (nH)",
      );
      const angularFrequency = 2 * Math.PI * frequency * 1e6;
      const llNh = finiteResult(
        (1 / (angularFrequency ** 2 * crPf * 1e-12)) * 1e9,
        "左手并联电感 LL",
        { allowZero: false },
      );
      const clPf = finiteResult(
        (1 / (angularFrequency ** 2 * lrNh * 1e-9)) * 1e12,
        "左手串联电容 CL",
        { allowZero: false },
      );

      return {
        targetFrequencyMHz: frequency,
        hostShuntCapacitancePf: crPf,
        hostSeriesInductanceNh: lrNh,
        requiredShuntInductanceNh: llNh,
        requiredSeriesCapacitancePf: clPf,
        balanced: true,
      };
    }

    function estimateViaInductance(viaLengthMm, viaDiameterMm) {
      const length = requireGreaterThan(
        viaLengthMm,
        0,
        "过孔长度 (mm)",
      );
      const diameter = requireGreaterThan(
        viaDiameterMm,
        0,
        "过孔孔径 (mm)",
      );
      const logarithmicFactor = Math.log((4 * length) / diameter) + 1;
      if (!(logarithmicFactor > 0)) {
        fail(
          "MODEL_DOMAIN",
          "该长径比超出过孔电感近似式的有效数学范围。",
          { viaLengthMm: length, viaDiameterMm: diameter },
        );
      }
      const inductanceNh = finiteResult(
        0.2 * length * logarithmicFactor,
        "过孔电感",
        { allowZero: false },
      );

      return {
        viaLengthMm: length,
        viaDiameterMm: diameter,
        aspectRatio: length / diameter,
        inductanceNh,
      };
    }

    function calculateMicrostrip(
      relativePermittivity,
      substrateHeightMm,
      traceWidthMm,
    ) {
      const er = requireAtLeast(relativePermittivity, 1, "相对介电常数 εr");
      const height = requireGreaterThan(
        substrateHeightMm,
        0,
        "介质厚度 h (mm)",
      );
      const width = requireGreaterThan(traceWidthMm, 0, "线宽 W (mm)");
      const ratio = width / height;
      let effectivePermittivity;
      let impedanceOhms;

      if (ratio <= 1) {
        effectivePermittivity =
          (er + 1) / 2 +
          ((er - 1) / 2) *
            (1 / Math.sqrt(1 + 12 / ratio) +
              0.04 * (1 - ratio) ** 2);
        impedanceOhms =
          (60 / Math.sqrt(effectivePermittivity)) *
          Math.log(8 / ratio + ratio / 4);
      } else {
        effectivePermittivity =
          (er + 1) / 2 +
          ((er - 1) / 2) * (1 / Math.sqrt(1 + 12 / ratio));
        impedanceOhms =
          (120 * Math.PI) /
          (Math.sqrt(effectivePermittivity) *
            (ratio +
              1.393 +
              0.667 * Math.log(ratio + 1.444)));
      }

      return {
        relativePermittivity: er,
        substrateHeightMm: height,
        traceWidthMm: width,
        widthToHeightRatio: ratio,
        effectivePermittivity: finiteResult(
          effectivePermittivity,
          "有效介电常数",
          { allowZero: false },
        ),
        impedanceOhms: finiteResult(
          impedanceOhms,
          "微带线特征阻抗",
          { allowZero: false },
        ),
      };
    }

    function synthesizeMicrostrip(
      relativePermittivity,
      substrateHeightMm,
      targetImpedanceOhms,
      options = {},
    ) {
      const er = requireAtLeast(relativePermittivity, 1, "相对介电常数 εr");
      const height = requireGreaterThan(
        substrateHeightMm,
        0,
        "介质厚度 h (mm)",
      );
      const target = requireGreaterThan(
        targetImpedanceOhms,
        0,
        "目标阻抗 (Ω)",
      );
      const minimumRatio =
        options.minimumWidthToHeight === undefined
          ? DEFAULT_MICROSTRIP_MIN_WIDTH_TO_HEIGHT
          : requireGreaterThan(
              options.minimumWidthToHeight,
              0,
              "最小 W/h",
            );
      const maximumRatio =
        options.maximumWidthToHeight === undefined
          ? DEFAULT_MICROSTRIP_MAX_WIDTH_TO_HEIGHT
          : requireGreaterThan(
              options.maximumWidthToHeight,
              0,
              "最大 W/h",
            );

      if (!(maximumRatio > minimumRatio)) {
        fail("INVALID_OPTION", "最大 W/h 必须大于最小 W/h。", {
          minimumWidthToHeight: minimumRatio,
          maximumWidthToHeight: maximumRatio,
        });
      }

      let lowWidth = minimumRatio * height;
      let highWidth = maximumRatio * height;
      const maximumImpedance = calculateMicrostrip(
        er,
        height,
        lowWidth,
      ).impedanceOhms;
      const minimumImpedance = calculateMicrostrip(
        er,
        height,
        highWidth,
      ).impedanceOhms;

      if (target > maximumImpedance || target < minimumImpedance) {
        fail(
          "UNATTAINABLE_TARGET",
          `目标阻抗超出当前 W/h 搜索范围可实现的 ${minimumImpedance.toFixed(
            3,
          )}–${maximumImpedance.toFixed(3)} Ω。`,
          {
            targetImpedanceOhms: target,
            minimumImpedanceOhms: minimumImpedance,
            maximumImpedanceOhms: maximumImpedance,
            minimumWidthMm: lowWidth,
            maximumWidthMm: highWidth,
          },
        );
      }

      for (let iteration = 0; iteration < 80; iteration += 1) {
        const middleWidth = (lowWidth + highWidth) / 2;
        const middleImpedance = calculateMicrostrip(
          er,
          height,
          middleWidth,
        ).impedanceOhms;
        if (middleImpedance > target) {
          lowWidth = middleWidth;
        } else {
          highWidth = middleWidth;
        }
      }

      const traceWidthMm = (lowWidth + highWidth) / 2;
      const analysis = calculateMicrostrip(er, height, traceWidthMm);
      return {
        ...analysis,
        targetImpedanceOhms: target,
        errorOhms: analysis.impedanceOhms - target,
        searchRange: {
          minimumWidthToHeight: minimumRatio,
          maximumWidthToHeight: maximumRatio,
        },
      };
    }

    function estimateSingleResonanceQ(
      centerFrequencyMHz,
      absoluteBandwidthMHz,
      thresholdVswr,
    ) {
      const center = requireGreaterThan(
        centerFrequencyMHz,
        0,
        "中心频率 (MHz)",
      );
      const bandwidth = requireGreaterThan(
        absoluteBandwidthMHz,
        0,
        "绝对带宽 (MHz)",
      );
      const vswr = requireGreaterThan(thresholdVswr, 1, "VSWR 门限");
      if (!(bandwidth < 2 * center)) {
        fail(
          "OUT_OF_RANGE",
          "按中心频率对称定义时，绝对带宽必须小于 2fc。",
          { centerFrequencyMHz: center, absoluteBandwidthMHz: bandwidth },
        );
      }

      const fractionalBandwidth = bandwidth / center;
      const equivalentQ = finiteResult(
        (vswr - 1) / Math.sqrt(vswr) / fractionalBandwidth,
        "单谐振等效 Q",
        { allowZero: false },
      );

      return {
        centerFrequencyMHz: center,
        absoluteBandwidthMHz: bandwidth,
        lowerBandEdgeMHz: center - bandwidth / 2,
        upperBandEdgeMHz: center + bandwidth / 2,
        thresholdVswr: vswr,
        fractionalBandwidth,
        fractionalBandwidthPercent: fractionalBandwidth * 100,
        equivalentQ,
        isNarrowbandApproximation: fractionalBandwidth <= 0.2,
      };
    }

    return Object.freeze({
      SPEED_OF_LIGHT_M_S,
      parseStrictNumber,
      calculateWavelength,
      calculateFspl,
      efficiencyDbToPercent,
      efficiencyPercentToDb,
      gainDbToLinear,
      gainLinearToDb,
      dbmToWatts,
      wattsToDbm,
      combineArrayGains,
      calculateDirectivity,
      calculateEirp,
      calculateTrp,
      calculateEis,
      calculateTis,
      metricsFromReflectionCoefficient,
      metricsFromVswr,
      metricsFromReturnLoss,
      calculateFraunhoferDistance,
      synthesizeBalancedCrlh,
      estimateViaInductance,
      calculateMicrostrip,
      synthesizeMicrostrip,
      estimateSingleResonanceQ,
    });
  },
);
