(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.AntennaArrayTools = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const C = 299792458;
  const DEG = Math.PI / 180;

  function finite(value, label) {
    const text = typeof value === "number" ? String(value) : String(value).trim();
    if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(text)) {
      throw new Error(label + "必须是有效数字。");
    }
    const number = Number(text);
    if (!Number.isFinite(number)) throw new Error(label + "必须是有效数字。");
    return number;
  }

  function parseList(value, expectedLength, label) {
    const text = String(value).trim().replace(/，/g, ",");
    if (!text) throw new Error(label + "不能为空。");
    const parts = text.split(",").map((item) => item.trim());
    if (parts.some((item) => !item)) throw new Error(label + "中存在空值。");
    const values = parts.map((item) => finite(item, label));
    if (values.length !== expectedLength) {
      throw new Error(label + "需要 " + expectedLength + " 个数值，当前为 " + values.length + " 个。");
    }
    return values;
  }

  function wrapPhase(degrees) {
    const wrapped = ((degrees + 180) % 360 + 360) % 360 - 180;
    return Math.abs(wrapped) < 5e-12 ? 0 : wrapped;
  }

  function calculateSteeringPhases(options) {
    const countValue = finite(options.numElements, "阵元数量");
    const count = Math.trunc(countValue);
    const frequencyMHz = finite(options.frequencyMHz, "中心频率");
    const spacingMm = finite(options.spacingMm, "阵元间距");
    const scanAngleDeg = finite(options.scanAngleDeg, "扫描角");
    if (count !== countValue || count < 1 || count > 64) throw new Error("阵元数量必须为 1–64 的整数。");
    if (!(frequencyMHz > 0) || !(spacingMm > 0)) throw new Error("频率和阵元间距必须大于 0。");
    if (Math.abs(scanAngleDeg) >= 90) throw new Error("扫描角必须在 -90° 到 90° 之间（不含端点）。");

    const waveNumber = 2 * Math.PI * frequencyMHz * 1e6 / C;
    const stepDeg = -waveNumber * spacingMm / 1000 * Math.sin(scanAngleDeg * DEG) / DEG;
    return Array.from({ length: count }, (_, index) =>
      wrapPhase((index - (count - 1) / 2) * stepDeg),
    );
  }

  function halfWaveDipoleFactor(theta) {
    const cosine = Math.cos(theta);
    if (Math.abs(cosine) < 1e-8) return 0;
    return Math.cos(Math.PI / 2 * Math.sin(theta)) / cosine;
  }

  function interpolateCrossing(angles, values, insideIndex, outsideIndex, level) {
    const x1 = angles[insideIndex];
    const x2 = angles[outsideIndex];
    const y1 = values[insideIndex];
    const y2 = values[outsideIndex];
    if (y1 === y2) return (x1 + x2) / 2;
    return x1 + (level - y1) * (x2 - x1) / (y2 - y1);
  }

  function beamwidth3dB(angles, db, peakIndex) {
    let left = peakIndex;
    let right = peakIndex;
    while (left > 0 && db[left] >= -3) left -= 1;
    while (right < db.length - 1 && db[right] >= -3) right += 1;
    const leftAngle = left === 0 && db[left] >= -3
      ? angles[0]
      : interpolateCrossing(angles, db, left + 1, left, -3);
    const rightAngle = right === db.length - 1 && db[right] >= -3
      ? angles[angles.length - 1]
      : interpolateCrossing(angles, db, right - 1, right, -3);
    return rightAngle - leftAngle;
  }

  function simulate(options) {
    const startMHz = finite(options.startMHz, "起始频率");
    const stopMHz = finite(options.stopMHz, "终止频率");
    const frequencyPointsValue = finite(options.frequencyPoints, "频率点数");
    const numElementsValue = finite(options.numElements, "阵元数量");
    const frequencyPoints = Math.trunc(frequencyPointsValue);
    const numElements = Math.trunc(numElementsValue);
    const spacingMm = finite(options.spacingMm, "阵元间距");
    const scanAngleDeg = finite(options.scanAngleDeg, "扫描角");
    const anglePoints = options.anglePoints === undefined ? 1001 : Math.trunc(finite(options.anglePoints, "角度采样点"));
    if (!(startMHz > 0) || !(stopMHz >= startMHz)) throw new Error("频率必须大于 0，且终止频率不能小于起始频率。");
    if (frequencyPoints !== frequencyPointsValue || frequencyPoints < 1 || frequencyPoints > 11) throw new Error("频率点数必须为 1–11 的整数。");
    if (numElements !== numElementsValue || numElements < 1 || numElements > 64) throw new Error("阵元数量必须为 1–64 的整数。");
    if (!(spacingMm > 0)) throw new Error("阵元间距必须大于 0。");
    if (Math.abs(scanAngleDeg) >= 90) throw new Error("扫描角必须在 -90° 到 90° 之间（不含端点）。");
    if (anglePoints < 181 || anglePoints > 4001) throw new Error("角度采样点必须为 181–4001。");

    const powerTaper = parseList(options.powerTaper, numElements, "功率加权");
    if (powerTaper.some((value) => value < 0)) throw new Error("功率加权不能为负数。");
    if (powerTaper.every((value) => value === 0)) throw new Error("功率加权不能全部为 0。");
    const amplitudes = powerTaper.map(Math.sqrt);
    const phases = parseList(options.phasesDeg, numElements, "相位分布").map((value) => value * DEG);
    const elementType = options.elementType === "isotropic" ? "isotropic" : "half-wave-dipole";

    const frequenciesMHz = Array.from({ length: frequencyPoints }, (_, index) =>
      frequencyPoints === 1 ? startMHz : startMHz + (stopMHz - startMHz) * index / (frequencyPoints - 1),
    );
    const anglesDeg = Array.from({ length: anglePoints }, (_, index) => -90 + 180 * index / (anglePoints - 1));
    const anglesRad = anglesDeg.map((value) => value * DEG);

    const traces = frequenciesMHz.map((frequencyMHz) => {
      const waveNumber = 2 * Math.PI * frequencyMHz * 1e6 / C;
      const power = new Array(anglePoints);
      let maxPower = -Infinity;
      let peakIndex = 0;
      for (let angleIndex = 0; angleIndex < anglePoints; angleIndex += 1) {
        const theta = anglesRad[angleIndex];
        let real = 0;
        let imaginary = 0;
        for (let element = 0; element < numElements; element += 1) {
          const phase = waveNumber * (element - (numElements - 1) / 2) * spacingMm / 1000 * Math.sin(theta) + phases[element];
          real += amplitudes[element] * Math.cos(phase);
          imaginary += amplitudes[element] * Math.sin(phase);
        }
        const factor = elementType === "isotropic" ? 1 : halfWaveDipoleFactor(theta);
        const pointPower = factor * factor * (real * real + imaginary * imaginary);
        power[angleIndex] = pointPower;
        if (pointPower > maxPower) {
          maxPower = pointPower;
          peakIndex = angleIndex;
        }
      }

      const db = power.map((value) => value > 0 ? 10 * Math.log10(value / maxPower) : -Infinity);
      let integral = 0;
      for (let index = 1; index < anglePoints; index += 1) {
        const y0 = power[index - 1] * Math.cos(anglesRad[index - 1]);
        const y1 = power[index] * Math.cos(anglesRad[index]);
        integral += (y0 + y1) * (anglesRad[index] - anglesRad[index - 1]) / 2;
      }
      return {
        frequencyMHz,
        db,
        peakAngleDeg: anglesDeg[peakIndex],
        beamwidthDeg: beamwidth3dB(anglesDeg, db, peakIndex),
        directivityDbi: 10 * Math.log10(2 * maxPower / integral),
      };
    });

    return {
      anglesDeg,
      traces,
      averageBeamwidthDeg: traces.reduce((sum, trace) => sum + trace.beamwidthDeg, 0) / traces.length,
      centerFrequencyMHz: (startMHz + stopMHz) / 2,
      spacingWavelengthsAtCenter: spacingMm / 1000 / (C / (((startMHz + stopMHz) / 2) * 1e6)),
    };
  }

  function svgElement(name, attributes) {
    const node = document.createElementNS("http://www.w3.org/2000/svg", name);
    Object.entries(attributes || {}).forEach(([key, value]) => node.setAttribute(key, value));
    return node;
  }

  function renderChart(svg, result) {
    const width = 900;
    const height = 500;
    const margin = { left: 64, right: 22, top: 24, bottom: 52 };
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;
    const x = (angle) => margin.left + (angle + 90) / 180 * plotWidth;
    const y = (db) => margin.top + (0 - Math.max(-40, db)) / 40 * plotHeight;
    const colors = ["#256ef2", "#8c40b8", "#228a50", "#d14343", "#df8a1a", "#0fa1b5", "#d94582", "#3754d6", "#d96b45", "#1fa363", "#6e56cf"];
    svg.replaceChildren();
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", "天线阵列归一化方向图，横轴角度，纵轴增益 dB");
    svg.append(svgElement("rect", { x: margin.left, y: margin.top, width: plotWidth, height: plotHeight, fill: "#fbfdff", stroke: "#d7e0ea" }));

    [-40, -30, -20, -10, 0].forEach((tick) => {
      const lineY = y(tick);
      svg.append(svgElement("line", { x1: margin.left, y1: lineY, x2: width - margin.right, y2: lineY, stroke: tick === 0 ? "#9aaabd" : "#e2e8f0", "stroke-width": 1 }));
      const label = svgElement("text", { x: margin.left - 10, y: lineY + 4, "text-anchor": "end", fill: "#516072", "font-size": 12 });
      label.textContent = tick;
      svg.append(label);
    });
    [-90, -60, -30, 0, 30, 60, 90].forEach((tick) => {
      const lineX = x(tick);
      svg.append(svgElement("line", { x1: lineX, y1: margin.top, x2: lineX, y2: height - margin.bottom, stroke: tick === 0 ? "#c1ccd8" : "#e8edf3", "stroke-width": 1 }));
      const label = svgElement("text", { x: lineX, y: height - margin.bottom + 22, "text-anchor": "middle", fill: "#516072", "font-size": 12 });
      label.textContent = tick + "°";
      svg.append(label);
    });

    result.traces.forEach((trace, traceIndex) => {
      const path = trace.db.map((value, index) => `${index ? "L" : "M"}${x(result.anglesDeg[index]).toFixed(2)},${y(value).toFixed(2)}`).join(" ");
      svg.append(svgElement("path", { d: path, fill: "none", stroke: colors[traceIndex % colors.length], "stroke-width": 2.25, "vector-effect": "non-scaling-stroke" }));
    });
    const xLabel = svgElement("text", { x: margin.left + plotWidth / 2, y: height - 8, "text-anchor": "middle", fill: "#142033", "font-size": 13, "font-weight": 600 });
    xLabel.textContent = "角度 (deg)";
    svg.append(xLabel);
    const yLabel = svgElement("text", { x: 17, y: margin.top + plotHeight / 2, transform: `rotate(-90 17 ${margin.top + plotHeight / 2})`, "text-anchor": "middle", fill: "#142033", "font-size": 13, "font-weight": 600 });
    yLabel.textContent = "归一化方向图 (dB)";
    svg.append(yLabel);
    return colors;
  }

  function mount() {
    const byId = (id) => document.getElementById(id);
    const svg = byId("arrayPatternChart");
    if (!svg) return;
    const inputIds = ["apStartFreq", "apStopFreq", "apFreqPoints", "apNumElements", "apSpacing", "apScanAngle", "apElementType", "apTaper", "apPhase"];
    const status = byId("arrayPatternStatus");
    const results = byId("arrayPatternResults");

    function setStatus(message, state) {
      status.textContent = message;
      status.dataset.state = state || "";
    }

    function refreshLists(resetTaper) {
      try {
        const count = Math.trunc(finite(byId("apNumElements").value, "阵元数量"));
        const center = (finite(byId("apStartFreq").value, "起始频率") + finite(byId("apStopFreq").value, "终止频率")) / 2;
        const phases = calculateSteeringPhases({ numElements: count, frequencyMHz: center, spacingMm: byId("apSpacing").value, scanAngleDeg: byId("apScanAngle").value });
        if (resetTaper || !String(byId("apTaper").value).trim()) byId("apTaper").value = Array(count).fill("1.0").join(", ");
        byId("apPhase").value = phases.map((value) => Number(value.toFixed(1))).join(", ");
        setStatus("已按中心频率自动生成渐进相位。", "success");
      } catch (error) {
        setStatus(error.message, "error");
      }
    }

    function run() {
      inputIds.forEach((id) => byId(id).removeAttribute("aria-invalid"));
      try {
        const result = simulate({
          startMHz: byId("apStartFreq").value,
          stopMHz: byId("apStopFreq").value,
          frequencyPoints: byId("apFreqPoints").value,
          numElements: byId("apNumElements").value,
          spacingMm: byId("apSpacing").value,
          scanAngleDeg: byId("apScanAngle").value,
          elementType: byId("apElementType").value,
          powerTaper: byId("apTaper").value,
          phasesDeg: byId("apPhase").value,
        });
        const colors = renderChart(svg, result);
        results.replaceChildren(...result.traces.map((trace, index) => {
          const item = document.createElement("li");
          item.style.setProperty("--trace-color", colors[index % colors.length]);
          item.textContent = `${trace.frequencyMHz.toFixed(1)} MHz｜峰值 ${trace.peakAngleDeg.toFixed(1)}°｜3 dB BW ${trace.beamwidthDeg.toFixed(2)}°｜Dir ${trace.directivityDbi.toFixed(2)} dBi`;
          return item;
        }));
        const spacingWarning = result.spacingWavelengthsAtCenter > 0.5 ? "；间距超过 0.5 λ，请检查栅瓣" : "";
        setStatus(`平均 3 dB 波束宽度 ${result.averageBeamwidthDeg.toFixed(2)}°；中心频率阵元间距 ${result.spacingWavelengthsAtCenter.toFixed(3)} λ${spacingWarning}。`, result.spacingWavelengthsAtCenter > 0.5 ? "warning" : "success");
      } catch (error) {
        setStatus("计算失败：" + error.message, "error");
      }
    }

    byId("btnArrayAutoPhase").addEventListener("click", () => refreshLists(false));
    byId("btnArrayPattern").addEventListener("click", run);
    byId("apNumElements").addEventListener("change", () => refreshLists(true));
    ["apStartFreq", "apStopFreq", "apSpacing", "apScanAngle"].forEach((id) => byId(id).addEventListener("change", () => refreshLists(false)));
    refreshLists(true);
    run();
  }

  return { calculateSteeringPhases, halfWaveDipoleFactor, parseList, simulate, mount };
});
