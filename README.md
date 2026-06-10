# 装机舱 CN

一个面向中国国内 DIY 玩家和装机场景的 T3 风格 3D 主机组装网站。项目参考 BuildCores 的 3D Builder、配件搜索、兼容性、价格和性能概览思路，并改造成中文本土化配置器。

## 技术栈

- Next.js App Router
- TypeScript
- Tailwind CSS
- tRPC + Zod 基础 API 层
- Three.js / React Three Fiber / Drei

## 本地运行

```bash
npm install
npm run dev
```

然后访问 `http://localhost:3000`。

## 功能

- 3D 主机装配预览，选中 CPU、显卡、机箱、散热等分类时会高亮对应区域
- 中文配件库和 RMB 估价
- AM5 / LGA1851 / LGA1700、DDR4 / DDR5、机箱限长、散热限高、PSU 余量等兼容性检查
- 电竞、创作、AI、静音场景评分
- 京东自营、天猫旗舰、拼多多百亿补贴、线下装机店等国内渠道标签

## 参数和模型导入

首批真实规格数据在 `src/data/scraped-core-parts.json`，当前包含 CPU、主板、显卡、机箱、水冷和电源的核心参数。可用下面命令从官方规格页重新抓取：

```bash
npm run scrape:parts
```

`src/lib/catalog.ts` 会按 `id` 自动把抓到的 `part`、`dimensions`、`model` 合并进配件目录。`src/lib/model-layout.ts` 负责把毫米尺寸映射到 3D 场景尺寸；`src/components/pc-scene.tsx` 会优先加载 `model.kind === "glb"` 的模型，否则使用参数化几何体。

真实模型建议放在 `public/models/<category>/xxx.glb`，然后在对应记录里填：

```json
{
  "model": {
    "kind": "glb",
    "slot": "gpu",
    "assetUrl": "/models/gpu/asus-tuf-rtx5070ti.glb",
    "position": [0.18, -0.52, -0.2],
    "rotation": [0, 0, 0],
    "scale": 1
  }
}
```

价格和库存是样例数据，不代表实时电商报价。
