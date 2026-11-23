---
title: Karing 使用笔记：分流组、规则集与数据源
published: 2026-11-23T14:48:00+08:00
description: Karing 用 sing-box 内核，配置模型和 Clash 完全不同。这篇拆开「分流组 = 规则集 + 出站」这层抽象，理清 geosite/geoip/acl 三类规则集，追踪规则数据从 meta-rules-dat 到 karing-ruleset 的生产链路，最后给 AI 工具和 GitHub 单独分流的实操配置。
tags:
  - karing
  - sing-box
  - 分流规则
series: 工具相关
---

Karing 用的是 sing-box 内核，界面看着像 Clash，但配置模型完全不同：**Clash 是「规则列表 → 策略组」，Karing 是「分流组 = 规则集 + 出站」**。搞清这一点，后面所有操作都顺了。

## 一、常用功能速查

| 入口 | 作用 | 什么时候用 |
|---|---|---|
| 系统代理 | 把 macOS 应用流量交给 Karing | 不想开 TUN 时用，覆盖不全 |
| TUN（主开关） | 接管全部流量，包括不认代理的 App | 日常默认开着 |
| 规则 / 全局 | 规则模式按分流组走；全局模式全走一个节点 | 排查「某个站走了哪条线」时切全局验证 |
| 分流规则 | 管理规则集本身（增删、看内容） | 想知道某组到底匹配了什么 |
| **分流** | 管理分流组 → 每组选节点 | 最高频，加组、换节点都在这 |
| DNS | 全局 DNS + 每组可单独指定 | 出现解析污染、内网域名失效时查 |
| 我的配置 | 订阅、节点列表 | 换机场、更新订阅 |
| 网络检测 / 统计 | 连通性、流量去向 | 判断是不是节点挂了 |

## 二、核心概念：一个分流组有三样东西

```
分流组 = 规则集（匹配什么） + 出站（走哪里） + DNS（怎么解析）
```

对应配置文件里的三个字段：

| 字段 | 含义 | 举例 |
|---|---|---|
| `rule_set_build_in` | 内置规则集 ID 列表 | `geosite:category-ai-!cn`、`acl:ChinaDomain` |
| `server_groupid` | 出站 | `currentSelected`（当前节点）/ `direct` / 指定节点 |
| `dns_servers` | 该组专用 DNS | 空 = 跟随全局 |

**分流是自上而下匹配，第一条命中就停**，所以组的顺序就是优先级。默认顺序里「苹果服务」「国内直连」在前面，就是为了让这些流量先被直连拿走。

macOS 上的配置存放位置：

```bash
~/Library/Group Containers/group.com.nebula.karing/
├── karing_routing_group.json     # 分流组定义（规则集）
├── karing_subscribe_use.json     # 分流组 → 出站 的绑定和顺序
└── service_core.json             # 编译后的 sing-box 配置（App 生成，别手改）
```

## 三、规则集有三种前缀

| 前缀 | 匹配对象 | 本机内置数量 | 典型例子 |
|---|---|---|---|
| `geosite:` | 域名 | 1984 个 | `geosite:category-ai-!cn`、`geosite:github` |
| `geoip:` | IP 段 | 278 个 | `geoip:cn`、`geoip:private` |
| `acl:` | 国内站点/公司（ACL4SSR） | 171 个 | `acl:ChinaDomain`、`acl:ProxyGFWlist` |

`geosite` 还带修饰后缀，同一个分类可以只取其中一部分：

| 后缀 | 含义 |
|---|---|
| `@ads` | 只取广告相关域名 |
| `@telemetry` | 只取埋点/遥测 |
| `@!cn` | 只要境外部分 |
| `@cn` | 只要境内部分 |

比如 `geosite:category-ai-!cn@ads` 就是「AI 分类里的广告域名」，用来拦截而不是代理。

## 四、这些数据是谁在维护

Karing 自己不做规则数据，全部来自两个仓库，关系是「工厂 → 成品包」：

```
上游数据（v2fly geosite / geoip / blackmatrix7 / ACL4SSR / AdGuard）
        ↓  合并、去重、编译（GitHub Actions 每天跑）
MetaCubeX/meta-rules-dat        ← 数据工厂，输出 .mrs / .dat
        ↓  组装成 sing-box 格式
KaringX/karing-ruleset          ← 成品包，Karing 直接吃
        ↓
Karing 内置（随 App 打包）或 远程订阅
```

### MetaCubeX/meta-rules-dat —— 规则工厂

| 项 | 情况 |
|---|---|
| 默认分支 | `master` **只有 16 个文件**，全是生成脚本 |
| 数据在哪 | `meta` / `sing` / `release` 分支，9 万+ 文件 |
| 输出 | `geo/geosite/*.mrs`、`geo/geoip/*.mrs`、`asn/AS*.mrs`、`country.mmdb` |
| 谁在用 | Clash Verge（`geosite.dat`）、mihomo、Karing 的 sing 分支数据 |
| 更新 | 每天 02:59 前后自动推送 |

### KaringX/karing-ruleset —— sing-box 成品包

默认分支 `sing`，7571 个文件：

| 目录 | 文件数 | 内容 |
|---|---|---|
| `geo/geosite/` | 4070 | 域名规则，`.json`（可读）+ `.srs`（二进制）双份 |
| `geo/geoip/` | 538 | IP 段规则 |
| `ACL4SSR/` | 513 | 国内站点/公司，对应界面里的 `acl:` 前缀 |
| `AdGuard/` | 130 | 去广告 hostlist |
| `recommend/` | 8 | 预置分流方案（default / cn / ir / ru） |
| `russia/` | 2299 | 俄国被封名单（用不上） |
| `chinese/` | 7 | 中文去广告 |

### 一个坑：这两个仓库在 GitHub 搜不到

两个都是 **fork 身份**，GitHub 仓库搜索默认排除 fork：

| 仓库 | fork 自 | 星数 |
|---|---|---|
| `MetaCubeX/meta-rules-dat` | `CHIZI-0618/v2ray-rules-dat` | 5.7k |
| `KaringX/karing-ruleset` | `ACL4SSR/ACL4SSR` | 733 |

搜索时要加 `fork:true`，或直接收藏直链。

## 五、内置数据 vs 远程订阅

Karing 默认 `use_remote_geosite / geoip / acl = false`——**用随 App 打包的数据，不联网拉取**。

| 方式 | 优点 | 缺点 |
|---|---|---|
| 内置（默认） | 离线可用、不占带宽、不怕 CDN 挂 | 落后于仓库几天到几周（跟版本走） |
| 远程 | 永远最新 | 每条规则集首次加载要下载，断网时失效 |

绝大多数场景内置就够。真要最新（比如某个新 AI 服务的域名刚收录），再加远程：

```
https://raw.githubusercontent.com/KaringX/karing-ruleset/sing/geo/geosite/<名字>.srs
```

## 六、实战：给 AI 工具单独分流

需求是让 Cursor / Antigravity / Claude 走一条**固定的美国线路**，其它流量继续走低延迟节点。

新建分流组「🤖 AI 服务」，勾这几个内置规则集：

| 规则集 | 条目数 | 覆盖 |
|---|---|---|
| `geosite:category-ai-!cn` | 243 | AI 服务总集，含 `antigravity.googleapis.com`、`claude.ai`、`api2.cursor.sh`、`chatgpt.com` |
| `geosite:anthropic` | 21 | Anthropic 全家桶 |
| `geosite:category-ai-chat-!cn` | 243 | 与上一项当前内容一致，选一个即可 |

开发工具同理：

| 规则集 | 条目数 |
|---|---|
| `geosite:github` | 66 |
| `geosite:github-copilot` | 23 |
| `geosite:category-dev` | 735（npm / pypi / jetbrains / gitlab…） |

> 注意 `category-dev` 里**不含 `github.com`**，GitHub 要单独加 `geosite:github`——这一条踩过才知道。

加完后，在分流列表里把「🤖 AI 服务」的出站从 `currentSelected` 改成一个美国节点即可。

## 七、怎么验证真的生效了

Karing 的 core 开了 Clash 兼容 API，可以直接查运行时状态（`secret` 在 `service.json` 里）：

```bash
K=~/Library/Group\ Containers/group.com.nebula.karing
SECRET='<service.json 里的 secret>'

# 看规则加载了几条、顺序对不对
curl -s -H "Authorization: Bearer $SECRET" http://127.0.0.1:3057/rules

# 看每条实时连接命中了哪条规则
curl -s -H "Authorization: Bearer $SECRET" http://127.0.0.1:3057/connections
```

`connections` 里能直接看到 `api2.cursor.sh -> 🤖 AI 服务[自定义]`，比看界面靠谱。

## 八、一个必须知道的坑

Karing 的 core 跑在 **root 系统扩展**里（`com.nebula.karing.karingServiceSE`），**重启 App 不会重启它**，App 会复用旧的编译配置。所以：

- 手改 `karing_routing_group.json` 后，必须在界面里**断开 → 重连**一次才会生效
- 重连时 App 会用内存里的状态重建 `service_core.json`，组名自动补 `[自定义]` 后缀
- `kill` 不掉（`Operation not permitted`），坐标点击、AXPress 也驱动不了 Flutter 界面

## 九、规则集选择速查

| 想要的效果 | 用哪个 |
|---|---|
| AI 工具走代理 | `geosite:category-ai-!cn` + `geosite:anthropic` |
| GitHub / Copilot | `geosite:github` + `geosite:github-copilot` |
| 开发工具链（npm/pypi/IDE） | `geosite:category-dev` |
| 苹果服务直连 | `geosite:apple` + `@ads` `@telemetry` |
| 国内站点直连 | `acl:ChinaDomain` + `acl:ChinaIp` |
| 常见广告拦截 | `geosite:category-ads-all` |
| 流媒体解锁 | `geosite:netflix` / `disney` / `hbomax` / `primevideo` |
| 游戏平台 | `geosite:category-games` |

---

Karing 的精华在「分流组」这一层抽象，规则数据不用自己写——`meta-rules-dat` 每天编译，`karing-ruleset` 组装成 sing-box 格式，Karing 打包进 App，你只需要挑规则集和指定出站。