---
title: Ponytail + Caveman：AI Agent 效率双刃剑——少写代码，少说废话
published: 2026-09-09
draft: false
description: 详细介绍 Ponytail 和 Caveman 两个 AI Agent 效率优化工具的搭配使用最佳实践，包括分工边界、强度搭配、实际工作流示例、等级切换技巧和常见坑。
tags: []
series: 工具相关
toc: true
coverImage: null
---

# Ponytail + Caveman：AI Agent 效率双刃剑——少写代码，少说废话

两个 GitHub 10 万 Star 级别的 AI Agent 效率工具，一个管代码，一个管输出。搭配使用能把总 token 成本砍到原来的约 30%。

- [**Ponytail**](https://github.com/DietrichGebert/ponytail)（133k Stars）：让 Agent 少写代码——YAGNI 原则，用最简实现达到同样效果
- [**Caveman**](https://github.com/JuliusBrussee/caveman)（104k Stars）：让 Agent 少说废话——极简语法，砍掉 65% 输出 token

核心一句话：**Ponytail 管代码，Caveman 管输出。各司其职，互不越界。**

Ponytail 的 SKILL.md 里也明确写了：*"Ponytail governs what you build, not how you talk (pair with Caveman for terse prose)."*

***

## 一、分工边界（最核心）

```
Ponytail → 管 Agent 写出来的代码：少写、不写、用最简单的实现
Caveman  → 管 Agent 说出来的话：去废话、碎片化、只留关键信息
```

**千万别让 Ponytail 去压缩输出，也别让 Caveman 去压缩代码。** 各自有自己的强度等级和规则体系，混用会互相干扰。

Ponytail 内置了一个决策阶梯，Agent 每次写代码前按顺序检查：

```
1. 这东西真的需要吗？           → YAGNI，不需要就不写
2. 代码库里已经有了？           → 复用，别重写
3. 标准库能干吗？              → 用标准库
4. 原生平台特性覆盖了吗？       → <input type="date"> 代替日期选择器组件
5. 已安装的依赖能解决吗？       → 用已有依赖
6. 能一行搞定吗？              → 一行
7. 实在不行：最少代码
```

**注意：** 阶梯在理解问题之后才执行。Agent 必须先读懂代码、追踪完整流程，然后才爬梯子。不能跳过理解直接偷懒——Ponytail 管这叫"危险的懒"。

***

## 二、强度搭配推荐

两者都有 lite / full / ultra 三级，搭配有讲究：

| 场景 | Ponytail | Caveman | 说明 |
|------|:--:|:--:|------|
| **日常开发（推荐）** | full | full | 代码精简 + 回复精简，最佳平衡 |
| **快速原型/探索** | ultra | ultra | 代码只写核心，回复只给结论 |
| **新人上手项目** | lite | lite | 代码正常写，只标注可简化处；回复去废话但保留完整句子 |
| **Code Review** | full | off | Ponytail 发现过度设计，Caveman 关掉确保审查意见表达清楚 |
| **写文档/注释** | off | off | 文档需要完整表达 |
| **提交 commit/PR** | off | off | Git 提交信息是给人看的，需要正常英文 |

***

## 三、实际工作流示例

### 场景一：日常开发新功能

**开启：** Ponytail full + Caveman full

**你：** 帮我加一个用户搜索功能，支持按用户名和邮箱搜索

**Agent 回复（Caveman full 压缩后）：**

```
后端：GET /api/users?q={term}。已有 findUser 工具函数，复用。前端：<input> + 防抖 300ms。
跳过：独立 SearchService、Elasticsearch 集成。
ponytail: 当前数据量 < 10k，SQL LIKE 够用。超 100k 时加索引。
```

**产出代码：**
- 后端 5 行：在已有路由里加一个 query 参数处理，调用已有 `findUser`
- 前端 8 行：一个 `<input>` + `useEffect` 防抖
- 没有新文件、没有新依赖、没有新抽象层

### 场景二：快速原型验证

**开启：** Ponytail ultra + Caveman ultra

**你：** 帮我做个页面，展示用户列表，能按角色筛选

**Agent 回复（Caveman ultra）：**

```
单文件。fetch('/api/users')。select 标签筛选 role。10 行。
跳过：分页、排序、loading、错误边界、响应式。原型验证后加。
ponytail: 全部跳过，等需求确认。
```

**产出代码：** 一个 15 行的 HTML 文件，能跑就行。

### 场景三：修 Bug

**开启：** Ponytail full + Caveman full

**你：** 登录后偶尔 401，帮我看看

**Agent 回复（Caveman full）：**

```
token 刷新逻辑竞态。旧 token 还在请求中，新 token 已覆盖。
修复：刷新时锁住并发请求，token 更新后重放队列。3 处改动，同一个 auth.ts。
ponytail: 全局互斥锁，并发刷新 < 10/s 时够用。超量加 per-user 锁。
```

**关键：** Ponytail 的 Bug 修复规则是「修根因，不修症状」。Agent 会追踪所有调用方，在一个地方修复，而不是到处打补丁。

### 场景四：Code Review

**开启：** Ponytail full + Caveman off

**你：** review 一下这个 PR

**Agent 回复（Caveman 关，完整表达）：**

```
这个 PR 引入了 3 个新文件和 1 个新依赖（moment.js）。
Ponytail 分析：
- date-utils.ts (47 行): 其中 3 个函数只被一处调用，可内联。formatDate 可以用原生 Intl.DateTimeFormat 替代，不需要 moment.js。
- UserService.ts (82 行): 接口只有一个实现，当前不需要抽象层。
- config.ts (23 行): 所有值都是硬编码默认值，没有覆盖场景，YAGNI。

建议：砍掉 moment.js 依赖，内联单次调用的工具函数，删除 UserService 接口，config 文件等真有第二个值再说。预估减少 120 行。
```

**关键：** Code Review 场景必须关 Caveman，因为审查意见需要完整、清晰的表达，否则容易产生歧义。

***

## 四、等级切换最佳实践

两个工具的等级切换命令：

```bash
# Ponytail
/ponytail lite      # 只标注可简化的地方
/ponytail full      # 默认，严格执行精简
/ponytail ultra     # YAGNI 极端主义
/ponytail off       # 关闭（或说 "stop ponytail" / "normal mode"）

# Caveman
/caveman lite       # 去废话，保留完整句子
/caveman full       # 默认，碎片化语句
/caveman ultra      # 极限压缩
/caveman off        # 关闭（或说 "stop caveman" / "normal mode"）
```

**切换原则：**

- 中途觉得 Agent 写得太简陋 → `/ponytail lite`
- 中途觉得 Agent 话太少看不懂 → `/caveman lite`
- 发现 Agent 过度设计 → `/ponytail ultra`
- 需要完整解释一段逻辑 → `/caveman off`（问完再切回来）
- 提交代码前 → 两个都 `off`，写正常的 commit message

---

## 五、Caveman 各等级效果对比

同样的问题「为什么 React 组件重复渲染？」，不同等级的输出差异：

| 等级 | 输出 |
|------|------|
| **lite** | "Your component re-renders because you create a new object reference each render. Wrap it in `useMemo`." |
| **full** | "New object ref each render. Inline object prop = new ref = re-render. Wrap in `useMemo`." |
| **ultra** | "Inline obj prop, new ref, re-render. `useMemo`." |

Caveman 还有文言文模式：

| 等级 | 输出 |
|------|------|
| **wenyan-lite** | "組件頻重繪，以每繪新生對象參照故。以 useMemo 包之。" |
| **wenyan-full** | "每繪新生對象參照，故重繪；以 useMemo 包之則免。" |
| **wenyan-ultra** | "新參照則重繪。useMemo 包之。" |

文言文模式对中文用户尤其友好——汉字本身就是高信息密度的载体，搭配 Caveman 压缩效果极佳。

---

## 六、Ponytail 的 `ponytail:` 注释——技术债标记

Ponytail 要求 Agent 对刻意简化标注 `ponytail:` 注释，写明天花板和升级路径：

```python
# ponytail: 全局锁，并发 < 10/s 够用。超量换 per-user 锁
_lock = threading.Lock()

# ponytail: O(n²) 扫描，n < 100 时无感。超 1000 换 hash map
for item in items:
    if item.id == target_id:
        return item
```

定期 `grep ponytail:` 扫一遍这些标记，就知道哪些简化需要升级了。

---

## 七、什么时候关掉它们

| 场景 | 操作 |
|------|------|
| 写 commit message | 两个都 off |
| 写文档/README/注释 | 两个都 off |
| 写 issue/PR 描述 | 两个都 off |
| Code Review | Caveman off，Ponytail 保持 |
| 安全相关代码 | Ponytail 自动不偷懒（硬规则） |
| 不可逆操作（删库/清数据） | Caveman 自动切到完整表达模式 |
| 用户明确要求完整实现 | 两个都 off |

Ponytail 有硬性安全规则：**输入验证、错误处理、安全措施、无障碍 —— 绝不简化。** 即使 ultra 模式下也不会跳过这些。

---

## 八、常见坑

**坑 1：Caveman ultra + Ponytail ultra 时，Agent 回复太简，看不懂做了什么**

→ 切 `/caveman lite`，保留完整句子但去废话。

**坑 2：Agent 偷懒跳过了必要的错误处理**

→ Ponytail 有硬规则：输入验证、错误处理、安全措施、无障碍绝不简化。如果 Agent 违反了，直接说 "don't skip error handling"，Ponytail 会修正。

**坑 3：Agent 写了 `ponytail:` 注释，但不知道什么时候该升级**

→ `ponytail:` 注释自带天花板说明和升级路径。定期 `grep ponytail:` 扫一遍这些技术债。

**坑 4：在同一个 session 里频繁切换等级，Agent 行为混乱**

→ 两个工具的等级切换都依赖 hook 注入规则到上下文。频繁切换可能导致规则不一致。建议一个 session 开始时就定好等级，中途最多调一次。

**坑 5：Caveman 的缩写并不会省 token**

→ Caveman 的规则明确禁止自创缩写（cfg/impl/req/res/fn/auth）。Tokenizer 对缩写和完整单词的 token 数是一样的，缩写不仅不省 token，还增加理解成本。同理，因果箭头（→）也不省 token。只有砍掉 article/filler/hedging 才真正省。

---

## 九、安装与验证

```bash
# 装 Caveman（自动检测所有已安装的 Agent）
npx skills add JuliusBrussee/caveman

# 装 Ponytail（Claude Code）
claude plugins install DietrichGebert/ponytail

# 验证
/caveman          # Agent 回复变短就是生效了
/ponytail         # Agent 开始质疑需求就是生效了
```

装完后日常使用不需要手动激活——两个都是 persistent 模式，**自动每轮生效**，直到你说 "stop"。

---

## 十、总结

```
Ponytail full + Caveman full = 日常最优解
  → 代码少写 54%，输出少说 65%，总成本约原来的 30%

核心原则：
  Ponytail 管代码 ← 决策阶梯（YAGNI → stdlib → 原生 → 一行）
  Caveman 管输出 ← 去废话（砍 article/filler/hedging，保留技术准确性）

场景速查：
  日常开发    → full + full
  快速原型    → ultra + ultra
  Code Review → full + off
  提交代码    → off + off

安装：
  npx skills add JuliusBrussee/caveman
  claude plugins install DietrichGebert/ponytail
```
