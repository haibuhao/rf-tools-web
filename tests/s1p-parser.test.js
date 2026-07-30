const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const rootDir = path.resolve(__dirname, "..");
const context = { window: {} };
vm.createContext(context);
vm.runInContext(
  fs.readFileSync(path.join(rootDir, "s1p-parser.js"), "utf8"),
  context,
);
const parser = context.window.TouchstoneS1P;

function closeTo(actual, expected, tolerance = 1e-9) {
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `${actual} 与期望值 ${expected} 的误差超过 ${tolerance}`,
  );
}

test("RI 格式能把匹配点转换为 50+j0 Ω", () => {
  const result = parser.parseTouchstoneS1p(`
    ! VNA export
    # MHz S RI R 50
    100 0 0 ! perfect match
  `);

  assert.equal(result.points[0].frequencyHz, 100e6);
  closeTo(result.points[0].impedanceOhms.re, 50);
  closeTo(result.points[0].impedanceOhms.im, 0);
  assert.equal(result.metadata.format, "RI");
});

test("MA 与 DB 格式、单位和非 50 Ω参考阻抗均可解析", () => {
  const ma = parser.parseTouchstoneS1p(`
    # GHz S MA R 50
    1 0.5 90
  `);
  closeTo(ma.points[0].impedanceOhms.re, 30, 1e-8);
  closeTo(ma.points[0].impedanceOhms.im, 40, 1e-8);

  const db = parser.parseTouchstoneS1p(`
    # R 75 DB S kHz
    2D3 -6.020599913 180
  `);
  assert.equal(db.points[0].frequencyHz, 2e6);
  closeTo(db.points[0].impedanceOhms.re, 25, 1e-8);
  closeTo(db.points[0].impedanceOhms.im, 0, 1e-8);
});

test("缺少选项行时按 Touchstone 默认值解析并给出提示", () => {
  const result = parser.parseTouchstoneS1p("1 0 0");
  assert.equal(result.points[0].frequencyHz, 1e9);
  closeTo(result.points[0].impedanceOhms.re, 50);
  assert.equal(result.warnings.length, 1);
});

test("不支持的参数会明确报错", () => {
  assert.throws(
    () => parser.parseTouchstoneS1p("# MHz Z RI R 50\n100 50 0"),
    (error) => error.code === "UNSUPPORTED_PARAMETER" && error.line === 1,
  );
});

test("支持常见 Touchstone 2.x 一端口关键字和 Reference", () => {
  const result = parser.parseTouchstoneS1p(`
    [Version] 2.0
    # MHz S RI R 50
    [Number of Ports] 1
    [Number of Frequencies] 1
    [Reference] 75
    [Network Data]
    100 0 0
    [End]
  `);

  assert.equal(result.metadata.version, "2.0");
  assert.equal(result.metadata.referenceOhms, 75);
  closeTo(result.points[0].impedanceOhms.re, 75);
});

test("Touchstone 2.x 非一端口和未知版本会明确报错", () => {
  assert.throws(
    () =>
      parser.parseTouchstoneS1p(
        "[Version] 2.0\n[Number of Ports] 2\n# MHz S RI R 50\n[Network Data]\n100 0 0",
      ),
    (error) => error.code === "NOT_ONE_PORT" && error.line === 2,
  );
  assert.throws(
    () => parser.parseTouchstoneS1p("[Version] 3.0"),
    (error) => error.code === "UNSUPPORTED_VERSION" && error.line === 1,
  );
});

test("理想开路点保留警告，但不会进入匹配点", () => {
  const result = parser.parseTouchstoneS1p("# MHz S RI R 50\n100 1 0");
  assert.equal(result.warnings.length, 1);
  assert.match(result.warnings[0], /1 个理想开路点/);
  assert.equal(parser.toMatcherPoints(result.points).length, 0);
});

test("MA 负幅度和单位换算后的频率溢出会明确拒绝", () => {
  assert.throws(
    () => parser.parseTouchstoneS1p("# MHz S MA R 50\n100 -0.5 0"),
    (error) => error.code === "NEGATIVE_MAGNITUDE" && error.line === 2,
  );
  assert.throws(
    () => parser.parseTouchstoneS1p("# GHz S RI R 50\n1e308 0 0"),
    (error) => error.code === "NON_POSITIVE_FREQUENCY" && error.line === 2,
  );
});

test("大量理想开路只生成汇总警告，不会膨胀 DOM 文本", () => {
  const rows = Array.from(
    { length: 2000 },
    (_, index) => `${index + 1} 1 0`,
  ).join("\n");
  const result = parser.parseTouchstoneS1p(`# MHz S RI R 50\n${rows}`);

  assert.equal(result.warnings.length, 1);
  assert.match(result.warnings[0], /2000 个理想开路点/);
});

test("频率过滤和 61 点等距抽样会保留首尾", () => {
  const points = Array.from({ length: 1001 }, (_, index) => ({
    frequencyHz: index * 1e6,
  }));
  const filtered = parser.filterPointsByFrequency(points, 100e6, 900e6);
  const sampled = parser.sampleTouchstonePoints(filtered, 61);

  assert.equal(filtered.length, 801);
  assert.equal(sampled.length, 61);
  assert.equal(sampled[0].frequencyHz, 100e6);
  assert.equal(sampled[sampled.length - 1].frequencyHz, 900e6);
});
