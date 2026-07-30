const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "..");
const sourcePath = path.join(rootDir, "data", "band.txt");
const outputPath = path.join(rootDir, "band-data.js");

function readBandData() {
  const data = JSON.parse(fs.readFileSync(sourcePath, "utf8"));

  if (!data || Array.isArray(data) || typeof data !== "object") {
    throw new Error("data/band.txt 必须是一个 JSON 对象");
  }

  for (const [key, value] of Object.entries(data)) {
    if (!/^(?:[1-9]\d*|n[1-9]\d*)$/.test(key)) {
      throw new Error(`无效的 Band 键: ${key}`);
    }
    if (typeof value !== "string" || !value.trim()) {
      throw new Error(`Band ${key} 的内容必须是非空字符串`);
    }
  }

  return data;
}

function renderBandData(data) {
  return [
    "// 此文件由 scripts/generate-band-data.js 从 data/band.txt 生成，请勿直接修改。",
    "// 规范基准：3GPP TS 36.101/36.102 与 TS 38.101-1/38.101-2/38.108，Release 19。",
    `window.BAND_DATA = ${JSON.stringify(data, null, 2)};`,
    "",
  ].join("\n");
}

const output = renderBandData(readBandData());

if (process.argv.includes("--check")) {
  const current = fs.readFileSync(outputPath, "utf8");
  if (current !== output) {
    console.error("band-data.js 与 data/band.txt 不同步，请运行：node scripts/generate-band-data.js");
    process.exitCode = 1;
  } else {
    console.log("Band 数据源与运行时文件一致。");
  }
} else {
  fs.writeFileSync(outputPath, output);
  console.log("已生成 band-data.js。");
}
