---
title: GitHub CLI（gh）完全上手指南
published: 2026-08-25
draft: false
description: 详细介绍 gh CLI 的安装、认证、以及仓库管理、Issue、Pull Request、GitHub Actions、Release 等核心使用场景，附带大量实战示例，帮助你快速上手。
tags: []
series: 工具相关
toc: true
coverImage: null
---

# GitHub CLI（gh）完全上手指南

GitHub CLI（`gh`）是 GitHub 官方提供的命令行工具，让你无需离开终端就能完成仓库管理、Issue 跟踪、Pull Request 工作流、CI/CD 监控等几乎所有 GitHub 操作。本文按场景分类，逐一介绍核心命令和实战用法。

***

## 一、安装与认证

### 安装

```bash
# macOS
brew install gh

# 升级
brew upgrade gh
```

### 认证

```bash
# 交互式登录（推荐）
gh auth login

# 查看当前登录状态
gh auth status
```

登录时会引导你选择 GitHub.com 或 GitHub Enterprise Server，然后选择 HTTPS 或 SSH 协议，最后通过浏览器完成 OAuth 授权。

### 查看版本

```bash
gh --version
```

***

## 二、仓库管理

### 克隆仓库

```bash
# 克隆自己的仓库
gh repo clone iYangJike/my-blog

# 克隆任意公开仓库（不需要先 fork）
gh repo clone deepseek-ai/deepseek-harness
```

### 创建仓库

```bash
# 交互式创建（会问你名称、可见性等）
gh repo create

# 一步到位：从当前目录创建公开仓库并推送
gh repo create my-project --public --source=. --push

# 创建私有仓库
gh repo create my-project --private

# 从模板创建
gh repo create my-project --template owner/template-repo
```

### 查看仓库

```bash
# 在浏览器中打开当前仓库
gh repo view --web

# 查看仓库基本信息
gh repo view
```

### Fork 仓库

```bash
# Fork 别人的仓库到自己的账号下
gh repo fork deepseek-ai/deepseek-harness

# Fork 并立即克隆到本地
gh repo fork deepseek-ai/deepseek-harness --clone
```

***

## 三、Issue 管理

### 创建 Issue

```bash
# 交互式创建
gh issue create

# 一行搞定
gh issue create \
  --title "登录页面报 500 错误" \
  --body "## 复现步骤
1. 打开登录页
2. 输入邮箱
3. 点击登录"

# 加标签和指派人
gh issue create \
  --title "API 响应慢" \
  --label "bug,performance" \
  --assignee @me
```

### 查看和筛选 Issue

```bash
# 列出当前仓库所有 Issue
gh issue list

# 只看自己的
gh issue list --assignee @me

# 按标签筛选
gh issue list --label "bug"

# 限制数量和状态
gh issue list --limit 20 --state open

# 查看详情
gh issue view 42

# 在浏览器打开
gh issue view 42 --web
```

### 修改 Issue 状态

```bash
# 关闭
gh issue close 42

# 重开
gh issue reopen 42

# 修改标题、标签、指派人
gh issue edit 42 \
  --title "新标题" \
  --add-label "urgent" \
  --remove-label "bug"
```

### 评论 Issue

```bash
# 添加评论
gh issue comment 42 --body "我来处理这个问题"

# 快速浏览 Issue 的评论
gh issue view 42 --comments
```

***

## 四、Pull Request 工作流

这是 `gh` 最常用、最强大的功能场景。

### 创建 PR

```bash
# 交互式创建（自动检测当前分支和 base 分支）
gh pr create

# 一行搞定
gh pr create \
  --title "修复登录页 500 错误" \
  --body "关闭 #42，修复了空指针问题"

# 指定 base 分支 + 添加审查人
gh pr create \
  --base main \
  --reviewer "colleague" \
  --assignee @me

# 标记为 Draft
gh pr create --draft --title "WIP: 重构用户模块"
```

### 查看 PR

```bash
# 列出所有 PR
gh pr list

# 只看自己的
gh pr list --author @me

# 查看需要你审查的 PR
gh pr list --search "review-requested:@me"

# 查看详情（自动展示 CI 状态）
gh pr view 123

# 在浏览器打开
gh pr view 123 --web

# 查看当前分支对应的 PR
gh pr view
```

### 审查 PR

```bash
# 检出某个 PR 到本地
gh pr checkout 123

# 查看 PR 的 diff
gh pr diff 123

# 批准
gh pr review 123 --approve

# 请求修改
gh pr review 123 --request-changes --body "请补充单元测试"

# 仅评论
gh pr review 123 --comment --body "小建议：变量名可以更语义化"
```

### 合并 PR

```bash
# 合并（默认 squash 还是 merge 取决于仓库设置）
gh pr merge 123

# 指定合并方式
gh pr merge 123 --squash
gh pr merge 123 --rebase
gh pr merge 123 --merge

# 合并后自动删除分支
gh pr merge 123 --delete-branch
```

### 日常 PR 操作

```bash
# 更新 PR 描述
gh pr edit 123 --body "新的描述"

# 添加/移除标签
gh pr edit 123 --add-label "ready-for-review"

# Draft 转为正式 PR
gh pr ready 123
```

### 完整 PR 流程示例

```bash
# 从开分支到合并的完整流程
git checkout -b fix/login-500          # 开分支
# ... 写代码、提交 ...
gh pr create --title "修复登录 500" --body "修复 #42"   # 创建 PR
gh pr view                                # 确认一下
gh pr merge --squash --delete-branch      # 合并后清理分支
```

***

## 五、GitHub Actions / CI

```bash
# 查看最近的工作流运行
gh run list

# 只看某个 workflow 的运行
gh run list --workflow "deploy.yml"

# 查看某个运行的详情
gh run view 987654321

# 查看运行日志
gh run view 987654321 --log

# 查看失败的 job 日志
gh run view 987654321 --log --failed

# 重新运行失败的 job
gh run rerun 987654321 --failed

# 重新运行整个 workflow
gh run rerun 987654321

# 手动触发 workflow
gh workflow run "deploy.yml" --ref main

# 查看 workflow 列表
gh workflow list

# 查看 workflow 详情
gh workflow view "deploy.yml"
```

***

## 六、Release 管理

```bash
# 创建 Release
gh release create v1.0.0 \
  --title "第一个正式版" \
  --notes "## 新功能
- 用户登录
- 数据导出"

# 从已有 tag 创建
gh release create v1.0.0

# 附带文件
gh release create v1.0.0 ./dist/*.tar.gz

# 标记为预发布
gh release create v1.0.0-beta --prerelease

# 查看 Release
gh release view v1.0.0

# 列出所有 Release
gh release list

# 下载 Release 文件
gh release download v1.0.0
```

***

## 七、Gist 管理

```bash
# 创建私有 gist
gh gist create my-script.sh -d "一个实用脚本"

# 创建公开 gist
gh gist create config.json --public

# 列出自己的 gist
gh gist list

# 编辑 gist
gh gist edit <gist-id>

# 查看 gist
gh gist view <gist-id>
```

***

## 八、通知管理

```bash
# 查看未读通知
gh notification list

# 标记已读
gh notification mark-read

# 在浏览器中查看通知
gh notification list --web
```

***

## 九、高级用法

### JSON 输出（方便脚本处理）

```bash
# 获取 PR 列表的 JSON
gh pr list --json number,title,author,state,createdAt

# 配合 jq 处理
gh pr list --json number,title --jq '.[] | "\(.number): \(.title)"'
```

### 搜索

```bash
# 搜索 Issue（GitHub 搜索语法）
gh issue list --search "登录 in:title"

# 搜索 PR
gh pr list --search "status:success label:ready"
```

### 配置

```bash
# 设置默认编辑器
gh config set editor "code --wait"

# 查看当前配置
gh config list

# 查看某个配置项
gh config get editor
```

### 别名

```bash
# 添加自定义别名
gh alias set co 'pr checkout'
gh co 123   # 等同于 gh pr checkout 123

# 常用别名推荐
gh alias set pv 'pr view'
gh alias set pl 'pr list'
gh alias set il 'issue list'
gh alias set rl 'run list'
```

***

## 快速记忆卡

| 你想做什么 | 命令 |
| --- | --- |
| 创建仓库 | `gh repo create` |
| 克隆仓库 | `gh repo clone owner/repo` |
| 创建 Issue | `gh issue create` |
| 列出 Issue | `gh issue list` |
| 创建 PR | `gh pr create` |
| 列出 PR | `gh pr list` |
| 检出 PR 到本地 | `gh pr checkout 123` |
| 审查 PR | `gh pr review 123 --approve` |
| 合并 PR | `gh pr merge 123 --squash` |
| 查看 CI 状态 | `gh run list` |
| 创建 Release | `gh release create v1.0.0` |

***

## 总结

`gh` 的核心价值在于：让你不必在终端和浏览器之间频繁切换。日常开发中最高频的场景是 **PR 工作流**——从创建、审查到合并，全程无需离开命令行。配合 `gh pr checkout` 和 `gh pr diff`，你可以快速审查他人的代码；配合 `gh run view --log`，你可以直接排查 CI 失败原因。

一旦上手，你会发现 GitHub 网页端更多只是用来做代码阅读和最终确认的补充工具。
