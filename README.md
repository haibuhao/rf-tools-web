# RF Tools Web

面向天线、OTA、阻抗匹配和射频链路分析的纯前端静态工具。项目可以直接部署到 GitHub Pages，所有计算与 S1P 文件解析均在当前浏览器本机完成。

## 文件结构

- `index.html`：页面结构
- `styles.css`：桌面与移动端样式
- `app.js`：页面交互与结果渲染
- `rf-calculations.js`：严格输入校验与 RF 纯计算函数
- `matching-engine.js`：DNP / 单元件 / L / Π 型离散物料匹配引擎
- `s1p-parser.js`：浏览器端 Touchstone 1.x/2.x S1P 解析器
- `components-data.js`：常用容感值与村田参考系列元数据
- `band-data.js`：由 `data/band.txt` 预生成的 Band 数据
- `data/band.txt`：JSON 格式的唯一 Band 数据源
- `scripts/generate-band-data.js`：Band 运行时数据生成与同步检查
- `tests/`：Band、S1P、匹配和 RF 公式回归测试

## Band 数据维护

Band 表按 3GPP Release 19 的以下规范维护：

- LTE 地面网络：[TS 36.101 V19.5.0](https://www.etsi.org/deliver/etsi_ts/136100_136199/136101/19.05.00_60/ts_136101v190500p.pdf)
- LTE 卫星网络：[TS 36.102 V19.3.0](https://www.etsi.org/deliver/etsi_ts/136100_136199/136102/19.03.00_60/ts_136102v190300p.pdf)
- NR FR1：[TS 38.101-1 V19.5.0](https://www.etsi.org/deliver/etsi_ts/138100_138199/13810101/19.05.00_60/ts_13810101v190500p.pdf)
- NR FR2：[TS 38.101-2 V19.3.0](https://www.etsi.org/deliver/etsi_TS/138100_138199/13810102/19.03.00_60/ts_13810102v190300p.pdf)
- NR 卫星网络：[TS 38.108 V19.4.0](https://www.etsi.org/deliver/etsi_ts/138100_138199/138108/19.04.00_60/ts_138108v190400p.pdf)

修改 `data/band.txt` 后重新生成运行时文件：

```bash
node scripts/generate-band-data.js
```

检查数据同步并运行全部回归测试：

```bash
node scripts/generate-band-data.js --check
node --test tests/*.test.js
```

## S1P 与匹配器

匹配工具支持：

- 手动输入 1–3 组频率与 `R+jX`
- 本地导入 Touchstone 1.x/2.x `.s1p`
- 独立设置目标系统 `Z0`，不会与 S1P 文件参考阻抗混淆
- 无需匹配（并联 DNP、串联 0 Ω / 直通）
- 单元件、两元件 L 型与 C-L-C 低通 Π 型

当前 S1P 支持 `Hz/kHz/MHz/GHz`、`S RI/MA/DB` 和 `R` 参考阻抗。为了保护手机浏览器，最多均匀抽取 61 点用于候选搜索；入围候选会再回到所选范围的**全部有效频点**重新计算和排序，因此窄带坏点不会因抽样而被误报为通过。

匹配器先判断直通是否已达标。达到门限时优先选择器件更少的方案；都不达标时才选择全频段最差 VSWR 真正最低的方案。每个结果均按“天线/负载端 → 目标 Z0 / 射频源端”给出完整装配方向。

## 村田器件参考

`components-data.js` 保留常用物料值，并按 Murata 给出 0201 英制（0603M）和 0402 英制（1005M）的系列提示：

- 电容：GJM/GCQ033、GJM/GCQ155（C0G / High-Q 方向）
- 电感：LQP03、LQW/LQG15（RF 系列方向）

这些只是系列参考，不会自动拼接成具体料号。匹配采用理想 L/C 模型，未计入逐料号 Q、ESR/ESL、SRF、焊盘和过孔寄生；具体 part number、容差和厂商 S 参数必须在打样前逐项核对。

- [Murata 高频电容系列](https://www.murata.com/products/capacitor/ceramiccapacitor/overview/lineup/smd/gjm)
- [Murata RF 电感选型说明](https://www.murata.com/products/inductor/chip/overview/feature/rf)

## 本地预览

直接双击 `index.html` 通常也能打开；建议通过本地静态服务器预览，以获得与 GitHub Pages 更接近的加载行为。

## GitHub Pages 免费部署

1. 新建一个 GitHub 仓库。
2. 把项目目录里的文件上传到仓库根目录。
3. 进入仓库 `Settings` → `Pages`。
4. 在 `Build and deployment` 中选择 `Deploy from a branch`。
5. 分支选择 `main`，目录选择 `/(root)`。
6. 保存并等待发布完成。

发布网址通常为：

```text
https://你的用户名.github.io/你的仓库名/
```

发布时请在同一个 commit 中一起提交 `index.html`、`app.js`、`styles.css`、`rf-calculations.js`、`matching-engine.js`、`s1p-parser.js` 和三个数据脚本，避免 GitHub Pages/CDN 短时间混用新旧文件。页面资源带有版本查询参数，版本更新时可同步修改 `index.html` 中的 `v=YYYYMMDD`。

## 当前功能

- 频率与自由空间波长
- LTE / NR Band 查询
- 手动 R+jX / 本地 S1P 阻抗匹配
- 自由空间路径损耗
- 效率、增益、dBm 与 Watt 换算
- 固定总输入功率的阵列合成估算
- 有源与无源指标等效预估
- VSWR、正值 Return Loss、失配损耗与端口接受功率
- Fraunhofer 远场距离
- 平衡 CRLH 单元初步综合与单根过孔自感粗估
- 微带线特征阻抗正向估算与线宽反求
- 单谐振阻抗带宽等效 Q 估算
- 射频公式与常用网站

## 模型边界

本项目用于工程初算和物料筛选，不替代 VNA/OTA 实测、厂商器件模型、3D EM 仿真或完整叠层场求解。页面中的模型限制会随结果一起提示。
