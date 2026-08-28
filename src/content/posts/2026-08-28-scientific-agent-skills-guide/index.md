---
title: Scientific Agent Skills 完全指南：把 AI 变成你的科研助手
published: 2026-08-28
draft: false
description: 详细介绍 K-Dense AI 开源的 Scientific Agent Skills 仓库——163 个即用型科学技能，覆盖生物信息学、药物发现、医学影像、地理空间等 18 个领域，让你的 Cursor/Claude Code 秒变 AI Scientist。
tags: []
series: 工具系列
toc: true
coverImage: null
---

# Scientific Agent Skills 完全指南：把 AI 变成你的科研助手

GitHub: [https://github.com/K-Dense-AI/scientific-agent-skills](https://github.com/K-Dense-AI/scientific-agent-skills)

## 一句话介绍

**Scientific Agent Skills** 是 K-Dense AI 开源的 Agent 技能库，包含 **163 个即用型科学技能**，覆盖生物信息学、药物发现、化学信息学、医学影像、地理空间等 18 个领域。安装后，你的 Cursor、Claude Code、Codex、Hermes 等 AI Agent 就能按专业说明书一步步执行科研任务，而不是凭空瞎猜。

全球已有 **175,000+ 科学家**在使用，GitHub **34,500 Star**。

---

## 它是什么

本质上是一套**按 Agent Skills 标准编写的 SKILL.md 文件集合**。每个 Skill 就是一本"AI 使用说明书"——告诉 Agent 某个科学领域该用什么 Python 库、怎么调 API、参数怎么设、常见坑在哪。

跟你简历里写的"封装业务 Skill，跨运行时复用"是同一套方法论，只是它封装的不是 API 封装/环境合入/i18n，而是单细胞 RNA 测序、分子对接、蛋白质结构预测。

---

## 覆盖领域（18 个）

| 领域 | 代表技能 | 能干什么 |
|------|---------|----------|
| 🧬 生物信息学/基因组学 | Scanpy, Biopython, DepMap | 单细胞测序分析、序列比对、变异注释 |
| 🧪 药物发现/化学信息学 | RDKit, DeepChem, DiffDock | 分子性质预测、虚拟筛选、分子对接 |
| 🔬 蛋白质组学 | Proteomics | LC-MS/MS 处理、肽段鉴定、蛋白定量 |
| 🏥 临床研究 | Clinical Trials, PK/PD | 临床试验分析、药代动力学建模 |
| 🧠 医疗 AI | NeuroKit2, EHR | 生理信号分析、电子病历研究 |
| 🖼️ 医学影像 | pydicom, PathML | DICOM 处理、病理切片分析 |
| 🤖 ML/AI | PyTorch Lightning, scikit-learn | 深度学习、强化学习、贝叶斯方法 |
| 🔮 材料科学 | pymatgen | 晶体结构分析、相图计算 |
| 🌌 物理/天文 | Astropy, Qiskit | 天文数据分析、量子计算模拟 |
| ⚙️ 工程仿真 | FluidSim, COBRApy | 离散事件仿真、代谢工程建模 |
| 📊 数据分析 | Dask, EDA | 统计分析、网络分析、出版级图表 |
| 🌍 地理空间 | GeoPandas, Geomaster | 卫星影像处理、GIS 分析 |
| 🧪 实验自动化 | Opentrons, Benchling | 移液方案、实验设备控制 |
| 📚 科学写作 | DOCX, Citation, PPTX | 论文写作、文献综述、海报生成 |
| 🔬 多组学 | Multi-omics | 多模态数据整合、通路分析 |
| 🧬 蛋白质工程 | ESM, Protein Design | 蛋白质语言模型、结构预测 |
| ⚖️ 法规与标准 | ISO, ICH | 分析方法验证、合规文档 |
| 🎓 研究方法 | Experimental Design | 实验设计、假设生成、同行评审 |

---

## 安装

三种方式，选一种即可：

### 方式一：npx（推荐，一行搞定）

```bash
npx skills add K-Dense-AI/scientific-agent-skills
```

自动安装到 `~/.agents/skills/`，Cursor、Claude Code、Codex 直接就能用。

### 方式二：GitHub CLI

```bash
# 安装全部 163 个技能
gh skill install K-Dense-AI/scientific-agent-skills

# 只安装你需要的（推荐，163 个全装太重）
gh skill install K-Dense-AI/scientific-agent-skills scanpy
gh skill install K-Dense-AI/scientific-agent-skills rdkit
gh skill install K-Dense-AI/scientific-agent-skills database-lookup

# 指定目标 Agent
gh skill install K-Dense-AI/scientific-agent-skills --agent cursor
```

### 方式三：Hermes tap

```bash
hermes skills tap add K-Dense-AI/scientific-agent-skills
```

---

## 具体使用场景（7 个实例）

### 场景 1：单细胞 RNA 测序分析

**背景**：你拿到了一个 10x Genomics 的单细胞数据集，想知道有多少种细胞类型、每种类型的 marker gene 是什么。

**对话**：
```
你：帮我分析这个 .h5ad 文件，做 QC、降维、聚类，找出每个 cluster 的 marker gene
```

**AI 做的事**（触发 Scanpy skill）：
1. `scanpy.read_h5ad()` 加载数据
2. 质控过滤：去除线粒体基因 >20% 的细胞、基因数异常的细胞
3. 归一化 + log 变换
4. 高变基因筛选
5. PCA 降维 → UMAP 可视化
6. Leiden 聚类
7. 差异表达分析找 marker gene
8. 输出每个 cluster 的 top marker 表格 + UMAP 图

**Skill 内置了 CLI 脚本**，AI 直接调 `scripts/` 里的脚本而不是手写代码，避免犯错。

---

### 场景 2：药物分子性质计算与虚拟筛选

**背景**：你有一个 SMILES 列表（100 个候选分子），想快速筛选出符合 Lipinski 五规则、LogP 在 1-5 之间的分子。

**对话**：
```
你：用 RDKit 计算这些 SMILES 的分子性质，按 Lipinski 规则过滤，输出符合条件的分子和它们的性质表
```

**AI 做的事**（触发 RDKit skill）：
1. 解析 SMILES 列表
2. 计算每个分子的 MW、LogP、HBD、HBA、TPSA、可旋转键数
3. 按 Lipinski 五规则过滤（MW<500, LogP<5, HBD<5, HBA<10, TPSA<140）
4. 生成 2D 结构图
5. 输出 CSV 表格 + 结构图

---

### 场景 3：查询科学数据库

**背景**：你想知道某个基因（如 TP53）在 COSMIC 癌症突变数据库中记录了多少种突变，以及最常见的突变类型。

**对话**：
```
你：在 COSMIC 数据库里查 TP53 的突变记录，统计突变类型分布，列出最常见的 10 个突变
```

**AI 做的事**（触发 database-lookup skill）：
1. 从 78 个数据库清单中选中 COSMIC
2. 读取 `references/cosmic.md` 获取 API 端点、参数格式
3. 按基因名查询 → 分页获取所有记录
4. 统计突变类型（missense/nonsense/frameshift 等）
5. 按出现频率排序，输出 top 10

**database-lookup skill 覆盖 78 个数据库**：PubChem、ChEMBL、UniProt、ClinicalTrials.gov、USPTO 等。

---

### 场景 4：实验设计

**背景**：你要测试 4 种药物在 3 个剂量下对细胞活性的影响，每组需要 6 个重复，怎么安排实验才能避免批次效应？

**对话**：
```
你：设计一个实验：4 种药物 × 3 个剂量 × 6 个重复，帮我做随机化和区组设计，避免批次效应
```

**AI 做的事**（触发 experimental-design skill）：
1. 分析因子结构：2 因子（药物 + 剂量），交叉设计
2. 计算总样本量：4×3×6=72 个实验单元
3. 生成随机化方案：在批次（区组）内随机分配
4. 输出实验布局表 + 随机化脚本 + 统计功效说明

---

### 场景 5：生成论文图表和文档

**背景**：实验做完了，要写论文，需要生成出版级的图表和 Word 文档。

**对话**：
```
你：根据这个 CSV 数据文件，生成一个带误差线的柱状图（300dpi），然后写一份包含方法、结果和图表的方法学报告 .docx
```

**AI 做的事**（触发多个 skill 协同）：
1. **EDA skill**：加载 CSV → 计算均值/标准差 → 生成 matplotlib 柱状图
2. **DOCX skill**：用 docx-js 生成 Word 文档，包含标题、方法、结果、图表、参考文献
3. **Citation skill**：自动格式化引用

---

### 场景 6：蛋白质结构预测

**背景**：有一个新的蛋白质序列，想知道它的 3D 结构是什么样的。

**对话**：
```
你：用 ESMFold 预测这个氨基酸序列的 3D 结构，然后分析它的活性位点和二级结构分布
```

**AI 做的事**（触发 ESM skill）：
1. 调 ESM API → 传入序列 → 获取 PDB 结构文件
2. 解析 PDB → 计算二级结构（α-螺旋/β-折叠/无规卷曲）
3. 预测活性位点（基于序列保守性和结构特征）
4. 生成结构可视化 + 二级结构分布图

---

### 场景 7：地理空间分析

**背景**：想分析某个地区过去 5 年的植被覆盖率变化趋势。

**对话**：
```
你：分析深圳 2019-2024 年的 NDVI 变化趋势，生成年度变化图和统计报告
```

**AI 做的事**（触发 GeoPandas + Geomaster skill）：
1. 下载 Sentinel-2 卫星影像
2. 计算 NDVI 指数
3. GeoPandas 按行政边界裁剪
4. 逐年统计均值、变化率
5. 生成时序图 + 空间分布图

---

## 每个 Skill 的结构

以 Scanpy 为例，每个 Skill 目录包含：

```
skills/scanpy/
├── SKILL.md        # 核心说明书：用途、安装、工作流、示例代码
├── references/     # 扩展文档：R 互操作、批次校正、轨迹推断
├── scripts/        # 可执行脚本：QC、归一化、降维、聚类、可视化
└── assets/         # 模板和静态资源
```

**SKILL.md 关键字段**：

```yaml
name: scanpy
description: "Standard single-cell RNA-seq analysis pipeline. Use for QC, normalization..."
license: BSD-3-Clause
metadata:
  version: "1.5"
  skill-author: K-Dense Inc.
```

`description` 就是触发条件——Agent 读到"single-cell RNA-seq"、"scRNA-seq"、"UMAP" 这些关键词时会自动加载这个 Skill。

---

## 安全提醒

- 每个 Skill 都经过 Cisco AI Defense Skill Scanner 安全扫描
- 社区贡献的 Skill 标记了作者（K-Dense 内部 vs 社区）
- **不建议一次装全部 163 个**——选你需要的主题装，全装会占用大量上下文

---

## 对你有什么用

1. **学习 Skill 编写规范**：163 个 Skill 都是按照 Agent Skills 标准编写的，研究它们的结构，能提升你自己的 Skill 工程能力
2. **PaddleHelix 相关**：RDKit、DeepChem、DiffDock、ESM 这些技能跟你之前做的生物计算平台直接相关
3. **简历加分**：如果你在简历里写"熟悉 Scientific Agent Skills 生态，能将科研工作流封装为 Agent Skill"，会是一个很好的差异化亮点

> GitHub: [https://github.com/K-Dense-AI/scientific-agent-skills](https://github.com/K-Dense-AI/scientific-agent-skills)
