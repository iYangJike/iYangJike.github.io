---
title: 内容分发两件套：Wechatsync 发文章，social-auto-upload 发视频
published: 2026-11-13T16:00:00+08:00
description: 写完文章、剪完视频，最费时间的往往不是创作而是逐个平台复制粘贴。这篇介绍两个开源工具的分工：Wechatsync 把 Markdown 文章铺到 29+ 图文平台，social-auto-upload 把视频发到抖音、小红书、B 站等平台，附完整命令与踩坑清单。
tags:
  - 自动化
  - 内容分发
series: 工具相关
---

写完一篇文章、剪完一条视频，真正耗时的往往是分发：打开知乎、掘金、CSDN、公众号，一个个复制标题、正文、封面；视频还要传抖音、小红书、B 站、视频号，每个平台再填一遍标题和标签。

这件事可以交给两个开源工具，分工很干净：

| | Wechatsync | social-auto-upload |
| :--- | :--- | :--- |
| 管什么 | 文章 / 图文 | 视频 / 图文 / 少量文章 |
| 平台 | 29+ 图文平台 | 17 个视频与图文平台 |
| 形态 | Chrome 扩展 + CLI + MCP | Python CLI（sau）+ Agent Skills |
| GitHub | 6.6k star，GPL-3.0 | 16.5k star，MIT |
| 一句话 | 一稿多投 | 视频矩阵 |

## 一、Wechatsync：把文章铺到所有图文平台

Wechatsync（文章同步助手）不是爬虫：Chrome 扩展直接用你浏览器里已登录的 Cookie，调用各平台 Web 编辑器同一套接口；CLI 通过 9527 端口的 WebSocket 把文章交给扩展。默认存草稿，不替你点发布。

### 安装三步

```bash
# 1. 装 CLI
npm install -g @wechatsync/cli

# 2. 装 Chrome 扩展并登录目标平台
#    https://wechatsync.com/#install

# 3. 扩展设置里开启「MCP 连接」，复制 Token
export WECHATSYNC_TOKEN="你的token"
```

### 常用命令

```bash
# 看平台和登录状态
wechatsync platforms --auth

# 一篇文章发三个平台（存草稿）
wechatsync sync article.md -p zhihu,juejin,csdn

# 指定标题和封面
wechatsync sync article.md -t "文章标题" --cover ./cover.jpg -p zhihu

# 先预览，不实际同步
wechatsync sync article.md --dry-run

# 从浏览器当前页提取文章，存成 Markdown
wechatsync extract -o article.md
```

跑完命令，各平台后台会多出一篇草稿，你只需要逐页检查、补标签、点发布。

支持知乎、公众号、掘金、CSDN、简书、头条、微博、小红书（图文）、B 站专栏、语雀、豆瓣、雪球、博客园、51CTO、开源中国、思否、百家号、大鱼号等。

注意：**它没有视频通道**。仓库里没有任何 video 相关代码，MCP 工具也只有 sync_article、extract_article、upload_image_file 三个。抖音在它这儿发的是图文，B 站发的是专栏。

## 二、social-auto-upload：视频矩阵的 CLI

social-auto-upload 用 patchright 驱动真实浏览器，登录态按账号名保存在本地，一条命令完成一个平台的上传。

### 安装

```bash
git clone https://github.com/dreammis/social-auto-upload.git
cd social-auto-upload
uv venv && source .venv/bin/activate
uv pip install -e .
PLAYWRIGHT_DOWNLOAD_HOST="https://npmmirror.com/mirrors/playwright" patchright install chromium
cp conf.example.py conf.py
```

### 常用命令（以抖音为例）

```bash
# 扫码登录，登录态按 account 名保存
sau douyin login --account creator
sau douyin check --account creator

# 发视频
sau douyin upload-video --account creator --file videos/demo.mp4 \
  --title "视频标题" --desc "简介"

# 发图文
sau douyin upload-note --account creator --images a.png b.png \
  --title "图文标题" --note "正文" --tags 'tag1,tag2'
```

定时发布用 `--schedule`，具体窗口以各平台文档为准（大鱼号是北京时间 2 小时后至 7 天内，分钟为 5 的倍数）：

```bash
sau douyin upload-video --account creator --file demo.mp4 \
  --title "标题" --desc "简介" --schedule "2026-11-14 20:05"
```

支持抖音、快手、小红书、B 站、视频号、百家号、大鱼号、微博、虎扑、知乎、YouTube、TikTok、Instagram、Facebook 等。知乎还支持文章，正文图片按原位置导入。

如果交给 Agent，仓库自带 18 个 Skill，Claude Code、Codex、OpenClaw 可以直接装；在 Hermes 里也能直接调 `sau` 命令。

## 三、组合成一条流水线

文章一条命令分发：

```bash
wechatsync sync posts/2026-11-13-xxx.md -p zhihu,juejin,csdn,weixin
```

视频按平台依次上传：

```bash
sau douyin upload-video --account creator --file demo.mp4 --title "标题" --desc "简介"
sau xiaohongshu upload-video --account creator --file demo.mp4 --title "标题"
sau bilibili upload-video --account creator --file demo.mp4 --title "标题"
```

海外平台（X、LinkedIn、Reddit）这两个都不覆盖，可以补一个自托管的 Postiz，配套的 postiz-agent 官方支持 Hermes Agent 与 Claude Code。

## 四、三个坑

1. **平台改版就会失效**。两者都是浏览器自动化，靠适配器跟平台 UI 走。装完先用小号试一次，别直接上主号。
2. **别当群发器用**。小红书、抖音、知乎对自动化发布有风控，频率高、内容重复容易限流。
3. **登录态会过期**。Cookie 失效要重新扫码；Wechatsync 主仓是 GPL-3.0，social-auto-upload 是 MIT，二次分发注意许可。

---

工具能省的只是重复动作，省不了内容本身。把分发压到几条命令之后，时间才真正回到写作和剪辑上。