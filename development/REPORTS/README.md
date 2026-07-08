# Howard AIOS Sprint Report System

版本：v1.0
状态：活跃

---

## 目的

每个 Sprint 完成后，必须生成一份标准 Sprint Report。

报告是项目的唯一可追溯记录。任何 AI Review、架构审查、技术债务分析，只能依据本报告体系。

---

## 规则

### 1. 每个 Sprint 必须生成 Report

Sprint 完成后，在本目录下创建对应的报告文件。

### 2. 文件命名

```
Sprint-<三位数编号>-Report.md
```

编号递增：

```
Sprint-001-Report.md
Sprint-002-Report.md
Sprint-003-Report.md
...
```

编号与 Sprint 序号对应，不跳号。

### 3. 格式要求

所有内容必须严格按照 [TEMPLATE.md](./TEMPLATE.md) 模板填写。

缺少任何章节的报告视为不合格。

### 4. 不可修改

Report 生成后不可修改。如需更正，创建补充文件：

```
Sprint-<编号>-Addendum.md
```

### 5. 权威来源

- AI Review 只能依据 `development/REPORTS/` 中的报告
- 架构决策变更需同步到 `development/DECISIONS.md`
- 版本记录需同步到 `development/CHANGELOG.md`

---

## 编号映射

| Report 编号 | Sprint | 名称 | 状态 |
|-------------|--------|------|------|
| Sprint-001 | Phase 0 | Foundation | 已完成（无报告，补录可选） |
| Sprint-002 | Phase 1 | Architecture | 已完成（无报告，补录可选） |
| Sprint-003 | Phase 2 | Kernel | 已完成（无报告，补录可选） |
| Sprint-004 | Sprint 2.5 | Foundation Fix | 已完成（无报告，补录可选） |
| Sprint-005 | Sprint 3.1 | Information Engine Foundation | 已完成（无报告，补录可选） |
| Sprint-006 | Sprint 0 | Development System | 已完成（无报告，补录可选） |
| Sprint-007 | Sprint A | Architecture Freeze | 已完成（无报告，补录可选） |

> 注：Sprint 001-007 在报告体系建立前完成，未生成标准报告。后续 Sprint 从 Sprint-008 开始，必须生成 Report。

---

## 使用流程

```
Sprint 完成
    ↓
按 TEMPLATE.md 格式创建 Sprint-<编号>-Report.md
    ↓
填写所有章节（不可留空，无内容写 "None"）
    ↓
更新 CHANGELOG.md
    ↓
更新 DECISIONS.md（如有新决策）
    ↓
更新 TODO.md（标记完成项 + 新增发现项）
    ↓
更新本文件编号映射表
    ↓
提交
```

---

## 目录结构

```
development/REPORTS/
├── README.md                # 本文件（管理规范）
├── TEMPLATE.md              # 报告模板
└── Sprint-XXX-Report.md     # 各 Sprint 报告
```
