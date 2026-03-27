const formulasData = [
  {
    title: "1. 3D 空间极化合成 (Total Gain)",
    desc: "在暗室只提供分极化(H 和 V)数据时，本系统在后台使用功率域叠加退回合成总增益。",
    math: "Gain_Total (dB) = 10 * log10( 10^(Gain_H / 10) + 10^(Gain_V / 10) )",
  },
  {
    title: "2. 辐射效率与方向性 (Efficiency & Directivity)",
    desc: "使用球面立体角微元 dΩ = sin(θ)dθdφ 作为带权重的二重积分，对齐 SATIMO/GTS 暗室底层算法。",
    math:
      "Average_Gain (Linear) = Σ [ 10^(Gain/10) * sin(θ) * dθ * dφ ] / Σ [ sin(θ) * dθ * dφ ]\n\nEfficiency (%) = Average_Gain * 100\n\nDirectivity (dBi) = Peak_Gain (dBi) - 10 * log10(Average_Gain)",
  },
  {
    title: "3. 阵列合成：非相干叠加 (Uncorrelated Gain)",
    desc: "模拟 MIMO / 分集天线中，各天线端口互相独立、相位随机的情况。纯功率域叠加后求均值。",
    math: "Gain_Uncorrelated (dB) = 10 * log10[ (1/N) * Σ 10^(Gain_i / 10) ]",
  },
  {
    title: "4. 阵列合成：相干叠加 (Correlated / Beamforming Gain)",
    desc: "模拟 5G 毫米波波束赋形，假设各阵子馈电相位同相叠加(电压域叠加)。除以 √N 用于总馈电功率归一化。",
    math: "Gain_Correlated (dB) = 20 * log10[ (1/√N) * Σ 10^(Gain_i / 20) ]",
  },
  {
    title: "5. 空间覆盖率 (Spatial Coverage / CDF)",
    desc: "评估大于某个阈值的有效辐射面积占整个物理球面的百分比。",
    math: "Coverage (%) = [ Σ(sin(θ)_pass) / Σ(sin(θ)_all) ] * 100",
  },
  {
    title: "6. 效率(%) 与 dB 换算",
    desc: "天线效率常用百分比和 dB 两种形式表达。这里按功率效率换算，例如 50% 对应 -3.01 dB。",
    math: "Efficiency (%) = 10^(dB / 10) * 100\n\ndB = 10 * log10(Efficiency / 100)\n\n示例: 50% = 10 * log10(0.5) = -3.01 dB",
  },
  {
    title: "7. 有源与无源指标等效评估 (Active vs Passive)",
    desc: "打通无源(Passive)与有源(OTA)测试的核心链路，用于快速预估整机辐射性能。网页版当前按桌面版最新逻辑，输入增益和效率，反推方向性。",
    math:
      "Directionality (dBi) = Gain (dBi) - Efficiency (dB)\n\nEIRP (dBm) = Conducted Power (dBm) + Gain (dBi)\nTRP (dBm) = Conducted Power (dBm) + Efficiency (dB)\n\nEIS (dBm) = Conducted Sensitivity (dBm) - Gain (dBi)\nTIS (dBm) = Conducted Sensitivity (dBm) - Efficiency (dB)",
  },
  {
    title: "8. 驻波与回波损耗换算 (VSWR ↔ Return Loss)",
    desc: "评估天线端口匹配程度的核心指标。VSWR 和 RL 是一一对应的。失配损耗代表因为端口阻抗不匹配而未进入天线的能量比例。",
    math:
      "Γ = (VSWR - 1) / (VSWR + 1) 或 10^(-RL / 20)\n\nRL (dB) = -20 * log10(Γ)\n\nMismatch Loss (dB) = -10 * log10(1 - Γ^2)\n\nTransmitted Power (%) = (1 - Γ^2) * 100",
  },
  {
    title: "9. 远场测试距离 (Fraunhofer Distance)",
    desc: "进入 OTA 暗室测试前必须满足的最小距离条件。只有测试探头距离大于 R 时，辐射球面波才可以近似等效为平面波。",
    math: "R = (2 * D^2) / λ\n\n其中 D 为天线最大物理轮廓尺寸，λ 为空间波长，单位统一为米。",
  },
];

const bandData = window.BAND_DATA || {};

const $ = (id) => document.getElementById(id);

function normalizeBandKey(value) {
  let band = value.trim().toLowerCase().replace(/\s+/g, "");
  if (band.startsWith("band")) {
    band = band.slice(4);
  } else if (band.startsWith("nr")) {
    band = `n${band.slice(2)}`;
  } else if (/^b\d+$/.test(band)) {
    band = band.slice(1);
  }
  return band;
}

function isFiniteNumber(value) {
  return Number.isFinite(value);
}

function setOutputs(ids, value = "---") {
  ids.forEach((id) => {
    $(id).value = value;
  });
}

function formatFixed(value, digits = 2) {
  return isFiniteNumber(value) ? value.toFixed(digits) : "---";
}

function formatSmart(value, digits = 4) {
  if (!isFiniteNumber(value)) {
    return "---";
  }
  return Number(value.toPrecision(digits)).toString();
}

function wireSelectAll() {
  document.querySelectorAll(".calc-input").forEach((input) => {
    input.addEventListener("focus", () => input.select());
    input.addEventListener("mouseup", (event) => event.preventDefault());
  });
}

function renderFormulas() {
  const list = $("formulaList");
  formulasData.forEach((item, index) => {
    const details = document.createElement("details");
    details.className = "formula-card";
    details.open = index === 0;

    const summary = document.createElement("summary");
    summary.textContent = item.title;

    const body = document.createElement("div");
    body.className = "formula-body";

    const desc = document.createElement("p");
    desc.textContent = item.desc;

    const math = document.createElement("pre");
    math.textContent = item.math;

    body.append(desc, math);
    details.append(summary, body);
    list.append(details);
  });
}

function setupTabs() {
  const buttons = document.querySelectorAll(".tab-button");
  const panels = document.querySelectorAll(".content-panel");

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const target = button.dataset.tabTarget;
      buttons.forEach((item) => item.classList.toggle("is-active", item === button));
      panels.forEach((panel) => {
        const active = panel.id === target;
        panel.hidden = !active;
        panel.classList.toggle("is-active", active);
      });
    });
  });
}

function calcWavelength() {
  const f = parseFloat($("freqInput").value);
  if (f > 0) {
    const wlMm = (300 / f) * 1000;
    $("waveMm").value = formatFixed(wlMm, 2);
    $("waveCm").value = formatFixed(wlMm / 10, 2);
    $("halfWave").value = formatFixed(wlMm / 2, 2);
    $("quarterWave").value = formatFixed(wlMm / 4, 2);
    return;
  }
  setOutputs(["waveMm", "waveCm", "halfWave", "quarterWave"]);
}

function queryBand() {
  const raw = $("bandInput").value;
  const band = normalizeBandKey(raw);
  let result = "❌ 未找到该Band频段信息";

  if (bandData[band]) {
    result = bandData[band];
  } else if (band.startsWith("n") && bandData[band.slice(1)]) {
    result = bandData[band.slice(1)];
  } else if (band && bandData[`n${band}`]) {
    result = bandData[`n${band}`];
  }

  $("bandResult").value = result;
}

function calcFspl() {
  const d = parseFloat($("fsplDistance").value);
  const f = parseFloat($("fsplFreq").value);
  if (d > 0 && f > 0) {
    const fspl = 20 * Math.log10(d) + 20 * Math.log10(f) - 27.55;
    $("fsplResult").value = formatFixed(fspl, 2);
    return;
  }
  setOutputs(["fsplResult"]);
}

function syncEfficiencyFromDb() {
  const db = parseFloat($("effDbInput").value);
  if (!isFiniteNumber(db)) {
    $("effPctInput").value = "";
    return;
  }
  const effPct = (10 ** (db / 10)) * 100;
  $("effPctInput").value = formatFixed(effPct, 2);
}

function syncDbFromEfficiency() {
  const effPct = parseFloat($("effPctInput").value);
  if (!(effPct > 0)) {
    $("effDbInput").value = "";
    return;
  }
  const db = 10 * Math.log10(effPct / 100);
  $("effDbInput").value = formatFixed(db, 4);
}

function syncWattFromDbm() {
  const dbm = parseFloat($("dbmInput").value);
  if (!isFiniteNumber(dbm)) {
    $("wattInput").value = "";
    return;
  }
  const watt = 10 ** ((dbm - 30) / 10);
  $("wattInput").value = formatSmart(watt, 4);
}

function syncDbmFromWatt() {
  const watt = parseFloat($("wattInput").value);
  if (!(watt > 0)) {
    $("dbmInput").value = "";
    return;
  }
  const dbm = 10 * Math.log10(watt) + 30;
  $("dbmInput").value = formatFixed(dbm, 4);
}

function calcArrayGain() {
  try {
    const gains = $("arrayGains")
      .value.replace(/，/g, ",")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .map(Number);

    if (!gains.length || gains.some((item) => !isFiniteNumber(item))) {
      throw new Error("Invalid gains");
    }

    const count = gains.length;
    const uncorr = 10 * Math.log10(gains.reduce((sum, g) => sum + 10 ** (g / 10), 0) / count);
    const corr =
      20 *
      Math.log10(
        gains.reduce((sum, g) => sum + 10 ** (g / 20), 0) / Math.sqrt(count),
      );

    $("arrayUncorr").value = formatFixed(uncorr, 2);
    $("arrayCorr").value = formatFixed(corr, 2);
  } catch (_error) {
    setOutputs(["arrayUncorr", "arrayCorr"]);
  }
}

function calcActivePassive() {
  const gain = parseFloat($("gainInput").value);
  const eff = parseFloat($("effInput").value);
  const condPower = parseFloat($("condPower").value);
  const condSens = parseFloat($("condSens").value);

  if ([gain, eff, condPower, condSens].every(isFiniteNumber)) {
    $("directivityOutput").value = formatFixed(gain - eff, 2);
    $("eirpOutput").value = formatFixed(condPower + gain, 2);
    $("trpOutput").value = formatFixed(condPower + eff, 2);
    $("eisOutput").value = formatFixed(condSens - gain, 2);
    $("tisOutput").value = formatFixed(condSens - eff, 2);
    return;
  }

  setOutputs([
    "directivityOutput",
    "eirpOutput",
    "trpOutput",
    "eisOutput",
    "tisOutput",
  ]);
}

function fillVswrOutputs(gamma) {
  const rl = gamma > 0 ? -20 * Math.log10(gamma) : 99.99;
  const ml = -10 * Math.log10(1 - gamma ** 2);
  $("gammaOutput").value = formatFixed(gamma, 3);
  $("mlOutput").value = formatFixed(ml, 3);
  $("transPctOutput").value = formatFixed((1 - gamma ** 2) * 100, 1);
  $("rlInput").value = formatFixed(rl, 2);
}

function syncRlFromVswr() {
  const vswr = parseFloat($("vswrInput").value);
  if (!isFiniteNumber(vswr)) {
    setOutputs(["gammaOutput", "mlOutput", "transPctOutput"]);
    $("rlInput").value = "";
    return;
  }

  if (vswr === 1) {
    $("rlInput").value = "99.99";
    $("gammaOutput").value = "0.000";
    $("mlOutput").value = "0.000";
    $("transPctOutput").value = "100.0";
    return;
  }

  if (vswr > 1) {
    const gamma = (vswr - 1) / (vswr + 1);
    fillVswrOutputs(gamma);
    return;
  }

  setOutputs(["gammaOutput", "mlOutput", "transPctOutput"]);
  $("rlInput").value = "";
}

function syncVswrFromRl() {
  const rlRaw = parseFloat($("rlInput").value);
  const rl = Math.abs(rlRaw);

  if (!(rl > 0)) {
    setOutputs(["gammaOutput", "mlOutput", "transPctOutput"]);
    $("vswrInput").value = "";
    return;
  }

  const gamma = 10 ** (-rl / 20);
  const vswr = (1 + gamma) / (1 - gamma);
  $("vswrInput").value = formatFixed(vswr, 2);
  $("gammaOutput").value = formatFixed(gamma, 3);
  $("mlOutput").value = formatFixed(-10 * Math.log10(1 - gamma ** 2), 3);
  $("transPctOutput").value = formatFixed((1 - gamma ** 2) * 100, 1);
}

function calcFarField() {
  const diameterMm = parseFloat($("ffDiameter").value);
  const freq = parseFloat($("ffFreq").value);

  if (diameterMm > 0 && freq > 0) {
    const wavelengthM = 300 / freq;
    const diameterM = diameterMm / 1000;
    const distanceM = (2 * diameterM ** 2) / wavelengthM;
    $("ffMeters").value = formatFixed(distanceM, 3);
    $("ffMillimeters").value = formatFixed(distanceM * 1000, 1);
    return;
  }

  setOutputs(["ffMeters", "ffMillimeters"]);
}

function bindEvents() {
  $("freqInput").addEventListener("input", calcWavelength);
  $("bandInput").addEventListener("input", queryBand);
  $("fsplDistance").addEventListener("input", calcFspl);
  $("fsplFreq").addEventListener("input", calcFspl);

  $("effDbInput").addEventListener("input", syncEfficiencyFromDb);
  $("effPctInput").addEventListener("input", syncDbFromEfficiency);

  $("dbmInput").addEventListener("input", syncWattFromDbm);
  $("wattInput").addEventListener("input", syncDbmFromWatt);

  $("arrayGains").addEventListener("input", calcArrayGain);

  ["gainInput", "effInput", "condPower", "condSens"].forEach((id) => {
    $(id).addEventListener("input", calcActivePassive);
  });

  $("vswrInput").addEventListener("input", syncRlFromVswr);
  $("rlInput").addEventListener("input", syncVswrFromRl);

  $("ffDiameter").addEventListener("input", calcFarField);
  $("ffFreq").addEventListener("input", calcFarField);
}

function init() {
  wireSelectAll();
  renderFormulas();
  setupTabs();
  bindEvents();

  calcWavelength();
  queryBand();
  calcFspl();
  syncEfficiencyFromDb();
  syncWattFromDbm();
  calcArrayGain();
  calcActivePassive();
  syncRlFromVswr();
  calcFarField();
}

window.addEventListener("DOMContentLoaded", init);
