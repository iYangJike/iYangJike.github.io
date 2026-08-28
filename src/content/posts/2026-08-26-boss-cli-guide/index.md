---
title: boss-cli：在终端里搞定 BOSS 直聘——搜索、批量投递、数据导出全攻略
published: 2026-08-26
draft: false
description: 详细介绍 boss-cli 开源工具的安装、认证、职位搜索、批量打招呼、数据导出等核心功能，以及求职场景下的最佳实践，帮助你在终端里高效完成 BOSS 直聘操作。
tags: []
series: 工具相关
toc: true
coverImage: null
---

# boss-cli：在终端里搞定 BOSS 直聘——搜索、批量投递、数据导出全攻略

BOSS 直聘是国内最主流的求职平台之一，但它的网页端和 App 操作效率其实不算高——搜索职位要反复点筛选、翻页、一个一个打招呼。作为开发者，这种重复劳动显然应该交给命令行。

[**boss-cli**](https://github.com/jackwener/boss-cli) 就是为此而生的：一个基于逆向工程 API 的 Python CLI 工具，让你在终端里完成搜索、筛选、批量打招呼、导出数据等几乎所有求职端操作。

GitHub 地址：[https://github.com/jackwener/boss-cli](https://github.com/jackwener/boss-cli)

***

## 一、它能做什么

boss-cli 目前覆盖了 BOSS 直聘求职者的核心操作路径：

| 能力 | 命令 | 说明 |
| --- | --- | --- |
| 搜索职位 | `boss search` | 支持关键词 + 城市/薪资/经验/学历/行业/规模/融资阶段多维度筛选 |
| 查看推荐 | `boss recommend` | 基于求职期望的个性化推荐 |
| 职位详情 | `boss show N` / `boss detail` | 按编号快速查看，或通过 securityId 查看完整信息 |
| 批量打招呼 | `boss batch-greet` | 对搜索结果批量发送打招呼消息（= 投递） |
| 单个打招呼 | `boss greet` | 对指定职位打招呼 |
| 已投递列表 | `boss applied` | 查看已投递的职位 |
| 面试邀请 | `boss interviews` | 查看收到的面试邀请 |
| 沟通列表 | `boss chat` | 查看沟通过的 HR/Boss |
| 浏览历史 | `boss history` | 查看浏览过的职位 |
| 数据导出 | `boss export` | 导出搜索结果为 CSV 或 JSON |
| 个人资料 | `boss me` | 查看在线简历基本信息 |

**不支持的操作**：修改在线简历、发送自定义聊天消息（需要 MQTT/Protobuf）、发简历附件。这些还是需要回到网页端或 App 操作。

***

## 二、安装

```bash
# 推荐：使用 uv（快速、隔离）
uv tool install kabi-boss-cli

# 或使用 pipx
pipx install kabi-boss-cli

# 可选：YAML 输出支持
pip install kabi-boss-cli[yaml]

# 验证安装
boss --version
```

> 注意：PyPI 包名是 `kabi-boss-cli`，安装后的可执行文件是 `boss`。

***

## 三、认证登录

boss-cli 支持两种登录方式：

### 方式一：自动提取浏览器 Cookie（推荐）

```bash
# 自动从 Chrome 提取（前提是你已在 Chrome 登录过 BOSS 直聘）
boss login --cookie-source chrome

# 支持 10+ 浏览器：chrome / firefox / edge / brave / arc / safari 等
boss login --cookie-source safari
```

### 方式二：二维码扫码登录

```bash
boss login --qrcode
```

终端会打印一个二维码，用 BOSS 直聘 App 扫码即可。

### 验证登录状态

```bash
boss status --json
```

输出示例：

```json
{
  "authenticated": true,
  "search_authenticated": true,
  "recommend_authenticated": true,
  "cookie_count": 18
}
```

三个核心认证全部为 `true` 即表示登录成功。Cookie 过期后需要重新登录。

***

## 四、核心功能详解

### 4.1 搜索职位

```bash
# 基础搜索
boss search "AI全栈"

# 完整筛选
boss search "AI Agent" \
  --city 北京 \
  --salary 30-50K \
  --exp 3-5年 \
  --degree 本科 \
  --industry 互联网 \
  --scale 1000-9999人 \
  --stage 已上市
```

**支持的筛选参数**：

| 参数 | 说明 | 可选值 |
| --- | --- | --- |
| `--city` | 城市 | 北京/上海/广州/深圳/杭州/成都 等 42 个城市 |
| `--salary` | 薪资范围 | 3K以下 / 3-5K / 5-10K / 10-15K / 15-20K / 20-30K / 30-50K / 50K以上 |
| `--exp` | 经验要求 | 应届生 / 1年以下 / 1-3年 / 3-5年 / 5-10年 / 10年以上 |
| `--degree` | 学历 | 大专 / 本科 / 硕士 / 博士 |
| `--industry` | 行业 | 互联网 / 计算机软件 / 电子商务 等 |
| `--scale` | 公司规模 | 0-20人 / 20-99人 / 100-499人 / 500-999人 / 1000-9999人 / 10000人以上 |
| `--stage` | 融资阶段 | 未融资 / 天使轮 / A轮 / B轮 / C轮 / D轮及以上 / 已上市 / 不需要融资 |

```bash
# JSON 输出（适合脚本处理）
boss search "AI全栈" --city 北京 --salary 30-50K --json

# 查看所有支持的城市
boss cities
```

### 4.2 查看职位详情

搜索后每个职位有一个编号，可以用 `boss show` 快速查看：

```bash
# 先搜索
boss search "AI全栈" --city 北京

# 查看第 3 个结果的详情
boss show 3

# 通过 securityId 查看完整信息
boss detail <securityId>
```

### 4.3 批量打招呼（核心功能）

这是 boss-cli 最有价值的命令。在 BOSS 直聘上，"打招呼"就等于投递——HR 收到你的消息后如果感兴趣就会回复，进而进入聊天。

```bash
# ⚠️ 强烈建议先 dry-run 预览，再真发
boss batch-greet "AI全栈" --city 北京 --salary 30-50K -n 30 --dry-run

# 确认无误后真发
boss batch-greet "AI全栈" --city 北京 --salary 30-50K -n 30

# 多条件组合
boss batch-greet "AI Agent" \
  --city 上海 \
  --salary 30-50K \
  --exp 3-5年 \
  -n 20
```

**注意事项**：

- 内置 1.5 秒延迟，防止触发风控
- 单次最多打招呼数量由 `-n` 控制
- 打招呼内容为系统预设，不能自定义
- \*\*一定要先 `--dry-run`\*\*，确认目标职位无误再真发

### 4.4 查看投递状态

```bash
# 已投递的职位
boss applied

# 收到的面试邀请
boss interviews

# 沟通过的 HR/Boss 列表
boss chat

# 浏览历史
boss history
```

### 4.5 导出数据

```bash
# 导出为 CSV
boss export "AI全栈" -n 100 --format csv -o ai-jobs.csv

# 导出为 JSON
boss export "AI全栈" -n 100 --format json -o ai-jobs.json

# 导出到标准输出（管道给其他工具）
boss export "AI全栈" -n 50 --format json -o -
```

### 4.6 查看个人资料

```bash
boss me
boss me --json
```

可以查看姓名、工作年限、学历、在线简历数量等基本信息。

***

## 五、最佳实践

### 5.1 求职场景完整流程

```bash
# 第一步：登录（Chrome Cookie 方式最快）
boss login --cookie-source chrome

# 第二步：多关键词搜索，了解市场
boss search "AI全栈" --city 北京 --salary 30-50K --json | python3 -c "
import json, sys
data = json.load(sys.stdin)
for j in data['data']['jobList']:
    print(f'{j[\"jobName\"]} | {j[\"brandName\"]} | {j[\"salaryDesc\"]}')
"

# 第三步：导出数据，用 Excel 分析
boss export "AI全栈" -n 100 --format csv -o ai-fullstack.csv

# 第四步：批量投递（先 dry-run！）
boss batch-greet "AI全栈" --city 北京 --salary 30-50K -n 30 --dry-run
boss batch-greet "AI全栈" --city 北京 --salary 30-50K -n 30

# 第五步：过几个小时查看回复
boss chat
boss interviews
```

### 5.2 多城市批量搜索脚本

```bash
#!/bin/bash
# 多城市搜索脚本
CITIES=("北京" "上海" "深圳" "杭州" "成都")
KEYWORD="AI全栈"

for city in "${CITIES[@]}"; do
  echo "=== $city ==="
  boss search "$KEYWORD" --city "$city" --salary 30-50K --json 2>/dev/null \
    | python3 -c "
import json, sys
data = json.load(sys.stdin)
print(f'找到 {len(data[\"data\"][\"jobList\"])} 个职位')
for j in data['data']['jobList'][:5]:
    print(f'  {j[\"jobName\"]} | {j[\"brandName\"]} | {j[\"salaryDesc\"]}')
"
  echo
done
```

### 5.3 导出 + jq 数据分析

```bash
# 按薪资从高到低排（导出为 JSON 后用 jq 处理）
boss export "AI全栈" -n 100 --format json -o - 2>/dev/null \
  | python3 -c "
import json, sys
jobs = json.load(sys.stdin)
# 按薪资下限排序
sorted_jobs = sorted(jobs, key=lambda j: int(j.get('salaryDesc','0K').split('-')[0].replace('K','')), reverse=True)
for j in sorted_jobs[:10]:
    print(f'{j[\"jobName\"]:30s} | {j[\"brandName\"]:20s} | {j[\"salaryDesc\"]}')
"
```

### 5.4 定时监控新职位

```bash
# 配合 cron 定时搜索，发现新职位后通知
# 例如每 2 小时跑一次，把结果追加到 CSV，去重后看增量
```

***

## 六、原理与局限

### 原理

boss-cli 通过逆向工程 BOSS 直聘的 Web API，模拟浏览器请求来实现搜索、打招呼等操作。认证方式是从浏览器提取已有的 Cookie（或扫码获取），不存储密码。

### 已知限制

| 限制 | 说明 |
| --- | --- |
| 不能改简历 | 在线简历的编辑需要网页端或 App 操作 |
| 不能发自定义消息 | 聊天消息需要 MQTT/Protobuf 协议，CLI 暂不支持 |
| 不能发简历附件 | 需要 HR 回复后手动在 App 发 |
| 单账号 | 同一时间只能使用一组 Cookie |
| 风控延迟 | 批量打招呼内置 1.5s 间隔，太快可能被限 |
| Cookie 过期 | 一段时间后需要重新登录 |

### 与其他工具的对比

| 工具 | 类型 | 面向用户 | 核心能力 |
| --- | --- | --- | --- |
| **boss-cli** | CLI | 求职者 | 搜索 + 批量打招呼 + 导出 |
| [boss-zhipin-mcp](https://github.com/Snseam/boss-zhipin-mcp) | MCP Server | 招聘者 (HR) | 批量搜候选人 + 简历截图 + 筛选评分 |
| [mcp-boss](https://github.com/derekdong-star/mcp-boss) | MCP Server | 求职者 | 搜索 + 自动打招呼，可接入 Claude Code |

如果你想把 BOSS 直聘接入 AI 助手（如 Claude Code / Hermes），可以用 `mcp-boss`。如果只是终端高效求职，`boss-cli` 是最佳选择。

***

## 七、总结

boss-cli 解决的核心痛点是：**把搜索和打招呼这两个最高频、最重复的操作从手动点击变成一条命令**。虽然它不能替代整个求职流程（在线简历优化、HR 聊天跟进还是需要手动），但能把海投 100 个岗位的时间从 2 小时压缩到 2 分钟。

配合之前介绍的 [JadeAI / Reactive Resume](https://github.com/amruthpillai/reactive-resume) 等简历优化工具，先打磨好在线简历内容，再用 boss-cli 批量投递，这就是一个高效的求职工作流。

> GitHub: [https://github.com/jackwener/boss-cli](https://github.com/jackwener/boss-cli)
