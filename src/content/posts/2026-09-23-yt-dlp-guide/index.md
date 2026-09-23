---
title: yt-dlp 完全指南：31 个使用场景与命令速查
published: 2026-09-23T14:45:00+08:00
description: 从安装到自动化流水线，覆盖日常下载、内容加工、访问控制、自动化、开发者五大类共 31 个场景，所有命令实测于 yt-dlp 2026.08.19，附命令速查表、避坑清单，以及 B 站 / YouTube / 小红书 / 抖音的分站实战。
tags:
  - yt-dlp
series: 工具相关
---

起因很简单：想存几条视频，试了一圈下载器和浏览器插件——要么限画质，要么满屏广告。回到命令行装上 yt-dlp，一个晚上把下载、扒字幕、切片段、追更这些场景全跑通了。

这篇是从实际使用中整理出来的完整指南：31 个场景，每个都附可直接复制的命令，全部在 yt-dlp 2026.08.19（macOS）上验证过。可以直接当手册用，建议收藏。

---

## 一、yt-dlp 是什么

yt-dlp 是一个开源命令行音视频下载器，GitHub 19 万+ star，支持数千个站点：YouTube、B 站、抖音、Twitter/X、Instagram、TikTok、Vimeo、SoundCloud……

它其实是著名的 youtube-dl 的「续作」：原项目被唱片业协会下架后基本停更，yt-dlp 接过接力棒成为事实标准，且兼容原版绝大部分语法——网上老教程里的参数基本都能照用。

| 对比项 | yt-dlp | youtube-dl（原版） |
| :--- | :--- | :--- |
| 维护状态 | 每年 20+ 次发布 | 基本停更 |
| 现在能否下 YouTube | 可以 | 已失效 |
| 支持站点 | 数千个 | 千余个，大量失效 |
| 默认画质 | 最佳视频+音频自动合并 | 单个文件，常常只有 360p |
| 自动跳过广告段 | 内置 SponsorBlock | 无 |
| 使用浏览器登录态 | 内置 `--cookies-from-browser` | 需手动导出 Cookie |

为什么值得学：它不只「下载」——截片段、扒字幕、嵌封面章节、追更频道、作为组件嵌进程序，一个工具全包。很多商业下载软件的底层用的也是它。

---

## 二、安装与更新

ffmpeg 必装——合并音视频、转码、嵌字幕全靠它，这是新手最容易漏的一步。

```bash
# macOS
brew install ffmpeg        # 依赖（必装）
pipx install yt-dlp        # yt-dlp 本体（独立环境，不污染系统）
# 也可以 brew install yt-dlp，或到 GitHub Releases 下载 yt-dlp_macos 独立二进制

# Windows：下载 yt-dlp.exe 放进 PATH；ffmpeg 解压后放同一目录
# Linux：pipx install yt-dlp，或下载 yt-dlp_linux 二进制
```

```bash
yt-dlp --version        # 验证：能打印版本号即成功
pipx upgrade yt-dlp     # 更新（独立二进制版用 yt-dlp -U 自更新）
```

---

## 三、三分钟上手

```bash
# 1. 直接下最高清（自动挑最佳视频流+最佳音频流并合并）
yt-dlp "视频URL"

# 2. 先看有哪些画质，再精确选（-F 列表，-f 选择）
yt-dlp -F "视频URL"
yt-dlp -f 137+140 "视频URL"

# 3. 只要音频，直接出 MP3（-t mp3 是官方预设）
yt-dlp -t mp3 "视频URL"

# 4. 下载整个播放列表
yt-dlp "播放列表URL"

# 5. 任何报错，先升级版本再排查
pipx upgrade yt-dlp
```

---

## 四、四个核心概念

理解这四个概念，后面的命令基本都能自己拼出来。

### 1. 格式选择：-f 与 -S

默认值 `bv*+ba/b` 的含义：`bv*` 最佳视频流 + `ba` 最佳音频流，`+` 表示要合并（所以必须装 ffmpeg），`/b` 是兜底（站点只有单文件时用单文件）。

追求「兼容性最好」而不是「画质最高」时，用 `-S` 排序：

```bash
# 优先 1080p、优先 h264 编码、合并成 mp4 —— 双击就能播的万能组合
yt-dlp -S "res:1080,vcodec:h264" --merge-output-format mp4 "URL"
```

### 2. 输出模板 -o

决定文件名和目录结构：

| 占位符 | 含义 | 占位符 | 含义 |
| :--- | :--- | :--- | :--- |
| %(title)s | 视频标题 | %(upload_date)s | 上传日期 |
| %(id)s | 视频唯一 ID | %(channel)s | 频道 / UP 主 |
| %(ext)s | 扩展名 | %(playlist_index)s | 列表中的序号 |
| %(resolution)s | 分辨率 | %(duration)s | 时长（秒） |

```bash
# 示例效果：20260328_标题前80字_[视频ID].mp4
yt-dlp -o "%(upload_date)s_%(title).80s_[%(id)s].%(ext)s" "URL"
```

### 3. 配置文件

把常用参数写进 `~/.config/yt-dlp/config`（Windows 为 `%APPDATA%\yt-dlp\config.txt`），一行一个参数，`#` 开头是注释。配好之后，日常只需要 `yt-dlp URL` 一个命令。

### 4. 预设别名 -t

官方内置的常用组合，省去记一堆参数：

| 预设 | 等价于 |
| :--- | :--- |
| -t mp3 | 挑最佳音频并转 MP3 |
| -t mp4 | 强制 h264 + aac 的兼容 mp4（全设备可播） |
| -t mkv | 输出 mkv（适合嵌字幕） |
| -t aac | 转 AAC 音频 |
| -t sleep | 慢速模式：自动加请求间隔，防限流 |

---

## 五、使用场景大全（31 个）

### A. 日常下载

1. 单条视频，最高画质：`yt-dlp "URL"`
2. 指定分辨率：`yt-dlp -S "res:720" "URL"`；要全设备兼容就用 `-t mp4`
3. 精确指定轨道（ID 来自 `-F` 输出）：`yt-dlp -f 137+140 "URL"`。注意：音视频分离的站点，只写视频轨（如 `-f 137`）会得到「没有声音」的文件，要成对拼上音频轨
4. 提取音频：`yt-dlp -t mp3 "URL"`；要原始 AAC 音质：`yt-dlp -x --audio-format m4a "URL"`
5. 播放列表 / 整个频道：`yt-dlp "列表或频道URL"`；只要其中几集：`--playlist-items 1-10,20`；只下前 N 个：`--max-downloads 5`
6. 从清单文件批量下载：多个 URL 存成 urls.txt（一行一个）→ `yt-dlp -a urls.txt`
7. 按日期筛选（追播客、追讲座常用）：`yt-dlp --dateafter 20260601 "频道URL"`
8. 下载到指定目录：`yt-dlp -P "$HOME/Media" "URL"`（支持子目录模板：`-P "$HOME/Media/%(channel)s"`）
9. 规整的归档命名：`yt-dlp -o "%(upload_date)s_%(title).80s_[%(id)s].%(ext)s" "URL"`
10. 全平台一视同仁：B 站、抖音、Twitter/X、Instagram、TikTok、YouTube Shorts 用的都是同一条命令，站点自动识别

### B. 内容加工：字幕 / 封面 / 片段 / 章节

11. 下载字幕：`yt-dlp --write-subs --sub-langs "zh-Hans,en" "URL"`；站方没提供字幕的用自动字幕兜底（准确率一般）：`--write-auto-subs`
12. 字幕转 SRT 并嵌入视频：`yt-dlp --write-subs --convert-subs srt --embed-subs --sub-langs "zh-Hans" "URL"`（要嵌字幕建议配合 `-t mkv`）
13. 嵌入封面、元数据、章节：`yt-dlp --embed-thumbnail --embed-metadata --embed-chapters "URL"`——本地媒体库（Jellyfin、Infuse 这类）识别更友好
14. 只下载视频里的一小段（剪素材、存金句）：`yt-dlp --download-sections "*10:15-15:30" "URL"`；从 1 小时到结尾：`--download-sections "*1:00:00-inf"`
15. 按章节切成多个文件：`yt-dlp --split-chapters -o "%(title)s - %(section_number)03d %(section_title)s.%(ext)s" "URL"`——把长讲座、播客拆成知识块
16. 素材库模式：`yt-dlp --write-thumbnail --write-info-json "URL"`——封面图和完整元数据（播放量、时长、上传时间）一起存下，做选题库

### C. 访问控制与风控

17. 会员 / 需登录的内容（B 站大会员、YouTube 会员、年龄限制视频）：`yt-dlp --cookies-from-browser chrome "URL"`。支持 chrome / chromium / edge / firefox / safari / brave 等；要求浏览器里已登录该站点；Safari 需要先给终端「完全磁盘访问权限」
18. 走代理：`yt-dlp --proxy "socks5://127.0.0.1:7890" "URL"`
19. 限速防封（大批量下载必用）：`yt-dlp --limit-rate 2M -N 4 --sleep-requests 1 "URL"`；懒得调参数就用预设 `-t sleep`
20. 报 403 / 要求验证的排查顺序：① 先升级 yt-dlp（绝大多数问题到此为止）② 加 `--cookies-from-browser` ③ 再试 `--impersonate chrome`（伪装浏览器指纹）
21. 只查信息不下载（不占流量做采集）：`yt-dlp --simulate --print "%(title)s %(duration)s %(view_count)s" "URL"`

### D. 自动化与流水线

22. 频道追更（增量下载）：`--download-archive` 会记录下载过的视频 ID，下次自动跳过。配合定时任务就是自动追更机器人：

```bash
# 每天 20:00 检查一次新视频（macOS / Linux crontab）
0 20 * * * $HOME/.local/bin/yt-dlp --download-archive "$HOME/Media/.archive.txt" \
  -o "$HOME/Media/%(upload_date)s %(title).80s.%(ext)s" "频道URL"
```

23. 直播录制：`yt-dlp --live-from-start "直播URL"`（从头开始录，仅部分站点支持）；等开播加 `--wait-for-video 10`（每 10 秒轮询一次）
24. 下载完自动处理：`--exec` 可以在文件就位后执行任意命令：

```bash
# 下完在 Finder 中高亮显示（macOS）
yt-dlp --exec 'after_move:open -R {}' "URL"
# {} 是文件路径占位符，也可换成移动、转码、推送到 NAS、发通知
```

25. aria2c 多线程提速：先 `brew install aria2`，然后：

```bash
yt-dlp --downloader aria2c --downloader-args "aria2c:-x 16 -s 16 -k 1M" "URL"
```

26. 自动跳过恰饭 / 广告段（SponsorBlock）：`yt-dlp --sponsorblock-remove sponsor "URL"`；只标记不删除用 `--sponsorblock-mark all`
27. 完整归档一条命令：原片 + 字幕 + 封面 + 元数据一次留全：

```bash
yt-dlp --write-subs --write-auto-subs --sub-langs "zh-Hans,en" \
  --write-thumbnail --write-info-json --embed-metadata --embed-thumbnail "URL"
```

28. 喂给 AI 流程：先用 `--write-auto-subs --sub-langs "zh-Hans"` 拿到字幕，再送进总结 / 翻译 / 知识库工具；只要音频做 ASR 就 `-x` 取音轨再丢给转写工具

### E. 开发者

29. Python 嵌入（`pip install yt-dlp` 后）：

```python
import yt_dlp

ydl_opts = {
    "format": "bv*+ba/b",
    "merge_output_format": "mp4",
    "outtmpl": "%(title).80s [%(id)s].%(ext)s",
}
with yt_dlp.YoutubeDL(ydl_opts) as ydl:
    ydl.download(["https://www.youtube.com/watch?v=xxxx"])
```

写爬虫、做训练语料管线、给内部工具加下载能力，都是这套 API。

30. 插件机制：支持自定义插件扩展提取器和后处理器（官方 README 的 PLUGINS 章节有开发模板）；也能用 `--extractor-args` 给特定站点传专属参数
31. GUI 生态：不想用命令行的，可以选 Stacher（桌面）、Open Video Downloader（桌面）、Seal（安卓，详见第七节）。给 AI 助手装 yt-dlp-downloader-skill（第七节）后，一句话也能下载。注意：很多商业下载器和 App 的底层其实就是 yt-dlp——你要的功能，命令行都能免费做到

---

## 六、主流平台实战：B 站、YouTube、小红书、抖音

平台规则变化快，这一节的链接格式和风控要点以 2026.08 实测为准；哪天失效了，老规矩：先升级。

### B 站：支持最全，体验最顺

```bash
yt-dlp "https://www.bilibili.com/video/BVxxxxxxxxxx"               # 单条视频
yt-dlp -I 1,3,5 "https://www.bilibili.com/video/BVxxxxxxxxxx?p=1"  # 只要第 1、3、5 P
yt-dlp "https://www.bilibili.com/bangumi/play/ss12345"             # 番剧 / 影视整季
yt-dlp "https://space.bilibili.com/UID/video"                      # UP 主全部投稿（记得限速）
```

- 提取器覆盖最全：普通视频、番剧、课堂（Cheese）、合集、系列、收藏夹、UP 主页全都有（本机 2026.08.19 确认），是 yt-dlp 里体验最好的国内平台
- 更高画质（1080P 高码率、4K）与大会员内容需要登录态：`--cookies-from-browser chrome`
- 字幕：`--write-subs --sub-langs "zh-Hans"`；UP 主页或合集批量下载时加 `--sleep-requests 1` 降频，避免撞风控
- 直播也能录：开播状态下把直播间 URL 直接喂给 yt-dlp（内置 BiliLive 提取器）
- 弹幕不归它管：yt-dlp 不抓弹幕（需要 DanmakuFactory 一类专门工具）

### YouTube：先解决网络和 JS 运行时

```bash
yt-dlp "https://www.youtube.com/watch?v=xxxxxxxxxxx"       # 单条视频
yt-dlp "https://www.youtube.com/playlist?list=xxxxxxxx"    # 播放列表 / 频道
yt-dlp --write-auto-subs --sub-langs "zh-Hans,en" "URL"    # 连自动字幕一起拿
```

- 大陆网络需要代理：临时 `--proxy "socks5://127.0.0.1:7890"`，常用的话直接写进 config
- 新版重要变化：YouTube 解析需要 JS 运行时。本机实测会提示「No supported JavaScript runtime … some formats may be missing」，装一个 deno 即可补全（`brew install deno`，官方 EJS 机制，详见 wiki）
- 会员视频 / 年龄限制：`--cookies-from-browser`
- 去恰饭 / 广告段：`--sponsorblock-remove sponsor`（YouTube 生态支持最好）
- 4K / HDR：`-S "res:2160"` 强制 4K；Shorts 和普通视频同一条命令

### 小红书：能下，但要带登录态

```bash
yt-dlp "https://www.xiaohongshu.com/explore/xxxxxxxxxxxx"   # 视频笔记
```

- 本机 2026.08.19 已内置 XiaoHongShu 提取器；实测裸跑容易卡在风控上，正确姿势：浏览器登录小红书 → `--cookies-from-browser chrome`
- 笔记里的视频可以下；纯图片笔记不是它的强项，建议换图文专用工具
- App 分享短链先在浏览器打开，跳转后的 explore 链接再喂给 yt-dlp

### 抖音：直接拿无水印原片

```bash
yt-dlp "https://www.douyin.com/video/7xxxxxxxxxxxxxxxxx"    # 视频页链接
```

- 本机 2026.08.19 已内置 Douyin 提取器；一般能直接拿到无水印原片：抖音的水印是客户端叠加的，不在源文件里
- App 分享的短链（v.douyin.com）先在浏览器跳转，用地址栏里的完整链接最稳
- 抖音接口改版频繁、风控敏感：失败先 `pipx upgrade yt-dlp` → 再加 cookies → 批量时用 `--sleep-requests 1` 降频

### 其他主流平台速览

| 平台 | 支持 | 说明 |
| :--- | :--- | :--- |
| 微博 | ✅ Weibo / WeiboVideo / WeiboUser | 单条视频、用户主页；部分内容要 cookies |
| 西瓜视频 | ✅ Ixigua | 用法同抖音 |
| AcFun | ✅ AcFunVideo / AcFunBangumi | 视频 + 番剧 |
| 优酷 / 爱奇艺 | ✅ 有提取器 | 部分会员内容受限，可能失败 |
| 斗鱼 / 虎牙 | ✅ | 直播流录制 |
| TikTok | ✅ | 需海外网络 |
| X（Twitter） | ✅ | 帖子内视频直接下 |
| Instagram | ✅ | 需代理；私密账号要 cookies |
| 快手 | ❌ 暂无官方提取器 | 用专门工具 |

各平台链接可以在 urls.txt 里混着放，`yt-dlp -a urls.txt` 一次批量跑完。

---

## 七、生态工具：Seal（安卓 App）与 AI Agent 技能

命令行的部分讲完了，再补两个「不写命令也能用上 yt-dlp」的生态工具：手机上装 Seal，AI 助手上装 yt-dlp-downloader-skill。

### Seal：安卓上的 yt-dlp 图形界面

https://github.com/JunkFood02/Seal

Seal 是开源的安卓音视频下载器，本质就是 yt-dlp 的图形界面——底层基于 youtubedl-android，在 App 内直接内置了 yt-dlp，近 3 万 star（GPL-3.0）：

- 粘贴链接即可下载，支持 yt-dlp 的全部站点，全程按钮操作
- 一键下载整个播放列表
- 提取音频时自动嵌入封面和元数据，存进手机音乐播放器直接能认
- 支持嵌入字幕、内置 aria2c 多线程下载
- Material Design 3 界面，支持动态取色和简体中文
- 支持自定义 yt-dlp 命令模板——相当于把第四节的「配置文件」搬进手机，常用参数固化成模板随时调用

安装：GitHub Releases 下载 APK（多数手机选 arm64-v8a）或 F-Droid 安装；要求 Android 7.0 及以上。

一句话定位：本文「`-t mp3` + 嵌入封面 + 播放列表 + aria2c 提速」这些场景的手机版——不在电脑前时，手机就是下载器。

### yt-dlp-downloader-skill：让 AI 助手学会 yt-dlp

https://github.com/MapleShaw/yt-dlp-downloader-skill

现在查资料、写代码的活越来越多人是跟 AI 助手聊着做的。这份 Agent Skill 把 yt-dlp 的用法打包成技能文件，装进助手后，「下载这个视频」一句话就能干活：

```bash
# 装进 Cursor 的技能目录（仓库文档里的默认路径）
git clone https://github.com/MapleShaw/yt-dlp-downloader-skill.git ~/.cursor/skills/yt-dlp-downloader
```

之后用自然语言下指令：

| 你说 | 效果 |
| :--- | :--- |
| 下载这个视频 <链接> | 最佳画质下载 |
| 提取音频 <链接> | 下载并转 MP3 |
| 下载视频和字幕 <链接> | 连字幕一起存 |
| 下载 720p <链接> | 指定画质下载 |

覆盖 1000+ 站点、MP3 提取、字幕下载、画质选择（720p / 1080p / 最佳）、YouTube 403 自动带浏览器 cookies、断点续传——对应第五节的日常下载和内容加工场景，区别只是参数由助手来记（MIT 协议）。

顺带一提：SKILL.md 是通用的 Agent Skills 格式，Claude Code、Hermes、GitHub Copilot 等支持该格式的助手也能加载同一份技能文件，一次维护、多端复用；本地多助手共用的话，用软链接把技能目录链过去即可。

### 什么时候用哪个

| 你的情况 | 用什么 |
| :--- | :--- |
| 想在手机上直接下视频 / 音频 | Seal |
| 桌面端不想碰命令行 | Stacher、Open Video Downloader（场景 31） |
| 日常和 AI 助手一起干活 | yt-dlp-downloader-skill |
| 批量、自动化、流水线 | 还是回到命令行：配置 + `--download-archive` + 定时任务 |

---

## 八、速查：常用命令与场景选型

高频命令一览：

| 我想…… | 命令 |
| :--- | :--- |
| 下最高清 | `yt-dlp URL` |
| 列出可用画质 | `yt-dlp -F URL` |
| 指定画质组合 | `-f 137+140` |
| 兼容性最好的 mp4 | `-t mp4` |
| 提取 MP3 | `-t mp3` |
| 下载整个列表 | `yt-dlp "列表URL"` |
| 列表第 1-10 集 | `--playlist-items 1-10` |
| 从清单文件批量下 | `-a urls.txt` |
| 日期筛选 | `--dateafter 20260601` |
| 下载字幕 | `--write-subs --sub-langs "zh-Hans,en"` |
| 字幕转 SRT 并嵌入 | `--write-subs --convert-subs srt --embed-subs` |
| 嵌入封面与元数据 | `--embed-thumbnail --embed-metadata` |
| 只下某个片段 | `--download-sections "*10:15-15:30"` |
| 按章节切割 | `--split-chapters` |
| 使用浏览器登录态 | `--cookies-from-browser chrome` |
| 走代理 | `--proxy "socks5://127.0.0.1:7890"` |
| 限速 | `--limit-rate 2M` |
| 并发分片数 | `-N 4` |
| 追更去重 | `--download-archive done.txt` |
| 直播从头录制 | `--live-from-start` |
| 去掉恰饭段 | `--sponsorblock-remove sponsor` |
| 只看信息不下载 | `--simulate --print "%(title)s"` |
| 更新版本 | `pipx upgrade yt-dlp` |

按需求选型：

| 你的需求 | 推荐做法 |
| :--- | :--- |
| 手机、电视上直接播放 | `-t mp4`（h264+aac 全设备兼容） |
| 存进 Apple Music / 车载 U 盘 | `-t mp3`，需要封面加 `--embed-thumbnail` |
| 做字幕、翻译、内容笔记 | `--write-subs --write-auto-subs --sub-langs "zh-Hans,en"` |
| 剪辑素材 | `--download-sections` 只截需要的段落 |
| 追更 UP 主 / 播客 | `--download-archive` + 定时任务，全自动 |
| 长期存档 | 原片 + `--write-info-json` + `--write-thumbnail` |
| NAS / 服务器批量下载 | 写好配置文件，加 `--limit-rate` 和 `-N` 控制资源占用 |
| 数据采集 / 选题研究 | `--simulate --print` 只取元数据，不占带宽 |

---

## 九、避坑清单 TOP 10

1. **报错第一件事：升级版本**。站点规则几乎每天在变，yt-dlp 更新极频繁，绝大多数解析失败升级即愈。
2. **务必装 ffmpeg**。没有它会：合并失败、无法转码、嵌不了字幕——新手最高频的坑。
3. **`-f 137` 只写视频轨会得到无声文件**。音视频分离的站点要写成 `137+140`，或干脆用默认选择。
4. **QuickTime 播不了 AV1 / VP9 / Opus**。我在 M1 Mac 上实测：默认选的 AV1 1440p 文件 QuickTime 直接打不开。要「双击就能播」，用 `-t mp4` 或 `-S "vcodec:h264"`。
5. **文件名要截断防超长**：模板里用 `%(title).80s`；跨平台整理可加 `--windows-filenames`。
6. **Cookie 有前提**：`--cookies-from-browser` 要求该浏览器在本机登录过目标站点；Safari 需要给终端完整磁盘访问权限；登录态过期后重新登录即可。
7. **别随手加 `--no-check-certificate`**：网上老配置里常见，它会永久关闭证书校验，有安全风险。
8. **批量下载要控制节奏**：`--limit-rate` + `-N` 避免被限流；追更一定配 `--download-archive`，否则每次全量重复下载。
9. **shell 里记得加英文引号**：`-o "..."` 模板和 URL、参数值都要用引号包住，防止 `$`、`&` 被 shell 提前解释。
10. **合规红线**：下载内容仅限个人备份、学习研究等合法用途；不要二次分发、不要商用，尊重平台条款与版权。

---

## 十、我的实际配置

最后分享一下我在 Mac 上固化的配置。写进 `~/.config/yt-dlp/config`，以后直接 `yt-dlp URL` 即可：

```bash
# ~/.config/yt-dlp/config —— 一行一个参数，# 开头为注释
# 统一命名：标题截断到 80 字 + 视频 ID 防重名
-o "%(title).80s [%(id)s].%(ext)s"
# 默认 1080p、优先 h264（兼容性最好）、合并为 mp4
-S "res:1080,vcodec:h264"
--merge-output-format mp4
# 并发 4 个分片提速
-N 4
# 需要会员内容时取消注释（浏览器需已登录）
# --cookies-from-browser chrome
```

几点说明：

- **默认锁 1080p + h264**：我的设备以 M1 Mac 和手机为主，兼容性优先于多出来的那几档画质；需要 4K 素材时单独加 `-S "res:2160"` 覆盖。
- **cookies 默认不开**：只有下会员内容时才临时启用，避免每次请求都去读浏览器数据。
- **`-N 4` 而不是更高**：4 个并发分片已经能跑满我的带宽，再高容易被站点限流。

---

## 十一、小结

| 场景 | 一句话方案 |
| :--- | :--- |
| 日常下载 | `yt-dlp URL` + 配好 config |
| 要兼容性 | `-t mp4`（h264 + aac） |
| 扒字幕做笔记 | `--write-subs --write-auto-subs` |
| 剪辑素材 | `--download-sections` |
| 追更自动化 | `--download-archive` + cron |
| 批量 / 归档 | `-a urls.txt` + `--write-info-json` |
| 程序集成 | `yt_dlp.YoutubeDL` API |
| 手机上下载 | Seal（安卓 GUI，见第七节） |
| AI 助手直接下载 | yt-dlp-downloader-skill（见第七节） |

yt-dlp 就像媒体下载界的「瑞士军刀」：表面是个下载器，实际是一整套媒体处理流水线。记住三条主线就不会迷路——**报错先更新、依赖装 ffmpeg、按场景选格式**。剩下三十多个场景，用到时回来抄命令即可。