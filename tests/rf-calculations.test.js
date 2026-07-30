const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const rootDir = path.resolve(__dirname, "..");
const rf = require(path.join(rootDir, "rf-calculations.js"));

function closeTo(actual, expected, tolerance = 1e-9) {
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `expected ${actual} to be within ${tolerance} of ${expected}`,
  );
}

function hasErrorCode(code) {
  return (error) =>
    error &&
    error.name === "RFCalculationError" &&
    error.code === code;
}

test("UMD 文件可由浏览器 script 全局方式加载", () => {
  const context = {};
  vm.createContext(context);
  vm.runInContext(
    fs.readFileSync(path.join(rootDir, "rf-calculations.js"), "utf8"),
    context,
  );

  assert.equal(typeof context.RFCalculations, "object");
  assert.equal(
    context.RFCalculations.calculateWavelength(1000).wavelengthM,
    0.299792458,
  );
});

test("严格数字解析拒绝 parseFloat 会接受的尾随文本", () => {
  assert.equal(rf.parseStrictNumber(" 2.4e3 "), 2400);
  for (const invalid of [
    "",
    "2400MHz",
    "2400foo",
    "2,400",
    "0x10",
    "Infinity",
    Infinity,
    NaN,
    null,
  ]) {
    assert.throws(
      () => rf.parseStrictNumber(invalid),
      hasErrorCode("INVALID_NUMBER"),
    );
  }
});

test("波长和 FSPL 使用精确真空光速", () => {
  const wavelength = rf.calculateWavelength(2400);
  closeTo(wavelength.wavelengthMm, 124.91352416666666, 1e-12);
  closeTo(wavelength.halfWaveMm, 62.45676208333333, 1e-12);
  closeTo(wavelength.quarterWaveMm, 31.228381041666665, 1e-12);

  const fspl = rf.calculateFspl(1, 2400);
  closeTo(fspl.fsplDb, 40.0520080561155, 1e-12);
  closeTo(
    rf.calculateFspl(10, 2400).fsplDb - fspl.fsplDb,
    20,
    1e-12,
  );
  closeTo(
    rf.calculateFspl(1, 4800).fsplDb - fspl.fsplDb,
    20 * Math.log10(2),
    1e-12,
  );
});

test("效率与增益换算采用正确功率比并限制效率范围", () => {
  closeTo(rf.efficiencyDbToPercent(-3.010299956639812), 50, 1e-12);
  closeTo(rf.efficiencyPercentToDb(50), -3.010299956639812, 1e-12);
  assert.equal(rf.efficiencyDbToPercent(0), 100);
  assert.equal(rf.efficiencyPercentToDb(0), -Infinity);
  assert.throws(
    () => rf.efficiencyDbToPercent(0.1),
    hasErrorCode("OUT_OF_RANGE"),
  );
  assert.throws(
    () => rf.efficiencyPercentToDb(100.1),
    hasErrorCode("OUT_OF_RANGE"),
  );

  closeTo(rf.gainDbToLinear(3.010299956639812), 2, 1e-12);
  closeTo(rf.gainLinearToDb(2), 3.010299956639812, 1e-12);
  assert.equal(rf.gainLinearToDb(0), -Infinity);
});

test("dBm 与 Watt 正确换算并明确处理零功率", () => {
  assert.equal(rf.dbmToWatts(30), 1);
  closeTo(rf.dbmToWatts(0), 0.001, 1e-15);
  closeTo(rf.dbmToWatts(-30), 0.000001, 1e-18);
  assert.equal(rf.wattsToDbm(1), 30);
  closeTo(rf.wattsToDbm(0.001), 0, 1e-12);
  assert.equal(rf.wattsToDbm(0), -Infinity);
  assert.throws(() => rf.wattsToDbm(-1), hasErrorCode("OUT_OF_RANGE"));
});

test("阵列合成显式区分固定总功率和每路功率不变", () => {
  const fixedTotal = rf.combineArrayGains([5, 5, 5, 5]);
  closeTo(fixedTotal.uncorrelatedDbi, 5, 1e-12);
  closeTo(fixedTotal.coherentDbi, 11.020599913279625, 1e-12);
  assert.equal(fixedTotal.normalization, "fixed-total");

  const perElement = rf.combineArrayGains([5, 5, 5, 5], {
    normalization: "per-element",
  });
  closeTo(perElement.uncorrelatedDbi, 11.020599913279625, 1e-12);
  closeTo(perElement.coherentDbi, 17.04119982655925, 1e-12);

  const single = rf.combineArrayGains([-3]);
  assert.equal(single.uncorrelatedDbi, -3);
  assert.equal(single.coherentDbi, -3);
  assert.throws(
    () => rf.combineArrayGains([]),
    hasErrorCode("INVALID_ARRAY"),
  );
  assert.throws(
    () => rf.combineArrayGains([5, "bad"]),
    hasErrorCode("INVALID_NUMBER"),
  );
});

test("有源与无源量按各自最小依赖独立计算", () => {
  assert.equal(rf.calculateDirectivity(2, -3), 5);
  assert.equal(rf.calculateEirp(23, 2), 25);
  assert.equal(rf.calculateTrp(23, -3), 20);
  assert.equal(rf.calculateEis(-95, 2), -97);
  assert.equal(rf.calculateTis(-95, -3), -92);
  assert.throws(
    () => rf.calculateTrp(23, 0.1),
    hasErrorCode("OUT_OF_RANGE"),
  );
});

test("VSWR、正值 Return Loss、失配损耗和接受功率双向一致", () => {
  const fromVswr = rf.metricsFromVswr(2);
  closeTo(fromVswr.reflectionCoefficient, 1 / 3, 1e-15);
  closeTo(fromVswr.returnLossDb, 9.54242509439325, 1e-12);
  closeTo(fromVswr.mismatchLossDb, 0.5115252244738131, 1e-12);
  closeTo(fromVswr.acceptedPowerPercent, 88.88888888888889, 1e-12);

  const fromReturnLoss = rf.metricsFromReturnLoss(
    fromVswr.returnLossDb,
  );
  closeTo(fromReturnLoss.vswr, 2, 1e-12);

  const ideal = rf.metricsFromVswr(1);
  assert.equal(ideal.reflectionCoefficient, 0);
  assert.equal(ideal.returnLossDb, Infinity);
  assert.equal(ideal.mismatchLossDb, 0);
  assert.equal(ideal.acceptedPowerPercent, 100);

  const totalReflection = rf.metricsFromReturnLoss(0);
  assert.equal(totalReflection.reflectionCoefficient, 1);
  assert.equal(totalReflection.vswr, Infinity);
  assert.equal(totalReflection.mismatchLossDb, Infinity);
  assert.equal(totalReflection.acceptedPowerPercent, 0);

  assert.throws(
    () => rf.metricsFromReturnLoss(-9.54),
    hasErrorCode("OUT_OF_RANGE"),
  );
  assert.throws(() => rf.metricsFromVswr(0.99), hasErrorCode("OUT_OF_RANGE"));
});

test("Fraunhofer 距离返回尺寸电气大小供 UI 提示模型边界", () => {
  const result = rf.calculateFraunhoferDistance(150, 2400);
  closeTo(result.distanceM, 0.36024922281400423, 1e-12);
  closeTo(result.distanceMm, 360.2492228140042, 1e-9);
  closeTo(
    result.diameterToWavelengthRatio,
    0.15 / (299792458 / 2.4e9),
    1e-12,
  );
  assert.equal(result.isElectricallyLarge, true);

  assert.equal(
    rf.calculateFraunhoferDistance(10, 1000).isElectricallyLarge,
    false,
  );
});

test("平衡 CRLH 和圆柱过孔粗估使用正确单位", () => {
  const crlh = rf.synthesizeBalancedCrlh(2000, 1.5, 2.5);
  closeTo(crlh.requiredShuntInductanceNh, 4.221715985097408, 1e-12);
  closeTo(crlh.requiredSeriesCapacitancePf, 2.5330295910584444, 1e-12);
  assert.equal(crlh.balanced, true);

  const via = rf.estimateViaInductance(1, 0.5);
  closeTo(via.inductanceNh, 0.6158883083359672, 1e-12);
  assert.equal(via.aspectRatio, 2);
  assert.throws(
    () => rf.estimateViaInductance(1, 20),
    hasErrorCode("MODEL_DOMAIN"),
  );
});

test("微带正向计算和反向综合相互回代", () => {
  const analysis = rf.calculateMicrostrip(4.4, 1.6, 3.05);
  closeTo(analysis.impedanceOhms, 50.32256299291707, 1e-12);
  closeTo(analysis.effectivePermittivity, 3.3294102822251848, 1e-12);

  const synthesis = rf.synthesizeMicrostrip(4.4, 1.6, 50);
  closeTo(synthesis.traceWidthMm, 3.0829414054453457, 1e-12);
  closeTo(synthesis.impedanceOhms, 50, 1e-12);
  closeTo(synthesis.errorOhms, 0, 1e-12);

  assert.throws(
    () => rf.synthesizeMicrostrip(4.4, 1.6, 1000),
    hasErrorCode("UNATTAINABLE_TARGET"),
  );
  assert.throws(
    () => rf.calculateMicrostrip(0.9, 1.6, 3),
    hasErrorCode("OUT_OF_RANGE"),
  );
});

test("Q 仅输出单谐振带宽近似并标出宽带情况", () => {
  const result = rf.estimateSingleResonanceQ(2400, 100, 2);
  closeTo(result.fractionalBandwidth, 1 / 24, 1e-15);
  closeTo(result.fractionalBandwidthPercent, 100 / 24, 1e-12);
  closeTo(result.equivalentQ, 16.97056274847714, 1e-12);
  assert.equal(result.isNarrowbandApproximation, true);

  const wide = rf.estimateSingleResonanceQ(1000, 300, 2);
  assert.equal(wide.isNarrowbandApproximation, false);
  assert.throws(
    () => rf.estimateSingleResonanceQ(1000, 100, 1),
    hasErrorCode("OUT_OF_RANGE"),
  );
  assert.throws(
    () => rf.estimateSingleResonanceQ(1000, 2000, 2),
    hasErrorCode("OUT_OF_RANGE"),
  );
  assert.throws(
    () => rf.estimateSingleResonanceQ("2400foo", 100, 2),
    hasErrorCode("INVALID_NUMBER"),
  );
});
