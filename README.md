# RF Tools Web

射频计算器与天线理论库的静态网页版，适合直接放到 GitHub 
本人不是知识储备有限，仅供自己学习使用，如有不严谨地方，请赐教。

## 文件结构

- `index.html`: 页面结构
- `styles.css`: 页面样式
- `app.js`: 所有计算逻辑和交互
- `band-data.js`: 由 `data/band.txt` 预生成的 Band 数据
- `data/band.txt`: 原始 Band 数据源

## 本地预览

直接双击 `index.html` 通常也能打开，但更推荐起一个静态服务器预览：

```bash
cd rf-tools-web
python3 -m http.server 8000
```

然后访问 [http://localhost:8000](http://localhost:8000)。

## GitHub Pages 免费部署

1. 新建一个 GitHub 仓库。
2. 把 `rf-tools-web` 目录里的文件上传到仓库根目录。
3. 进入 GitHub 仓库的 `Settings`。
4. 打开 `Pages`。
5. 在 `Build and deployment` 中选择 `Deploy from a branch`。
6. 分支选择 `main`，目录选择 `/root`。
7. 保存后，等待 GitHub Pages 发布完成。

发布后会得到一个类似下面的网址：

```text
https://你的用户名.github.io/你的仓库名/
```

## 当前已包含功能

- 频率与波长计算
- Band 频段查询
- 自由空间路径损耗
- 效率与 dB 换算
- dBm 与 Watt 转换
- 多天线阵列合成增益
- 有源与无源指标等效预估
- VSWR 与 Return Loss 换算
- 远场测试距离评估
- 核心理论库

## 备注

这是纯前端静态站点，不依赖数据库或后端服务。
