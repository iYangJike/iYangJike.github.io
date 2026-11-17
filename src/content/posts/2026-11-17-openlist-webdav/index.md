---
title: 从 AList 到 OpenList：自建网盘网关 + WebDAV 全平台挂载
published: 2026-11-17T18:00:00+08:00
description: AList 易主后我把整套服务迁到了 OpenList。这篇记录 macOS 上的安装、夸克网盘挂载、WebDAV 挂进 Finder 的完整过程，以及踩过的坑和 12 条运维实践。
tags:
  - openlist
  - webdav
  - 自建服务
series: 工具相关
---

## 一、为什么会有 OpenList

2025 年 6 月，AList 项目易主。原作者的私有 API 留在代码里，新接手方的 PR 里出现了采集系统信息的模块，社区随即分叉出 OpenList，仓库描述写得很直白：*A new AList Fork to Anti Trust Crisis*。一年半后它已经成了这个项目的事实主干：25.6k star、AGPL-3.0、最新 v4.2.9（2026-10）、Docker 拉取 400 万+。

对我最关键的是兼容性：配置、数据库、目录结构、API 路径全部沿用 AList，换掉一个二进制就能跑起来。

拿两边 `drivers/` 目录做差集（2026-11 快照）：AList 93 个驱动，OpenList 89 个，共有 74 个。驱动数量上 AList 略多（飞书云文档、360 云盘、pCloud 这些是它独有），但离线下载 OpenList 多 4 个（9 对 5，多了 115 开放平台、123 分享、迅雷 SuperLite），另外还独有城通、WPS 云文档、夸克开放平台。对我这种要下载的用法，后者更实用。

## 二、安装

### 二进制（macOS，我在用这个）

官方 release 配一份 `md5.txt`，校验这一步别省：

```bash
mkdir -p ~/Library/openlist/{bin,data} && cd /tmp
VER=v4.2.9
curl -LO https://github.com/OpenListTeam/OpenList/releases/download/$VER/openlist-darwin-arm64.tar.gz
curl -LO https://github.com/OpenListTeam/OpenList/releases/download/$VER/md5.txt
grep darwin-arm64 md5.txt && md5 -q openlist-darwin-arm64.tar.gz   # 两个值必须一致

tar xzf openlist-darwin-arm64.tar.gz -C ~/Library/openlist/bin
openlist admin set '你的密码' --data ~/Library/openlist/data
openlist server --data ~/Library/openlist/data     # http://127.0.0.1:5244
```

`openlist admin` 另有 `random`（随机重置密码）和 `token`（打印 API token，脚本调用用）。

状态全在 `~/Library/openlist/data`（config.json + data.db + 日志）。我把 config.json 里的 `db_file`、`temp_dir`、`bleve_dir` 都显式指到这里 —— 打包这一个目录就是完整备份。

开机自启用 LaunchAgent（`~/Library/LaunchAgents/com.openlist.server.plist`）：`ProgramArguments` 填 `openlist server --data ...`，`KeepAlive` 和 `RunAtLoad` 都设 true，再 `launchctl load -w` 加载。

### Docker（NAS / VPS）

```yaml
services:
  openlist:
    image: openlistteam/openlist:latest
    container_name: openlist
    restart: always
    ports: ["5244:5244", "5245:5245"]            # Web/WebDAV + S3 网关
    volumes: ["/etc/openlist:/opt/openlist/data"]
    environment: [UMASK=022, TZ=Asia/Shanghai]
```

`docker compose up -d` 之后跑 `docker exec -it openlist ./openlist admin set '密码'`。镜像分 `latest`、`-aio`（含 aria2 + ffmpeg）、`-lite` 三种，只挂网盘选 `latest` 就够。

## 三、把网盘挂进来

### 添加存储的两种姿势

Web 界面点点点是一种，但我更常用 API —— 可复现、能进脚本。下面命令里的密码和 token 换成你自己的：

```bash
TOKEN=$(curl -s -X POST http://127.0.0.1:5244/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"你的密码"}' | jq -r .data.token)

curl -s -X POST http://127.0.0.1:5244/api/admin/storage/create \
  -H "Authorization: $TOKEN" -H 'Content-Type: application/json' \
  -d '{
    "mount_path": "/夸克",
    "driver": "Quark",
    "cache_expiration": 30,
    "addition": "{\"cookie\":\"__pus=...; b-user-id=...\",\"root_folder_id\":\"0\"}",
    "remark": "夸克网盘"
  }'
```

两个容易踩的点：

1. `addition` 是**字符串**，不是对象 —— 里面还得是一层合法 JSON
2. 创建后要 `POST /api/admin/storage/enable` 才生效（Web 界面保存时会自动启用）

### cookie 类驱动的通用做法

夸克、UC、115 这些「网页版登录」的网盘，驱动要的是一整条浏览器 cookie。手贴能跑，但一两周就过期，维护很烦。

我的做法是写个小脚本从 Chrome 直接读取 —— macOS 上 Chrome 的 cookie 是 AES-128-CBC 加密的，密钥从钥匙串的 `Chrome Safe Storage` 派生：

```
算法：PBKDF2-HMAC-SHA1(password, "saltysalt", 1003 轮, 16 字节)
解密：AES-128-CBC，IV = 16 个空格
```

解出来的串先别急着写配置，拿它直接打一次网盘 API 验证：

```bash
curl -s "https://drive.quark.cn/1/clouddrive/file/sort?pr=ucpro&fr=pc&pdir_fid=0&_page=1&_size=1&_fetch_total=1" \
  -H "Cookie: $CK" -H "Referer: https://pan.quark.cn/" | jq '{code,status,total}'
# {"code":0,"status":200,"total":6}  ← 说明 cookie 有效
```

验证通过再写回存储配置，失败就直接退出。这样「cookie 过期」变成了一个可以定时跑、自己会报错的检查，而不是某天打开 Finder 发现目录空了才反应过来。

### 容量显示默认是关的

这个坑我找了半天：OpenList 明明支持显示配额，界面上却什么都不显示。原因是两个设置项默认都是 `true`：

```bash
curl -X POST http://127.0.0.1:5244/api/admin/setting/save \
  -H "Authorization: $TOKEN" -H 'Content-Type: application/json' \
  -d '[{"key":"hide_storage_details","value":"false","type":"bool"},
       {"key":"hide_storage_details_in_manage_page","value":"false","type":"bool"}]'
```

注意 body 必须是**数组**，传单个对象会 400。

改完效果：文件列表里挂载点那一行的大小列变成进度条 + `已用 / 总量`，管理台存储页也多一列容量。数据来源是驱动的 `GetDetails` —— 本地目录走磁盘 df，网盘走各家的 member 接口。

实测我这台机器：夸克总 10.00 GB、已用 6.84 GB（免费额度就 10 GB）。

### 命令行速查

管理接口封装成脚本后，日常操作都在终端完成：

```bash
openlist-hermes ls /夸克              # 列目录
openlist-hermes get /夸克/a.mkv       # 取直链（含签名）
openlist-hermes put ./f.zip /夸克      # 上传
openlist-hermes mkdir /夸克/新建
openlist-hermes mv | cp | rename | rm
openlist-hermes storage-list          # 存储列表 + 状态
openlist-hermes space                 # 各存储容量
openlist-hermes offline "URL" /离线     # 离线下载
```

## 四、WebDAV：一次配置，全平台当本地盘

### 它到底是什么

WebDAV 是架在 HTTP 上的一套文件读写协议（RFC 2518 → RFC 4918），思路是给 HTTP 加 7 个动词，让 Web 从只读变成可写：

| 动词 | 作用 |
| --- | --- |
| `PROPFIND` | 读属性，兼做「列目录」（GET 目录会 405） |
| `PROPPATCH` | 批量改属性 |
| `MKCOL` | 建目录 |
| `COPY` / `MOVE` | 服务端直接复制/移动，不经过客户端 |
| `LOCK` / `UNLOCK` | 文件锁 |

三个必须知道的细节：

- 属性用 XML 存在 `DAV:` 命名空间，内容和元数据是同一个 URL 的两张脸
- 一个请求可以问多个资源（`Depth: 0/1/infinity`），所以响应码是 **207 Multi-Status** —— 部分成功是常态
- `Dav: 1` 只有基本读写，`Dav: 2` 才有锁

在 OpenList 上实测：

```bash
curl -i -X OPTIONS http://127.0.0.1:5244/dav/
# HTTP/1.1 200 OK
# Allow: OPTIONS, LOCK, DELETE, PROPPATCH, COPY, MOVE, UNLOCK, PROPFIND
# Dav: 1, 2
# Ms-Author-Via: DAV
```

Class 2，锁是支持的；不带认证访问会 401，符合预期。

### 挂到各个平台

**macOS Finder**：`⌘K` → `http://127.0.0.1:5244/dav` → 账号密码，挂好后出现在 `/Volumes/dav`。

**iPhone / iPad**：文件 App → 右上角「…」→ 连接服务器 → 输入 `http://<内网IP>:5244/dav` → 选「注册用户」。

**Windows**：资源管理器「映射网络驱动器」。注意 Win11 起 WebDAV 客户端服务（WebClient）默认禁用，得先开服务，或者用 RaiDrive 这类工具。

**命令行挂载（要缓存、要断点续传就用这个）**：

```bash
rclone config   # 选 webdav → url 填 http://127.0.0.1:5244/dav → vendor 选 other
rclone mount ol: ~/mnt/ol --vfs-cache-mode writes
```

**四步自检**（接任何 WebDAV 服务前都建议跑一遍）：

```bash
curl -X PROPFIND -u user:pass -H "Depth: 1" http://127.0.0.1:5244/dav/
curl -X PUT      -u user:pass -d '{"t":1}'   http://127.0.0.1:5244/dav/test.json
curl             -u user:pass                http://127.0.0.1:5244/dav/test.json
curl -X DELETE   -u user:pass                http://127.0.0.1:5244/dav/test.json
```

第一步返回 207 + 一段 multi-status XML 就对了；返回 405 说明服务端没实现 PROPFIND，别往下试了。

### 性能与坑

- **大量小文件很慢**：PROPFIND 是逐层问的，几千个文件的目录能卡几十秒，比 SMB 慢一个数量级
- **锁基本指望不上**：协议支持，但多数客户端不实现，别用它做并发保护
- **反代要放行非标准动词**：`PROPFIND/PROPPATCH/MKCOL/COPY/MOVE` 常被 WAF 默认拦掉
- **别对目录做 `Depth: infinity`**：一次拉整棵树，服务端会很难受

一句话选型：跨公网/要通用 → WebDAV；局域网大文件 → SMB；程序化对象存储 → S3。

## 五、12 条运维实践

按「安全 / 稳定 / 性能 / 维护」四组，都是我这次部署里实际落地的：

**安全**

1. **不要直接把 5244 暴露到公网**。要么反代 + HTTPS + 强密码，要么只开在内网，远程用 Tailscale / WireGuard 进来
2. **按网段做防火墙白名单**。macOS 用 pf anchor，只放行回环和内网段：

   ```
   pass quick on lo0 proto tcp from any to any port 5244
   pass quick inet proto tcp from 10.100.0.0/24 to any port 5244
   block drop quick inet proto tcp from any to any port 5244
   ```

3. **给自动化单独开账号**，不要用 admin 跑脚本；admin 只登录管理台
4. **凭据单独存**，`chmod 600`，别写进 shell 历史或 dotfiles 仓库

**稳定**

5. **唯一状态就是 `data/` 目录**，备份它等于备份一切。定时 `cp -a data data.bak-YYYY-MM-DD`，或停服务后直接打包
6. **别把数据目录放在 iCloud / Dropbox 同步盘里** —— SQLite 在同步盘上会锁冲突、损坏
7. **cookie 类驱动做健康检查**：定时跑一次 `--dry-run` 验证，失败就告警，别等用户发现目录空了
8. **升级三步走**：停服务 → 换二进制 → 校验 md5 → 起服务。小版本可以直接跳，跨大版本先看 release notes 里的破坏性变更

**性能**

9. **`cache_expiration` 设 30-60 秒**，别设 0（每次请求都打真实网盘 API，很容易被风控）
10. **网盘文件走 302 直链**（`/d/` 带签名那条），让流量从网盘 CDN 直达客户端，不经过你的机器中转
11. **大目录别用 infinity 深度**，Web 端翻页 + 按需 PROPFIND

**维护**

12. **日志会涨**，`data/log/` 和 `~/Library/Logs/openlist/` 都要配轮转；排障时先看 stderr，驱动报错基本都在这儿

## 六、踩坑记录

- **改名踩坑**：把数据目录从 `alist` 改成 `openlist` 后，本地目录存储直接报 invalid —— 因为存储的 `root_folder_path` 是绝对路径写死在配置里的，改目录必须同步改存储配置
- **设置接口 body 是数组**：`{"key":...}` 会 400，必须 `[{"key":...}]`
- **OCR 默认端点已失效**：官方默认的 HF Space 端点实测 503，用不上就清空 `ocr_api`，否则日志里一直刷错误
- **夸克免费账号 10 GB**：挂进来能读能写，但当不了仓库；非会员下载限速实测 ~0.93 MB/s，是网盘侧的，OpenList 只能原样转发
- **Finder 挂载会掉**：网络切换、休眠唤醒都可能断，我用一个 LaunchAgent 每 120 秒检查并重挂，日志落在 `webdav-mount.log`
- **cookie 有效期 1-3 个月**：这是所有 cookie 类驱动的通病，必须准备刷新脚本，不然就是定时炸弹

## 七、最后

这套东西的价值不在于「能看网盘」，而在于**所有设备、所有 App 都用同一个标准协议访问同一批文件**：Finder、iPhone 文件 App、rclone、Zotero、Obsidian，甚至 S3 客户端（5245 端口）。

网盘厂商的客户端会变、会员会涨价、接口会关，但 WebDAV 这套 1999 年定稿的协议不会 —— 这是自建网关最大的收益。

---

**参考**

- OpenList 仓库：https://github.com/OpenListTeam/OpenList
- OpenList 文档：https://docs.oplist.org/zh/
- WebDAV 官方站：http://www.webdav.org/
- RFC 4918（中文版）：https://fullstackplayer.github.io/WebDAV-RFC4918-CN/