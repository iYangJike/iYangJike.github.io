---
title: 'DiceBear 完全指南：开源 SVG 头像库的 8 种玩法'
published: 2026-08-24
draft: false
description: '9.3k Star 的开源头像库 DiceBear 完全介绍：从 HTTP API 到 6 种语言 SDK、55 种风格、Figma 插件、Docker 私有部署、CSS 动画头像等 8 种进阶玩法。'
tags:
  - DiceBear
  - 头像
  - SVG
  - 开源
  - 前端
toc: true
---

# DiceBear 完全指南：开源 SVG 头像库的 8 种玩法

## 一、DiceBear 是什么

DiceBear 是一个**开源头像生成库**，GitHub 9.3k Stars，核心原理很简单：输入一个字符串（用户名、邮箱、ID 等），输出一个固定的 SVG 头像。同一个 seed 永远生成同一张图。

```
"iYangJike" → 🧑‍💻  ← 每次都是这个，一模一样
"John"      → 👨‍🔬  ← 完全不同
```

这意味着你不需要让用户上传头像，不需要存图片文件，不需要处理裁剪缩放。只需要存一个字符串，需要展示的时候实时生成。

### 核心数据

| 指标 | 数据 |
|------|------|
| GitHub Stars | 9.3k |
| License | MIT（代码），风格各自授权 |
| 头像风格数 | 55 种 |
| 支持语言 | JavaScript、Python、PHP、Rust、Go、Dart（6 种） |
| 输出格式 | SVG、PNG、WebP、JPEG |
| 维护状态 | 活跃开发中，v10 为当前大版本 |

---

## 二、六种接入方式

### 方式一：HTTP API（最方便，零代码）

```
https://api.dicebear.com/10.x/lorelei/svg?seed=iYangJike
```

| 参数 | 说明 | 示例 |
|------|------|------|
| `seed` | 种子字符串 | `?seed=alice` |
| `size` | 输出尺寸 | `?size=512` |
| `format` | 输出格式 | `svg` / `png` / `webp` / `jpg` |
| `backgroundColor` | 背景色 | `?backgroundColor=ff0000` |
| 风格参数 | 不同风格不同 | `?mouth=happy01&eyes=variant20` |

免费、无限调用、不需要注册。想私有部署也可以，一个 Docker 容器搞定。

### 方式二：JavaScript/TypeScript（前端/Node.js）

```js
import { Avatar } from '@dicebear/core';
import definition from '@dicebear/styles/lorelei/json' with { type: 'json' };

const avatar = new Avatar(definition, {
  seed: 'iYangJike',
  size: 512,
  backgroundColor: ['#1a1a2e'],
  mouth: ['happy01'],
});

avatar.toString();   // SVG 字符串 → 直接嵌入 HTML
avatar.toDataUri();  // data:image/svg+xml;... → img src
```

### 方式三：Python

```python
from dicebear_core import Avatar
import json

with open('lorelei.json') as f:
    definition = json.load(f)

avatar = Avatar(definition, seed='iYangJike', size=512)
svg_string = str(avatar)
```

### 方式四：CLI（命令行批量生成）

```bash
# 一次生成 100 个头像
npx dicebear lorelei --count 100 --format png --size 256

# 从文件读取 seed 列表批量生成
npx dicebear lorelei --seeds seeds.txt --output ./avatars/
```

### 方式五：在线编辑器

https://editor.dicebear.com — 可视化调整每个五官、颜色、配饰，所见即所得。调整完后可以导出 SVG 或 JSON 参数文件。

### 方式六：Figma 插件

在 Figma 里直接插入 DiceBear 头像，设计师的福音。还可以用 Figma 创建自己的头像风格，导出为 JSON 定义供 DiceBear 使用。

---

## 三、55 种风格速览

### 极简抽象类（适合技术产品/仪表盘）

| 风格 | 视觉效果 | 动画 | 许可 |
|------|---------|------|------|
| **Shapes** | 几何色块拼接，现代感 | ✅ | CC0 |
| **Identicon** | GitHub 默认头像风格 | ❌ | CC0 |
| **Rings** | 同心圆环，简洁 | ❌ | CC0 |
| **Glass** | 毛玻璃质感 | ✅ | CC0 |
| **Blobs** | 流动斑点 | ✅ | CC0 |
| **Disco** | 迪斯科舞会风 | ❌ | CC0 |
| **Triangles** | 三角形拼接 | ❌ | CC0 |
| **Waves** | 波浪纹理 | ✅ | CC0 |
| **Loops** | 循环图案 | ✅ | CC0 |

### 人物角色类（适合社交/社区）

| 风格 | 视觉效果 | 许可 |
|------|---------|------|
| **Lorelei** | 黑白线稿，极简优雅 | CC0 |
| **Bottts** | 机器人，科技感 | 免费商用 |
| **Notionists** | Notion 手绘风 | CC0 |
| **Avataaars** | 经典卡通，五官丰富 | 免费商用 |
| **Pixel Art** | 像素风，复古游戏感 | CC0 |
| **Open Peeps** | 涂鸦手绘，温暖 | CC0 |
| **Thumbs** | 大拇指卡通风 | CC0 |
| **Adventurer** | D&D 冒险者，配饰丰富 | CC BY 4.0 |
| **Fun Emoji** | 表情包风格 | CC BY 4.0 |
| **Croodles** | 蜡笔涂鸦风 | CC BY 4.0 |
| **Micah** | 极简插画风 | CC BY 4.0 |
| **Big Smile** | 夸张笑容 | CC BY 4.0 |

### 场景类

| 风格 | 视觉效果 |
|------|---------|
| **Constellation** | 星座连线 |
| **Landscape** | 自然风景 |
| **Planets** | 星球表面 |

---

## 四、8 种进阶玩法

### 玩法 1：Gravatar 替代品

```html
<img src="https://api.dicebear.com/10.x/bottts/svg?seed={{username}}" />
```

用户注册后自动有头像，不需要上传。同一个用户永远同一个头像。

### 玩法 2：同一人不同表情

```
https://api.dicebear.com/10.x/lorelei/svg?seed=iYangJike&mouth=happy01   😊
https://api.dicebear.com/10.x/lorelei/svg?seed=iYangJike&mouth=surprise  😮
https://api.dicebear.com/10.x/lorelei/svg?seed=iYangJike&mouth=sad       😢
```

同一个 seed，换参数就换表情。可以做评论区的情绪头像、聊天软件的状态头像。

### 玩法 3：团队/组织头像墙

```bash
npx dicebear bottts --seeds team.txt --format png --size 256
```

生成整整齐齐的团队头像，风格统一。适合 About 页面展示团队。

### 玩法 4：动态头像（CSS 动画）

部分风格（Shapes、Glass、Blobs、Moods、Critters、Clay 等）生成的 SVG 自带 CSS 动画。直接嵌入网页，头像会动。

```html
<!-- 这个头像会自己动 -->
<img src="https://api.dicebear.com/10.x/shapes/svg?seed=alice" />
```

### 玩法 5：深色/浅色模式自适应

用 DiceBear 的 `backgroundColor` 参数生成两个版本，配合 CSS 媒体查询：

```css
@media (prefers-color-scheme: dark) {
  .avatar { content: url('/avatar-dark.svg'); }
}
```

### 玩法 6：Figma 自定义风格

DiceBear 提供 Figma 插件，可以在 Figma 里设计自己的头像组件（眼睛、嘴巴、发型等），导出为 JSON 定义，然后就能用 DiceBear 的 API 生成该风格的无限变体。不需要写一行代码。

### 玩法 7：Docker 私有部署

```bash
docker run -p 3000:3000 dicebear/api
```

数据不出服务器，完全自己掌控。适合企业内部使用或有隐私要求的场景。

### 玩法 8：保存参数保证头像唯一性

在在线编辑器中调整五官后，记录下参数组合：

```json
{
  "style": "lorelei",
  "eyes": "variant20",
  "eyebrows": "variant05",
  "mouth": "happy01",
  "nose": "variant05",
  "earrings": "variant03",
  "hair": "variant02",
  "head": "variant03"
}
```

以后每次用这个参数组合就能生成一模一样的头像，不需要依赖 seed 字符串。这是保持头像唯一性的最可靠方式。

---

## 五、博客实战：用 DiceBear 做 favicon 和头像

我的博客 (iyangjike.github.io) 使用的就是 DiceBear 的 Lorelei 风格：

1. **Favicon** — 直接用 SVG 格式，矢量永不模糊。所有现代浏览器都支持 SVG favicon
2. **博客头像** — 用 sharp (Node.js) 将 SVG 渲染为 512×512 的 WebP，保证在 Retina 屏幕上清晰
3. **Apple Touch Icon** — 180×180 WebP，iOS 添加到主屏幕时显示

工作流：

```
DiceBear 编辑器调整参数
  → 下载 SVG（矢量，无限清晰）
  → sharp 渲染 → 512×512 WebP（博客头像）
  → sharp 渲染 → 180×180 WebP（apple-touch-icon）
  → SVG 直接用作 favicon（无需转换）
```

---

## 六、相关资源

- 官网 & Playground：https://www.dicebear.com
- GitHub：https://github.com/dicebear/dicebear
- 在线编辑器：https://editor.dicebear.com
- HTTP API 文档：https://www.dicebear.com/how-to-use/http-api/
- 风格浏览：https://www.dicebear.com/styles
- 创建自定义风格：https://www.dicebear.com/guides/create-an-avatar-style-with-figma/

---

*参考：DiceBear 官方文档、GitHub README、个人使用经验。最后更新：2026-08-24*
