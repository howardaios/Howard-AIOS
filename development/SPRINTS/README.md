# Howard AIOS Sprint 记录与模板

---

## Sprint 模板

每个 Sprint 完成后，在 `development/SPRINTS/` 目录下创建对应的记录文件。

文件命名：`SPRINT-X.Y-<名称>.md`

例如：`SPRINT-3.1-Information-Engine.md`

### 模板内容

```markdown
# Sprint X.Y — <Sprint 名称>

状态：<进行中 | 已完成 | 已取消>
开始日期：YYYY-MM-DD
完成日期：YYYY-MM-DD

---

## 目标

<一段话描述本 Sprint 的核心目标>

---

## 范围

### 包含

- [ ] 任务 1
- [ ] 任务 2
- [ ] 任务 3

### 不包含（明确排除）

- 排除项 1
- 排除项 2

---

## 输入

<本 Sprint 的前置条件或依赖>

- 前置条件 1
- 前置条件 2

---

## 输出

<本 Sprint 的交付成果>

- 成果 1
- 成果 2

---

## 修改文件

| 文件路径 | 操作 | 说明 |
|----------|------|------|
| `path/to/file.ts` | 新增/修改/删除 | 简要说明 |

---

## 新增文件

| 文件路径 | 说明 |
|----------|------|
| `path/to/new-file.ts` | 简要说明 |

---

## 删除文件

| 文件路径 | 说明 |
|----------|------|
| `path/to/deleted-file.ts` | 简要说明 |

---

## 设计决策

<本 Sprint 中做出的重要设计决策，如有重大决策需同步到 DECISIONS.md>

- 决策 1
- 决策 2

---

## 测试结果

```
pnpm typecheck: X/Y packages ✅
pnpm test:      X/Y packages ✅
新增测试数: N 个
```

---

## 兼容性影响

<本 Sprint 引入的 Breaking Changes 或需要关注的兼容性问题>

- 影响 1
- 影响 2

---

## 风险

| 风险 | 等级 | 缓解措施 |
|------|------|----------|
| 风险描述 | 高/中/低 | 措施描述 |

---

## 技术债务

<本 Sprint 发现或遗留的技术债务>

- 债务 1
- 债务 2

---

## 下一步建议

<建议的后续 Sprint 方向>

1. 建议 1
2. 建议 2
```

---

## 已完成的 Sprint 记录

| Sprint | 名称 | 状态 | 文件 |
|--------|------|------|------|
| Phase 0 | 基础设施 | 已完成 | — |
| Phase 1 | 架构设计 | 已完成 | — |
| Phase 2 | 内核 | 已完成 | — |
| 2.5 | Foundation Fix | 已完成 | — |
| 3.1 | Information Engine | 已完成 | — |

> 注：Phase 0-2 和 Sprint 2.5/3.1 在建立管理体系之前已完成，未生成 Sprint 文档。后续 Sprint 必须按模板创建记录。
