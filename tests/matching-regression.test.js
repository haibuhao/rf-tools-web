const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const rootDir = path.resolve(__dirname, "..");
const RFCalculations = require("../rf-calculations.js");
const MatchingEngine = require("../matching-engine.js");

const touchstoneContext = { window: {} };
vm.createContext(touchstoneContext);
vm.runInContext(
  fs.readFileSync(path.join(rootDir, "s1p-parser.js"), "utf8"),
  touchstoneContext,
);
const TouchstoneS1P = touchstoneContext.window.TouchstoneS1P;

function createTextInput(value = "") {
  return {
    value,
    trim() {
      return this.value.trim();
    },
    removeAttribute() {},
    setAttribute() {},
  };
}

class FakeFileReader {
  static instances = [];

  constructor() {
    this.result = "";
    FakeFileReader.instances.push(this);
  }

  readAsText(file) {
    this.file = file;
  }
}

function loadMatchingUiApi() {
  FakeFileReader.instances.length = 0;
  const elements = {
    smF1: createTextInput(),
    smR1: createTextInput(),
    smX1: createTextInput(),
    smF2: createTextInput(),
    smR2: createTextInput(),
    smX2: createTextInput(),
    smF3: createTextInput(),
    smR3: createTextInput(),
    smX3: createTextInput(),
    smS1pMinFreq: createTextInput(),
    smS1pMaxFreq: createTextInput(),
    smComponentProfile: createTextInput("mixed"),
    smS1pStatus: {
      textContent: "",
      className: "",
      classList: { add() {} },
    },
  };
  const context = {
    console,
    FileReader: FakeFileReader,
    document: {
      getElementById(id) {
        return elements[id];
      },
    },
    setTimeout,
    window: {
      BAND_DATA: {},
      COMPONENTS_DATA: {
        defaultProfile: "mixed",
        profiles: {
          mixed: {
            id: "mixed",
            label: "fixture",
            STD_C: [0.3, 3.3],
            STD_L: [0.6, 3.3],
          },
        },
      },
      RFCalculations,
      MatchingEngine,
      TouchstoneS1P,
      addEventListener() {},
    },
  };
  vm.createContext(context);
  vm.runInContext(
    `${fs.readFileSync(path.join(rootDir, "app.js"), "utf8")}
    this.__matchingUiApi = {
      collectManualMatchingPoints,
      collectS1pMatchingPoints,
      getComponentProfile,
      handleS1pFile,
      getImportedS1p() { return importedS1p; },
      setImportedS1p(value) { importedS1p = value; }
    };`,
    context,
  );
  return { api: context.__matchingUiApi, elements };
}

test("手动匹配输入使用严格数字解析并拒绝尾随单位与 Infinity", () => {
  const { api, elements } = loadMatchingUiApi();

  elements.smF1.value = "2400MHz";
  elements.smR1.value = "50";
  elements.smX1.value = "0";
  assert.throws(() => api.collectManualMatchingPoints(), /格式无效/);

  elements.smF1.value = "2400";
  elements.smR1.value = "Infinity";
  assert.throws(() => api.collectManualMatchingPoints(), /格式无效/);
});

test("完整手动 R+jX 可转换成按频率排序的有限 Hz 数据", () => {
  const { api, elements } = loadMatchingUiApi();
  elements.smF1.value = "2500";
  elements.smR1.value = "45";
  elements.smX1.value = "-12.5";
  elements.smF2.value = "2300";
  elements.smR2.value = "40";
  elements.smX2.value = "8";

  const result = api.collectManualMatchingPoints();
  assert.equal(result.points.length, 2);
  assert.equal(result.points[0].fHz, 2.3e9);
  assert.equal(result.points[1].Z.X, -12.5);
});

test("S1P 所选范围的全部有效点交给引擎，UI 不再预先压到 61 点", () => {
  const { api } = loadMatchingUiApi();
  const rows = Array.from(
    { length: 1001 },
    (_, index) => `${1000 + index} 0 0`,
  ).join("\n");
  const parsed = TouchstoneS1P.parseTouchstoneS1p(
    `# MHz S RI R 50\n${rows}`,
  );
  api.setImportedS1p({ fileName: "full.s1p", parsed });

  const result = api.collectS1pMatchingPoints();
  assert.equal(result.points.length, 1001);
  assert.equal(result.meta.usableCount, 1001);
});

test("封装选择读取对应物料配置而非硬编码单一数组", () => {
  const { api } = loadMatchingUiApi();
  const profile = api.getComponentProfile();
  assert.equal(profile.id, "mixed");
  assert.deepEqual(Array.from(profile.STD_C), [0.3, 3.3]);
});

test("连续选择 A/B 文件时，较晚返回的旧 FileReader 不会覆盖 B", () => {
  const { api } = loadMatchingUiApi();
  api.handleS1pFile({
    target: { files: [{ name: "A.s1p", size: 20 }] },
  });
  api.handleS1pFile({
    target: { files: [{ name: "B.s1p", size: 20 }] },
  });

  const [readerA, readerB] = FakeFileReader.instances;
  readerB.result = "# MHz S RI R 50\n200 0 0";
  readerB.onload();
  readerA.result = "# MHz S RI R 50\n100 0 0";
  readerA.onload();

  assert.equal(api.getImportedS1p().fileName, "B.s1p");
  assert.equal(api.getImportedS1p().parsed.points[0].frequencyHz, 200e6);
});
