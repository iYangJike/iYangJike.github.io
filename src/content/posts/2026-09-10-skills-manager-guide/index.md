---
title: Skills Manager 完全指南：统一管理所有 AI 编码工具的 Skills
published: 2026-09-10
draft: false
description: 详细介绍 Skills Manager 的安装、核心概念、GUI 与 CLI 双模式操作、manage-skills 的 Agent 集成、以及标签/Preset/备份的最佳实践，帮助你高效管理 100+ 个 Skill。
tags: []
series: 工具相关
toc: true
coverImage: null
---

# Skills Manager 完全指南：统一管理所有 AI 编码工具的 Skills

[Skills Manager](https://github.com/xingkongliang/skills-manager) 是一个桌面应用 + CLI，专门解决一个痛点：**当你有 Claude Code、Codex、Cursor、Hermes 等 7 个 Agent、128 个 Skill 时，怎么不疯掉。**

它用一个统一的技能库管理所有 Agent 的 Skill，支持一键部署、Preset 分组、标签过滤、Git 备份多设备同步。CLI 版本让 Agent 自己也能操作——装 skill、部署、打标签，全程不需要打开 GUI。

GitHub: [https://github.com/xingkongliang/skills-manager](https://github.com/xingkongliang/skills-manager)

***

## 一、安装

```bash
# macOS
brew install --cask skills-manager

# 或从 Release 下载 dmg
# https://github.com/xingkongliang/skills-manager/releases/latest
```

安装后自动在 `~/.skills-manager/bin/skills-manager-cli` 部署 CLI，版本与 GUI 保持一致。

***

## 二、核心概念

```
┌─────────────────────────────────────────────────┐
│                  技能库（中央仓库）                │
│          ~/.skills-manager/skills/               │
│  所有 Skill 的统一存放位置，带来源元数据和标签       │
└──────────┬──────────┬──────────┬────────────────┘
           │          │          │
     ┌─────▼──┐  ┌───▼───┐  ┌──▼──────┐
     │Claude  │  │ Codex  │  │ Hermes  │  ...
     │ Code   │  │        │  │  Agent  │
     └────────┘  └────────┘  └─────────┘
```

### 核心概念

| 概念 | 说明 |
|------|------|
| **技能库** | `~/.skills-manager/skills/`，所有 Skill 的统一中央仓库 |
| **Agent** | 支持的 53 种编码工具（Claude Code、Codex、Cursor 等） |
| **部署** | 把技能库的 Skill 复制/软链接到 Agent 的 skills 目录 |
| **Preset** | 一组 Skill 的命名集合，一键部署到 Agent |
| **标签** | 按来源/用途给 Skill 打标签，用于筛选和分组 |
| **备份** | Git 仓库自动备份，多设备同步 |

### 与直接装 Skill 的区别

```
# ❌ 直接装：Skill 散落在各个 Agent 目录，无来源追踪
npx skills add xxx → 写入 ~/.claude/skills/

# ✅ Skills Manager：统一管理，保留来源、Preset、更新追踪
skills-manager-cli skills install xxx → 写入中央技能库
skills-manager-cli skills deploy xxx --agent claude_code → 部署到 Agent
```

***

## 三、GUI 界面速览

### 左侧边栏

| 区域 | 功能 |
|------|------|
| **技能库** | 浏览、搜索、管理所有 Skill |
| **安装 Skills** | 从 Git 仓库 / 本地目录 / skills.sh 市场安装 |
| **Preset** | 管理预设分组，一键部署/撤销 |
| **全局工作区** | 按 Agent 查看/管理已部署的 Skill |
| **项目工作区** | 管理项目本地 `.claude/skills/` 等目录 |
| **备份** | GitHub 登录自动备份，多设备同步 |
| **设置** | 代理、主题、语言、Git 远程、自定义工具 |

### 主要操作

1. 侧边栏 → **安装 Skills** → 输入 Git 地址 → 克隆并预览 → 安装
2. 侧边栏 → **技能库** → 多选 Skill → 点击 Agent 图标部署
3. 侧边栏 → **Preset** → 新建 Preset → 添加 Skill → 一键部署到指定 Agent
4. 侧边栏 → **备份** → GitHub 登录 → 自动备份

***

## 四、CLI 完全手册

CLI 路径：`~/.skills-manager/bin/skills-manager-cli`

所有命令支持 `--json` 输出，破坏性命令支持 `--dry-run`。

### 4.1 技能库管理

```bash
# 列出所有 Skill
skills-manager-cli --json skills list

# 按标签筛选
skills-manager-cli --json skills list --tag matt-pocock
skills-manager-cli --json skills list --tag lark-cli

# 按 Preset 筛选
skills-manager-cli --json skills list --preset Base

# 查看未打标签的 Skill
skills-manager-cli --json skills list --untagged

# 按部署目标筛选
skills-manager-cli --json skills list --deployed-to claude_code

# 查看 Skill 详情
skills-manager-cli --json skills show manage-skills
```

### 4.2 安装 Skill

```bash
# 从 Git 仓库安装（自动识别整个仓库或单个 skill）
skills-manager-cli skills install https://github.com/anthropics/skills
skills-manager-cli skills install anthropics/skills/skill-creator

# 从 skills.sh 市场安装（推荐，保留来源元数据）
skills-manager-cli skills install xingkongliang/skills-manager/manage-skills

# 从本地目录安装
skills-manager-cli skills install --local /path/to/skill

# 安装并自动加入 Preset + 部署
skills-manager-cli skills install xxx --sync-preset "工程开发"
```

### 4.3 部署与撤销

```bash
# 部署 Skill 到指定 Agent
skills-manager-cli skills deploy manage-skills --agent claude_code --agent hermes

# 撤销部署
skills-manager-cli skills undeploy manage-skills --agent claude_code

# 查看 Skill 在各 Agent 的状态
skills-manager-cli --json skills status manage-skills

# 同步 Preset 到 Agent（部署 Preset 中所有 Skill）
skills-manager-cli skills sync --preset "工程开发" --tool claude_code
```

### 4.4 标签管理

```bash
# 打标签
skills-manager-cli skills tag add manage-skills --add "cli" --add "skill-management"

# 设置标签（替换全部）
skills-manager-cli skills tag set manage-skills --tag "cli,skill-management"

# 移除标签
skills-manager-cli skills tag remove manage-skills --remove "old-tag"

# 删除标签（全局）
skills-manager-cli skills tag delete old-tag

# 重命名标签
skills-manager-cli skills tag rename old-name new-name

# 列出所有标签
skills-manager-cli --json skills tag list
```

### 4.5 更新与维护

```bash
# 检查远端更新
skills-manager-cli skills check --all

# 拉取更新
skills-manager-cli skills update manage-skills
skills-manager-cli skills update --all

# 搜索 skills.sh 市场
skills-manager-cli skills search "react"

# 纳管已有 Skill（把 Agent 目录里已有的 Skill 注册到技能库）
skills-manager-cli skills adopt ~/.claude/skills/my-skill --dry-run
skills-manager-cli skills adopt ~/.claude/skills/my-skill
```

### 4.6 Preset 管理

```bash
# 列出所有 Preset
skills-manager-cli --json presets list

# 创建 Preset
skills-manager-cli presets create "我的预设"

# 添加 Skill 到 Preset
skills-manager-cli presets add-skill "我的预设" --skill manage-skills

# 部署 Preset（安装 Preset 中所有 Skill 到 Agent）
skills-manager-cli presets deploy "我的预设" --agent claude_code --agent hermes

# 撤销 Preset 部署
skills-manager-cli presets undeploy "我的预设" --agent claude_code

# 查看 Preset 详情
skills-manager-cli --json presets show "我的预设"
```

### 4.7 Agent 管理

```bash
# 列出所有 Agent
skills-manager-cli --json agents list

# 启用/禁用 Agent
skills-manager-cli agents enable claude_code
skills-manager-cli agents disable gemini_cli
```

### 4.8 Git 备份

```bash
# 查看备份状态
skills-manager-cli --json git status

# 初始化备份仓库
skills-manager-cli git init

# 克隆备份仓库
skills-manager-cli git clone git@github.com:user/skills-manager-backup.git

# 手动推送
skills-manager-cli git push

# 查看版本历史
skills-manager-cli --json git versions

# 恢复快照
skills-manager-cli git restore <version>
```

### 4.9 删除

```bash
# 删除 Skill（从技能库移除，同时自动撤销所有 Agent 部署）
skills-manager-cli skills remove --yes old-skill

# 预览删除
skills-manager-cli skills remove old-skill --dry-run
```

***

## 五、manage-skills：让 Agent 管理 Skills Manager

`manage-skills` 是 Skills Manager 自带的一个 Skill，专门给 Agent 用。装了之后，Agent 可以直接操作 Skills Manager，而不是绕过它直接往 Agent 目录里写文件。

### 安装与部署

```bash
# 安装到技能库
skills-manager-cli skills install xingkongliang/skills-manager/manage-skills

# 部署到 Agent
skills-manager-cli skills deploy manage-skills --agent claude_code --agent hermes --agent codex --agent cursor
```

### Agent 如何使用

部署后，Agent 自动识别 `manage-skills`。在对话中直接说：

> "帮我把 anthropic 的 skill-creator 装到 Claude Code"

Agent 会执行：
```bash
skills-manager-cli skills install anthropics/skills/skill-creator
skills-manager-cli skills deploy skill-creator --agent claude_code
```

> "看看我现在有哪些 skill 没有打标签"

```bash
skills-manager-cli --json skills list --untagged
```

> "把 matt-pocock 标签的 skill 部署到 Codex"

```bash
skills-manager-cli --json skills list --tag matt-pocock | # 解析 ID 列表
skills-manager-cli skills deploy <ids> --agent codex
```

### 为什么走 Skills Manager 而不是直接写文件

| 直接写文件 | 走 Skills Manager |
|------|------|
| 无来源追踪 | 保留 Git 来源、版本 |
| 无 Preset 归属 | 保留 Preset 成员关系 |
| 更新靠手动 | `skills update` 一键拉新 |
| Agent 各自为政 | 跨 Agent 统一部署 |
| 备份靠手工 | Git 自动备份多设备同步 |

---

## 六、最佳实践

### 6.1 标签体系设计

按来源打标签，配合用途筛选：

| 标签 | 示例 | 用途 |
|------|------|------|
| `lark-cli` | 飞书系列 28 个 | 按来源分组 |
| `matt-pocock` | 工程系列 37 个 | 按来源分组 |
| `superpowers` | Superpowers 35 个 | 按来源分组 |
| `baoyu-skills` | 宝玉系列 21 个 | 按来源分组 |
| `anthropic` | Anthropic 官方 | 按来源分组 |
| `vercel` | Vercel 官方 | 按来源分组 |

标签支持中英文，建议保持一致性。用 `skills tag list` 查看当前所有标签。

### 6.2 Preset 分组策略

按使用场景分组，而不是按来源分组：

| Preset | 内容 | 场景 |
|--------|------|------|
| 飞书办公 | 24 个 lark-* skill | 日常飞书操作 |
| 工程开发 | 35 个开发/调试/部署 skill | 写代码、修 bug、发 PR |
| 内容创作 | 21 个作图/翻译/发布 skill | 社交媒体、文章配图 |
| 前端设计 | 5 个 UI/UX skill | 设计系统、性能优化 |
| 思考决策 | 16 个 brainstorm/架构 skill | 计划、评审、认知工具 |
| 写作表达 | 12 个写作/教学 skill | 写文档、交接、教学 |
| Skill 管理 | 8 个 skill 维护 skill | 创建、管理 skills |

**关键：Preset 和标签是独立的两个维度。** 标签管「这是谁的」，Preset 管「用来干什么」。同一个 Skill 可以同时有 `matt-pocock` 标签和「工程开发」Preset。

### 6.3 工作流

**日常装新 Skill：**

```bash
# 1. 搜索
skills-manager-cli skills search "react testing"

# 2. 安装到技能库
skills-manager-cli skills install xxx/xxx

# 3. 加入合适的 Preset
skills-manager-cli presets add-skill "工程开发" --skill xxx

# 4. 部署到需要的 Agent
skills-manager-cli skills deploy xxx --agent claude_code --agent hermes
```

**批量管理：**

```bash
# 查看所有未打标签的 Skill
skills-manager-cli --json skills list --untagged

# 批量打标签（在 GUI 里更快）
# 或者逐个
skills-manager-cli skills tag add xxx --add "matt-pocock"

# 定期检查更新
skills-manager-cli skills check --all

# 更新全部
skills-manager-cli skills update --all
```

**多设备同步：**

1. GUI 侧边栏 → 备份 → GitHub 登录
2. 之后自动备份，约 2 分钟无编辑后自动 push
3. 新设备首次启动 → 选择「从备份恢复」

### 6.4 清理与维护

```bash
# 查找重复（同名 Skill）
# 用 SQL 查，或 GUI 里看技能库

# 删除重复
skills-manager-cli skills remove --yes <重复的ID>

# 清理 Agent 残留目录
rm -rf ~/.claude/skills/<old-skill>
rm -rf ~/.hermes/skills/<old-skill>
```

---

## 七、使用场景

### 场景一：从零搭建 Agent 工具链

你刚换了新电脑，要装 50 个 Skill 到 3 个 Agent。

**不用 Skills Manager：** 每个 Skill 在每个 Agent 下分别执行安装命令 → 50×3=150 次操作。

**用 Skills Manager：**

```bash
# 1. 从备份恢复（或批量安装）
skills-manager-cli git clone git@github.com:you/skills-manager-backup.git

# 2. 一键部署 Preset
skills-manager-cli presets deploy "工程开发" --agent claude_code --agent codex --agent hermes
```

### 场景二：团队统一 Skill 配置

团队有 5 个前端，都需要相同的 React/TypeScript Skill 集合。

**做法：**

1. 一个人建好 Preset「前端开发」，加入需要的 Skill
2. 导出 Preset 或直接共享备份仓库
3. 其他人 `git clone` 备份仓库 → `presets deploy "前端开发" --agent claude_code`

### 场景三：Agent 自己管理 Skill

你在 Hermes 里说：

> "帮我看看 Codex 少了哪些工程开发的 Skill"

Agent 通过 `manage-skills` 自动：

```bash
# 对比 Preset 和实际部署
skills-manager-cli --json presets show "工程开发"  # 拿到 Preset 里有哪些
skills-manager-cli --json skills list --deployed-to codex  # 拿到 Codex 实际有哪些
# 计算差异 → 部署缺失的
skills-manager-cli skills deploy <missing-ids> --agent codex
```

### 场景四：Skill 大扫除

每隔一段时间清理积压：

```bash
# 找未打标签的（可能是临时装的，需要整理）
skills-manager-cli --json skills list --untagged

# 找不属于任何 Preset 的（孤立的）
skills-manager-cli --json skills list --no-preset

# 检查哪些 Skill 有远端更新
skills-manager-cli skills check --all

# 删除已废弃的
skills-manager-cli skills remove --yes deprecated-skill
```

---

## 八、总结

Skills Manager 解决的核心问题：**把 100+ 个 Skill 从散落各处的文件变成可管理、可分组、可备份、可同步的结构化资产。**

```
GUI  → 可视化操作，浏览、拖拽、一键部署
CLI  → 脚本化、Agent 可调用，--json 输出
manage-skills → Agent 自己管自己的 Skill，不绕开中央库
备份 → Git 自动同步，多设备一致，快照可恢复
标签 → 按来源/用途筛选
Preset → 按场景分组，一键部署/撤销
```

安装一行命令：`brew install --cask skills-manager`
