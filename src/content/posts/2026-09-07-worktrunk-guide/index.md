---
title: Worktrunk：Git Worktree 管理利器——并行 AI Agent 开发的最佳搭档
published: 2026-09-07
draft: false
description: 详细介绍 Worktrunk 的安装、核心命令、六大使用场景，以及它与 Claude Code、Cursor、VS Code 内置 worktree 的定位对比，帮助你高效管理并行开发环境。
tags: []
series: 工具相关
toc: true
coverImage: null
---

# Worktrunk：Git Worktree 管理利器——并行 AI Agent 开发的最佳搭档

Git worktree 让你在同一个仓库里同时检出多个分支到不同目录，互不干扰。但原生命令繁琐——创建一个 worktree 需要打三遍分支名，清理更是全靠手记。

AI 时代，这个痛点被放大：当你同时跑 5 个 Claude Code 或 Codex 实例处理不同任务时，每个都需要自己的 worktree。创建、查看状态、合并、清理——这些操作如果全用原生 git 命令，效率极低。

[**Worktrunk**](https://worktrunk.dev/) 正是为此而生。2026 年初发布后迅速成为最流行的 Git worktree 管理器（GitHub 6,800+ Stars），专为并行 AI Agent 工作流设计。

GitHub 地址：[https://github.com/max-sixty/worktrunk](https://github.com/max-sixty/worktrunk)

***

## 一、安装

```bash
# macOS / Linux（推荐）
brew install worktrunk

# Cargo
cargo install worktrunk

# 安装 Shell 集成（让 wt switch 能真正切换目录）
wt config shell install
```

> 装完 Shell 集成后需要重开终端生效。这一步是必须的——否则 `wt switch` 只在子进程里切换目录，退出就回来了。

***

## 二、四大核心命令

Worktrunk 的哲学是「worktree 应该像 branch 一样简单」。你只需要记住四个命令：

| 命令 | 作用 | 原生 git 等价操作 |
|------|------|-------------------|
| `wt switch` | 切换 / 创建 worktree | `git worktree add` + `cd` |
| `wt list` | 查看所有 worktree 状态 | `git worktree list`（只有路径） |
| `wt merge` | 合并 + 自动清理 | `git merge` + `git worktree remove` + `git branch -d` |
| `wt remove` | 删除 worktree | `git worktree remove` + `git branch -d` |

Worktree 用分支名寻址，路径由配置模板自动生成。所有接受分支名的参数也接受 worktree 路径。

***

## 三、六大使用场景

### 场景一：日常开发——开新功能分支

```bash
# 创建 worktree 并切换过去
wt switch --create feature-login

# 做完后合并到 main 并自动清理
wt merge main
```

`wt merge` 一条命令完成：自动 commit → squash → rebase → 运行 pre-merge hooks → fast-forward merge → 删除 worktree 和分支。相当于 GitHub 的 "Squash and merge" 按钮，但在本地执行。

### 场景二：并行跑多个 AI Agent

这是 Worktrunk 最核心的场景。你有三个独立任务，想同时启动三个 Claude Code：

```bash
wt switch --create -x claude feature-auth  -- '实现用户认证模块'
wt switch --create -x claude fix-pagination -- '修复分页 bug'
wt switch --create -x claude api-tests    -- '补全 API 测试'
```

- `-c` / `--create`：创建新分支和 worktree
- `-x` / `--execute`：创建后立即执行指定命令
- `--` 后面的内容会作为参数传给该命令

三个 Agent 各自在独立 worktree 里工作，互不干扰。`wt list --full` 随时查看全局状态。

### 场景三：审查 PR——一行命令切过去

```bash
# GitHub PR
wt switch pr:123

# 或直接贴完整 URL
wt switch https://github.com/owner/repo/pull/123

# GitLab MR
wt switch mr:789
```

不需要手动 fetch、不需要记分支名。看完后 `wt remove` 清理。

### 场景四：交互式浏览——不记分支名也能用

```bash
# 纯交互模式，列出所有 worktree 用方向键选
wt switch

# 加上还没创建 worktree 的分支
wt switch --branches

# 加上远程分支
wt switch --remotes

# 加上所有 open PR
wt switch --prs
```

快捷键：

| 键 | 作用 |
|---|---|
| `↑↓` | 上下选择 |
| 直接打字 | 实时过滤 |
| `Enter` | 切换到选中 worktree |
| `Alt-c` | 创建新 worktree |
| `Alt-x` | 删除选中 worktree |
| `Alt-o` | 浏览器打开该分支的 PR/MR |
| `Alt-1`~`Alt-8` | 切换预览面板（diff / log / CI / PR 讨论等） |

右侧预览面板实时显示选中 worktree 的 diff、提交日志、CI 状态、LLM 自动生成的分支摘要。

### 场景五：查看全局状态

```bash
# 基础视图
wt list

# 完整模式（含 CI 状态 + LLM 自动生成的变更摘要）
wt list --full

# JSON 输出（适合脚本）
wt list --format=json
```

输出示例：

```
  Branch          Status  HEAD±     main↕   main…±    Remote⇅  Commit   Age  Message
@ feature-login   + ↑     +27  -8   ↑1      +31        ⇡3       4bc72dc  2h   添加登录模块
^ main                ^⇡                               ⇡1       0e631ad  1d   Initial commit
+ fix-auth         ↕|     ↑2  ↓1   +25 -11  |                  b772e68  5h   修复 token 验证
+ fix-typos        _|                                |                  41ee083  4d   Merge fix-auth
```

符号含义速查：

| 符号 | 含义 |
|------|------|
| `@` | 当前所在的 worktree |
| `^` | 主 worktree（main 分支） |
| `+` | 有暂存的改动 |
| `↑N` | 比 main 多 N 个 commit |
| `⇡N` | 有 N 个 commit 未推送 |
| `_` | 与 main 内容一致，可安全删除（行变灰） |
| `⊂` | 内容已合并到 main（squash-merge 也能检测到），可安全删除 |

### 场景六：清理积压的 worktree

```bash
# 删指定分支
wt remove old-feature

# 批量删
wt remove feat-a feat-b feat-c

# 强制删（分支未合并也要删）
wt remove -D experiment

# 只删 worktree 目录，保留分支
wt remove --no-delete-branch temp-branch

# 删之前先杀掉 worktree 里残留的进程（dev server 等）
wt remove --reap feature-auth
```

`wt remove` 默认后台执行（瞬间返回）。worktree 被移到 `.git/wt/trash/` 后异步 `rm -rf`，超过 24 小时自动清理。删除前 Worktrunk 会自动检测分支是否已合并——即使是通过 squash-merge 或 rebase 合并的也能识别（通过 patch-id 匹配等 6 种检测策略）。

***

## 四、Hooks：自动化你的工作流

在项目根目录创建 `.config/wt.toml`：

```toml
# 创建 worktree 后自动装依赖 + 启动 dev server
[post-start]
install = "npm ci"
dev = "npm run dev"

# 合并前必须通过测试和 lint
[pre-merge]
test = "npm test"
lint = "npm run lint"

# 删除 worktree 前清理
[pre-remove]
cleanup = "npm run clean"
```

支持 10 种 hook 事件：`pre/post-switch`、`pre/post-start`、`pre/post-commit`、`pre/post-merge`、`pre/post-remove`。`pre-*` 失败会中断操作，`post-*` 后台运行。

首次运行项目级 hook 会弹出确认（防止恶意仓库执行脚本），确认后记住。

***

## 五、快捷方式速查

```bash
wt switch -              # 回到上一个 worktree（类似 cd -）
wt switch ^              # 切到主分支（main/master）
wt switch --create fix --base @   # 从当前位置创建新分支
wt switch pr:456         # GitHub PR
wt switch mr:789         # GitLab MR
wt step commit           # 只提交不改动（不 squash、不 merge）
```

***

## 六、与其他工具的定位关系

### VS Code 内置 Worktree 支持

VS Code 从 2025 年 7 月起内置 worktree 支持：在 Source Control 视图里可以创建 worktree、自动开新窗口。但它只做「创建 + 开窗口」这一层——没有状态视图、没有合并 pipeline、没有批量清理。

### Claude Code

Claude Code 内置 `--worktree` 标志，可以在 worktree 里启动 Agent。但它不管理 worktree 生命周期——创建后的查看、合并、清理全要靠手敲原生命令。

### Cursor

Cursor 3.0 起支持 `/worktree`、`/apply-worktree`、`/delete-worktree` 命令，Agents Window 可以管理多个 worktree。但功能仅限于 IDE 内，且 worktree 中 LSP 经常不稳定。

### Worktrunk 的定位

**Worktrunk 与以上工具是互补关系，不是替代关系：**

- Claude Code / Cursor / Codex → **上层**：在 worktree 里写代码
- Worktrunk → **下层**：管理 worktree 的创建、查看、合并、清理

实际工作流：

```bash
# Worktrunk 创建 worktree + 启动 Claude Code（一行搞定）
wt switch -c -x claude feat-login -- '实现登录模块'

# Worktrunk 查看全局状态
wt list --full

# Worktrunk 合并 + 自动清理
wt merge main
```

功能对比总览：

| 能力 | 原生 git | VS Code 内置 | Claude Code | Cursor | Worktrunk |
|------|:--:|:--:|:--:|:--:|:--:|
| 创建 worktree | ✅ 手动 | ✅ 图形化 | ✅ `--worktree` | ✅ `/worktree` | ✅ `wt switch -c` |
| 启动 Agent 到 worktree | ❌ | ❌ | ✅ 内置 | ✅ 内置 | ✅ `-x claude` |
| 列出所有 worktree + 状态 | 只有路径 | ❌ | ❌ | Agents Window | ✅ `wt list --full` |
| 交互式 picker | ❌ | ❌ | ❌ | ❌ | ✅ |
| 合并 + 清理一条龙 | ❌ | ❌ | ❌ | `/apply-worktree` | ✅ `wt merge` |
| 批量清理 merged/stale | ❌ | ❌ | ❌ | 自动（有上限） | ✅ 多参数 + 6 种检测 |
| PR 快捷 checkout | ❌ | ❌ | ❌ | ❌ | ✅ `wt switch pr:123` |
| Hooks 自动化 | ❌ | ❌ | ❌ | ❌ | ✅ 10 种 hook |
| 构建缓存共享 | ❌ | ❌ | ❌ | ❌ | ✅ |
| 端口隔离 | ❌ | ❌ | ❌ | ❌ | ✅ `hash_port` |

***

## 七、总结

Worktrunk 解决的核心痛点是：**把 worktree 从「偶尔手动用一下」变成「日常高频操作的基础设施」**。

没有 Worktrunk 时，worktree 创建后就是孤儿——你只能手动 `git worktree list` 看路径，手动 `git worktree remove` 删，手动 `git branch -d` 删分支。有了 Worktrunk，四个命令覆盖全生命周期，并行 AI Agent 开发变得像开多个终端窗口一样自然。

如果你的日常涉及多个 AI Agent 并行工作，Worktrunk 是目前最好的 worktree 管理层工具。它不与 Claude Code、Cursor、VS Code 冲突——而是让这些上层工具能更高效地运转。
