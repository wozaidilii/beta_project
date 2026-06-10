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

价格和库存是样例数据，不代表实时电商报价。
