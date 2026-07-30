(function exposeMatchingEngine(root, factory) {
  "use strict";

  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  } else {
    root.MatchingEngine = api;
  }
})(
  typeof globalThis !== "undefined" ? globalThis : this,
  function createMatchingEngine() {
    "use strict";

    const VERSION = "1.0.0";
    const DEFAULT_TARGET_Z0 = 50;
    const DEFAULT_VSWR_THRESHOLD = 2;
    const DEFAULT_MAX_SEARCH_POINTS = 61;
    const DEFAULT_SHORTLIST_SIZE = 24;
    const DEFAULT_RESULT_LIMIT = 5;
    const MAX_ENUMERATED_CANDIDATES = 250000;

    class MatchingEngineError extends Error {
      constructor(code, message, details = null) {
        super(message);
        this.name = "MatchingEngineError";
        this.code = code;
        this.details = details;
      }
    }

    function fail(code, message, details = null) {
      throw new MatchingEngineError(code, message, details);
    }

    function isFiniteNumber(value) {
      return typeof value === "number" && Number.isFinite(value);
    }

    function requireFinitePositive(value, label, code) {
      if (!isFiniteNumber(value) || !(value > 0)) {
        fail(code, `${label}必须是大于 0 的有限数字`);
      }
      return value;
    }

    function requirePositiveInteger(value, label, minimum, code) {
      if (!Number.isInteger(value) || value < minimum) {
        fail(code, `${label}必须是大于等于 ${minimum} 的整数`);
      }
      return value;
    }

    function normalizeComponentValues(values, label) {
      if (!Array.isArray(values)) {
        fail("INVALID_COMPONENT_TABLE", `${label}物料表必须是数组`);
      }

      const unique = new Set();
      values.forEach((value, index) => {
        if (!isFiniteNumber(value) || !(value > 0)) {
          fail(
            "INVALID_COMPONENT_VALUE",
            `${label}物料表第 ${index + 1} 项必须是大于 0 的有限数字`,
            { index, value },
          );
        }
        unique.add(value);
      });

      return Array.from(unique).sort((a, b) => a - b);
    }

    function normalizePoints(points) {
      if (!Array.isArray(points) || !points.length) {
        fail("NO_MATCHING_POINTS", "至少需要一个阻抗频点");
      }

      return points
        .map((point, index) => {
          if (!point || typeof point !== "object") {
            fail(
              "INVALID_MATCHING_POINT",
              `第 ${index + 1} 个阻抗频点格式无效`,
              { index },
            );
          }

          const fHz = point.fHz;
          const impedance = point.Z;
          if (!isFiniteNumber(fHz) || !(fHz > 0)) {
            fail(
              "INVALID_FREQUENCY",
              `第 ${index + 1} 个频点的频率必须是大于 0 的有限 Hz 数值`,
              { index, value: fHz },
            );
          }
          if (!impedance || typeof impedance !== "object") {
            fail(
              "INVALID_IMPEDANCE",
              `第 ${index + 1} 个频点缺少阻抗 Z`,
              { index },
            );
          }
          if (!isFiniteNumber(impedance.R) || !(impedance.R > 0)) {
            fail(
              "INVALID_RESISTANCE",
              `第 ${index + 1} 个频点的实部 R 必须是大于 0 的有限数字`,
              { index, value: impedance.R },
            );
          }
          if (!isFiniteNumber(impedance.X)) {
            fail(
              "INVALID_REACTANCE",
              `第 ${index + 1} 个频点的虚部 X 必须是有限数字`,
              { index, value: impedance.X },
            );
          }

          return {
            fHz,
            Z: { R: impedance.R, X: impedance.X },
            originalIndex: index,
          };
        })
        .sort((a, b) => a.fHz - b.fHz || a.originalIndex - b.originalIndex);
    }

    function samplePoints(points, maxPoints) {
      requirePositiveInteger(
        maxPoints,
        "搜索抽样点数",
        2,
        "INVALID_SEARCH_POINT_LIMIT",
      );
      if (!Array.isArray(points)) {
        fail("INVALID_MATCHING_POINTS", "阻抗频点必须是数组");
      }
      if (points.length <= maxPoints) {
        return points.slice();
      }

      const sampled = [];
      const lastIndex = points.length - 1;
      for (let index = 0; index < maxPoints; index += 1) {
        const sourceIndex = Math.round(
          (index * lastIndex) / (maxPoints - 1),
        );
        sampled.push(points[sourceIndex]);
      }
      return sampled;
    }

    function formatNumber(value) {
      return Number(value.toPrecision(8)).toString();
    }

    function makeDnpPlacement() {
      return {
        state: "dnp",
        componentType: null,
        value: null,
        unit: null,
        display: "DNP（不装，理想开路）",
      };
    }

    function makeBypassPlacement() {
      return {
        state: "bypass",
        componentType: null,
        value: 0,
        unit: "Ω",
        display: "0 Ω / 直通（理想短路）",
      };
    }

    function makeComponentPlacement(componentType, value) {
      const unit = componentType === "C" ? "pF" : "nH";
      return {
        state: "component",
        componentType,
        value,
        unit,
        display: `${componentType} = ${formatNumber(value)} ${unit}`,
      };
    }

    function placementSignature(placement) {
      if (placement.state === "component") {
        return `${placement.componentType}${formatNumber(placement.value)}`;
      }
      return placement.state;
    }

    function countPopulatedComponents(placements) {
      return [
        placements.loadShunt,
        placements.series,
        placements.sourceShunt,
      ].filter((placement) => placement.state === "component").length;
    }

    function makeTopology(placements, targetZ0) {
      const targetText = formatNumber(targetZ0);
      return {
        direction: "antenna-to-source",
        fromPort: {
          id: "antenna-load",
          label: "天线/负载端",
        },
        toPort: {
          id: "source-target",
          label: `${targetText} Ω 目标/射频源端`,
          impedanceOhms: targetZ0,
        },
        slots: [
          {
            id: "loadShunt",
            side: "antenna-load",
            connection: "shunt-to-ground",
            label: "天线/负载侧并联位",
            placement: placements.loadShunt,
          },
          {
            id: "series",
            side: "between-ports",
            connection: "series",
            label: "信号路径串联位",
            placement: placements.series,
          },
          {
            id: "sourceShunt",
            side: "source-target",
            connection: "shunt-to-ground",
            label: "目标/射频源侧并联位",
            placement: placements.sourceShunt,
          },
        ],
        text:
          `天线/负载端 → 负载侧并联 ${placements.loadShunt.display}` +
          ` → 在线串联 ${placements.series.display}` +
          ` → 源侧并联 ${placements.sourceShunt.display}` +
          ` → ${targetText} Ω 目标/射频源端`,
      };
    }

    function makeCandidate(
      tier,
      topologyId,
      label,
      loadShunt,
      series,
      sourceShunt,
      targetZ0,
    ) {
      const placements = { loadShunt, series, sourceShunt };
      const id = [
        topologyId,
        placementSignature(loadShunt),
        placementSignature(series),
        placementSignature(sourceShunt),
      ].join(":");

      return {
        id,
        tier,
        topologyId,
        label,
        componentCount: countPopulatedComponents(placements),
        placements,
        topology: makeTopology(placements, targetZ0),
      };
    }

    function makeBaselineCandidate(targetZ0) {
      return makeCandidate(
        "baseline",
        "baseline-through",
        "无需匹配 / 直通基准",
        makeDnpPlacement(),
        makeBypassPlacement(),
        makeDnpPlacement(),
        targetZ0,
      );
    }

    function componentImpedance(placement, fHz) {
      if (placement.state !== "component") {
        return { R: 0, X: 0 };
      }

      const angularFrequency = 2 * Math.PI * fHz;
      const reactance =
        placement.componentType === "L"
          ? angularFrequency * placement.value * 1e-9
          : -1 / (angularFrequency * placement.value * 1e-12);
      if (!Number.isFinite(reactance)) {
        return { R: NaN, X: NaN };
      }
      return { R: 0, X: reactance };
    }

    function addSeries(left, right) {
      return {
        R: left.R + right.R,
        X: left.X + right.X,
      };
    }

    function invertImpedance(impedance) {
      const scale = Math.hypot(impedance.R, impedance.X);
      if (!(scale > 0) || !Number.isFinite(scale)) {
        return { R: NaN, X: NaN };
      }
      const normalizedR = impedance.R / scale;
      const normalizedX = impedance.X / scale;
      return {
        R: normalizedR / scale,
        X: -normalizedX / scale,
      };
    }

    function parallel(left, right) {
      const leftY = invertImpedance(left);
      const rightY = invertImpedance(right);
      if (
        !isFiniteNumber(leftY.R) ||
        !isFiniteNumber(leftY.X) ||
        !isFiniteNumber(rightY.R) ||
        !isFiniteNumber(rightY.X)
      ) {
        return { R: NaN, X: NaN };
      }
      return invertImpedance({
        R: leftY.R + rightY.R,
        X: leftY.X + rightY.X,
      });
    }

    function applyCandidate(loadZ, candidate, fHz) {
      let impedance = { R: loadZ.R, X: loadZ.X };
      const placements = candidate.placements;

      if (placements.loadShunt.state === "component") {
        impedance = parallel(
          impedance,
          componentImpedance(placements.loadShunt, fHz),
        );
      }
      if (placements.series.state === "component") {
        impedance = addSeries(
          impedance,
          componentImpedance(placements.series, fHz),
        );
      }
      if (placements.sourceShunt.state === "component") {
        impedance = parallel(
          impedance,
          componentImpedance(placements.sourceShunt, fHz),
        );
      }

      return impedance;
    }

    function calculateVswr(impedance, targetZ0 = DEFAULT_TARGET_Z0) {
      if (
        !impedance ||
        !isFiniteNumber(impedance.R) ||
        !isFiniteNumber(impedance.X) ||
        impedance.R < 0 ||
        !isFiniteNumber(targetZ0) ||
        !(targetZ0 > 0)
      ) {
        return Infinity;
      }

      const numerator = Math.hypot(
        impedance.R - targetZ0,
        impedance.X,
      );
      const denominator = Math.hypot(
        impedance.R + targetZ0,
        impedance.X,
      );
      if (!(denominator > 0) || !Number.isFinite(numerator)) {
        return Infinity;
      }

      const reflectionMagnitude = numerator / denominator;
      if (!Number.isFinite(reflectionMagnitude) || reflectionMagnitude >= 1) {
        return Infinity;
      }
      return (1 + reflectionMagnitude) / (1 - reflectionMagnitude);
    }

    function scoreCandidate(candidate, points, targetZ0, cutoff = Infinity) {
      let maximum = 1;
      for (const point of points) {
        const inputImpedance = applyCandidate(
          point.Z,
          candidate,
          point.fHz,
        );
        const vswr = calculateVswr(inputImpedance, targetZ0);
        if (vswr > maximum) {
          maximum = vswr;
        }
        if (maximum >= cutoff) {
          break;
        }
      }
      return maximum;
    }

    function evaluateCandidate(candidate, points, targetZ0) {
      let maximum = 1;
      let worstPointIndex = 0;
      let worstFrequencyHz = points[0].fHz;
      let worstOriginalIndex = points[0].originalIndex ?? 0;

      points.forEach((point, index) => {
        const inputImpedance = applyCandidate(
          point.Z,
          candidate,
          point.fHz,
        );
        const vswr = calculateVswr(inputImpedance, targetZ0);
        if (vswr > maximum) {
          maximum = vswr;
          worstPointIndex = index;
          worstFrequencyHz = point.fHz;
          worstOriginalIndex = point.originalIndex ?? index;
        }
      });

      return {
        ...candidate,
        maxVswr: maximum,
        worstPointIndex,
        worstFrequencyHz,
        worstOriginalIndex,
        validationPointCount: points.length,
      };
    }

    function compareByScore(left, right) {
      if (left.maxVswr !== right.maxVswr) {
        return left.maxVswr - right.maxVswr;
      }
      if (left.componentCount !== right.componentCount) {
        return left.componentCount - right.componentCount;
      }
      return left.id.localeCompare(right.id);
    }

    function insertSearchShortlist(
      shortlist,
      candidate,
      searchPoints,
      targetZ0,
      limit,
    ) {
      const cutoff =
        shortlist.length < limit
          ? Infinity
          : shortlist[shortlist.length - 1].searchMaxVswr;
      const searchMaxVswr = scoreCandidate(
        candidate,
        searchPoints,
        targetZ0,
        cutoff,
      );
      if (!Number.isFinite(searchMaxVswr)) {
        return;
      }

      const hydrated = { ...candidate, searchMaxVswr };
      let insertAt = shortlist.length;
      for (let index = 0; index < shortlist.length; index += 1) {
        const current = shortlist[index];
        if (
          searchMaxVswr < current.searchMaxVswr ||
          (searchMaxVswr === current.searchMaxVswr &&
            candidate.componentCount < current.componentCount)
        ) {
          insertAt = index;
          break;
        }
      }
      if (insertAt === shortlist.length && shortlist.length >= limit) {
        return;
      }
      shortlist.splice(insertAt, 0, hydrated);
      if (shortlist.length > limit) {
        shortlist.pop();
      }
    }

    function estimateCandidateCount(capacitorCount, inductorCount) {
      const allComponentCount = capacitorCount + inductorCount;
      const baselineCount = 1;
      const singleCount = 3 * allComponentCount;
      const lCount = 2 * allComponentCount * allComponentCount;
      const piCount =
        capacitorCount * capacitorCount * inductorCount;
      return baselineCount + singleCount + lCount + piCount;
    }

    function enumerateCandidates(
      capacitorsPf,
      inductorsNh,
      targetZ0,
      visit,
    ) {
      const allComponents = [
        ...capacitorsPf.map((value) => makeComponentPlacement("C", value)),
        ...inductorsNh.map((value) => makeComponentPlacement("L", value)),
      ];

      for (const component of allComponents) {
        visit(
          makeCandidate(
            "single",
            "single-series",
            "单元件串联匹配",
            makeDnpPlacement(),
            component,
            makeDnpPlacement(),
            targetZ0,
          ),
        );
        visit(
          makeCandidate(
            "single",
            "single-load-shunt",
            "单元件并联匹配（天线/负载侧）",
            component,
            makeBypassPlacement(),
            makeDnpPlacement(),
            targetZ0,
          ),
        );
        visit(
          makeCandidate(
            "single",
            "single-source-shunt",
            "单元件并联匹配（目标/射频源侧）",
            makeDnpPlacement(),
            makeBypassPlacement(),
            component,
            targetZ0,
          ),
        );
      }

      for (const shuntComponent of allComponents) {
        for (const seriesComponent of allComponents) {
          visit(
            makeCandidate(
              "l",
              "l-load-shunt-first",
              "L 型：负载侧并联后串联",
              shuntComponent,
              seriesComponent,
              makeDnpPlacement(),
              targetZ0,
            ),
          );
        }
      }

      for (const seriesComponent of allComponents) {
        for (const shuntComponent of allComponents) {
          visit(
            makeCandidate(
              "l",
              "l-source-shunt-last",
              "L 型：先串联后源侧并联",
              makeDnpPlacement(),
              seriesComponent,
              shuntComponent,
              targetZ0,
            ),
          );
        }
      }

      for (const loadCapacitance of capacitorsPf) {
        for (const seriesInductance of inductorsNh) {
          for (const sourceCapacitance of capacitorsPf) {
            visit(
              makeCandidate(
                "pi",
                "pi-lowpass-clc",
                "Π 型低通：C-L-C",
                makeComponentPlacement("C", loadCapacitance),
                makeComponentPlacement("L", seriesInductance),
                makeComponentPlacement("C", sourceCapacitance),
                targetZ0,
              ),
            );
          }
        }
      }
    }

    function validateSynthesisOptions(options) {
      if (!options || typeof options !== "object") {
        fail("INVALID_OPTIONS", "匹配参数必须是对象");
      }

      const targetZ0 =
        options.targetZ0 === undefined
          ? DEFAULT_TARGET_Z0
          : options.targetZ0;
      const vswrThreshold =
        options.vswrThreshold === undefined
          ? DEFAULT_VSWR_THRESHOLD
          : options.vswrThreshold;
      const maxSearchPoints =
        options.maxSearchPoints === undefined
          ? DEFAULT_MAX_SEARCH_POINTS
          : options.maxSearchPoints;
      const shortlistSize =
        options.shortlistSize === undefined
          ? DEFAULT_SHORTLIST_SIZE
          : options.shortlistSize;
      const resultLimit =
        options.resultLimit === undefined
          ? DEFAULT_RESULT_LIMIT
          : options.resultLimit;

      requireFinitePositive(
        targetZ0,
        "目标阻抗 Z0",
        "INVALID_TARGET_Z0",
      );
      if (!isFiniteNumber(vswrThreshold) || !(vswrThreshold > 1)) {
        fail(
          "INVALID_VSWR_THRESHOLD",
          "VSWR 门限必须是大于 1 的有限数字",
        );
      }
      requirePositiveInteger(
        maxSearchPoints,
        "搜索抽样点数",
        2,
        "INVALID_SEARCH_POINT_LIMIT",
      );
      requirePositiveInteger(
        shortlistSize,
        "全量复核候选数",
        1,
        "INVALID_SHORTLIST_SIZE",
      );
      requirePositiveInteger(
        resultLimit,
        "结果数量",
        1,
        "INVALID_RESULT_LIMIT",
      );

      const capacitorsPf = normalizeComponentValues(
        options.capacitorsPf === undefined ? [] : options.capacitorsPf,
        "电容",
      );
      const inductorsNh = normalizeComponentValues(
        options.inductorsNh === undefined ? [] : options.inductorsNh,
        "电感",
      );
      const estimatedCandidateCount = estimateCandidateCount(
        capacitorsPf.length,
        inductorsNh.length,
      );
      if (estimatedCandidateCount > MAX_ENUMERATED_CANDIDATES) {
        fail(
          "COMPONENT_TABLE_TOO_LARGE",
          `物料组合预计产生 ${estimatedCandidateCount} 个候选，超过安全上限 ${MAX_ENUMERATED_CANDIDATES}`,
          { estimatedCandidateCount, limit: MAX_ENUMERATED_CANDIDATES },
        );
      }

      return {
        targetZ0,
        vswrThreshold,
        maxSearchPoints,
        shortlistSize,
        resultLimit,
        capacitorsPf,
        inductorsNh,
        estimatedCandidateCount,
      };
    }

    function compareForRecommendations(left, right, threshold) {
      const leftPassed = left.maxVswr <= threshold;
      const rightPassed = right.maxVswr <= threshold;
      if (leftPassed !== rightPassed) {
        return leftPassed ? -1 : 1;
      }
      if (leftPassed && left.componentCount !== right.componentCount) {
        return left.componentCount - right.componentCount;
      }
      return compareByScore(left, right);
    }

    function synthesizeMatching(options) {
      const normalizedOptions = validateSynthesisOptions(options);
      const fullPoints = normalizePoints(options.points);
      const searchPoints = samplePoints(
        fullPoints,
        normalizedOptions.maxSearchPoints,
      );
      const baseline = evaluateCandidate(
        makeBaselineCandidate(normalizedOptions.targetZ0),
        fullPoints,
        normalizedOptions.targetZ0,
      );
      baseline.searchMaxVswr = scoreCandidate(
        baseline,
        searchPoints,
        normalizedOptions.targetZ0,
      );

      // A load already within the requested limit should not spend time
      // enumerating thousands of unnecessary L/C combinations.
      if (baseline.maxVswr <= normalizedOptions.vswrThreshold) {
        return {
          version: VERSION,
          targetZ0: normalizedOptions.targetZ0,
          vswrThreshold: normalizedOptions.vswrThreshold,
          passed: true,
          selectionReason: "baseline-meets-threshold",
          improvedVsBaseline: false,
          baseline,
          selected: baseline,
          recommendations: [baseline],
          tiers: {
            baseline: { best: baseline, validatedCount: 1 },
            single: { best: null, validatedCount: 0 },
            l: { best: null, validatedCount: 0 },
            pi: { best: null, validatedCount: 0 },
          },
          inventory: {
            capacitorsPf: normalizedOptions.capacitorsPf.slice(),
            inductorsNh: normalizedOptions.inductorsNh.slice(),
          },
          counts: {
            fullPointCount: fullPoints.length,
            searchPointCount: searchPoints.length,
            estimatedCandidateCount: 1,
            shortlistedCandidateCount: 0,
            fullyValidatedCandidateCount: 1,
          },
          usedSampling: searchPoints.length < fullPoints.length,
        };
      }

      const shortlists = {
        single: [],
        l: [],
        pi: [],
      };

      enumerateCandidates(
        normalizedOptions.capacitorsPf,
        normalizedOptions.inductorsNh,
        normalizedOptions.targetZ0,
        (candidate) => {
          insertSearchShortlist(
            shortlists[candidate.tier],
            candidate,
            searchPoints,
            normalizedOptions.targetZ0,
            normalizedOptions.shortlistSize,
          );
        },
      );

      function validateShortlist(shortlist) {
        return shortlist
          .map((candidate) => ({
            ...evaluateCandidate(
              candidate,
              fullPoints,
              normalizedOptions.targetZ0,
            ),
            searchMaxVswr: candidate.searchMaxVswr,
          }))
          .sort(compareByScore);
      }

      const validated = {
        single: validateShortlist(shortlists.single),
        l: validateShortlist(shortlists.l),
        pi: validateShortlist(shortlists.pi),
      };
      const allValidated = [
        baseline,
        ...validated.single,
        ...validated.l,
        ...validated.pi,
      ];
      const passing = allValidated.filter(
        (candidate) =>
          candidate.maxVswr <= normalizedOptions.vswrThreshold,
      );

      let selected;
      let selectionReason;
      if (passing.length) {
        passing.sort((left, right) => {
          if (left.componentCount !== right.componentCount) {
            return left.componentCount - right.componentCount;
          }
          return compareByScore(left, right);
        });
        selected = passing[0];
        selectionReason =
          selected.tier === "baseline"
            ? "baseline-meets-threshold"
            : "lowest-complexity-passing";
      } else {
        selected = allValidated.slice().sort(compareByScore)[0];
        selectionReason =
          selected.tier === "baseline"
            ? "no-candidate-improves-baseline"
            : "best-available-not-passing";
      }

      const recommendations = allValidated
        .slice()
        .sort((left, right) =>
          compareForRecommendations(
            left,
            right,
            normalizedOptions.vswrThreshold,
          ),
        )
        .slice(0, normalizedOptions.resultLimit);

      return {
        version: VERSION,
        targetZ0: normalizedOptions.targetZ0,
        vswrThreshold: normalizedOptions.vswrThreshold,
        passed:
          selected.maxVswr <= normalizedOptions.vswrThreshold,
        selectionReason,
        improvedVsBaseline:
          selected.maxVswr < baseline.maxVswr &&
          selected.tier !== "baseline",
        baseline,
        selected,
        recommendations,
        tiers: {
          baseline: {
            best: baseline,
            validatedCount: 1,
          },
          single: {
            best: validated.single[0] || null,
            validatedCount: validated.single.length,
          },
          l: {
            best: validated.l[0] || null,
            validatedCount: validated.l.length,
          },
          pi: {
            best: validated.pi[0] || null,
            validatedCount: validated.pi.length,
          },
        },
        inventory: {
          capacitorsPf: normalizedOptions.capacitorsPf.slice(),
          inductorsNh: normalizedOptions.inductorsNh.slice(),
        },
        counts: {
          fullPointCount: fullPoints.length,
          searchPointCount: searchPoints.length,
          estimatedCandidateCount:
            normalizedOptions.estimatedCandidateCount,
          shortlistedCandidateCount:
            shortlists.single.length +
            shortlists.l.length +
            shortlists.pi.length,
          fullyValidatedCandidateCount: allValidated.length,
        },
        usedSampling: searchPoints.length < fullPoints.length,
      };
    }

    return {
      VERSION,
      LIMITS: {
        maxEnumeratedCandidates: MAX_ENUMERATED_CANDIDATES,
      },
      MatchingEngineError,
      applyCandidate,
      calculateVswr,
      evaluateCandidate,
      makeBaselineCandidate,
      normalizeComponentValues,
      normalizePoints,
      samplePoints,
      synthesizeMatching,
    };
  },
);
