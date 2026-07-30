// 常用贴片容感物料池。数值仍以你的料盒/贴片清单为准，单位：C=pF、L=nH。
// Murata 字段只用于给出可复核的参考系列，不代表自动生成了具体料号。
// 具体 part number、容差、额定值、Q(f)、SRF、S 参数必须逐料号查证后再用于打样。

(() => {
  const commonCapacitorsPf = Object.freeze([
    0.3, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0,
    2.0, 2.2, 2.4, 2.7,
    3.3, 3.6, 3.9, 4.3, 4.7, 5.1, 5.6, 6.2, 6.8,
    7.5, 8.2, 9.1, 10.0, 11, 12, 15, 18, 22,
  ]);

  const commonInductorsNh = Object.freeze([
    0.6, 1.1, 1.2, 1.5, 1.6, 1.8, 2.0, 2.2, 2.4, 2.7,
    3.0, 3.3, 3.6, 3.9, 4.3, 4.7, 5.1, 5.6, 6.2, 6.8,
    7.5, 8.2, 9.1, 10.0, 11, 12, 15, 18, 22,
  ]);

  const profiles = {
    mixed: {
      id: "mixed",
      label: "Murata 0201 + 0402 常用值",
      manufacturer: "Murata",
      packageEia: "0201 / 0402 inch",
      sizeMetric: "0603M / 1005M",
      capacitorSeriesHint: "GJM/GCQ033 + GJM/GCQ155",
      inductorSeriesHint: "LQP03 + LQW/LQG15",
      sourceUrl: "https://www.murata.com/products/inductor/chip/overview/feature/rf",
      STD_C: commonCapacitorsPf,
      STD_L: commonInductorsNh,
    },
    "0201": {
      id: "0201",
      label: "Murata 0201 inch / 0603M",
      manufacturer: "Murata",
      packageEia: "0201 inch",
      sizeMetric: "0603M (0.6 × 0.3 mm)",
      capacitorSeriesHint: "GJM033 / GCQ033 (C0G, High-Q direction)",
      inductorSeriesHint: "LQP03HQ / LQP03TN (film RF)",
      sourceUrl: "https://www.murata.com/products/capacitor/ceramiccapacitor/overview/lineup/smd/gjm",
      STD_C: commonCapacitorsPf,
      STD_L: commonInductorsNh,
    },
    "0402": {
      id: "0402",
      label: "Murata 0402 inch / 1005M",
      manufacturer: "Murata",
      packageEia: "0402 inch",
      sizeMetric: "1005M (1.0 × 0.5 mm)",
      capacitorSeriesHint: "GJM155 / GCQ155 (C0G, High-Q direction)",
      inductorSeriesHint: "LQW15AN / LQG15HN/HS (RF)",
      sourceUrl: "https://www.murata.com/products/inductor/chip/overview/lineup/rf2",
      STD_C: commonCapacitorsPf,
      STD_L: Object.freeze(commonInductorsNh.filter((value) => value >= 1.1)),
    },
  };

  window.COMPONENTS_DATA = Object.freeze({
    manufacturer: "Murata",
    defaultProfile: "mixed",
    profiles: Object.freeze(profiles),
    // 兼容旧版匹配逻辑；新版应优先读取 profiles。
    STD_C: commonCapacitorsPf,
    STD_L: commonInductorsNh,
  });
})();
