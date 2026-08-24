---
title: Astro + Decap CMS 博客搭建完全指南（含踩坑全记录）
published: 2026-08-24
draft: false
description: 从零搭建 Astro 博客、集成 CMS 内容管理、Vercel 部署 OAuth 网关的完整指南，含 7 个踩坑记录和 Decap vs Sveltia 对比。
tags:
  - Astro
  - Decap CMS
  - Sveltia CMS
  - GitHub
  - Vercel
  - OAuth
  - 博客
series: ''
toc: true
coverImage: null
---

# Astro + Decap CMS 博客搭建完全指南（含 GitHub OAuth 踩坑全记录）

本文记录从零搭建一个 Astro 博客、集成 Decap CMS 内容管理、并通过 Vercel 部署 GitHub OAuth 网关的完整过程。每一步都经过实战验证，包含所有踩过的坑和最终解决方案。

***

## 一、项目概览

| 项目 | 说明 |
| --- | --- |
| 博客框架 | Astro 5 + MultiTerm 主题（Dracula 配色） |
| 部署平台 | GitHub Pages（iyangjike.github.io） |
| CI/CD | GitHub Actions 自动构建部署 |
| 内容管理 | Sveltia CMS（从 Decap CMS 迁移而来，原 Netlify CMS） |
| OAuth 网关 | Vercel Serverless Functions |
| 代码仓库 | github.com/iYangJike/iYangJike.github.io |

***

## 二、Astro 博客搭建

## 推荐模版

## [multiterm 开源博客网站](https://multiterm.stelclementine.com/)

### 2.1 初始化项目

MultiTerm 是一个终端风格的技术博客主题，基于 Astro 构建，支持暗色/亮色切换、代码高亮、数学公式、GitHub 卡片等丰富功能。

```bash
# 克隆主题仓库（具体仓库地址取决于你使用的主题）
git clone <theme-repo> my-blog
cd my-blog
npm install
```

### 2.2 配置站点信息

编辑 `src/site.config.ts`，设置站点标题、描述、作者、社交链接等：

```ts
const config: SiteConfig = {
  site: 'https://iyangjike.github.io',
  title: 'iYangJike',
  description: 'Web3 开发笔记 — Solidity, React, 智能合约',
  author: '杨继珂',
  tags: ['Web3', 'Solidity', 'React', 'Blockchain', 'Astro'],
  socialCardAvatarImage: './src/content/profile.webp',
  // ...更多配置
}
```

### 2.3 配置 GitHub Actions 自动部署

创建 `.github/workflows/deploy.yml`：

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

permissions:
  contents: write
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

每次推送 `main` 分支，GitHub Actions 会自动构建并部署到 `gh-pages` 分支。

### 2.4 本地开发

```bash
npm run dev      # 启动开发服务器
npm run build    # 生产构建
npm run preview  # 预览构建结果
```

***

## 三、集成 CMS 内容管理（Decap → Sveltia）

### 3.1 什么是 Git-based CMS

Git-based CMS 是一类特殊的内容管理系统，它不需要数据库，直接将内容以 Markdown 文件的形式存储在 Git 仓库中。编辑内容后自动提交到 GitHub，触发 CI/CD 重新部署。Decap CMS（原名 Netlify CMS）和 Sveltia CMS 都属于这一类。

**核心理念：** 内容就是 Git 仓库里的 Markdown 文件，不需要数据库。

> ⚠️ **重要更新：** 本文最初使用 Decap CMS，但后来发现其维护缓慢、存在安全漏洞、issue 堆积严重。最终迁移到了 **Sveltia CMS**——一个完全重写的现代替代品，config.yml 完全兼容，只需改一行代码。详见第八节。

### 3.2 创建管理后台页面

在 `public/admin/` 目录下创建两个文件：

**`public/admin/index.html`：**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>内容管理 - iYangJike</title>
</head>
<body>
  <script src="https://unpkg.com/@sveltia/cms/dist/sveltia-cms.js"></script>
</body>
</html>
```

> **关键点：** 只需要加载这一个脚本，Sveltia CMS 会自动读取 `config.yml` 完成初始化，与 Decap CMS 完全兼容。

### 3.3 配置 CMS（与 Decap/Sveltia 通用）

**`public/admin/config.yml`（最终版本）：**

```yaml
backend:
  name: github
  repo: iYangJike/iYangJike.github.io
  branch: main
  base_url: https://decap-oauth-vercel-seven.vercel.app
  client_id: Ov23liX8k2rOOZ7wHTnx

media_folder: src/content/posts/images
public_folder: /images

collections:
  - name: posts
    label: 博客文章
    label_singular: 文章
    folder: src/content/posts
    path: '{{slug}}/index'
    create: true
    slug: '{{year}}-{{month}}-{{day}}-{{slug}}'
    preview_path: posts/{{slug}}
    editor:
      preview: false
    fields:
      - label: 标题
        name: title
        widget: string
      - label: 发布日期
        name: published
        widget: datetime
        format: YYYY-MM-DD
      - label: 草稿
        name: draft
        widget: boolean
        default: false
        required: false
      - label: 摘要
        name: description
        widget: text
        required: false
      - label: 标签
        name: tags
        widget: list
        required: false
      - label: 正文
        name: body
        widget: markdown
```

**配置说明：**

| 字段 | 说明 |
| --- | --- |
| `backend.name` | 后端类型，`github` 表示使用 GitHub 仓库存储内容 |
| `backend.repo` | GitHub 仓库路径（用户名/仓库名） |
| `backend.branch` | 内容操作的目标分支 |
| `backend.base_url` | OAuth 认证网关地址（这是最关键的配置） |
| `backend.client_id` | GitHub OAuth App 的 Client ID |
| `media_folder` | 媒体文件存储路径 |
| `collections` | 内容集合定义 |

***

## 四、GitHub OAuth 认证（核心难点）

### 4.1 为什么需要 OAuth 网关

Decap CMS 需要 GitHub 的写入权限（创建分支、提交 PR），这需要 OAuth 认证。但 GitHub Pages 是纯静态托管，无法运行服务端代码完成 OAuth 流程。

Decap CMS 支持三种认证方式：

| 方式 | 适用场景 | 缺点 |
| --- | --- | --- |
| **PKCE** | 单页应用 | GitHub Pages 不支持，需要服务端 secret |
| **Netlify Identity** | Netlify 部署 | 只适用于 Netlify |
| **外部 OAuth 网关** | 任何托管平台 | 需要自己部署一个 OAuth 代理服务 |

我们的博客部署在 GitHub Pages，只能用第三种——**自建 OAuth 网关**。

### 4.2 OAuth 流程原理

整个认证流程如下：

```plain
用户点击 "Login with GitHub"
  → 弹窗打开 {base_url}/auth
  → OAuth 网关重定向到 GitHub 授权页
  → 用户在 GitHub 完成授权
  → GitHub 回调 {base_url}/callback?code=xxx
  → OAuth 网关用 code 换取 access_token
  → 通过 postMessage 将 token 发回 Decap CMS 父窗口
  → Decap CMS 拿到 token，完成登录
```

### 4.3 创建 GitHub OAuth App

1. 访问 [https://github.com/settings/developers](https://github.com/settings/developers)
2. 点击 "New OAuth App"
3. 填写信息：

    - Application name：`My Blog CMS`（任意名称）
    - Homepage URL：`https://iyangjike.github.io`
    - Authorization callback URL：`https://decap-oauth-vercel-seven.vercel.app/callback`

4. 注册后生成 Client Secret（只显示一次，务必保存）

***

## 五、用 Vercel 部署 OAuth 网关

### 5.1 为什么选 Vercel

- **免费额度充足**：每月 100GB 带宽、50 万次函数调用，个人博客完全够用
- **Serverless 函数**：无需管理服务器，自动扩缩容
- **全球 CDN**：访问速度快
- **环境变量管理**：密钥安全存储

### 5.2 项目结构

```plain
decap-oauth-vercel/
├── package.json          # 项目配置
├── vercel.json           # Vercel 路由配置
├── index.html            # 首页（避免 404）
└── api/
    ├── auth.js           # 授权端点
    └── callback.js       # 回调端点
```

### 5.3 API 端点代码

**`api/auth.js` — 授权端点：**

```javascript
export default async function handler(req, res) {
  const { code } = req.query || {}

  if (!code) {
    // 第一步：重定向到 GitHub 授权页
    const callbackUrl = `https://${req.headers.host}/callback`
    const redirect = `https://github.com/login/oauth/authorize`
      + `?client_id=${process.env.OAUTH_CLIENT_ID}`
      + `&scope=repo,user`
      + `&redirect_uri=${encodeURIComponent(callbackUrl)}`
    res.redirect(302, redirect)
    return
  }

  // 第二步：用 code 换取 access_token
  const tokenRes = await fetch(
    'https://github.com/login/oauth/access_token',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.OAUTH_CLIENT_ID,
        client_secret: process.env.OAUTH_CLIENT_SECRET,
        code,
      }),
    }
  )
  const data = await tokenRes.json()
  if (data.error) {
    res.status(400).json(data)
    return
  }

  res.status(200)
    .setHeader('Content-Type', 'text/html')
    .send(
      `<!DOCTYPE html><body><script>
        window.opener.postMessage(
          ${JSON.stringify({ token: data.access_token, provider: 'github' })},
          '*'
        );
        window.close();
      </script></body>`
    )
}
```

**`api/callback.js` — 回调端点：**

```javascript
export default async function handler(req, res) {
  const { code } = req.query || {}
  if (!code) {
    res.status(400).send('Missing code parameter')
    return
  }

  // 用 code 换取 access_token（同上）
  const tokenRes = await fetch(
    'https://github.com/login/oauth/access_token',
    { /* ...同上... */ }
  )
  const data = await tokenRes.json()
  if (data.error) {
    res.status(400).json(data)
    return
  }

  const content = { token: data.access_token, provider: 'github' }
  const authMsg = `authorization:github:success:${JSON.stringify(content)}`

  res.status(200)
    .setHeader('Content-Type', 'text/html')
    .send(
      `<!DOCTYPE html><html><head><meta charset="utf-8">
      <title>授权中...</title></head><body><script>
      (function() {
        // ⚠️ 关键：先发 authorizing:github
        window.opener && window.opener.postMessage('authorizing:github', '*');

        function receiveMessage(e) {
          window.opener && window.opener.postMessage('${authMsg}', e.origin);
          window.close();
        }
        window.addEventListener('message', receiveMessage, false);

        // 兜底：1 秒后直接发
        setTimeout(function() {
          window.opener && window.opener.postMessage('${authMsg}', '*');
          window.close();
        }, 1000);
      })();
      </script></body></html>`
    )
}
```

### 5.4 Vercel 路由配置

**`vercel.json`：**

```json
{
  "rewrites": [
    { "source": "/auth", "destination": "/api/auth" },
    { "source": "/callback", "destination": "/api/callback" }
  ]
}
```

> **关键：** Vercel 的 Serverless Functions 默认挂在 `/api/` 路径下，但 Decap CMS 请求的是 `/auth` 和 `/callback`（不带 `/api/` 前缀）。`vercel.json` 中的 `rewrites` 规则将这两个路径映射到实际的函数路径。

### 5.5 部署步骤

```bash
# 1. 登录 Vercel
npx vercel login

# 2. 设置环境变量
npx vercel env add OAUTH_CLIENT_ID production
# 输入：Ov23liX8k2rOOZ7wHTnx

npx vercel env add OAUTH_CLIENT_SECRET production
# 输入：你的 GitHub OAuth App Client Secret

# 3. 部署到生产环境
npx vercel --prod
```

部署成功后，你会得到一个类似 `https://decap-oauth-vercel-seven.vercel.app` 的地址。

***

## 六、踩坑全记录

以下是整个搭建过程中遇到的所有问题及解决方案。

### 坑 1：PKCE 方式在 GitHub Pages 上不工作

**现象：** 使用 `auth_type: pkce` 配置，点击登录后报错或无法完成认证。

**原因：** PKCE 是纯前端 OAuth 流程，不涉及 client_secret，但 GitHub Pages 的静态托管环境有限制，且 PKCE 在某些浏览器上对跨域 postMessage 支持不完整。

**解决：** 放弃 PKCE，改用外部 OAuth 网关方式。将 `auth_type: pkce` 替换为 `base_url: <你的网关地址>`。

### 坑 2：Vercel Serverless 路由 `/api/` 前缀问题

**现象：** 部署后访问网关根路径返回 `404: NOT_FOUND`，点击 "Login with GitHub" 也报 404。

**原因：** Vercel 的 Serverless Functions 默认路由是 `/api/函数名`，即 `/api/auth` 和 `/api/callback`。但 Decap CMS 请求的是 `{base_url}/auth`（不带 `/api/` 前缀）。

**解决：** 在项目根目录添加 `vercel.json`，使用 `rewrites` 将 `/auth` 映射到 `/api/auth`，`/callback` 映射到 `/api/callback`。

```json
{
  "rewrites": [
    { "source": "/auth", "destination": "/api/auth" },
    { "source": "/callback", "destination": "/api/callback" }
  ]
}
```

### 坑 3：根路径 404

**现象：** 访问 `https://xxx.vercel.app/` 返回 404。

**原因：** 项目只有 API 函数，没有根路径的静态文件。

**解决：** 添加 `index.html` 作为首页。

### 坑 4：GitHub 授权后卡在登录页面不跳转

**现象：** 点击 "Login with GitHub" → 弹出 GitHub 授权页 → 完成授权 → 弹窗关闭 → 管理后台仍然显示登录按钮，没有进入控制台。

**原因：** 这是最隐蔽的一个坑。Decap CMS（继承自 Netlify CMS）的 OAuth 认证需要一个**两步握手协议**：

1. 弹窗必须先发送 `authorizing:github` 消息通知父窗口
2. 父窗口收到后回复确认
3. 弹窗收到确认后，再发送格式为 `authorization:github:success:{...}` 的 token 消息

如果跳过第一步直接发 token，Decap CMS 不会处理这条消息。

**解决：** 在 `callback.js` 中实现完整的握手流程：

```javascript
// 第一步：发送授权开始信号
window.opener.postMessage('authorizing:github', '*');

// 第二步：等待父窗口回复
window.addEventListener('message', function receiveMessage(e) {
  // 发送 token
  window.opener.postMessage('authorization:github:success:{...}', e.origin);
  window.close();
});

// 兜底：1 秒超时后直接发送
setTimeout(function() {
  window.opener.postMessage('authorization:github:success:{...}', '*');
  window.close();
}, 1000);
```

### 坑 5：redirect_uri 未显式指定

**现象：** GitHub 授权完成后回调到了错误的地址。

**原因：** 初始版本的 `auth.js` 在重定向到 GitHub 时没有传 `redirect_uri` 参数，GitHub 使用 OAuth App 设置中的默认回调地址。如果默认地址还没更新，就会回调失败。

**解决：** 在 `auth.js` 中显式指定 `redirect_uri`：

```javascript
const callbackUrl = `https://${req.headers.host}/callback`
const redirect = `https://github.com/login/oauth/authorize`
  + `?client_id=${process.env.OAUTH_CLIENT_ID}`
  + `&scope=repo,user`
  + `&redirect_uri=${encodeURIComponent(callbackUrl)}`
```

### 坑 6：GitHub OAuth App 回调 URL 配置

**现象：** 即使代码正确，GitHub 也报 `redirect_uri mismatch` 错误。

**原因：** GitHub OAuth App 的 Authorization callback URL 必须与代码中传入的 `redirect_uri` 完全匹配。

**解决：** 去 [https://github.com/settings/developers](https://github.com/settings/developers) → 找到你的 OAuth App → 将 Authorization callback URL 设置为：

```plain
https://decap-oauth-vercel-seven.vercel.app/callback
```

### 坑 7：Social Card 只支持 JPEG 格式

**现象：** 社交分享卡片的头像不显示。

**原因：** MultiTerm 主题的 social card 生成器（`src/pages/social-cards/[slug].png.ts`）只处理 `.jpg` / `.jpeg` 格式的图片，`profile.png` 或 `profile.webp` 会被跳过。

**解决：** 修改 social card 生成器，添加 PNG 格式支持：

```typescript
// 修改前
if (
  fs.existsSync(avatarPath) &&
  (path.extname(avatarPath).toLowerCase() === '.jpg' ||
    path.extname(avatarPath).toLowerCase() === '.jpeg')
) {
  avatarData = fs.readFileSync(avatarPath)
  avatarBase64 = `data:image/jpeg;base64,${avatarData.toString('base64')}`
}

// 修改后
if (fs.existsSync(avatarPath)) {
  const ext = path.extname(avatarPath).toLowerCase()
  if (ext === '.jpg' || ext === '.jpeg') {
    avatarData = fs.readFileSync(avatarPath)
    avatarBase64 = `data:image/jpeg;base64,${avatarData.toString('base64')}`
  } else if (ext === '.png') {
    avatarData = fs.readFileSync(avatarPath)
    avatarBase64 = `data:image/png;base64,${avatarData.toString('base64')}`
  }
}
```

***

## 八、Decap CMS vs Sveltia CMS 对比

在踩完上述所有坑之后，我们发现了一个更好的选择——**Sveltia CMS**。以下是两个产品的全面对比。

### 8.1 出身与背景

|  | Decap CMS | Sveltia CMS |
| --- | --- | --- |
| 前身 | Netlify CMS（2022 年被 Netlify 放弃） | 无，完全从零重写 |
| 创立时间 | 2023 年 2 月，由 Netlify 合作伙伴接手 | 2022 年 11 月启动，2023 年 3 月 GitHub 公开 |
| 性质 | Netlify CMS 的"换标版"，继承全部代码 | **完全重写**，不是 fork |
| 技术栈 | React（遗留代码） | Svelte（现代框架） |
| 维护者 | 一家公司，3 个开发者 | 独立开发者 @kyoshino（前 Mozilla 本地化工程师） |

### 8.2 性能对比

|  | Decap CMS | Sveltia CMS |
| --- | --- | --- |
| 打包体积 | \~1.5 MB（gzip） | \~300 KB（gzip）——只有 Decap 的 1/5 |
| 框架开销 | React + 虚拟 DOM | Svelte 编译时优化，无虚拟 DOM |
| API 方式 | REST，逐条请求 | GraphQL，批量获取 |
| 本地缓存 | 无 | 有，Git 文件本地缓存 |
| 启动速度 | 慢，文章多了更慢 | 快 5 倍以上 |
| 保存速度 | REST 单次提交 | GraphQL mutation 批量提交 |

有用户实测从 Decap 迁移到 Sveltia 后速度提升了 5 倍。

### 8.3 安全对比

|  | Decap CMS | Sveltia CMS |
| --- | --- | --- |
| XSS 漏洞 | ⚠️ 有已知未修复漏洞 | ✅ 不受影响，实现完全不同 |
| 代理服务器漏洞 | ⚠️ 两个未修复漏洞 | ✅ 本地开发模式不需要代理 |
| 依赖更新 | ⚠️ 多个高危依赖长期未更新 | ✅ Dependabot + pnpm audit 持续更新 |
| npm 发布 | 无签名验证 | ✅ GPG 签名 + 溯源 + 2FA |
| CSP 支持 | 需要 `unsafe-eval` | ✅ 不需要 |
| 安全响应 | ⚠️ 很慢，有时直接删除 issue | ✅ 2 小时内修复并发布安全公告 |

### 8.4 功能对比

| 功能 | Decap CMS | Sveltia CMS |
| --- | --- | --- |
| config.yml 兼容 | — | ✅ 完全兼容，不用改 |
| 多语言 i18n | ⚠️ 有 bug，功能受限 | ✅ 一等公民，从底层就支持 |
| 本地开发 | 需要代理服务器 | ✅ 直连本地 Git 仓库 |
| 批量删除 | ❌ 只能一个一个删 | ✅ 多选批量删除 |
| 键盘快捷键 | 无 | ✅ Ctrl+E 新建、Ctrl+S 保存、Ctrl+F 搜索 |
| 暗色模式 | 基础 | ✅ 完善的暗色模式 + 跟随系统 |
| 移动端 | ❌ 体验差 | ✅ 专门适配移动端 |
| 无障碍 (a11y) | 基本 | ✅ WCAG 2.2 级别 |
| GraphQL API | 需手动开启 | ✅ 自动启用 |
| PAT 直接登录 | ❌ | ✅ 可以用 Personal Access Token 跳过 OAuth |
| PKCE token 自动刷新 | ❌ | ✅ |
| 集合自定义图标 | ❌ | ✅ |
| 资产选择器 | 基础 | ✅ 拖拽上传 + Unsplash/Pexels/Pixabay 集成 |
| 可选 object 字段 | ❌ 必填始终报错 | ✅ 可以移除可选 object |

### 8.5 维护与社区

|  | Decap CMS | Sveltia CMS |
| --- | --- | --- |
| 发布频率 | 偶尔，间隔数月 | 频繁，持续更新 |
| Bug 修复 | ⚠️ 大量 issue 被 stale bot 自动关闭 | ✅ 通常在 24 小时内响应 |
| 公开路线图 | 无 | ✅ 有详细的 roadmap |
| 文档质量 | 过时、不完整 | ✅ 完善、持续更新 |
| 已解决 Decap 遗留问题 | — | ✅ 730+ 个 issue 在 Sveltia 中已修复 |
| 用户案例 | 只有过时的 Demo | ✅ 有真实的 Showcase 页面，含美国政府网站 |

### 8.6 总结建议

| 如果你... | 推荐 |
| --- | --- |
| 已经在用 Decap CMS，想更好的体验 | → Sveltia CMS，一行代码迁移 |
| 新项目选型 | → Sveltia CMS，没有理由选 Decap |
| 需要多语言站点 | → Sveltia CMS，i18n 是一等公民 |
| 在意安全 | → Sveltia CMS，Decap 有已知未修复漏洞 |
| 需要移动端管理 | → Sveltia CMS，专门做了移动端适配 |
| 有大量文章 | → Sveltia CMS，GraphQL 批量加载快得多 |

***

## 九、从 Decap CMS 迁移到 Sveltia CMS

### 9.1 迁移成本

**几乎为零。** 只需要改一行代码，`config.yml` 完全不用动，OAuth 网关也完全兼容。

### 9.2 步骤一：更换 script 引用

编辑 `public/admin/index.html`：

```diff
- <script src="https://unpkg.com/decap-cms@^3.0.0/dist/decap-cms.js"></script>
+ <script src="https://unpkg.com/@sveltia/cms/dist/sveltia-cms.js"></script>
```

### 9.3 步骤二：修复文件结构兼容性

如果 `config.yml` 中配置了 `path: '{{slug}}/index'`（文章以文件夹形式存储），需要确保所有文章都是 `文件夹/index.md` 的结构，而非扁平的 `.md` 文件。

**现象：** Sveltia 管理后台只显示部分文章，但博客页面上能看到全部。

**原因：** Sveltia 严格遵循 `path` 配置，扁平 `.md` 文件不会被识别。

**解决：** 将扁平文件转为目录结构：

```bash
cd src/content/posts
for f in *.md; do
  slug="${f%.md}"
  mkdir -p "$slug"
  mv "$f" "$slug/index.md"
done
```

### 9.4 迁移后体验提升

迁移到 Sveltia CMS 后，以下 Decap CMS 的痛点全部消失：

- ✅ 登录不再需要两步握手协议（Sveltia 内置处理）
- ✅ 界面响应快 5 倍以上
- ✅ 支持暗色模式，与博客主题风格统一
- ✅ 列表 widget 支持自动补全，标签管理更清晰
- ✅ 支持批量删除文章
- ✅ 键盘快捷键（Ctrl+E 新建、Ctrl+S 保存）
- ✅ 移动端也可以正常使用管理后台
- ✅ 不再有安全漏洞的隐忧

***

## 十、最终配置汇总

### 博客配置（`public/admin/config.yml`）

```yaml
backend:
  name: github
  repo: iYangJike/iYangJike.github.io
  branch: main
  base_url: https://decap-oauth-vercel-seven.vercel.app
  client_id: Ov23liX8k2rOOZ7wHTnx
```

### Vercel 环境变量

| 变量 | 值 |
| --- | --- |
| `OAUTH_CLIENT_ID` | `Ov23liX8k2rOOZ7wHTnx` |
| `OAUTH_CLIENT_SECRET` | GitHub OAuth App 的 Client Secret |

### GitHub OAuth App 配置

| 字段 | 值 |
| --- | --- |
| Homepage URL | `https://iyangjike.github.io` |
| Authorization callback URL | `https://decap-oauth-vercel-seven.vercel.app/callback` |

***

## 十一、日常使用

### 写文章

1. 访问 [https://iyangjike.github.io/admin/](https://iyangjike.github.io/admin/)
2. 点击 "Login with GitHub" 登录
3. 点击 "新文章" 开始写作
4. 填写标题、标签、摘要等信息
5. 用 Markdown 编辑器撰写正文
6. 点击 "发布" → Decap CMS 自动提交 PR 到 GitHub
7. 合并 PR 后，GitHub Actions 自动部署

### 修改现有文章

1. 在管理后台找到文章
2. 点击编辑
3. 修改后发布

### 上传图片

在编辑器中可以直接拖拽图片到正文，Decap CMS 会自动上传到 `src/content/posts/images/` 目录。

***

## 十二、总结

整个搭建过程涉及的技术栈：

```plain
Astro (博客框架)
  + MultiTerm 主题 (终端风格)
  + Decap CMS (内容管理)
  + GitHub OAuth (认证)
  + Vercel Serverless (OAuth 网关)
  + GitHub Pages (托管)
  + GitHub Actions (CI/CD)
```

最核心的难点是 OAuth 认证——从 PKCE 到自建网关，经历了路由不匹配、缺少握手协议、redirect_uri 缺失等多个坑。但只要理解了 Decap CMS 的 OAuth 握手流程（`authorizing:github` → 等待回复 → `authorization:github:success:{...}`），一切都迎刃而解。

***

_最后更新：2026-08-21_
