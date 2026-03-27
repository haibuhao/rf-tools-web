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
    title: "03. 史密斯圆图单频 L 型阻抗匹配 (L-Section Matching)",
    desc: "将复数负载 (RL+jXL) 匹配到 50 欧姆。有两个准则：如果实部 RL 大于 50 欧姆，先并在负载侧，后串在源端；如果 RL 小于 50 欧姆，先串在负载侧，后并在源端（这可以通过 Q 因子原理证明）。",
    math: "并联导纳 Bp = 1 / Xp, 串联阻抗 Xs。目标: Rin = 50 且 Xin = 0。\n当电抗需要是正数，则该元件为电感 L = X / (2πf)。\n当电抗需要是负数，则该元件为电容 C = -1 / (2πfX)。",
  },

  {
    title: "04. 双阶宽频阻抗匹配 (Pi / T 型网络)",
    desc: "宽带必备算法。通过寻找匹配中间节点阻抗 R_mid = √(50 × R_antenna)，将单级 L 网降维成两个低 Q 值的 L 网络级联。并联器件相邻合并成 Π 型，串联相邻合并成 T 型。",
    math: "降 Q 思路：总匹配频带不仅满足 f_c，还能大幅拉平两端驻波。\\nΠ 型特征：头尾对地并联元件，中间串联。\\nT 型特征：头尾串联元件，中间对地并联。",
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

  {
    title: "12. 零阶谐振器参数综合 (ZOR CRLH)",
    desc: "ZOR 天线在零阶模式（β=0）时的工作频率由等效分布参数L和C决定，不受物理波长限制。输入目标频率，反求出左手(LH)并联电感和左手串联电容值。",
    math: "并联(ε-zero): f0 = 1 / [2π * √(LL * CR)]\n串联(μ-zero): f0 = 1 / [2π * √(LR * CL)]\n\n短截线/过孔预估引脚电感:\nL (nH) ≈ 0.2 * h * [ln(4h / d) + 1]  (h与d单位为mm)",
  },

  {
    title: "13. 微带线特征阻抗综合 (Microstrip)",
    desc: "使用经典的 Wheeler/Hammerstad 公式估算顶层微带线的 Z0。通常 1.6mm 的 FR4 产生 50 欧姆特征阻抗所需的线宽约在 3.0 ~ 3.1 毫米。",
    math: "W/h ≤ 1:\nε_eff = (ε_r+1)/2 + (ε_r-1)/2 * [1/√(1 + 12h/W) + 0.04(1 - W/h)^2]\nZ0 = 60 / √ε_eff * ln(8h/W + W/4h)\n\nW/h > 1:\nε_eff = (ε_r+1)/2 + (ε_r-1)/2 * 1/√(1 + 12h/W)\nZ0 = 120π / [√ε_eff * (W/h + 1.393 + 0.667*ln(W/h + 1.444))]",
  },

  {
    title: "14. 品质因数与物理带宽 (Q Factor & FBW)",
    desc: "评估一个谐振式小型化天线的性能极限（Q值越小，频带越宽）。",
    math: "分数带宽 FBW = Δf / fc\n\n对于给定的目标驻波比门限 S (例如 S=2 代表 -9.54 dB):\n品质因数 Q ≈ [ (S - 1) / √S ] / FBW",
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

function calcZor() {
  const f0 = parseFloat($("zorFreq").value);
  const Cr = parseFloat($("zorCr").value);
  const Lr = parseFloat($("zorLr").value);

  if (f0 > 0 && Cr > 0 && Lr > 0) {
    const f0Hz = f0 * 1e6;
    const CrF = Cr * 1e-12;
    const LrH = Lr * 1e-9;

    const LlH = 1 / ((2 * Math.PI * f0Hz) ** 2 * CrF);
    const ClF = 1 / ((2 * Math.PI * f0Hz) ** 2 * LrH);

    $("zorReqLl").value = formatFixed(LlH * 1e9, 3);
    $("zorReqCl").value = formatFixed(ClF * 1e12, 3);
    return;
  }
  setOutputs(["zorReqLl", "zorReqCl"]);
}

function calcViaInductance() {
  const h = parseFloat($("viaHeight").value);
  const d = parseFloat($("viaDiam").value);

  if (h > 0 && d > 0) {
    const L = 0.2 * h * (Math.log((4 * h) / d) + 1);
    $("viaEstInd").value = formatFixed(L, 3);
    return;
  }
  setOutputs(["viaEstInd"]);
}

function calcMsZ0(er, h, w) {
  const r = w / h;
  let eeff = 0;
  let z0 = 0;
  if (r <= 1) {
    eeff = (er + 1) / 2 + ((er - 1) / 2) * (1 / Math.sqrt(1 + 12 / r) + 0.04 * (1 - r) ** 2);
    z0 = (60 / Math.sqrt(eeff)) * Math.log(8 / r + r / 4);
  } else {
    eeff = (er + 1) / 2 + ((er - 1) / 2) * (1 / Math.sqrt(1 + 12 / r));
    z0 = (120 * Math.PI) / (Math.sqrt(eeff) * (r + 1.393 + 0.667 * Math.log(r + 1.444)));
  }
  return { z0, eeff };
}

function calcMicrostrip() {
  const er = parseFloat($("msEr").value);
  const h = parseFloat($("msH").value);
  const w = parseFloat($("msW").value);
  const targetZ0 = parseFloat($("msTargetZ0").value);

  if (er > 0 && h > 0) {
    if (w > 0) {
      const res = calcMsZ0(er, h, w);
      $("msZ0Result").value = formatFixed(res.z0, 2);
      $("msEeffResult").value = formatFixed(res.eeff, 3);
    } else {
      setOutputs(["msZ0Result", "msEeffResult"]);
    }
    
    if (targetZ0 > 0) {
      let low = 0.001;
      let high = 100.0 * h; 
      let bestW = 0;
      for (let i = 0; i < 50; i++) {
        const mid = (low + high) / 2;
        const testZ0 = calcMsZ0(er, h, mid).z0;
        if (testZ0 > targetZ0) low = mid;
        else high = mid;
        bestW = mid;
      }
      $("msWResult").value = formatFixed(bestW, 3);
    } else {
      setOutputs(["msWResult"]);
    }
    return;
  }
  setOutputs(["msZ0Result", "msEeffResult", "msWResult"]);
}

function parseLcString(reactance, fHz) {
  if (Math.abs(reactance) < 1e-9) return "短路 0Ω";
  const w = 2 * Math.PI * fHz;
  if (reactance > 0) {
    const L = reactance / w; 
    return `L = ${formatFixed(L * 1e9, 2)} nH`;
  } else {
    const C = -1 / (w * reactance);
    return `C = ${formatFixed(C * 1e12, 2)} pF`;
  }
}

function parseLcStringP(susceptance, fHz) {
  if (Math.abs(susceptance) < 1e-12) return "开路 0S";
  const w = 2 * Math.PI * fHz;
  if (susceptance > 0) {
    const C = susceptance / w; 
    return `C = ${formatFixed(C * 1e12, 2)} pF`;
  } else {
    const L = -1 / (w * susceptance);
    return `L = ${formatFixed(L * 1e9, 2)} nH`;
  }
}


function calcQFactor() {
  const f = parseFloat($("qFreq").value);
  const bw = parseFloat($("qBw").value);
  const vswr = parseFloat($("qVswr").value);

  if (f > 0 && bw > 0 && vswr > 1) {
    const fbw = bw / f;
    const q = ((vswr - 1) / Math.sqrt(vswr)) * (1 / fbw);
    $("qFbwResult").value = formatFixed(fbw * 100, 2) + " %";
    $("qResult").value = formatFixed(q, 2);
    return;
  }
  setOutputs(["qFbwResult", "qResult"]);
}

const COMP_DATA = window.COMPONENTS_DATA || {};
const STD_C = COMP_DATA.STD_C || [];
const STD_L = COMP_DATA.STD_L || [];

function getZComp(isL, val, fHz) {
    if (val === 0) return { R: 0, X: 0 };
    const w = 2 * Math.PI * fHz;
    return isL ? { R: 0, X: w * val * 1e-9 } : { R: 0, X: -1 / (w * val * 1e-12) };
}

function zAdd(a, b) { return { R: a.R + b.R, X: a.X + b.X }; }
function zInv(a) { 
    const mag2 = a.R*a.R + a.X*a.X; 
    return { R: a.R/mag2, X: -a.X/mag2 }; 
}
function zPar(a, b) { 
    if (a.R===0 && a.X===0) return {R:0, X:0};
    if (b.R===0 && b.X===0) return {R:0, X:0};
    return zInv(zAdd(zInv(a), zInv(b))); 
}

function calcVSWR(zin, z0 = 50.0) {
    const r1 = zin.R - z0, x1 = zin.X;
    const r2 = zin.R + z0, x2 = zin.X;
    const magGamma = Math.sqrt((r1*r1 + x1*x1) / (r2*r2 + x2*x2));
    if (magGamma >= 0.999) return 999;
    return (1 + magGamma) / (1 - magGamma);
}

function processSmartMatch() {
  const thresh = parseFloat($("smVswrTarget").value);
  const pts = [];
  for(let i=1; i<=3; i++) {
      const f = parseFloat($(`smF${i}`).value) * 1e6;
      const R = parseFloat($(`smR${i}`).value);
      const X = parseFloat($(`smX${i}`).value);
      if(f > 0 && R > 0 && isFiniteNumber(X)) pts.push({ fHz: f, Z: { R, X } });
  }
  if (pts.length === 0 || !isFiniteNumber(thresh)) {
      setOutputs(["smTopology", "smAntShunt", "smSeries", "smSrcShunt"]);
      return;
  }

  $("smAlertBox").innerHTML = "<em>正在暴力推演庞大组合，请稍候...</em>";
  $("smAlertBox").style.background = "rgba(0,0,0,0.03)";
  $("smAlertBox").style.color = "#555";
  setTimeout(() => runSmartMatch(pts, thresh), 10);
}

function runSmartMatch(pts, thresh) {
    let bestL = { maxV: Infinity, top: "", c1: "", c2: "", c3: "" };
    const comps = ["C", "L"];

    // L-Net: Shunt Antenna -> Series Source
    for (let sh of comps) {
        let vals1 = sh === "C" ? STD_C : STD_L;
        for (let v1 of vals1) {
            for (let se of comps) {
                let vals2 = se === "C" ? STD_C : STD_L;
                for (let v2 of vals2) {
                    let maxV = 0;
                    let tempVswrs = [];
                    for (let pt of pts) {
                        let zsh = getZComp(sh === "L", v1, pt.fHz);
                        let zse = getZComp(se === "L", v2, pt.fHz);
                        let zIn = zAdd(zPar(pt.Z, zsh), zse);
                        let v = calcVSWR(zIn);
                        tempVswrs.push(v);
                        maxV = Math.max(maxV, v);
                    }
                    if (maxV < bestL.maxV) {
                        bestL = { maxV, vswrs: tempVswrs, top: "L型倒置: [并联] ➔ [串联] ➔ 接匹配端",
                                  c1: `${sh} = ${v1} ${sh==="L"?"nH":"pF"} (对地并联)`, 
                                  c2: `${se} = ${v2} ${se==="L"?"nH":"pF"} (在线串联)`, c3: "---" };
                    }
                }
            }
        }
    }

    // L-Net: Series Antenna -> Shunt Source
    for (let se of comps) {
        let vals1 = se === "C" ? STD_C : STD_L;
        for (let v1 of vals1) {
            for (let sh of comps) {
                let vals2 = sh === "C" ? STD_C : STD_L;
                for (let v2 of vals2) {
                    let maxV = 0;
                    let tempVswrs = [];
                    for (let pt of pts) {
                        let zse = getZComp(se === "L", v1, pt.fHz);
                        let zsh = getZComp(sh === "L", v2, pt.fHz);
                        let zIn = zPar(zAdd(pt.Z, zse), zsh);
                        let v = calcVSWR(zIn);
                        tempVswrs.push(v);
                        maxV = Math.max(maxV, v);
                    }
                    if (maxV < bestL.maxV) {
                        bestL = { maxV, vswrs: tempVswrs, top: "L型顺序: [串联] ➔ [并联] ➔ 接匹配端",
                                  c1: `${se} = ${v1} ${se==="L"?"nH":"pF"} (在线串联)`, 
                                  c2: `${sh} = ${v2} ${sh==="L"?"nH":"pF"} (对地并联)`, c3: "---" };
                    }
                }
            }
        }
    }

    let vswrStrL = pts.map((_, i) => `f${i+1}: ${formatFixed(bestL.vswrs[i], 2)}`).join(" | ");
    if (bestL.maxV <= thresh) {
        renderMatchResult(bestL, `✅ L 型极简网络及格！<br/>测算点最差驻波比 VSWR = <strong style="color:#1e8e3e;font-size:16px;">${formatFixed(bestL.maxV,2)}</strong><br/><span style="font-size:12px">测算点实绩: [ ${vswrStrL} ]</span>`, "#e6f4ea", "#1e8e3e");
        return;
    }

    // Pi-Network (3 elements) C-L-C Low Pass Fallback with strict limits > 0.3pF, > 0.3nH
    let bestPi = { maxV: Infinity, top: "", c1: "", c2: "", c3: "" };
    for (let c1 of STD_C) {
        if (c1 < 0.3) continue;
        for (let l2 of STD_L) {
            if (l2 < 0.3) continue;
            for (let c3 of STD_C) {
                if (c3 < 0.3) continue;
                let maxV = 0;
                let tempVswrs = [];
                for (let pt of pts) {
                    let zShunt1 = getZComp(false, c1, pt.fHz);
                    let zSer = getZComp(true, l2, pt.fHz);
                    let zShunt3 = getZComp(false, c3, pt.fHz);
                    let zIn = zPar(zAdd(zPar(pt.Z, zShunt1), zSer), zShunt3);
                    let v = calcVSWR(zIn);
                    tempVswrs.push(v);
                    maxV = Math.max(maxV, v);
                }
                if (maxV < bestPi.maxV) {
                    bestPi = { maxV, vswrs: tempVswrs, top: "Π 型经典低通宽频: (并联 ➔ 串联 ➔ 并联)",
                              c1: `C = ${c1} pF (对地并联)`, c2: `L = ${l2} nH (在线串联)`, c3: `C = ${c3} pF (对地并联)` };
                }
            }
        }
    }

    let vswrStrPi = pts.map((_, i) => `f${i+1}: ${formatFixed(bestPi.vswrs[i], 2)}`).join(" | ");
    let msg = `⚠️ <strong>带宽不足预警</strong>：L型网络最优仅能压到 <span style="color:#d93025">${formatFixed(bestL.maxV,2)}</span>，不满足门限。<br/>`;
    msg += `🚀 <strong>强启 Π 型稳固综合引擎</strong>：严格防寄生 (<0.3失效) 筛选库求出三元件最优组合。<br/>极限封顶 VSWR = <strong style="color:#d93025;font-size:16px;">${formatFixed(bestPi.maxV,2)}</strong> <br/><span style="font-size:12px;color:#d93025">测算点实绩: [ ${vswrStrPi} ]</span>`;
    renderMatchResult(bestPi, msg, "#fce8e6", "#d93025");
}

function renderMatchResult(res, msgHtml, bgColor, txtColor) {
    $("smAlertBox").innerHTML = msgHtml;
    $("smAlertBox").style.background = bgColor;
    $("smTopology").value = res.top;
    $("smAntShunt").value = res.c1;
    $("smSeries").value = res.c2;
    $("smSrcShunt").value = res.c3;
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

  $("zorFreq").addEventListener("input", calcZor);
  $("zorCr").addEventListener("input", calcZor);
  $("zorLr").addEventListener("input", calcZor);

  $("viaHeight").addEventListener("input", calcViaInductance);
  $("viaDiam").addEventListener("input", calcViaInductance);

  $("msEr").addEventListener("input", calcMicrostrip);
  $("msH").addEventListener("input", calcMicrostrip);
  $("msW").addEventListener("input", calcMicrostrip);
  $("msTargetZ0").addEventListener("input", calcMicrostrip);

  // Progressive Matcher is click-based to avoid throttling the heavy Pi-net computation
  $("btnSmartMatch").addEventListener("click", processSmartMatch);

  $("qFreq").addEventListener("input", calcQFactor);
  $("qBw").addEventListener("input", calcQFactor);
  $("qVswr").addEventListener("input", calcQFactor);
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
  calcZor();
  calcViaInductance();
  calcMicrostrip();
  processSmartMatch();
  calcQFactor();
}

window.addEventListener("DOMContentLoaded", init);
