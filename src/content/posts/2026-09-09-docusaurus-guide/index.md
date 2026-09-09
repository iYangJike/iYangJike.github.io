---
title: Docusaurus 快速上手指南：开源项目文档的最佳选择
published: 2026-09-09
draft: false
description: 详细介绍 Meta 开源的 Docusaurus 静态站点生成器——安装、核心特性、项目结构、六大使用场景、常用插件、配置文件详解和部署方案。
tags: []
series: 工具相关
toc: true
coverImage: null
---

# Docusaurus 快速上手指南：开源项目文档的最佳选择

[Docusaurus](https://docusaurus.io/) 是 Meta（Facebook）开源的静态站点生成器，专为**文档网站**设计，当前版本 **v3.10**，基于 React。它被 React Native、Redux、Jest、Supabase 等数千个项目用于构建文档站。

核心理念：**你只管写 Markdown，它负责生成漂亮的网站。**

***

## 一、5 分钟体验

```bash
npx create-docusaurus@latest my-docs classic
cd my-docs
npx docusaurus start
```

浏览器打开 `http://localhost:3000`，一个完整的文档站已经跑起来了——包含首页、文档区、博客、导航栏、暗色模式、搜索。

***

## 二、核心特性

| 特性 | 说明 |
|------|------|
| **MDX** | Markdown 里直接写 JSX/React 组件 |
| **文档版本管理** | 一个站点同时托管 v1.0 / v2.0 文档 |
| **国际化 (i18n)** | 内置多语言支持，Crowdin 集成 |
| **博客系统** | 内置博客，支持 RSS、标签、归档 |
| **全文搜索** | Algolia 集成，或本地搜索插件 |
| **暗色模式** | 开箱即用，CSS 变量驱动 |
| **SEO 优化** | 静态 HTML 生成，页面级 meta 标签 |
| **插件系统** | 20+ 官方插件，社区插件丰富 |
| **React 组件** | 整个站点就是 React App，可完全自定义 |
| **部署简单** | 一键部署 GitHub Pages / Vercel / Netlify |

***

## 三、与同类工具对比

| 工具 | 技术栈 | 定位 | 适合 |
|------|--------|------|------|
| **Docusaurus** | React + MDX | 文档站优先 | 开源项目文档、API 文档、知识库 |
| **VitePress** | Vue + Markdown | 文档站 | Vue 生态项目 |
| **Nextra** | Next.js + MDX | 文档站 | Next.js 项目 |
| **Astro** | 多框架 | 通用内容站 | 博客、营销站 |
| **GitBook** | 闭源 SaaS | 文档托管 | 不想自己搭的用户 |

Docusaurus 的优势在于**文档功能开箱即用**——版本管理、国际化、侧边栏、搜索，这些东西在 Astro 或 Next.js 里都需要自己配。

***

## 四、项目结构

```
my-docs/
├── docusaurus.config.js    # 全局配置（一文件控全场）
├── sidebars.js             # 侧边栏结构定义
├── docs/                   # 文档（Markdown）
│   ├── intro.md
│   ├── tutorial/
│   │   ├── basics.md
│   │   └── advanced.md
│   └── api/
│       └── reference.md
├── blog/                   # 博客
│   └── 2026-09-01-hello.md
├── src/
│   ├── components/         # 自定义 React 组件
│   ├── css/
│   │   └── custom.css      # 全局样式覆盖
│   └── pages/              # 独立页面（React 组件）
│       └── index.js
├── static/                 # 静态资源
│   └── img/
└── i18n/                   # 多语言翻译文件
```

***

## 五、六大使用场景

### 场景一：开源项目文档（最常见）

**问题：** 你的开源项目需要一份像样的文档站，有侧边栏导航、API 参考、快速开始。

**做法：**

```bash
npx create-docusaurus@latest my-project-docs classic
```

侧边栏配置 `sidebars.js`：

```js
export default {
  docs: [
    'intro',
    {
      type: 'category',
      label: '教程',
      items: ['tutorial/basics', 'tutorial/advanced'],
    },
    {
      type: 'category',
      label: 'API',
      items: ['api/authentication', 'api/endpoints'],
    },
  ],
};
```

然后只需在 `docs/` 下写 Markdown，侧边栏自动生成导航。

**实际案例：** React Native、Redux、Jest、Prettier、Supabase 文档站都用 Docusaurus。

### 场景二：多版本文档

**问题：** 你的项目有 v1.0 和 v2.0 两个版本，API 不兼容，需要同时维护两份文档。

**做法：**

```bash
# 冻结当前文档为 v1.0
npx docusaurus docs:version 1.0

# 继续在 docs/ 下写 v2.0 内容
```

站点顶部自动出现版本切换下拉框，用户可以在 v1.0 和 Next（v2.0）之间切换。

目录结构变为：

```
docs/              # 始终是最新版
versioned_docs/
├── version-1.0/   # 冻结的 v1.0 文档
versioned_sidebars/
└── version-1.0-sidebars.json
```

### 场景三：企业知识库 / 内部 Wiki

**问题：** 团队需要一个内部知识库，支持搜索、多语言（中英文）、权限控制。

**做法：**

```js
// docusaurus.config.js
export default {
  i18n: {
    defaultLocale: 'zh-Hans',
    locales: ['zh-Hans', 'en'],
  },
  themeConfig: {
    algolia: {
      appId: 'YOUR_APP_ID',
      apiKey: 'YOUR_SEARCH_ONLY_API_KEY',
      indexName: 'YOUR_INDEX_NAME',
    },
  },
};
```

翻译文件放在 `i18n/zh-Hans/` 和 `i18n/en/`，或对接 Crowdin 自动翻译。

**实际案例：** 字节跳动、美团内部大量使用 Docusaurus 做技术 Wiki。

### 场景四：产品官网 + 文档一体

**问题：** 需要一个产品官网（首页 + 特性介绍 + 定价），同时挂文档和博客。

**做法：** Docusaurus 不是只能做文档。`src/pages/` 下写 React 页面，可以做任何东西：

```jsx
// src/pages/index.js
import React from 'react';
import Layout from '@theme/Layout';

export default function Home() {
  return (
    <Layout title="My Product" description="The best tool">
      <div className="hero">
        <h1>My Product</h1>
        <p>一句话介绍你的产品</p>
        <a href="/docs/intro">快速开始</a>
      </div>
      <div className="features">
        <div>⚡ 快</div>
        <div>🔒 安全</div>
        <div>🌍 全球部署</div>
      </div>
    </Layout>
  );
}
```

一个项目 = 官网 + 文档 + 博客，不需要拆成多个站点。

### 场景五：个人博客

**问题：** 想写技术博客，Docusaurus 内置的博客系统够用吗？

**做法：** 够用。`blog/` 目录下写 Markdown，自动生成博客列表、标签页、RSS。

```markdown
---
slug: my-first-post
title: 我的第一篇文章
authors: [jike]
tags: [react, docusaurus]
---

这是正文。
```

支持多作者、标签过滤、归档、RSS/Atom。不过相比 Astro，Docusaurus 博客的自定义自由度稍低——如果你已经有 Astro 博客，不需要换。

### 场景六：API 文档 + 交互式 Playground

**问题：** API 文档里想嵌入可交互的代码示例，用户能直接在浏览器里试。

**做法：** Docusaurus 支持 MDX，在 Markdown 里写 React 组件：

```mdx
import { ApiPlayground } from '@site/src/components/ApiPlayground';

# 用户 API

## POST /api/login

<ApiPlayground
  method="POST"
  endpoint="/api/login"
  defaultBody={{ username: 'demo', password: '***' }}
/>

返回示例：
```

`ApiPlayground` 是自定义 React 组件，可以发真实请求、展示结果。这是 Docusaurus 对比纯 Markdown 工具（如 MkDocs）的最大优势。

***

## 六、常用插件速查

| 插件 | 作用 |
|------|------|
| `plugin-content-docs` | 文档内容（内置） |
| `plugin-content-blog` | 博客（内置） |
| `plugin-content-pages` | 独立页面（内置） |
| `plugin-sitemap` | 自动生成 sitemap.xml |
| `plugin-pwa` | PWA 离线支持 |
| `plugin-client-redirects` | 301 重定向（改 URL 后不丢流量） |
| `plugin-ideal-image` | 响应式图片优化 |
| `plugin-google-gtag` | Google Analytics |
| `plugin-svgr` | SVG 转 React 组件 |

***

## 七、核心配置文件 `docusaurus.config.js`

```js
export default {
  title: '我的文档站',
  tagline: '一句话描述',
  url: 'https://docs.example.com',
  baseUrl: '/',
  favicon: 'img/favicon.ico',

  // 导航栏
  themeConfig: {
    navbar: {
      title: 'My Docs',
      logo: { alt: 'Logo', src: 'img/logo.svg' },
      items: [
        { to: '/docs/intro', label: '文档', position: 'left' },
        { to: '/blog', label: '博客', position: 'left' },
        { href: 'https://github.com/you/repo', label: 'GitHub', position: 'right' },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        { title: '文档', items: [{ label: '快速开始', to: '/docs/intro' }] },
        { title: '社区', items: [{ label: 'GitHub', href: 'https://github.com/you/repo' }] },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} My Project.`,
    },
  },

  // 插件和预设
  presets: [
    [
      'classic',
      {
        docs: { sidebarPath: './sidebars.js' },
        blog: { showReadingTime: true },
        theme: { customCss: './src/css/custom.css' },
      },
    ],
  ],
};
```

配置入口只有一个文件，所有内容（导航栏、页脚、插件、主题、i18n）都在这里声明。

***

## 八、部署

```bash
# 构建
npm run build

# 部署到 GitHub Pages
GIT_USER=<你的GitHub用户名> npm run deploy

# 或手动部署 /build 目录到任何静态托管
# Vercel / Netlify 直接连 GitHub 仓库，push 自动部署
```

支持 GitHub Pages、Vercel、Netlify、Cloudflare Pages、Stormkit、Koyeb 等几乎所有静态托管平台。

***

## 九、什么时候选 Docusaurus

| 你的需求 | 推荐 |
|------|------|
| 开源项目文档 | ✅ 最佳选择 |
| API 参考文档 | ✅ 版本管理 + MDX |
| 企业知识库 | ✅ 国际化 + 搜索 |
| 产品官网 + 文档 | ✅ 一个项目搞定 |
| 个人博客 | 可以但不必要 |
| 电商/后台管理 | ❌ 不适合，这是内容站 |

Docusaurus 的核心竞争力在于：文档相关的功能（版本管理、国际化、侧边栏、搜索、MDX）全部开箱即用，不需要从零搭建。如果你做的不是文档站，有其他更好的选择；如果你做的就是文档站，Docusaurus 是目前的标杆方案。
