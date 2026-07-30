const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");
const vm = require("node:vm");

const rootDir = path.resolve(__dirname, "..");
const bandData = JSON.parse(
  fs.readFileSync(path.join(rootDir, "data", "band.txt"), "utf8"),
);

function loadBandApi() {
  const appSource = fs.readFileSync(path.join(rootDir, "app.js"), "utf8");
  const context = {
    console,
    document: {},
    window: {
      BAND_DATA: bandData,
      addEventListener() {},
    },
  };
  vm.createContext(context);
  vm.runInContext(
    `${appSource}\nthis.__bandApi = { parseBandQuery, resolveBandQuery };`,
    context,
  );
  return context.__bandApi;
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

const { parseBandQuery, resolveBandQuery } = loadBandApi();

test("Band 输入格式能明确区分 LTE、NR 和自动查询", () => {
  assert.deepEqual(plain(parseBandQuery("b41")), {
    mode: "lte",
    number: "41",
  });
  assert.deepEqual(plain(parseBandQuery(" LTE Band 41 ")), {
    mode: "lte",
    number: "41",
  });
  assert.deepEqual(plain(parseBandQuery("Nr 78")), {
    mode: "nr",
    number: "78",
  });
  assert.deepEqual(plain(parseBandQuery("Band 41")), {
    mode: "auto",
    number: "41",
  });
  assert.equal(parseBandQuery("abc"), null);
  assert.equal(parseBandQuery(""), null);
});

test("显式前缀不会跨 LTE/NR 回退", () => {
  const fixture = {
    "4": "LTE B4",
    "41": "LTE B41",
    n41: "NR n41",
    n78: "NR n78",
  };

  assert.deepEqual(plain(resolveBandQuery("b41", fixture).matches), [
    { label: "LTE B41", value: "LTE B41" },
  ]);
  assert.deepEqual(plain(resolveBandQuery("n41", fixture).matches), [
    { label: "NR n41", value: "NR n41" },
  ]);
  assert.deepEqual(plain(resolveBandQuery("41", fixture).matches), [
    { label: "LTE B41", value: "LTE B41" },
    { label: "NR n41", value: "NR n41" },
  ]);
  assert.deepEqual(plain(resolveBandQuery("78", fixture).matches), [
    { label: "NR n78", value: "NR n78" },
  ]);
  assert.deepEqual(plain(resolveBandQuery("b78", fixture).matches), []);
  assert.deepEqual(plain(resolveBandQuery("n4", fixture).matches), []);
});

test("高风险错值和单双工类型已按 Release 19 规范修正", () => {
  assert.equal(
    bandData["13"],
    "FDD - 上行: 777-787 MHz | 下行: 746-756 MHz",
  );
  assert.equal(
    bandData["24"],
    "FDD - 上行: 1626.5-1660.5 MHz | 下行: 1525-1559 MHz",
  );
  assert.equal(bandData["29"], "SDL - 下行: 717-728 MHz");
  assert.equal(
    bandData["252"],
    "NTN FDD - 上行: 2000-2020 MHz | 下行: 2180-2200 MHz",
  );
  assert.equal(bandData.n29, "SDL - 下行: 717-728 MHz");
  assert.equal(bandData.n80, "SUL - 上行: 1710-1785 MHz");
  assert.equal(
    bandData.n94,
    "FDD - 上行: 880-915 MHz | 下行: 1432-1517 MHz",
  );
  assert.equal(
    bandData.n105,
    "FDD - 上行: 663-703 MHz | 下行: 612-652 MHz",
  );
  assert.equal(bandData.n263, "TDD - 57000-71000 MHz");
  assert.equal(Object.hasOwn(bandData, "n73"), false);
});

test("生成文件与唯一数据源保持同步", () => {
  const result = spawnSync(
    process.execPath,
    [path.join(rootDir, "scripts", "generate-band-data.js"), "--check"],
    { cwd: rootDir, encoding: "utf8" },
  );

  assert.equal(result.status, 0, result.stderr || result.stdout);
});
