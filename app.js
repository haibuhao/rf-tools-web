const formulasData = [
  {
    title: "自由空间波长",
    desc: "使用真空光速 c = 299,792,458 m/s；实际介质中的导波波长还取决于有效介电常数。",
    math: "λ = c / f\nλ/2 = c / (2f)\nλ/4 = c / (4f)",
  },
  {
    title: "自由空间路径损耗 (FSPL)",
    desc: "只描述无障碍自由空间传播，不含天线增益、馈线损耗、极化失配或遮挡；d 用米、f 用 MHz。",
    math: "FSPL (dB) = 20 log10(d) + 20 log10(f) - 27.5522",
  },
  {
    title: "效率、增益与线性值",
    desc: "效率是功率比，物理被动天线范围为 0–100%；普通功率增益的 dB/线性换算不受 100% 上限约束。",
    math: "η (%) = 100 × 10^(ηdB / 10)\nηdB = 10 log10(η / 100)\nGlinear = 10^(GdB / 10)",
  },
  {
    title: "dBm 与 Watt",
    desc: "dBm 以 1 mW 为参考。0 W 对应负无穷 dBm，不能用有限数字表示。",
    math: "P(W) = 10^[(PdBm - 30) / 10]\nPdBm = 10 log10[P(W)] + 30",
  },
  {
    title: "阵列合成（固定总输入功率）",
    desc: "假设 N 路等功率分配、理想无损馈电，并在同一指定方向评估；未计端口耦合、幅相误差和实际合路损耗。",
    math: "G非相干 = 10 log10[(1/N) Σ 10^(Gi/10)]\nG相干 = 20 log10[(1/√N) Σ 10^(Gi/20)]",
  },
  {
    title: "有源与无源指标等效估算",
    desc: "峰值实现增益与总效率必须位于同一参考面。TRP/TIS 的严格定义是球面综合量；这里由传导结果和无源量作一阶估算。",
    math: "D = G - ηdB\nEIRP = Pcond + G\nTRP ≈ Pcond + ηdB\nEISdirection ≈ Scond - G\nTIS ≈ Scond - ηdB",
  },
  {
    title: "VSWR、Return Loss 与失配",
    desc: "本页采用正值 Return Loss 约定：完全匹配时 RL = +∞，完全反射时 RL = 0 dB。",
    math: "|Γ| = (VSWR - 1)/(VSWR + 1) = 10^(-RL/20)\nRL = -20 log10|Γ|\nML = -10 log10(1-|Γ|²)\n端口接受功率 = (1-|Γ|²) × 100%",
  },
  {
    title: "Fraunhofer 远场边界",
    desc: "D 为 DUT 最大物理尺寸。该常用判据并不自动覆盖所有电小天线、测量探头和暗室误差条件。",
    math: "R = 2D² / λ",
  },
  {
    title: "离散器件阻抗匹配",
    desc: "候选网络按理想 L/C 计算，并在所有有效频点上以最差 VSWR 复核；优先选择已达标的更少元件方案。",
    math: "Γ(f) = [Zin(f)-Z0] / [Zin(f)+Z0]\nVSWR(f) = [1+|Γ(f)|] / [1-|Γ(f)|]\nScore = max_f VSWR(f)\nXL = 2πfL，XC = -1/(2πfC)",
  },
  {
    title: "平衡 CRLH 单元初值",
    desc: "同时令串联与并联谐振为 f0，得到平衡 CRLH 的一组等效初值；实际 ZOR 还取决于终端和色散关系。",
    math: "ωse = 1/√(LR·CL) = 2πf0\nωsh = 1/√(LL·CR) = 2πf0\nCL = 1/(ω0²LR)，LL = 1/(ω0²CR)",
  },
  {
    title: "单根圆柱过孔自感粗估",
    desc: "只估计孤立圆柱导体的部分自感；实际环路电感强烈依赖回流路径、焊盘和并联地过孔。",
    math: "L(nH) ≈ 0.2h[ln(4h/d)+1]\nh、d 使用 mm",
  },
  {
    title: "微带线准静态近似",
    desc: "此处忽略铜厚、粗糙度、阻焊、损耗和频散；W/h 较宽与较窄时使用对应的 Hammerstad/Wheeler 形式。",
    math: "W/h ≤ 1:\nεeff = (εr+1)/2 + (εr-1)/2[1/√(1+12h/W)+0.04(1-W/h)²]\nZ0 = 60/√εeff · ln(8h/W + W/4h)\n\nW/h > 1:\nεeff = (εr+1)/2 + (εr-1)/(2√(1+12h/W))\nZ0 = 120π/{√εeff[W/h+1.393+0.667ln(W/h+1.444)]}",
  },
  {
    title: "单谐振阻抗带宽等效 Q",
    desc: "适用于调谐、窄带、单端口单谐振近似；多谐振、强损耗或宽带结构会偏离该关系。S=2 时 S11≈-9.54 dB、RL≈+9.54 dB。",
    math: "FBW = Δf/fc\nQ ≈ (S-1)/(√S · FBW)",
  },
  {
    title: "3D 双极化总增益与球面积分",
    desc: "H/V 两个正交极化在功率域相加；球面平均需用 sinθ 作为立体角权重。",
    math: "Gtotal(dB) = 10log10[10^(GH/10)+10^(GV/10)]\nGavg = Σ[Glinear·sinθ·dθ·dφ] / Σ[sinθ·dθ·dφ]\nη = Gavg，D(dBi) = Gpeak(dBi)-10log10(Gavg)",
  },
];

const bandData = window.BAND_DATA || {};
const RF_CALC = window.RFCalculations || null;
const MATCH_ENGINE = window.MatchingEngine || null;

const $ = (id) => document.getElementById(id);

function parseBandQuery(value) {
  const input = value.trim().toLowerCase().replace(/\s+/g, "");
  let match;

  if ((match = input.match(/^(?:b|lte(?:band)?)(\d+)$/))) {
    return { mode: "lte", number: String(parseInt(match[1], 10)) };
  }

  if ((match = input.match(/^(?:n|nr(?:band)?)(\d+)$/))) {
    return { mode: "nr", number: String(parseInt(match[1], 10)) };
  }

  if ((match = input.match(/^(?:band)?(\d+)$/))) {
    return { mode: "auto", number: String(parseInt(match[1], 10)) };
  }

  return null;
}

function resolveBandQuery(value, data = bandData) {
  const query = parseBandQuery(value);
  if (!query) {
    return { query: null, matches: [] };
  }

  const matches = [];
  const lte = data[query.number];
  const nr = data[`n${query.number}`];

  if ((query.mode === "lte" || query.mode === "auto") && lte) {
    matches.push({ label: `LTE B${query.number}`, value: lte });
  }

  if ((query.mode === "nr" || query.mode === "auto") && nr) {
    matches.push({ label: `NR n${query.number}`, value: nr });
  }

  return { query, matches };
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
  if (value === Infinity) {
    return "∞";
  }
  if (value === -Infinity) {
    return "−∞";
  }
  return isFiniteNumber(value) ? value.toFixed(digits) : "---";
}

function formatSmart(value, digits = 4) {
  if (value === Infinity) {
    return "∞";
  }
  if (value === -Infinity) {
    return "−∞";
  }
  if (!isFiniteNumber(value)) {
    return "---";
  }
  return Number(value.toPrecision(digits)).toString();
}

function wireSelectAll() {
  document.querySelectorAll(".calc-input").forEach((input) => {
    if (input.tagName !== "INPUT") {
      return;
    }
    if (!["bandInput", "arrayGains"].includes(input.id)) {
      input.inputMode = "decimal";
    }
    input.addEventListener("focus", () => input.select());
  });
}

function clearInputErrors(ids) {
  ids.forEach((id) => {
    const input = $(id);
    if (!input) return;
    input.removeAttribute("aria-invalid");
    input.removeAttribute("title");
  });
}

function markInputErrors(ids, message) {
  ids.forEach((id) => {
    const input = $(id);
    if (!input) return;
    input.setAttribute("aria-invalid", "true");
    input.title = message;
  });
}

function setCardMessage(anchorId, message = "", state = "error") {
  const anchor = $(anchorId);
  const card = anchor && anchor.closest(".tool-card");
  if (!card) return;

  let status = card.querySelector(".calc-status");
  if (!status) {
    status = document.createElement("p");
    status.className = "calc-status";
    status.setAttribute("role", "status");
    card.append(status);
  }

  status.textContent = message;
  status.dataset.state = state;
  status.hidden = !message;
}

function reportCalculationError(anchorId, inputIds, outputIds, error) {
  const message = error && error.message ? error.message : "输入数据无效。";
  markInputErrors(inputIds, message);
  setOutputs(outputIds, "输入有误");
  setCardMessage(anchorId, message, "error");
}

function requireCalculationLibrary() {
  if (!RF_CALC) {
    throw new Error("计算模块未加载，请确认 rf-calculations.js 已部署。");
  }
  return RF_CALC;
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

function renderLinks() {
  const linksData = window.LINKS_DATA || [];
  const container = $("linksList");
  if (!container || !linksData.length) return;

  // Group by tag
  const groups = {};
  linksData.forEach(item => {
    if (!groups[item.tag]) groups[item.tag] = [];
    groups[item.tag].push(item);
  });

  Object.keys(groups).forEach(tag => {
    const section = document.createElement("div");
    section.className = "links-section";

    const heading = document.createElement("h3");
    heading.className = "links-tag";
    heading.textContent = tag;
    section.append(heading);

    const grid = document.createElement("div");
    grid.className = "links-card-grid";

    groups[tag].forEach(link => {
      const a = document.createElement("a");
      a.href = link.url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.className = "link-card";

      const name = document.createElement("span");
      name.className = "link-name";
      name.textContent = link.name;

      const desc = document.createElement("span");
      desc.className = "link-desc";
      desc.textContent = link.desc;

      const arrow = document.createElement("span");
      arrow.className = "link-arrow";
      arrow.textContent = "↗";

      a.append(name, desc, arrow);
      grid.append(a);
    });

    section.append(grid);
    container.append(section);
  });
}

function setupTabs() {
  const buttons = Array.from(document.querySelectorAll(".tab-button"));
  const panels = document.querySelectorAll(".content-panel");

  const activate = (button, shouldFocus = false) => {
    const target = button.dataset.tabTarget;
    buttons.forEach((item) => {
      const active = item === button;
      item.classList.toggle("is-active", active);
      item.setAttribute("aria-selected", String(active));
      item.tabIndex = active ? 0 : -1;
    });
    panels.forEach((panel) => {
      const active = panel.id === target;
      panel.hidden = !active;
      panel.classList.toggle("is-active", active);
    });
    if (shouldFocus) {
      button.focus();
    }
  };

  buttons.forEach((button, index) => {
    button.addEventListener("click", () => activate(button));
    button.addEventListener("keydown", (event) => {
      let nextIndex = null;
      if (event.key === "ArrowRight" || event.key === "ArrowDown") {
        nextIndex = (index + 1) % buttons.length;
      } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        nextIndex = (index - 1 + buttons.length) % buttons.length;
      } else if (event.key === "Home") {
        nextIndex = 0;
      } else if (event.key === "End") {
        nextIndex = buttons.length - 1;
      }

      if (nextIndex !== null) {
        event.preventDefault();
        activate(buttons[nextIndex], true);
      }
    });
  });
}

function calcWavelength() {
  const inputIds = ["freqInput"];
  const outputIds = ["waveMm", "waveCm", "halfWave", "quarterWave"];
  clearInputErrors(inputIds);
  setCardMessage("freqInput");
  try {
    const result = requireCalculationLibrary().calculateWavelength(
      $("freqInput").value,
    );
    $("waveMm").value = formatFixed(result.wavelengthMm, 3);
    $("waveCm").value = formatFixed(result.wavelengthCm, 3);
    $("halfWave").value = formatFixed(result.halfWaveMm, 3);
    $("quarterWave").value = formatFixed(result.quarterWaveMm, 3);
  } catch (error) {
    reportCalculationError("freqInput", inputIds, outputIds, error);
  }
}

function queryBand() {
  const { query, matches } = resolveBandQuery($("bandInput").value);

  if (!query) {
    $("bandResult").value = "❌ 输入格式无效";
    return;
  }

  if (!matches.length) {
    const wanted =
      query.mode === "lte"
        ? `LTE B${query.number}`
        : query.mode === "nr"
          ? `NR n${query.number}`
          : `Band ${query.number}`;
    $("bandResult").value = `❌ 未找到 ${wanted}`;
    return;
  }

  $("bandResult").value = matches
    .map(({ label, value }) => `[${label}] ${value}`)
    .join("\n");
}

function calcFspl() {
  const inputIds = ["fsplDistance", "fsplFreq"];
  const outputIds = ["fsplResult"];
  clearInputErrors(inputIds);
  setCardMessage("fsplDistance");
  try {
    const result = requireCalculationLibrary().calculateFspl(
      $("fsplDistance").value,
      $("fsplFreq").value,
    );
    $("fsplResult").value = formatFixed(result.fsplDb, 3);
  } catch (error) {
    reportCalculationError("fsplDistance", inputIds, outputIds, error);
  }
}

function syncEfficiencyFromDb() {
  const inputIds = ["effDbInput"];
  clearInputErrors(["effDbInput", "effPctInput"]);
  setCardMessage("effDbInput");
  try {
    const percent = requireCalculationLibrary().efficiencyDbToPercent(
      $("effDbInput").value,
    );
    $("effPctInput").value = formatFixed(percent, 3);
  } catch (error) {
    $("effPctInput").value = "输入有误";
    markInputErrors(inputIds, error.message);
    setCardMessage("effDbInput", error.message, "error");
  }
}

function syncDbFromEfficiency() {
  const inputIds = ["effPctInput"];
  clearInputErrors(["effDbInput", "effPctInput"]);
  setCardMessage("effPctInput");
  try {
    const db = requireCalculationLibrary().efficiencyPercentToDb(
      $("effPctInput").value,
    );
    $("effDbInput").value = formatFixed(db, 4);
  } catch (error) {
    $("effDbInput").value = "输入有误";
    markInputErrors(inputIds, error.message);
    setCardMessage("effPctInput", error.message, "error");
  }
}

function syncGainLinFromDb() {
  clearInputErrors(["gainDbInput", "gainLinInput"]);
  setCardMessage("gainDbInput");
  try {
    const linear = requireCalculationLibrary().gainDbToLinear(
      $("gainDbInput").value,
    );
    $("gainLinInput").value = formatSmart(linear, 6);
  } catch (error) {
    $("gainLinInput").value = "输入有误";
    markInputErrors(["gainDbInput"], error.message);
    setCardMessage("gainDbInput", error.message, "error");
  }
}

function syncDbFromGainLin() {
  clearInputErrors(["gainDbInput", "gainLinInput"]);
  setCardMessage("gainLinInput");
  try {
    const db = requireCalculationLibrary().gainLinearToDb(
      $("gainLinInput").value,
    );
    $("gainDbInput").value = formatFixed(db, 4);
  } catch (error) {
    $("gainDbInput").value = "输入有误";
    markInputErrors(["gainLinInput"], error.message);
    setCardMessage("gainLinInput", error.message, "error");
  }
}

function syncWattFromDbm() {
  clearInputErrors(["dbmInput", "wattInput"]);
  setCardMessage("dbmInput");
  try {
    const watts = requireCalculationLibrary().dbmToWatts(
      $("dbmInput").value,
    );
    $("wattInput").value = formatSmart(watts, 7);
  } catch (error) {
    $("wattInput").value = "输入有误";
    markInputErrors(["dbmInput"], error.message);
    setCardMessage("dbmInput", error.message, "error");
  }
}

function syncDbmFromWatt() {
  clearInputErrors(["dbmInput", "wattInput"]);
  setCardMessage("wattInput");
  try {
    const dbm = requireCalculationLibrary().wattsToDbm(
      $("wattInput").value,
    );
    $("dbmInput").value = formatFixed(dbm, 4);
  } catch (error) {
    $("dbmInput").value = "输入有误";
    markInputErrors(["wattInput"], error.message);
    setCardMessage("wattInput", error.message, "error");
  }
}

function calcArrayGain() {
  try {
    const gains = $("arrayGains")
      .value.replace(/，/g, ",")
      .split(",")
      .map((item) => item.trim());
    if (gains.some((item) => !item)) {
      throw new Error("各路增益之间不能有空项，请用逗号分隔完整数字。");
    }

    clearInputErrors(["arrayGains"]);
    setCardMessage("arrayGains");
    const result = requireCalculationLibrary().combineArrayGains(gains, {
      normalization: "fixed-total",
    });
    $("arrayUncorr").value = formatFixed(result.uncorrelatedDbi, 3);
    $("arrayCorr").value = formatFixed(result.coherentDbi, 3);
  } catch (error) {
    reportCalculationError(
      "arrayGains",
      ["arrayGains"],
      ["arrayUncorr", "arrayCorr"],
      error,
    );
  }
}

function calcActivePassive() {
  const allInputIds = ["gainInput", "effInput", "condPower", "condSens"];
  const allOutputIds = [
    "directivityOutput",
    "eirpOutput",
    "trpOutput",
    "eisOutput",
    "tisOutput",
  ];
  const errors = [];
  clearInputErrors(allInputIds);
  setCardMessage("gainInput");
  let library;
  try {
    library = requireCalculationLibrary();
  } catch (error) {
    reportCalculationError("gainInput", allInputIds, allOutputIds, error);
    return;
  }

  const calculateOutput = (outputId, dependencyIds, calculation) => {
    if (dependencyIds.some((id) => !$(id).value.trim())) {
      $(outputId).value = "---";
      return;
    }
    try {
      $(outputId).value = formatFixed(calculation(), 3);
    } catch (error) {
      $(outputId).value = "输入有误";
      markInputErrors(dependencyIds, error.message);
      errors.push(error.message);
    }
  };

  calculateOutput(
    "directivityOutput",
    ["gainInput", "effInput"],
    () => library.calculateDirectivity($("gainInput").value, $("effInput").value),
  );
  calculateOutput(
    "eirpOutput",
    ["condPower", "gainInput"],
    () => library.calculateEirp($("condPower").value, $("gainInput").value),
  );
  calculateOutput(
    "trpOutput",
    ["condPower", "effInput"],
    () => library.calculateTrp($("condPower").value, $("effInput").value),
  );
  calculateOutput(
    "eisOutput",
    ["condSens", "gainInput"],
    () => library.calculateEis($("condSens").value, $("gainInput").value),
  );
  calculateOutput(
    "tisOutput",
    ["condSens", "effInput"],
    () => library.calculateTis($("condSens").value, $("effInput").value),
  );

  if (errors.length) {
    setCardMessage("gainInput", [...new Set(errors)].join(" "), "error");
  }
}

function fillMismatchOutputs(metrics, source) {
  $("gammaOutput").value = formatFixed(metrics.reflectionCoefficient, 6);
  $("mlOutput").value = formatFixed(metrics.mismatchLossDb, 4);
  $("transPctOutput").value = formatFixed(metrics.acceptedPowerPercent, 3);
  if (source !== "vswr") {
    $("vswrInput").value = formatFixed(metrics.vswr, 4);
  }
  if (source !== "rl") {
    $("rlInput").value = formatFixed(metrics.returnLossDb, 4);
  }
}

function syncRlFromVswr() {
  const inputIds = ["vswrInput"];
  clearInputErrors(["vswrInput", "rlInput"]);
  setCardMessage("vswrInput");
  try {
    const metrics = requireCalculationLibrary().metricsFromVswr(
      $("vswrInput").value,
    );
    fillMismatchOutputs(metrics, "vswr");
  } catch (error) {
    $("rlInput").value = "输入有误";
    reportCalculationError(
      "vswrInput",
      inputIds,
      ["gammaOutput", "mlOutput", "transPctOutput"],
      error,
    );
  }
}

function syncVswrFromRl() {
  const inputIds = ["rlInput"];
  clearInputErrors(["vswrInput", "rlInput"]);
  setCardMessage("rlInput");
  try {
    const metrics = requireCalculationLibrary().metricsFromReturnLoss(
      $("rlInput").value,
    );
    fillMismatchOutputs(metrics, "rl");
  } catch (error) {
    $("vswrInput").value = "输入有误";
    reportCalculationError(
      "rlInput",
      inputIds,
      ["gammaOutput", "mlOutput", "transPctOutput"],
      error,
    );
  }
}

function calcFarField() {
  const inputIds = ["ffDiameter", "ffFreq"];
  const outputIds = ["ffMeters", "ffMillimeters"];
  clearInputErrors(inputIds);
  setCardMessage("ffDiameter");
  try {
    const result = requireCalculationLibrary().calculateFraunhoferDistance(
      $("ffDiameter").value,
      $("ffFreq").value,
    );
    $("ffMeters").value = formatFixed(result.distanceM, 4);
    $("ffMillimeters").value = formatFixed(result.distanceMm, 2);
    if (!result.isElectricallyLarge) {
      setCardMessage(
        "ffDiameter",
        "D < λ：2D²/λ 仍可显示，但单一 Fraunhofer 判据可能不足，请结合探头、暗室和天线类型复核。",
        "warning",
      );
    }
  } catch (error) {
    reportCalculationError("ffDiameter", inputIds, outputIds, error);
  }
}

function calcZor() {
  const inputIds = ["zorFreq", "zorCr", "zorLr"];
  const outputIds = ["zorReqLl", "zorReqCl"];
  clearInputErrors(inputIds);
  setCardMessage("zorFreq");
  try {
    const result = requireCalculationLibrary().synthesizeBalancedCrlh(
      $("zorFreq").value,
      $("zorCr").value,
      $("zorLr").value,
    );
    $("zorReqLl").value = formatFixed(
      result.requiredShuntInductanceNh,
      4,
    );
    $("zorReqCl").value = formatFixed(
      result.requiredSeriesCapacitancePf,
      4,
    );
  } catch (error) {
    reportCalculationError("zorFreq", inputIds, outputIds, error);
  }
}

function calcViaInductance() {
  const inputIds = ["viaHeight", "viaDiam"];
  const outputIds = ["viaEstInd"];
  clearInputErrors(inputIds);
  setCardMessage("viaHeight");
  try {
    const result = requireCalculationLibrary().estimateViaInductance(
      $("viaHeight").value,
      $("viaDiam").value,
    );
    $("viaEstInd").value = formatFixed(result.inductanceNh, 4);
  } catch (error) {
    reportCalculationError("viaHeight", inputIds, outputIds, error);
  }
}

function calcMsZ0(er, h, w) {
  const result = requireCalculationLibrary().calculateMicrostrip(er, h, w);
  return {
    z0: result.impedanceOhms,
    eeff: result.effectivePermittivity,
  };
}

function calcMicrostrip() {
  const inputIds = ["msEr", "msH", "msW", "msTargetZ0"];
  const errors = [];
  clearInputErrors(inputIds);
  setCardMessage("msEr");
  let library;
  try {
    library = requireCalculationLibrary();
  } catch (error) {
    reportCalculationError(
      "msEr",
      inputIds,
      ["msZ0Result", "msEeffResult", "msWResult"],
      error,
    );
    return;
  }

  try {
    const analysis = library.calculateMicrostrip(
      $("msEr").value,
      $("msH").value,
      $("msW").value,
    );
    $("msZ0Result").value = formatFixed(analysis.impedanceOhms, 4);
    $("msEeffResult").value = formatFixed(
      analysis.effectivePermittivity,
      5,
    );
  } catch (error) {
    setOutputs(["msZ0Result", "msEeffResult"], "输入有误");
    markInputErrors(["msEr", "msH", "msW"], error.message);
    errors.push(error.message);
  }

  try {
    const synthesis = library.synthesizeMicrostrip(
      $("msEr").value,
      $("msH").value,
      $("msTargetZ0").value,
    );
    $("msWResult").value = formatFixed(synthesis.traceWidthMm, 4);
  } catch (error) {
    $("msWResult").value = "输入有误";
    markInputErrors(["msEr", "msH", "msTargetZ0"], error.message);
    errors.push(error.message);
  }

  if (errors.length) {
    setCardMessage("msEr", [...new Set(errors)].join(" "), "error");
  }
}

function calcQFactor() {
  const inputIds = ["qFreq", "qBw", "qVswr"];
  const outputIds = ["qFbwResult", "qResult"];
  clearInputErrors(inputIds);
  setCardMessage("qFreq");
  try {
    const result = requireCalculationLibrary().estimateSingleResonanceQ(
      $("qFreq").value,
      $("qBw").value,
      $("qVswr").value,
    );
    $("qFbwResult").value =
      `${formatFixed(result.fractionalBandwidthPercent, 3)} %`;
    $("qResult").value = formatFixed(result.equivalentQ, 4);
    if (!result.isNarrowbandApproximation) {
      setCardMessage(
        "qFreq",
        "FBW > 20%：该单谐振窄带关系可能产生较大偏差。",
        "warning",
      );
    }
  } catch (error) {
    reportCalculationError("qFreq", inputIds, outputIds, error);
  }
}

const COMP_DATA = window.COMPONENTS_DATA || {};
const TOUCHSTONE = window.TouchstoneS1P || null;
const MAX_S1P_FILE_BYTES = 5 * 1024 * 1024;
const MAX_S1P_MATCH_POINTS = 61;
const MAX_MATCH_VSWR_THRESHOLD = 100;
let importedS1p = null;
let s1pReadToken = 0;
let smartMatchTaskId = 0;

function formatFrequencyMHz(fHz) {
  return Number((fHz / 1e6).toPrecision(8)).toString();
}

function setMatchAlertText(message, state = "neutral") {
  const alert = $("smAlertBox");
  alert.textContent = message;
  alert.dataset.state = state;
}

function setS1pStatus(message, state = "neutral") {
  const status = $("smS1pStatus");
  status.textContent = message;
  status.className = "s1p-status";
  if (state === "success") {
    status.classList.add("is-success");
  } else if (state === "error") {
    status.classList.add("is-error");
  }
}

function getSmartMatchMode() {
  const selected = document.querySelector('input[name="smInputMode"]:checked');
  return selected ? selected.value : "manual";
}

function getComponentProfile() {
  const profiles = COMP_DATA.profiles || {};
  const requestedId = $("smComponentProfile").value;
  const fallbackId = COMP_DATA.defaultProfile || "mixed";
  const profile = profiles[requestedId] || profiles[fallbackId];
  if (!profile) {
    throw new Error("没有找到可用的村田参考物料配置，请检查 components-data.js。");
  }
  return profile;
}

function syncSmartMatchMode() {
  smartMatchTaskId += 1;
  const mode = getSmartMatchMode();
  $("smManualPanel").hidden = mode !== "manual";
  $("smS1pPanel").hidden = mode !== "s1p";
  document.querySelectorAll(".match-mode-option").forEach((option) => {
    const radio = option.querySelector('input[name="smInputMode"]');
    option.classList.toggle("is-active", Boolean(radio && radio.checked));
  });
  $("smResultsList").replaceChildren();
  setMatchAlertText(
    mode === "manual"
      ? "手动模式：请输入 1–3 组完整的频率、R、X。"
      : "S1P 模式：请选择天线或负载的一端口 Touchstone 文件。",
  );
}

function handleS1pFile(event) {
  const readToken = ++s1pReadToken;
  const file = event.target.files && event.target.files[0];
  importedS1p = null;

  if (!file) {
    setS1pStatus("尚未选择文件。");
    return;
  }
  if (!TOUCHSTONE) {
    setS1pStatus("S1P 解析模块未加载，请确认 s1p-parser.js 已部署。", "error");
    return;
  }
  if (!/\.s1p$/i.test(file.name)) {
    setS1pStatus("请选择扩展名为 .s1p 的一端口文件。", "error");
    return;
  }
  if (file.size > MAX_S1P_FILE_BYTES) {
    setS1pStatus("文件超过 5 MiB，请缩小扫频数据后再导入。", "error");
    return;
  }

  setS1pStatus("正在本机读取并解析文件…");
  const reader = new FileReader();
  reader.onload = () => {
    if (readToken !== s1pReadToken) return;
    try {
      const parsed = TOUCHSTONE.parseTouchstoneS1p(String(reader.result || ""));
      importedS1p = { fileName: file.name, parsed };
      const first = parsed.points[0];
      const last = parsed.points[parsed.points.length - 1];
      const warningText = parsed.warnings.length
        ? "；提示：" + parsed.warnings.join("；")
        : "";
      setS1pStatus(
        "已读取 " + file.name + "：" + parsed.points.length + " 点，" +
          formatFrequencyMHz(first.frequencyHz) + "–" +
          formatFrequencyMHz(last.frequencyHz) + " MHz，" +
          parsed.metadata.format + "，文件参考 R " +
          parsed.metadata.referenceOhms + " Ω" + warningText,
        "success",
      );
    } catch (error) {
      importedS1p = null;
      setS1pStatus(error.message || "S1P 解析失败。", "error");
    }
  };
  reader.onerror = () => {
    if (readToken !== s1pReadToken) return;
    importedS1p = null;
    setS1pStatus("浏览器无法读取该文件，请重新选择。", "error");
  };
  reader.readAsText(file);
}

function strictUiNumber(text, label) {
  return requireCalculationLibrary().parseStrictNumber(text, label);
}

function positiveFrequencyHz(text, label) {
  const frequencyMHz = strictUiNumber(text, label);
  const frequencyHz = frequencyMHz * 1e6;
  if (!(frequencyMHz > 0) || !Number.isFinite(frequencyHz)) {
    throw new Error(label + "必须是换算后仍有限且大于 0 的 MHz 数值。");
  }
  return frequencyHz;
}

function collectManualMatchingPoints() {
  const points = [];
  for (let index = 1; index <= 3; index += 1) {
    const frequencyText = $("smF" + index).value.trim();
    const resistanceText = $("smR" + index).value.trim();
    const reactanceText = $("smX" + index).value.trim();
    const filled = [frequencyText, resistanceText, reactanceText].filter(Boolean);

    if (!filled.length) continue;
    if (filled.length !== 3) {
      throw new Error("手动输入第 " + index + " 行不完整，频率、R、X 需要同时填写。");
    }

    const fHz = positiveFrequencyHz(frequencyText, "第 " + index + " 行频率");
    const resistance = strictUiNumber(resistanceText, "第 " + index + " 行 R");
    const reactance = strictUiNumber(reactanceText, "第 " + index + " 行 X");
    if (!(resistance > 0)) {
      throw new Error("手动输入第 " + index + " 行的 R 必须大于 0 Ω。");
    }
    points.push({ fHz, Z: { R: resistance, X: reactance } });
  }

  if (!points.length) {
    throw new Error("请至少填写一组完整的手动阻抗数据。");
  }
  points.sort((left, right) => left.fHz - right.fHz);
  return {
    points,
    meta: {
      mode: "manual",
      sourceLabel: "手动 R+jX",
      inRangeCount: points.length,
      usableCount: points.length,
      skippedCount: 0,
      referenceOhms: null,
    },
  };
}

function readOptionalFrequencyMHz(id, fallback, label) {
  const textValue = $(id).value.trim();
  return textValue ? positiveFrequencyHz(textValue, label) : fallback;
}

function collectS1pMatchingPoints() {
  if (!TOUCHSTONE) {
    throw new Error("S1P 解析模块未加载，请确认部署了 s1p-parser.js。");
  }
  if (!importedS1p) {
    throw new Error("请先选择并成功解析一个 .s1p 文件。");
  }

  const sourcePoints = importedS1p.parsed.points;
  const sourceMinHz = sourcePoints[0].frequencyHz;
  const sourceMaxHz = sourcePoints[sourcePoints.length - 1].frequencyHz;
  const minHz = readOptionalFrequencyMHz("smS1pMinFreq", sourceMinHz, "分析起点");
  const maxHz = readOptionalFrequencyMHz("smS1pMaxFreq", sourceMaxHz, "分析终点");
  if (minHz > maxHz) {
    throw new Error("分析起点不能高于分析终点。");
  }

  const inRange = TOUCHSTONE.filterPointsByFrequency(sourcePoints, minHz, maxHz);
  if (!inRange.length) {
    throw new Error("所选频率范围内没有 S1P 数据点。");
  }

  const usable = TOUCHSTONE.toMatcherPoints(inRange);
  if (!usable.length) {
    throw new Error("所选范围内没有正实部且有限的负载阻抗点。");
  }

  return {
    points: usable,
    meta: {
      mode: "s1p",
      sourceLabel: importedS1p.fileName,
      inRangeCount: inRange.length,
      usableCount: usable.length,
      skippedCount: inRange.length - usable.length,
      minHz: usable[0].fHz,
      maxHz: usable[usable.length - 1].fHz,
      referenceOhms: importedS1p.parsed.metadata.referenceOhms,
    },
  };
}

function formatVswr(value) {
  return value === Infinity ? "∞" : formatFixed(value, 3);
}

function tierName(tier) {
  const names = {
    baseline: "无需匹配",
    single: "单元件",
    l: "L 型",
    pi: "C-L-C Π 型",
  };
  return names[tier] || tier;
}

function appendMatchBadge(container, textValue, kind) {
  const badge = document.createElement("span");
  badge.className = "match-badge match-badge-" + kind;
  badge.textContent = textValue;
  container.append(badge);
}

function renderCandidateCard(candidate, result, profile, index) {
  const card = document.createElement("article");
  card.className = "match-result-card";
  if (candidate.id === result.selected.id) {
    card.classList.add("is-selected");
  }

  const header = document.createElement("div");
  header.className = "match-result-head";
  const title = document.createElement("strong");
  title.textContent =
    "#" + (index + 1) + " " + candidate.label +
    (candidate.id === result.selected.id ? "（当前选择）" : "");
  const score = document.createElement("span");
  score.textContent = "Max VSWR " + formatVswr(candidate.maxVswr);
  header.append(title, score);

  const badges = document.createElement("div");
  badges.className = "match-badges";
  appendMatchBadge(
    badges,
    candidate.maxVswr <= result.vswrThreshold ? "达到门限" : "未达门限",
    candidate.maxVswr <= result.vswrThreshold ? "success" : "warning",
  );
  appendMatchBadge(badges, candidate.componentCount + " 个 L/C 器件", "info");
  appendMatchBadge(badges, tierName(candidate.tier), "neutral");

  const comparison = document.createElement("p");
  comparison.className = "match-result-comparison";
  const delta = result.baseline.maxVswr - candidate.maxVswr;
  comparison.textContent =
    "匹配前 " + formatVswr(result.baseline.maxVswr) +
    " → 匹配后 " + formatVswr(candidate.maxVswr) +
    "；最差频点 " + formatFrequencyMHz(candidate.worstFrequencyHz) +
    " MHz" +
    (delta > 0 ? "；改善 " + formatFixed(delta, 3) : "");

  const direction = document.createElement("p");
  direction.className = "match-direction";
  direction.textContent = candidate.topology.text;

  const slots = document.createElement("dl");
  slots.className = "match-slot-list";
  candidate.topology.slots.forEach((slot) => {
    const term = document.createElement("dt");
    term.textContent = slot.label;
    const detail = document.createElement("dd");
    detail.textContent = slot.placement.display;
    slots.append(term, detail);
  });

  const reference = document.createElement("p");
  reference.className = "match-part-reference";
  reference.textContent =
    "村田参考：" + profile.packageEia + " / " +
    profile.capacitorSeriesHint + " / " + profile.inductorSeriesHint +
    "。具体料号、Q/SRF 和容差需按频点复核。";

  card.append(header, badges, comparison, direction, slots, reference);
  return card;
}

function formatTierComparison(result) {
  const order = ["baseline", "single", "l", "pi"];
  return order
    .map((tier) => {
      const best = result.tiers[tier].best;
      return tierName(tier) + " " + (best ? formatVswr(best.maxVswr) : "无候选");
    })
    .join("｜");
}

function renderMatchingSynthesis(result, meta, profile) {
  const selected = result.selected;
  let headline;
  let state;
  if (result.selectionReason === "baseline-meets-threshold") {
    headline = "✅ 匹配前已经达到门限，建议保持直通：串联位 0 Ω / 直通，并联位 DNP。";
    state = "success";
  } else if (result.passed) {
    headline = "✅ 已找到达到门限的最低复杂度方案。";
    state = "success";
  } else if (result.selectionReason === "no-candidate-improves-baseline") {
    headline = "⚠️ 当前物料表没有找到优于直通基准的方案，建议扩大物料值或回到天线本体调试。";
    state = "warning";
  } else {
    headline = "⚠️ 当前最佳方案仍未达到门限，以下结果仅供继续调试。";
    state = "warning";
  }

  const fileReference =
    meta.referenceOhms === null
      ? ""
      : "；S1P 文件参考 R " + meta.referenceOhms + " Ω";
  const skipped =
    meta.skippedCount > 0 ? "；跳过 " + meta.skippedCount + " 个不可用点" : "";
  const sampling =
    result.usedSampling
      ? "搜索抽样 " + result.counts.searchPointCount + " 点，最终全量复核 " +
        result.counts.fullPointCount + " 点"
      : "全部 " + result.counts.fullPointCount + " 点参与搜索和复核";

  setMatchAlertText(
    headline + "\n" +
      "目标 Z0 " + result.targetZ0 + " Ω" + fileReference +
      "；门限 VSWR " + result.vswrThreshold + "。\n" +
      "匹配前 Max VSWR " + formatVswr(result.baseline.maxVswr) +
      "；选择后 " + formatVswr(selected.maxVswr) +
      "；最差频点 " + formatFrequencyMHz(selected.worstFrequencyHz) + " MHz。\n" +
      sampling + skipped + "；候选约 " +
      result.counts.estimatedCandidateCount + " 组。\n" +
      "分层最佳：" + formatTierComparison(result) + "。\n" +
      "理想 L/C 模型：未计入实际 Q、ESR/ESL、SRF、焊盘与过孔寄生。",
    state,
  );

  const container = $("smResultsList");
  container.replaceChildren();
  result.recommendations.forEach((candidate, index) => {
    container.append(renderCandidateCard(candidate, result, profile, index));
  });
}

function runSmartMatch(input, threshold, targetZ0, profile) {
  if (!MATCH_ENGINE) {
    throw new Error("匹配引擎未加载，请确认 matching-engine.js 已部署。");
  }
  const result = MATCH_ENGINE.synthesizeMatching({
    points: input.points,
    capacitorsPf: profile.STD_C,
    inductorsNh: profile.STD_L,
    targetZ0,
    vswrThreshold: threshold,
    maxSearchPoints: MAX_S1P_MATCH_POINTS,
    shortlistSize: 24,
    resultLimit: 5,
  });
  renderMatchingSynthesis(result, input.meta, profile);
  return result;
}

function processSmartMatch() {
  let threshold;
  let targetZ0;
  let profile;
  let input;

  clearInputErrors(["smTargetZ0", "smVswrTarget"]);
  try {
    threshold = strictUiNumber($("smVswrTarget").value, "VSWR 门限");
    targetZ0 = strictUiNumber($("smTargetZ0").value, "目标系统 Z0");
    if (!(threshold > 1) || threshold > MAX_MATCH_VSWR_THRESHOLD) {
      throw new Error("VSWR 门限必须大于 1 且不超过 " + MAX_MATCH_VSWR_THRESHOLD + "。");
    }
    if (!(targetZ0 > 0)) {
      throw new Error("目标系统 Z0 必须大于 0 Ω。");
    }
    profile = getComponentProfile();
    input =
      getSmartMatchMode() === "s1p"
        ? collectS1pMatchingPoints()
        : collectManualMatchingPoints();
  } catch (error) {
    $("smResultsList").replaceChildren();
    setMatchAlertText(error.message || "输入数据无效。", "error");
    return;
  }

  const button = $("btnSmartMatch");
  const taskId = ++smartMatchTaskId;
  button.disabled = true;
  button.textContent = "正在计算…";
  setMatchAlertText(
    "正在用 " + input.points.length + " 个有效频点筛选 " +
      profile.label + " 物料组合；最终会在全部有效点上复核…",
  );

  setTimeout(() => {
    try {
      if (taskId === smartMatchTaskId) {
        runSmartMatch(input, threshold, targetZ0, profile);
      }
    } catch (error) {
      if (taskId === smartMatchTaskId) {
        setMatchAlertText("匹配计算失败：" + (error.message || "未知错误"), "error");
      }
    } finally {
      if (taskId === smartMatchTaskId) {
        button.disabled = false;
        button.textContent = "运行阻抗匹配网络计算";
      }
    }
  }, 20);
}

function bindEvents() {
  $("freqInput").addEventListener("input", calcWavelength);
  $("bandInput").addEventListener("input", queryBand);
  $("fsplDistance").addEventListener("input", calcFspl);
  $("fsplFreq").addEventListener("input", calcFspl);

  $("effDbInput").addEventListener("input", syncEfficiencyFromDb);
  $("effPctInput").addEventListener("input", syncDbFromEfficiency);

  $("gainDbInput").addEventListener("input", syncGainLinFromDb);
  $("gainLinInput").addEventListener("input", syncDbFromGainLin);

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

  document.querySelectorAll('input[name="smInputMode"]').forEach((radio) => {
    radio.addEventListener("change", syncSmartMatchMode);
  });
  $("smS1pFile").addEventListener("change", handleS1pFile);
  $("smComponentProfile").addEventListener("change", () => {
    smartMatchTaskId += 1;
    $("smResultsList").replaceChildren();
    const profile = getComponentProfile();
    setMatchAlertText(
      "已切换为 " + profile.label + "；请重新运行匹配计算。",
    );
  });

  // 匹配器保持点击触发，避免在输入过程中反复执行组合搜索。
  $("btnSmartMatch").addEventListener("click", processSmartMatch);

  $("qFreq").addEventListener("input", calcQFactor);
  $("qBw").addEventListener("input", calcQFactor);
  $("qVswr").addEventListener("input", calcQFactor);
}

function init() {
  wireSelectAll();
  renderFormulas();
  renderLinks();
  setupTabs();
  bindEvents();

  calcWavelength();
  queryBand();
  calcFspl();
  syncEfficiencyFromDb();
  syncGainLinFromDb();
  syncWattFromDbm();
  calcArrayGain();
  calcActivePassive();
  syncRlFromVswr();
  calcFarField();
  calcZor();
  calcViaInductance();
  calcMicrostrip();
  syncSmartMatchMode();
  calcQFactor();
}

window.addEventListener("DOMContentLoaded", init);
