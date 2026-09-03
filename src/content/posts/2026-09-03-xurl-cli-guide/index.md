---
title: xurl：在终端里玩转 X（Twitter）的官方 CLI 工具
published: 2026-09-03
draft: false
description: 详细介绍 xurl 官方 CLI 工具的安装、App 创建、OAuth 授权、额度查看及发帖/搜索/互动/私信等完整使用场景，让你在终端里高效操作 X。
tags: []
series: 工具相关
toc: true
coverImage: null
---

# xurl：在终端里玩转 X（Twitter）的官方 CLI 工具

X（Twitter）是获取技术资讯和行业动态的重要渠道。但每次发帖都要打开网页或 App，对于习惯终端操作的开发者来说效率不高。

[**xurl**](https://github.com/xdevplatform/xurl) 是 X 官方（xdevplatform 团队）开发的命令行工具，让你在终端里直接操作 X——发推、回复、搜索、点赞、私信、上传媒体，全部通过 X API v2。对 AI Agent 尤其友好——Hermes、Claude Code 等工具可以直接调用 xurl 替你完成 X 上的一切操作。

GitHub 地址：[https://github.com/xdevplatform/xurl](https://github.com/xdevplatform/xurl)

***

## 一、安装

四种方式任选，推荐第一种：

```bash
# macOS Homebrew（推荐）
brew install --cask xdevplatform/tap/xurl

# Shell 脚本（Linux / 无 Homebrew 环境）
curl -fsSL https://raw.githubusercontent.com/xdevplatform/xurl/main/install.sh | bash

# npm
npm install -g @xdevplatform/xurl

# Go
go install github.com/xdevplatform/xurl@latest
```

安装后验证：

```bash
xurl --version
```

> 如果用 Shell 脚本安装，二进制在 `~/.local/bin/xurl`，确保它在你的 PATH 里。macOS 用户可能需要将 `export PATH="$HOME/.local/bin:$PATH"` 添加到 `.zshrc`。

***

## 二、创建 App 并授权

xurl 需要通过 X 官方 API 操作，所以要先在 X Developer Portal 创建一个 App 并完成 OAuth 2.0 授权。整个过程约 5 分钟。

### 第一步：创建 App

1. 打开 [https://developer.x.com/en/portal/dashboard](https://developer.x.com/en/portal/dashboard)
2. 点击 **"+ Create App"**，名字随便填（比如 `my-bot`）
3. 创建完成后，进入 App 设置，找到 **User authentication settings**
4. 按以下配置填写：

| 配置项 | 值 |
|--------|-----|
| App permissions | **Read and write and Direct message** |
| Type of App | **Web App, Automated App or Bot** |
| Callback URI / Redirect URL | `http://localhost:8080/callback` |
| Website URL | 填你的个人网站地址（必填，如 `https://iyangjike.github.io`） |

> ⚠️ **不要选 Native App**，否则 OAuth 流程会报 `unauthorized_client` 错误。

其他字段（Organization name、Privacy Policy 等）留空即可，保存。

5. 保存后，在 **Keys and tokens** 页面找到 **Client ID** 和 **Client Secret**，记下来。

### 第二步：注册 App 到 xurl

```bash
xurl auth apps add my-app \
  --client-id 你的ClientID \
  --client-secret 你的ClientSecret
```

### 第三步：OAuth 2.0 授权

```bash
xurl auth oauth2 --app my-app
```

这会自动打开浏览器，跳转到 X 授权页面。点击 **"Authorize App"** 即可。

> 如果授权后 `xurl whoami` 报错，尝试带用户名重新授权：
> ```bash
> xurl auth oauth2 --app my-app 你的X用户名
> ```

### 第四步：设为默认

```bash
xurl auth default my-app
```

### 验证

```bash
xurl auth status    # 看到 ▸ my-app 且有 oauth2 用户名即成功
xurl whoami         # 查看自己的 X 账号信息
```

输出示例：

```json
{
  "data": {
    "id": "1922114199158980608",
    "name": "Jike",
    "username": "iike_1155665",
    "public_metrics": {
      "followers_count": 0,
      "following_count": 27,
      "tweet_count": 16
    }
  }
}
```

***

## 三、使用场景全览

### 发帖 & 管理内容

```bash
# 发推文
xurl post "今天学到一个新东西。"

# 带图片发（先上传，再发）
xurl media upload screenshot.png
xurl post "看图说话" --media-id 123456789

# 回复某人
xurl reply 2095391142246523237 "这个分析很到位"

# 引用转发
xurl quote 2095391142246523237 "补充一下我的看法..."

# 删帖
xurl delete 2095391142246523237
```

> POST_ID 也可以用完整 URL，比如 `xurl reply https://x.com/user/status/123456789 "回复内容"`，xurl 会自动提取 ID。

### 搜索 & 发现

```bash
# 搜关键词（返回原始推文 JSON，有 ID 可以直接互动）
xurl search "Gemini 学生优惠" -n 10

# 高级搜索
xurl search "from:elonmusk lang:en" -n 5
xurl search "#buildinpublic" -n 20
```

### 看用户 & 时间线

```bash
xurl user elonmusk          # 查看某个用户信息
xurl timeline -n 25         # 首页时间线
xurl mentions -n 10         # 谁 @ 了我
```

### 互动操作

```bash
xurl like 2095391142246523237       # 点赞
xurl unlike 2095391142246523237     # 取消点赞
xurl repost 2095391142246523237     # 转发
xurl unrepost 2095391142246523237   # 取消转发
xurl bookmark 2095391142246523237   # 收藏
xurl unbookmark 2095391142246523237 # 取消收藏
xurl follow @someuser               # 关注
xurl unfollow @someuser             # 取关
xurl block @spammer                 # 拉黑
xurl mute @annoying                 # 静音
```

### 私信

```bash
xurl dm @someuser "你好，想聊聊合作"
xurl dms -n 10    # 查看最近私信列表
```

### 媒体上传

```bash
# 上传图片
xurl media upload photo.jpg

# 上传视频（需要等服务器处理）
xurl media upload video.mp4
xurl media status MEDIA_ID --wait    # 等待处理完成
```

### 裸调 API（高级用法）

xurl 内置命令覆盖不了的，可以直接调任意 X API v2 端点：

```bash
# GET
xurl /2/users/me
xurl /2/users/by/username/elonmusk

# POST
xurl -X POST /2/tweets -d '{"text":"Hello world!"}'

# 发投票
xurl -X POST /2/tweets -d '{
  "text": "你更喜欢哪个？",
  "poll": {
    "duration_minutes": 1440,
    "options": ["A", "B"]
  }
}'
```

***

## 四、额度与费用

xurl 本身是**免费开源**的，但 X API 有使用成本。

**2026 年 2 月起，X 取消了免费套餐**，新开发者默认进入 **按量付费（Pay-per-use）** 模式：

| 操作 | 价格 |
|------|------|
| 发帖（不含链接） | $0.015 / 条 |
| 发帖（含链接） | $0.20 / 条 |
| 读帖 | $0.005 / 条 |

需要在 Developer Console → Billing 页面预先购买额度（最低 $5 起），用多少扣多少。不会自动扣费超支——额度用完即停，API 返回 `429` 错误。

**查看额度：**
打开 [https://developer.x.com/en/portal/dashboard](https://developer.x.com/en/portal/dashboard) → 点你的 Project → **Usage** 标签页，可以看到本月用量和剩余额度。

> 旧版 Free（500 条/月）、Basic（$200/月）、Pro（$5,000/月）套餐仅对存量用户保留，新用户无法选择。

***

## 五、典型工作流

**场景一：日常发帖**

```bash
xurl post "分享一个技术发现..."
```

**场景二：搜话题 + 参与讨论**

```bash
xurl search "前端面试" -n 5              # 搜索
xurl reply 123456789 "我来回答这个问题..."  # 回复
xurl like 123456789                      # 点赞
```

**场景三：图文内容发布**

```bash
xurl media upload chart.png                    # 上传图片
xurl post "上个月的数据分析结果" --media-id 123456 # 发图文
```

**场景四：配合 AI Agent 自动化**

在 Hermes 里直接说"帮我把这篇文章发到 X 上"，Agent 自动调用 xurl 完成发帖、排版、回复。配合 Grok Bot 或其他 Agent 工具，可以实现 X 内容的全自动运营。

**场景五：多账号管理**

```bash
xurl auth apps add work-account --client-id ... --client-secret ...
xurl auth oauth2 --app work-account

# 切换账号
xurl --app work-account post "工作相关推文"
xurl --app my-app post "个人推文"
```

***

## 六、常见问题

### 授权后 xurl whoami 报错？

可能是 App 类型选错了——确保选的是 **"Web App, Automated App or Bot"**，不是 "Native App"。如果类型正确但仍报错，带用户名重新授权：

```bash
xurl auth oauth2 --app my-app 你的X用户名
```

### 发帖时遇到 403 Forbidden？

常见原因：
- 内容太长（超过 X 字数限制）
- 额度用完（去 Usage 页面查看）
- Free 套餐连续回复限制（等几分钟再试）

### 如何查看当前认证状态？

```bash
xurl auth status
```

输出中 `▸` 标记的是当前默认 App，`oauth2:` 后面是绑定的用户名。如果默认 App 显示 `(none)`，说明还没完成授权，需要重新执行 `xurl auth oauth2 --app my-app`。

### 可以同时管理多个 X 账号吗？

可以。每个 App 可以绑定不同的 X 账号，通过 `--app` 参数切换：

```bash
xurl --app account-a post "账号 A 的内容"
xurl --app account-b post "账号 B 的内容"
```

***

## 总结

xurl 是终端用户的 X 操作利器，也是 AI Agent 通往 X 的标准桥梁。安装 1 分钟，配置 5 分钟，之后所有 X 操作都在终端里搞定。配合 Hermes 等 Agent 工具，还能实现发帖、互动、数据采集的全自动化。
