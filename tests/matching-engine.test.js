const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const engine = require("../matching-engine.js");

const CURRENT_CAPACITORS_PF = [
  0.3, 0.5, 0.6, 0.7, 0.8, 0.9, 1, 2, 2.2, 2.4, 2.7, 3.3, 3.6, 3.9,
  4.3, 4.7, 5.1, 5.6, 6.2, 6.8, 7.5, 8.2, 9.1, 10, 11, 12, 15, 18, 22,
];
const CURRENT_INDUCTORS_NH = [
  0.6, 1.1, 1.2, 1.5, 1.6, 1.8, 2, 2.2, 2.4, 2.7, 3, 3.3, 3.6, 3.9,
  4.3, 4.7, 5.1, 5.6, 6.2, 6.8, 7.5, 8.2, 9.1, 10, 11, 12, 15, 18, 22,
];

function point(fHz, R, X) {
  return { fHz, Z: { R, X } };
}

function closeTo(actual, expected, tolerance = 1e-9) {
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `${actual} 与期望值 ${expected} 的误差超过 ${tolerance}`,
  );
}

test("UMD 文件可直接通过浏览器 script 暴露 MatchingEngine", () => {
  const context = {};
  vm.createContext(context);
  vm.runInContext(
    fs.readFileSync(path.resolve(__dirname, "../matching-engine.js"), "utf8"),
    context,
  );

  assert.equal(context.MatchingEngine.VERSION, "1.0.0");
  assert.equal(
    context.MatchingEngine.calculateVswr({ R: 50, X: 0 }, 50),
    1,
  );
});

test("UMD/CommonJS API 可加载，VSWR 不再使用 999 哨兵", () => {
  assert.equal(engine.VERSION, "1.0.0");
  assert.equal(engine.calculateVswr({ R: 50, X: 0 }, 50), 1);
  closeTo(engine.calculateVswr({ R: 75, X: 0 }, 50), 1.5);

  const reflection = 0.9995;
  const highResistance = 50 * (1 + reflection) / (1 - reflection);
  closeTo(
    engine.calculateVswr({ R: highResistance, X: 0 }, 50),
    (1 + reflection) / (1 - reflection),
    1e-6,
  );
});

test("已满足门限时选择无需匹配，明确 DNP 与 0Ω 直通", () => {
  const result = engine.synthesizeMatching({
    points: [point(2.4e9, 50, 0)],
    capacitorsPf: [0.3, 3.3],
    inductorsNh: [0.6, 3.3],
    targetZ0: 50,
    vswrThreshold: 2,
  });

  assert.equal(result.passed, true);
  assert.equal(result.selectionReason, "baseline-meets-threshold");
  assert.equal(result.selected.tier, "baseline");
  assert.equal(result.selected.componentCount, 0);
  assert.equal(result.selected.placements.loadShunt.state, "dnp");
  assert.equal(result.selected.placements.series.state, "bypass");
  assert.equal(result.selected.placements.sourceShunt.state, "dnp");
  assert.match(result.selected.topology.text, /^天线\/负载端/);
  assert.match(result.selected.topology.text, /50 Ω 目标\/射频源端$/);
});

test("单个串联电容可完成匹配时不会强塞第二个器件", () => {
  const frequencyHz = 2.4e9;
  const capacitancePf = 3.3;
  const loadReactance =
    1 / (2 * Math.PI * frequencyHz * capacitancePf * 1e-12);
  const result = engine.synthesizeMatching({
    points: [point(frequencyHz, 50, loadReactance)],
    capacitorsPf: [capacitancePf],
    inductorsNh: [1],
    targetZ0: 50,
    vswrThreshold: 1.01,
  });

  assert.equal(result.passed, true);
  assert.equal(result.selected.tier, "single");
  assert.equal(result.selected.topologyId, "single-series");
  assert.equal(result.selected.componentCount, 1);
  assert.equal(result.selected.placements.loadShunt.state, "dnp");
  assert.equal(result.selected.placements.series.componentType, "C");
  assert.equal(result.selected.placements.series.value, 3.3);
  assert.equal(result.selected.placements.sourceShunt.state, "dnp");
  closeTo(result.selected.maxVswr, 1, 1e-9);
});

test("两元件 L 型满足门限时优先于三元件 Π 型", () => {
  const result = engine.synthesizeMatching({
    points: [point(2.4e9, 25, 0)],
    capacitorsPf: [2.7],
    inductorsNh: [3.3],
    targetZ0: 50,
    vswrThreshold: 1.05,
  });

  assert.equal(result.passed, true);
  assert.equal(result.selected.tier, "l");
  assert.equal(result.selected.componentCount, 2);
  assert.equal(result.selected.topology.direction, "antenna-to-source");
  assert.deepEqual(
    result.selected.topology.slots.map((slot) => slot.side),
    ["antenna-load", "between-ports", "source-target"],
  );
});

test("L 型不达标时不会无条件切换到更差的 Π 型", () => {
  const result = engine.synthesizeMatching({
    points: [
      point(700e6, 107.930883128196, 225.49524516798556),
      point(2050e6, 262.645680682268, -93.8650453928858),
      point(3400e6, 272.9202284021303, -76.37798669748008),
    ],
    capacitorsPf: CURRENT_CAPACITORS_PF,
    inductorsNh: CURRENT_INDUCTORS_NH,
    targetZ0: 50,
    vswrThreshold: 2,
    shortlistSize: 24,
  });

  assert.equal(result.passed, false);
  assert.ok(result.tiers.l.best);
  assert.ok(result.tiers.pi.best);
  assert.ok(result.tiers.l.best.maxVswr < result.tiers.pi.best.maxVswr);
  assert.equal(result.selected.tier, "l");
  assert.equal(result.selectionReason, "best-available-not-passing");
});

test("抽样只用于搜索，窄带坏点仍由全部频点复核发现", () => {
  const points = Array.from({ length: 1001 }, (_, index) =>
    index === 8
      ? point((1000 + index) * 1e6, 5, 200)
      : point((1000 + index) * 1e6, 50, 0),
  );
  const result = engine.synthesizeMatching({
    points,
    capacitorsPf: [0.3],
    inductorsNh: [0.6],
    targetZ0: 50,
    vswrThreshold: 2,
    maxSearchPoints: 61,
    shortlistSize: 24,
  });

  assert.equal(result.usedSampling, true);
  assert.equal(result.counts.searchPointCount, 61);
  assert.equal(result.counts.fullPointCount, 1001);
  assert.equal(result.selected.validationPointCount, 1001);
  assert.equal(result.passed, false);
  assert.ok(result.selected.maxVswr > 2);
  assert.ok(
    result.recommendations.every(
      (candidate) => candidate.validationPointCount === 1001,
    ),
  );
});

test("S1P 参考阻抗之外可独立配置目标 Z0", () => {
  const result75 = engine.synthesizeMatching({
    points: [point(1e9, 75, 0)],
    capacitorsPf: [],
    inductorsNh: [],
    targetZ0: 75,
    vswrThreshold: 1.01,
  });
  const result50 = engine.synthesizeMatching({
    points: [point(1e9, 75, 0)],
    capacitorsPf: [],
    inductorsNh: [],
    targetZ0: 50,
    vswrThreshold: 2,
  });

  assert.equal(result75.selected.maxVswr, 1);
  closeTo(result50.selected.maxVswr, 1.5);
  assert.equal(result75.targetZ0, 75);
  assert.equal(result50.targetZ0, 50);
});

test("没有可用物料且基准不达标时保留真正更优的基准结果", () => {
  const result = engine.synthesizeMatching({
    points: [point(1e9, 10, 100)],
    capacitorsPf: [],
    inductorsNh: [],
    targetZ0: 50,
    vswrThreshold: 2,
  });

  assert.equal(result.passed, false);
  assert.equal(result.selected.tier, "baseline");
  assert.equal(result.selectionReason, "no-candidate-improves-baseline");
  assert.equal(result.improvedVsBaseline, false);
});

test("物料表去重排序，但拒绝 0、负数、字符串与无穷值", () => {
  assert.deepEqual(
    engine.normalizeComponentValues([3.3, 0.6, 3.3, 1.2], "电感"),
    [0.6, 1.2, 3.3],
  );
  for (const invalid of [0, -1, "3.3", Infinity, NaN]) {
    assert.throws(
      () => engine.normalizeComponentValues([invalid], "电容"),
      (error) => error.code === "INVALID_COMPONENT_VALUE",
    );
  }
  assert.throws(
    () =>
      engine.synthesizeMatching({
        points: [point(1e9, 50, 0)],
        capacitorsPf: null,
        inductorsNh: [],
      }),
    (error) => error.code === "INVALID_COMPONENT_TABLE",
  );
});

test("目标阻抗、门限和所有阻抗频点必须是严格有限数字", () => {
  const base = {
    points: [point(1e9, 50, 0)],
    capacitorsPf: [1],
    inductorsNh: [1],
  };

  assert.throws(
    () => engine.synthesizeMatching({ ...base, targetZ0: Infinity }),
    (error) => error.code === "INVALID_TARGET_Z0",
  );
  assert.throws(
    () =>
      engine.synthesizeMatching({
        ...base,
        vswrThreshold: Infinity,
      }),
    (error) => error.code === "INVALID_VSWR_THRESHOLD",
  );
  assert.throws(
    () =>
      engine.synthesizeMatching({
        ...base,
        points: [point(Infinity, 50, 0)],
      }),
    (error) => error.code === "INVALID_FREQUENCY",
  );
  assert.throws(
    () =>
      engine.synthesizeMatching({
        ...base,
        points: [point(1e9, Infinity, 0)],
      }),
    (error) => error.code === "INVALID_RESISTANCE",
  );
  assert.throws(
    () =>
      engine.synthesizeMatching({
        ...base,
        points: [point(1e9, 50, NaN)],
      }),
    (error) => error.code === "INVALID_REACTANCE",
  );
});

test("均匀搜索抽样保留首尾，且不改变原数组", () => {
  const points = Array.from({ length: 101 }, (_, index) => ({ index }));
  const sampled = engine.samplePoints(points, 5);

  assert.deepEqual(
    sampled.map((item) => item.index),
    [0, 25, 50, 75, 100],
  );
  assert.equal(points.length, 101);
});
