---
title: Docker 完全指南：容器原理、macOS 安装选型与 20+ 条最佳实践
published: 2026-09-29T20:00:00+08:00
description: 从「容器是不是轻量虚拟机」这个常见误解讲起：核心概念、底层原理、macOS 三条安装路线（含许可门槛与国内镜像加速）、命令速查，以及镜像构建、安全加固、运行时三组 20+ 条最佳实践与避坑清单。
tags:
  - docker
series: 工具相关
---

起因是一次「本地数据库怎么跑」的讨论：SQLite 一个文件开箱即用，MySQL、PostgreSQL 却要先把服务跑起来——绕不开的问题就是：要不要上 Docker？

顺手把 Docker 从概念到最佳实践完整梳理了一遍：它到底解决了什么问题、容器和虚拟机的本质区别在哪、macOS 上三条安装路线怎么选、以及二十多条能直接落地的实践。适合当作一篇随时查阅的速用指南。

---

## 一、Docker 是什么

Docker 是开源的容器平台：把应用连同它的运行环境一起打包成**镜像**，在任何机器上以**容器**跑出完全一致的结果——终结经典的「在我电脑上明明是好的」。2025 年 Stack Overflow 调查中，71% 的开发者使用 Docker，是当年增长最快的技术。

核心概念一共六个，先建立心智模型：

| 概念 | 是什么 | 类比 |
| :--- | :--- | :--- |
| 镜像 Image | 只读模板，由 Dockerfile 构建，分层存储 | 类 / 安装盘 |
| 容器 Container | 镜像的运行实例，顶部只有一层可写层 | 对象 / 装好的机器 |
| Dockerfile | 构建镜像的配方文件，每条指令生成一层 | 菜谱 |
| 卷 Volume | Docker 托管的数据存储，独立于容器生命周期 | 移动硬盘 |
| 网络 Network | 容器间的虚拟网络，同网络内可用服务名互访 | 局域网 |
| Registry | 镜像仓库，Docker Hub 是最大的公共仓库 | 应用商店 |

### 容器不是轻量虚拟机

这是最需要纠正的误解。两者的对照：

| 对比项 | 容器 | 虚拟机 |
| :--- | :--- | :--- |
| 内核 | 共享宿主机的同一个内核 | 每台 VM 一套完整 OS 内核 |
| 本质 | 一组被隔离的进程 | 模拟出来的一台完整计算机 |
| 启动 | 毫秒 ~ 秒 | 30 秒 ~ 分钟 |
| 体积 | MB 级（alpine 约 5MB） | GB 级 |
| 一台机器能跑 | 几十上百个 | 几个 |
| 隔离强度 | 进程级（软隔离） | 硬件级（硬隔离） |

打个比方：**虚拟机是独栋别墅**，每户有自己的地基、水管、供电（独立内核）；**容器是同栋大楼里的公寓**，共享大楼的地基和总水管（宿主内核），各自上锁、独立门牌。

「每个容器装不同依赖」这个直觉在结果上没错，机制上不同：虚拟机是先开机得到一台空机器，再往里面装；容器根本没有「一台机器」——依赖是镜像里预先打包好的文件系统内容，运行时只是让你的进程「戴着这副文件系统眼镜」跑起来。

三条证据可以自己验证：

- 容器里 `uname -r` 看到的内核版本和宿主机一模一样（VM 里可以完全不同的内核）
- 容器里没有 systemd/init，你的应用进程直接就是 1 号进程
- 宿主机 `ps aux` 能看到容器里的进程——本质就是宿主进程

### 为什么 Mac 上会觉得「容器像虚拟机」

这个直觉在 macOS 上情有可原：Mac 没有 Linux 内核，所以 Docker Desktop / OrbStack 其实是先起**一个**轻量 Linux 虚拟机，所有容器都在那一个 VM 里跑。也就是说，Mac 上的容器确实「住在 VM 里」——但是一整个共享的 VM，不是每个容器一台。这也是 Mac 上容器文件 IO 比 Linux 慢一点的原因（要穿过 VM 边界）。

---

## 二、容器为什么又快又小（底层原理）

秘密在 Linux 内核的三个特性：

| 内核机制 | 作用 |
| :--- | :--- |
| namespaces | 隔离：每个容器有自己的 PID / 网络 / 挂载 / 主机名视图，容器「以为」自己独占一台机 |
| cgroups | 限额：CPU / 内存 / IO 配额，防止一个容器饿死邻居 |
| 分层文件系统 | 镜像分层复用，多个镜像共享底层，所以又快又小 |

执行 `docker run` 时，背后是一条组件链：

```
docker CLI → dockerd（守护进程）→ containerd（生命周期管理）→ runc（真正创建进程）
```

这个拆分是刻意设计的：镜像和运行时遵循 OCI 标准后，Kubernetes 可以抛开 Docker 直接用 containerd——你构建的 Docker 镜像照样跑在 K8s 里，生态不被任何一家锁定。

2025-2026 年值得知道的变化：

- **Engine 29**（2025 年 11 月）：containerd image store 成为默认，原生支持多平台镜像（amd64 + arm64 同一 tag）
- **Compose v5**：带连字符的旧命令 `docker-compose` 已淘汰，统一 `docker compose`
- **Docker Hardened Images**：官方加固、持续修 CVE 的基础镜像，2025 年 12 月起免费

---

## 三、macOS 上怎么装：三条路线

macOS 上没有 Linux 内核，所以要先装一个「容器运行时」。主流选择：

| 工具 | 定位 | 优势 | 代价 |
| :--- | :--- | :--- | :--- |
| Docker Desktop | 官方全平台 | 生态最全、镜像构建基准最快、企业功能完整 | Mac 上偏重、偏耗电；大公司商用需付费授权 |
| OrbStack | Mac 专用替代 | 启动 / 内存 / 体积全面更轻，容器间吞吐 130Gbps 级 | 仅 macOS；商用 \$8/用户/月 |
| Colima | 开源 CLI | 完全免费、可脚本化、端口延迟低 | 无 GUI、冷启动偶有波动 |
| Podman | 无守护进程 | rootless 更安全 | 生态小、使用习惯不同 |

许可要点（容易踩坑）：**Docker Desktop 免费范围 = 个人 + 教育 + 非商业开源 + 小型企业（同时满足小于 250 员工 且 年收入低于 \$10M）**，超出需订阅（Pro 约 \$9-11、Team 约 \$15-16、Business \$24 /用户/月）；Linux 上的 Docker Engine 和 CLI 永远是 Apache 2.0 免费。个人学习和开源项目在三条路线里都完全免费。

```bash
# 路线 A：Docker Desktop（官方，全平台）
brew install --cask docker

# 路线 B：OrbStack（Mac 专用，个人最推荐）
brew install --cask orbstack

# 路线 C：Colima（纯 CLI，免费开源）
brew install colima docker && colima start
```

### 国内必做：配置镜像加速

Docker Hub 直连在国内常超时或被 429 限流，而且不少老牌镜像站已关停。装完第一件事就是配加速：

```json
// Docker Desktop：Settings → Docker Engine 里加；OrbStack/Colima 改 daemon.json
{
  "registry-mirrors": [
    "https://docker.xuanyuan.me",
    "https://docker.m.daocloud.io"
  ]
}
```

可用源变动频繁，动手前先看月度更新的实测清单：`github.com/dongyubin/DockerHub`。

---

## 四、三分钟上手

```bash
# 1. 验证安装（拉取测试镜像并运行）
docker run hello-world

# 2. 跑一个 MySQL（对应「本机开发要个数据库」的场景）
docker run -d --name mysql-dev \
  -e MYSQL_ROOT_PASSWORD=devpass \
  -p 127.0.0.1:3306:3306 \
  -v mysql-data:/var/lib/mysql \
  mysql:8

# 3. 常用观察三连
docker ps                      # 运行中的容器
docker logs -f mysql-dev       # 跟踪日志
docker exec -it mysql-dev bash # 进容器开 shell（注意：alpine 镜像只有 sh）

# 4. 清理：不用了直接删，比装在本机干净
docker rm -f mysql-dev
docker volume rm mysql-data    # 数据卷单独删（要保留数据就别执行）
```

多服务用 Compose 声明式管理，一个文件起停整组：

```yaml
# compose.yaml
services:
  db:
    image: mysql:8
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_PASSWORD}
    ports:
      - "127.0.0.1:3306:3306"
    volumes:
      - db-data:/var/lib/mysql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      retries: 5
volumes:
  db-data:
```

```bash
docker compose up -d      # 起
docker compose logs -f    # 看日志
docker compose down       # 停
```

---

## 五、命令速查

日常 90% 的操作用这张表就够：

| 命令 | 作用 |
| :--- | :--- |
| `docker run -d -p 8080:80 --name web nginx` | 起容器（后台 / 映射端口 / 命名） |
| `docker ps` / `docker ps -a` | 看运行中 / 全部容器 |
| `docker logs -f web` | 跟踪日志 |
| `docker exec -it web sh` | 进容器开 shell |
| `docker inspect web` | 查看容器完整配置（JSON） |
| `docker cp web:/path ./local` | 容器和宿主机之间拷文件 |
| `docker build -t myapp:1.0 .` | 构建镜像 |
| `docker images` / `docker rmi` | 列出 / 删除镜像 |
| `docker stop` / `docker rm` | 停 / 删容器 |
| `docker compose up -d` / `down` | 整组服务起停 |
| `docker system prune` | 清理无用数据（能释放数 GB） |

---

## 六、最佳实践（一）：镜像构建

1. **多阶段构建**——上线前性价比最高的技巧。构建阶段带编译器，产出阶段只留运行所需，镜像能从 1GB 掉到 100MB：

```dockerfile
FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:24-alpine          # 新阶段：不带任何构建工具
WORKDIR /app
COPY --from=build /app/dist ./dist
CMD ["node", "dist/server.js"]
```

2. **层缓存顺序：变化少的放前面**。先拷依赖清单装依赖，再拷代码——改代码时依赖层命中缓存；反过来（先 `COPY .` 再装依赖）等于每次构建全量重来。

3. **基础镜像选对**：alpine（约 5MB，注意 musl 兼容性）> slim（稳）> distroless（更安全，无 shell）。优先官方镜像，生产可用免费的 Hardened Images。小镜像 = 更快 + 攻击面更小。

4. **必写 `.dockerignore`**：把 `node_modules`、`.git`、`.env`、`dist` 排除——不然构建上下文动辄几个 GB。

5. **固定版本，不用 latest**：`node:24.3-alpine` 而不是 `node:latest`，更严格就 pin digest（`镜像@sha256:...`）。latest 不可复现，今天能跑明天可能就挂。

6. **一个容器一个关注点**：别把 sshd、cron、应用塞进同一个容器，需要多个服务就 Compose 编排。

7. **定期重建镜像**：`docker build --pull` 拉最新基础镜像重建。镜像是快照，不会自己更新。

---

## 七、最佳实践（二）：安全加固

1. **容器内别用 root**（最高性价比的一条）。现实数据：2025 年 Sysdig 报告显示 78% 的生产容器仍以 root 运行。正确姿势：

```dockerfile
RUN addgroup -S app && adduser -S app -G app && chown -R app /app
USER app
```

2. **服务器环境用 rootless Docker**：daemon 本身以普通用户运行，容器逃逸不再直通 host root。代价约 2-5% 开销、不能直接绑 80/443 端口。个人 Mac 上 Docker Desktop / OrbStack 已内置边界，主要对 Linux 服务器有意义。

3. **三件套（对多数应用无害）**：

```bash
--cap-drop=ALL                       # 默认能力全丢，需要才加回
--security-opt no-new-privileges     # 禁止提权
--read-only --tmpfs /tmp             # 根文件系统只读，写路径显式声明
```

永远不要 `--privileged`（等于放弃隔离）；不要关 seccomp。

4. **密钥不进环境变量**：`-e API_KEY=***` 会在 `docker inspect`、日志、镜像层里留痕，用 secrets 或挂载文件。

5. **镜像来源可信 + 扫描**：只拉官方 / 验证发布者镜像，CI 里加 Trivy 扫 CVE。第三方镜像 = 你要执行的陌生代码。

---

## 八、最佳实践（三）：运行时、数据与运维

1. **永远设资源限制**——一个失控容器会耗尽宿主内存、连累所有服务：

```bash
docker run -d --memory 512m --memory-swap 512m --cpus 0.5 --pids-limit 200 myapp
```

2. **日志设上限**：`--log-opt max-size=10m --log-opt max-file=3`，不然日志能悄悄写满磁盘。

3. **重启策略显式声明**：`--restart unless-stopped`（崩溃或重启后自动拉起，手动停的不会自己起来）。

4. **CMD 用 exec 形式**：`CMD ["node", "server.js"]` 能收到 SIGTERM 优雅退出；shell 形式会被中间 shell 吞掉信号。

5. **HEALTHCHECK**：声明健康检查后，Compose 里可以 `depends_on: condition: service_healthy`，避免「起来了但没就绪」。

6. **数据永远放卷**，不信容器可写层：`-v db-data:/var/lib/mysql`。删容器 = 删可写层，没挂卷的数据是写在沙滩上。

7. **只暴露必要端口**：数据库别映射到 `0.0.0.0`，本机访问用 `-p 127.0.0.1:3306:3306`。

8. **容器间通信走自定义网络 + 服务名**：用 `mysql://db:3306` 而不是 IP（重启会变）；生产不用 `--network host`。

9. **不可变原则**：不修改运行中的容器。进容器手改配置 = 重启即丢 + 没人知道线上状态。正确循环：改 Dockerfile → 重建镜像 → 重新起容器。

10. **定期清理**：`docker system prune` 清停止的容器、悬空镜像和构建缓存。

---

## 九、最容易踩的坑 TOP 10

| # | 坑 | 后果 | 正确做法 |
| :--- | :--- | :--- | :--- |
| 1 | 用 `latest` 标签 | 不可复现，构建结果随时间漂移 | 固定版本号 / digest |
| 2 | 数据库不挂卷 | 删容器 = 数据全没 | 命名卷存数据 |
| 3 | 密钥写进 `-e` 环境变量 | 泄漏在 inspect / 日志 / 镜像层 | secrets 或文件挂载 |
| 4 | 不设内存限制 | 一个容器拖垮整台机器 | `--memory` + `--cpus` |
| 5 | 进容器手改线上配置 | 重启即丢、状态不可考 | 改 Dockerfile 重建 |
| 6 | 不写 `.dockerignore` | 构建上下文几个 GB、构建慢 | 排除 node_modules / .git / .env |
| 7 | 先 `COPY .` 再装依赖 | 改一行代码就全量重装依赖 | 层序：依赖清单在前 |
| 8 | 容器里跑 root + 可写文件系统 | 逃逸即宿主 root | `USER` + 资源限制 + 只读 |
| 9 | 日志不设上限 | 磁盘被写满 | `--log-opt max-size` |
| 10 | Mac 上硬跑 x86 镜像 | 经模拟层，慢好几倍 | 优先 arm64 镜像 |

---

## 十、小结：场景 → 方案

| 场景 | 推荐做法 |
| :--- | :--- |
| 本机开发要个数据库 | `docker run` 起 MySQL/PG，数据挂卷，用完 `docker rm -f` |
| 多服务本地联调 | 一份 compose.yaml，`docker compose up -d` |
| 部署自己的应用 | 多阶段 Dockerfile → CI 构建扫描 → 服务器 pull 运行 |
| Mac 个人开发容器 | OrbStack（免费）；要完全免费开箱即用选 Colima |
| 公司商业环境 | 注意 Docker Desktop 授权门槛，超标用 Colima / OrbStack Pro / Linux Engine |
| AI 相关工作流 | Docker Model Runner 本地跑模型；MCP server 容器化隔离 |

如果只看五条，记这个优先级：**非 root 运行 > 数据放卷 > 资源限制 > 多阶段构建 > 层缓存顺序**。安全 > 数据不丢 > 稳定 > 镜像质量。

---

Docker 的入门门槛其实不在命令，而在两个心智模型：镜像 / 容器是「模板与实例」的关系，容器是「进程」不是「小虚拟机」。