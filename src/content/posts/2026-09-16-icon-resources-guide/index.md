---
title: 图标资源站全清单：从 Simple Icons 到 iconfont
published: 2026-09-16T12:50:00+08:00
description: 聚合国内外成熟的图标资源站，按品牌图标、通用图标、聚合搜索、国内平台四类划分，附数量、授权与适用场景。
tags:
  - 图标
  - 资源
series: 工具相关
---

## 为什么需要这份清单

做前端项目最耗时的环节之一，是找图标。

不是找不到，而是选择太多：品牌 logo 要去一个地方，通用 UI 图标要去另一个地方，国内项目的特殊图标还得到中文站翻。等你好不容易找到一组，又发现授权不能商用，或者风格和现有图标混在一起像两个项目。

这篇文章把常用的图标资源站按用途分类整理，标注了图标数量、授权协议和适用场景，都是长期运营、有明确授权的成熟平台。

---

## 一、品牌图标（Logo / 社交媒体）

这类图标是各大品牌的官方标志，特点是**每个品牌只有一个版本**，不存在风格选择问题。

### Simple Icons

- 官网：https://simpleicons.org
- 数量：约 3000+ 个品牌
- 授权：CC0（可商用、免署名）

收录各大品牌与产品的官方 logo。你若不是要「找一个设置图标」，而是要「放一个 GitHub 图标」，就从这里拿。

本站的 X（原 Twitter）图标即来自这里，CDN 直链形式：

```
https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/x.svg
```

全站统一使用 `fill="currentColor"`，可以直接跟随主题色变化。体积都很小，通常 300-600 字节。

### Iconify 品牌集合

- 官网：https://iconify.design
- 内含 `simple-icons`、`logos`、`skill-icons` 等多个品牌图标集

比 Simple Icons 多了几个品牌图标集，可以一次性对比同一品牌的不同版本。

---

## 二、通用 UI 图标（界面元素）

这类是按钮、菜单、状态提示用的通用图标，特点是风格统一、数量庞大、可调粗细。

### Lucide

- 官网：https://lucide.dev
- 数量：约 1700+ 个
- 授权：ISC
- 规格：24×24，2px 线框

Feather Icons 的社区后继项目，风格极简、线条干净，适合偏严肃的界面。

### Tabler Icons

- 官网：https://tablericons.com
- 数量：约 6100+ 个
- 授权：MIT
- 规格：24×24，2px 线框

和 Lucide 同风格但数量多得多。找冷门图标（比如「航空管制」「电池充电」这类）时命中率更高。

### IconPark（字节跳动）

- 官网：https://iconpark.oceanengine.com
- GitHub：https://github.com/bytedance/iconpark
- 数量：约 2600+ 个，覆盖 29 个分类
- 授权：免费商用（官方确认）

字节 CUX 团队出品的开源图标库，特点是**单一 SVG 源文件可变换多种主题**：线性、填充、双色、四色。在线可以复制 SVG code、React 组件、Vue 组件。

目前已覆盖字节商业化产品线所有平台，并被 12 个平台作为底层代码引入。

### Remix Icon

- 官网：https://remixicon.com
- 数量：约 2800+ 个
- 授权：免费商用

中性风格，线框和填充两套都有。风格比较「不挑项目」，适合不想在图标上花太多时间的情况。

### Material Symbols（Google）

- 官网：https://fonts.google.com/icons
- 数量：约 2500+ 个
- 授权：Apache 2.0

Google 官方图标库，支持可变字重（粗细可调）、填充与线框切换。Android 和 Material Design 项目的默认选择。

### Radix Icons

- 官网：https://icons.radix-ui.com
- 数量：约 300+ 个
- 授权：MIT
- 规格：15×15

小巧精致，专为 15px 网格设计，适合密集的表格、工具栏场景。

---

## 三、聚合搜索站（一个站搜全部）

不想在多个站点之间来回切换时，用这类聚合站。

### Iconify

- 官网：https://iconify.design
- 集合浏览：https://icon-sets.iconify.design
- 总量：**20 万+ 图标，来自 150+ 图标集**

目前最好用的图标聚合站。一次搜索能同时命中 Lucide、Tabler、Material、Phosphor、Carbon、Bootstrap、Fluent、IconPark、Octicons 等所有主流图标集，结果里会标注来源和授权。

除了网页搜索，还提供：

- Web Component（`<iconify-icon>`）
- React / Vue / Svelte 原生组件
- **Astro Icon**（Astro 项目专用）
- Unplugin Icons、UnoCSS 集成
- 官方 API，可直接拿原始 SVG

如果你只记一个网址，记这个。

### SVG Repo

- 官网：https://www.svgrepo.com
- 总量：**50 万+ 矢量图与图标**
- 授权：开源授权（下载时标注具体协议）
- 风格：35 种不同风格

比 Iconify 更偏「矢量素材」而非「UI 图标」，包含大量插画、剪影、彩色图标。找非标准图标（比如「一只猫的剪影」）时更有用。

### Flaticon

- 官网：https://www.flaticon.com
- 总量：**900 万+**
- 授权：免费 + 付费（免费需署名）

数量最大的图标站之一，各种风格应有尽有。注意：**免费下载需要署名作者**，不想署名要付费。商业项目使用前务必看清具体图标的授权。

---

## 四、国内图标平台

国内项目的现实需求：中文搜索、符合国内审美的风格，以及微信、支付宝、抖音这类国内特有的品牌图标。

### iconfont（阿里巴巴）

- 官网：https://www.iconfont.cn
- 总量：**3000 万+**（官方数据）
- 授权：多数可免费商用，部分有版权限制，使用前看具体图标说明

国内最大、最成熟的矢量图标平台，由阿里妈妈 MUX 团队打造，2013 年上线至今。

核心优势：

- **中文语义搜索**，支持中英文拼音互译
- **可以上传自己的图标**，做团队图标库
- 提供三种引用方式：Unicode、Font Class、Symbol
- 支持分路径改色、在线编辑

三种引用方式的实际选择建议：

| 方式 | 原理 | 适用 | 建议 |
| :--- | :--- | :--- | :--- |
| Unicode | 引用字体编码 | 老项目 | 不推荐，语义不明确 |
| Font Class | 字体类名 | H5、小程序 | **推荐**，兼容最好 |
| Symbol | SVG 雪碧图 | 纯 Web | 小程序和 App 不支持，慎用 |

**注意**：iconfont 是设计师上传分享的平台，同一平台上的图标版权状态各不相同。用之前点进图标详情看清楚是「原创」还是「非原创」、免费还是付费。

### 即时设计 资源广场

- 官网：https://js.design
- 定位：国内在线 UI 设计工具 + 素材库

国内版 Figma 的定位，自带资源广场。特点是**选中图标后可以一键二次编辑**，不需要下载再导入其他工具，适合设计师直接在线改。

资源广场里的图标来自各方设计师分享，支持按「可商用」筛选。

### Icons8

- 官网：https://icons8.com
- 授权：免费 + 订阅

老牌图标站，风格分类细致，支持在线改色、改尺寸、加背景。免费版需要加链接署名，订阅可免署名。

---

## 五、个人博客怎么选

如果你也在用 Astro 搭个人博客，说说我这一站的实际选择。

**品牌图标用 Simple Icons**。博客页脚的 GitHub、X、RSS 都是品牌 logo，Simple Icons 每个品牌只有一个官方版本，不用挑风格，还能直接跟随主题色变化。

**通用图标用 Lucide**。博客的图标需求量很小 —— 主题切换的太阳月亮、搜索放大镜、归档箭头，加起来不超过十个。Lucide 的 24×24 / 2px 线框风格干净克制，和博客的排版不冲突。

**用 `import.meta.glob` 批量导入**。不要一个个写 import：

```js
const icons = import.meta.glob('~/icons/*.svg', { eager: true })
```

这样往 `src/icons/` 里丢一个新的 `xxx.svg`，不用改任何代码就能用。

**下载后务必检查 `fill` 属性**。很多图标站导出的 SVG 写死了颜色，用之前把 `fill="#333"` 改成 `fill="currentColor"`，否则暗色模式下图标会隐形。

---

## 小结

| 站点 | 类型 | 数量 | 授权 |
| :--- | :--- | :--- | :--- |
| Simple Icons | 品牌 | 3,000+ | CC0 |
| Lucide | 通用 | 1,700+ | ISC |
| Tabler | 通用 | 6,100+ | MIT |
| IconPark | 通用 | 2,600+ | 免费商用 |
| Remix Icon | 通用 | 2,800+ | 免费商用 |
| Material Symbols | 通用 | 2,500+ | Apache 2.0 |
| Radix Icons | 通用 | 300+ | MIT |
| Iconify | 聚合 | 200,000+ | 各集不同 |
| SVG Repo | 聚合 | 500,000+ | 开源授权 |
| Flaticon | 聚合 | 9,000,000+ | 免费需署名 |
| iconfont | 国内 | 30,000,000+ | 多数可商用 |
| 即时设计 | 国内 | — | 平台内使用 |
| Icons8 | 通用 | — | 免费需署名 |