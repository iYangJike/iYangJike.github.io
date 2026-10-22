---
title: Mole 完全指南：五大能力实测、19GB 清理实录与避坑清单
published: 2026-10-22T14:00:00+08:00
description: 起因是磁盘一天天见红。这篇从「Mole 是什么」讲起，把它的五大核心能力逐条实测：怎么安装、怎么预览、怎么清理，一次真实清理释放 19.23GB 的完整过程，以及与 CleanMyMac 等付费软件的选择对比、命令速查和踩坑清单——还包括让 AI Agent 安全代劳的官方玩法。
tags:
  - mole
  - macos
series: 工具相关
---

起因是本地磁盘一天天见红：开发机用久了，npm 缓存、浏览器 Service Worker、各种 App 的日志把空间一点点啃掉。第一反应是装个 CleanMyMac，一看订阅价格又犹豫了——每年一订阅，就为了跑几次清理。

后来发现了 Mole：一个开源的终端清理工具，被不少开发者称为「CleanMyMac + AppCleaner + DaisyDisk + iStat Menus 的合体」。我实际跑了一次清理，805 个动作、释放 19.23GB。顺手把从了解到上手的过程整理成这篇，适合随时查阅。

---

## 一、Mole 是什么

Mole（中文昵称「小鼹鼠 🐹」）是独立开发者 Tw93（Pake、妙言等项目的作者）写的 macOS 命令行清理工具，GitHub 上约 7.2 万 star，GPL-3.0 开源，轻量无后台常驻。设计理念是「像鼹鼠一样往系统深处挖」，把藏在各个角落的缓存、日志和残留物找出来清掉。

它最吸引我的点是**功能覆盖**——一个工具覆盖了好几个付费软件的常用能力：

| 能力 | 对标软件 | 对应命令 |
| :--- | :--- | :--- |
| 深度清理缓存/日志/残留 | CleanMyMac | `mo clean` |
| 卸载 App + 连根拔残留 | AppCleaner | `mo uninstall` |
| 磁盘占用可视化分析 | DaisyDisk | `mo analyze` |
| 系统实时监控 | iStat Menus | `mo status` |
| 系统缓存刷新与维护 | Sensei 等 | `mo optimize` |

另外还有几个开发者向的补充能力：`mo purge` 清各项目的构建产物、`mo installer` 找出忘删的 .dmg/.pkg 安装包、`mo slim` 在 Apple Silicon 上剥掉 App 里的 Intel 代码。

模式上分两条线：

- **CLI 版**：完全免费开源，就是这篇用的（`brew install mole` 装到的就是它）
- **原生 Mac App**：官网 mole.fit 单独下载，\$19 一次性买断、两台 Mac、终身更新。多的是图形界面、逐项确认、851 个 App 的残留规则库，以及对支持机型的风扇控制

终端党用免费版就够了；想要精致 GUI 或帮家人维护电脑，\$19 买断也比订阅制良心。

---

## 二、安装与升级

前置要求：macOS 12 或更高，Intel / Apple Silicon 都支持。

```bash
# Homebrew 安装（推荐）
brew install mole

# 或官方脚本安装
curl -fsSL https://raw.githubusercontent.com/tw93/mole/main/install.sh | bash
```

两个小提示：

- 我安装时的版本是 1.30.0，`brew upgrade mole` 一口气升到 1.62.0——这项目迭代非常快，装完建议先升级
- `mo completion` 可以装 zsh 补全，之后 `mo cl<Tab>` 就能补出子命令

装完输入 `mo` 回车，出现交互式主菜单即成功；`mo --version` 看版本。

---

## 三、五大核心能力逐个看

### 1. mo clean：深度清理（主打功能）

扫描并清理系统缓存、App 缓存、日志、临时文件、已卸载 App 的残留数据。核心安全设计是**先预览**：

```bash
mo clean --dry-run    # 只列出要清什么，零改动
mo clean              # 确认后真清理
```

dry-run 会打印分类清单（用户缓存 / 浏览器 / 开发工具 / App 等 6 大类），并把完整文件列表写到 `~/.config/mole/clean-list.txt`，可逐项核对。

它自带**白名单保护**，默认就保护着 19 条常见敏感路径（JetBrains、Surge、ollama 模型、gradle 缓存等），也可以自己管理：

```bash
mo clean --whitelist   # 交互式编辑保护路径
```

### 2. mo uninstall：卸载 App + 残留

```bash
mo uninstall              # 交互式选择
mo uninstall slack zoom   # 直接点名卸载
mo uninstall --list       # 列出所有可卸载的 App
```

卸载时连 LaunchAgents、偏好设置、隐藏残留一起清。**默认进废纸篓可以反悔**；个人数据默认保留，需要连数据一起清就加 `--with-data`。

### 3. mo analyze：磁盘分析

交互式 TUI 磁盘浏览器（类似 DaisyDisk 的体验），支持方向键 / vim 键位导航：

```bash
mo analyze              # 全局概览
mo analyze ~/Library    # 指定目录
mo analyze --json       # 输出 JSON，方便脚本处理
```

### 4. mo status：实时监控

```bash
mo status                        # 交互式仪表盘：CPU / 内存 / 磁盘 IO / 网络 / 进程
mo status --json                 # 单次快照
mo status --watch --interval 2s  # 流式输出，可接自己的监控
```

还带高 CPU 进程告警（默认超过 100% 持续 5 分钟提醒）。

### 5. mo optimize：系统维护

刷新系统缓存、重启服务、清理 DNS 缓存、重建 QuickLook 图标索引等。同样支持 `--dry-run` 和 `--whitelist`。

### 开发者专区

```bash
mo purge        # 清项目构建产物（node_modules / dist / target 等）
mo installer    # 找出并清理 .dmg/.pkg/.iso/.xip/.zip 安装包
mo slim         # 剥离 universal App 里的 Intel 代码（省空间）
```

`mo purge` 的细节值得单独说：它会扫描 `~/dev`、`~/Projects`、`~/GitHub` 等常见目录（`mo purge --paths` 可自定义），保护机制很克制——含部署密钥、嵌套 Git 仓库、有 Git 跟踪文件的目录都会跳过；近 7 天有文件活动的默认不勾选。

---

## 四、实测：一次真实的 19GB 清理

直接上我的实测数据（Apple Silicon + macOS 14，Mole 1.62.0）。

**第一步：dry-run 预览**

```text
$ mo clean --dry-run
Free space: 80.46GB
...
Potential space: 19.83GB+ | Items: 1053 | Categories: 6
Detailed file list: ~/.config/mole/clean-list.txt
```

预览可清理 19.83GB、1053 项。几个大头：

| 项目 | 大小（预览值） |
| :--- | :--- |
| npm 相关缓存（含 npx、日志） | ≈ 7GB |
| 用户 App 缓存 | 4.28GB |
| VS Code / Cursor 缓存 + 废弃旧插件 | ≈ 2.9GB |
| Chrome Service Worker | 2.33GB |
| 飞书 Service Worker | 1.44GB |
| uv / pip / Homebrew 等开发缓存 | ≈ 1.5GB |

**第二步：真清理**

```text
$ mo clean
...
Cleanup complete
Tracked cleanup: 9.28GB | Items cleaned: 805
Free space: 102.37GB (+19.23GB)
```

`df` 独立确认：可用空间 77Gi → 95Gi，**实际释放 19.23GB**，耗时约 4 分钟。

有几个细节值得记录：

- 涉及系统级缓存时它会单独询问管理员权限，跳过也只清用户级；扫到的系统级部分想清可以自己在终端跑 `sudo -v && mo clean`
- 它会把本机上的 **Agent 残留**单独拎出来标记：我机器上 Codex 相关的运行时缓存被标了 1.68GB「建议手动复核」
- 还有三类它不碰、留给手动决策：Docker unused data、Codex runtimes，以及 1.49GB 的项目构建产物（那个留给 `mo purge`）

以上过程其实我是让 AI Agent 代跑的（细节见第六节），我全程只做了三件事：看清单、拍板、抢救废纸篓。

---

## 五、避坑清单（重要）

1. **`mo clean` 默认会清空废纸篓**——这是最容易踩的坑。我 dry-run 时就发现废纸篓里躺着几张自己生成的图和几个下载的视频，清理前先救出来才清的。不想清废纸篓，就在白名单界面把 Trash 保护掉
2. **删除方式分两类**：
   - `clean` / `purge` / `installer`：确认后是**永久删除**（不进废纸篓）
   - `uninstall` / `slim` / `analyze`：默认**进废纸篓**，可恢复
3. **永远先 dry-run**：几秒钟的事，换来 100% 的知情权，尤其第一次用
4. **系统级和用户级要分清**：涉及 /Library 的系统缓存需要 sudo，Mole 会单独询问；建议自己在终端输密码跑
5. **个别「略激进」的社区反馈**：有用户报告清理后 Spotify 设置和屏保设置被重置过。用白名单保护关键 App 的缓存可以规避
6. 清理后 Chrome、飞书等首次启动会略慢（缓存重建），属正常现象

---

## 六、AI Agent 安全用法（这个时代的新玩法）

Mole 有一个我很欣赏的设计：它明确考虑了「AI Agent 来跑」的场景。

**官方 skill 包**：仓库里带了给 Claude Code / Codex / Cursor 用的 skill，装上后 Agent 会遵守「先 dry-run、给用户看清单、最后才执行」的流程：

```bash
npx skills add tw93/Mole -a claude-code codex cursor -g -y
```

**非交互模式的默认行为**（我实际验证过）：

- 没有终端时，`mo clean` 直接执行**用户级**清理
- 涉及 sudo 的**系统级部分自动跳过**，并在输出里说明
- `mo purge` 更严格：非终端环境必须显式加 `--yes` 才动手

**推荐的实操姿势**（用任何 Agent 都适用）：

> 让 Agent 先跑 `mo clean --dry-run`，读取 `~/.config/mole/clean-list.txt`，按「可重建缓存 / 真数据」分类给出风险清单；确认后再执行。系统级那部分不要交给 Agent（它也不该知道你的密码），自己在终端补跑。

这正是本次我经历的完整流程。

---

## 七、和付费软件怎么选

| 工具 | 形态 | 价格模式 | 适合谁 |
| :--- | :--- | :--- | :--- |
| Mole CLI | 终端 | 免费开源（GPL-3.0） | 开发者、终端党，喜欢可脚本化 |
| Mole Mac App | 原生 GUI | \$19 买断（2 台 Mac，终身更新） | 想要精致界面、逐项确认的用户 |
| CleanMyMac | GUI 全家桶 | 订阅制为主 | 要最成熟的引导式体验、不在意订阅费 |
| AppCleaner | GUI 小工具 | 免费 | 只需要「卸载单个 App 清残留」 |
| DaisyDisk | GUI 磁盘地图 | 买断制 | 只想直观看到「空间到底去哪了」 |
| OnyX | GUI 维护工具 | 免费 | 只做系统维护类操作 |

按场景决策：

| 你的场景 | 推荐 |
| :--- | :--- |
| 终端党，清理 + 监控 + 卸载一条龙 | Mole CLI（免费） |
| 想要 GUI、愿意一次性买断 | Mole Mac App |
| 只要卸载 App | AppCleaner 或 `mo uninstall` |
| 只想知道空间去向 | DaisyDisk 或 `mo analyze` |
| 正在纠结 CleanMyMac 要不要续费 | 先试一次 mole 再决定 |

---

## 八、命令速查

| 命令 | 作用 |
| :--- | :--- |
| `mo` | 交互式主菜单 |
| `mo clean` | 深度清理（`--dry-run` 预览 / `--whitelist` 白名单） |
| `mo uninstall` | 卸载 App + 残留（`--list` 列表 / `--with-data` 连数据） |
| `mo analyze` | 磁盘占用分析（`--json`） |
| `mo status` | 系统监控（`--json` / `--watch`） |
| `mo optimize` | 系统维护与缓存刷新 |
| `mo purge` | 清项目构建产物（`--paths` 自定义目录） |
| `mo installer` | 清理安装包文件 |
| `mo slim` | 剥离 Intel 代码 |
| `mo history` | 查看清理历史（`--json`） |
| `mo touchid` | 给 sudo 配 Touch ID |
| `mo completion` | 装 shell 补全 |
| `mo update` | 自更新 |

---

## 九、总结

Mole 把 Mac 维护从「买订阅软件」变成「敲一条命令」：19.23GB 实测、全流程有预览、有操作记录、有白名单，控制感很强。

它最打动我的其实不是清理量，而是安全设计的克制——拿不准的一律跳过、破坏性操作全部可预览、连 AI Agent 场景都单独设计了防线。对开发者来说，它是少数「装完立刻能用、用完就忘掉它存在」的工具，这可能就是好工具的样子。

**参考链接**

- GitHub：https://github.com/tw93/Mole
- 官网（含 Mac App）：https://mole.fit