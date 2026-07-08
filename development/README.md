# Howard AIOS 开发管理体系

版本：v1.0
状态：活跃
负责人：Howard Zhang

---

## 目录

| 文件 | 职责 |
|------|------|
| [README.md](./README.md) | 开发体系总览（本文件） |
| [CHANGELOG.md](./CHANGELOG.md) | 版本变更记录 |
| [TODO.md](./TODO.md) | 统一待办事项（P0/P1/P2/Backlog） |
| [DECISIONS.md](./DECISIONS.md) | 架构决策记录（ADR） |
| [AI-CTO.md](./AI-CTO.md) | AI 最高开发规范 |
| [SPRINTS/](./SPRINTS/) | Sprint 记录与模板 |
| [PROMPTS/](./PROMPTS/) | Prompt 版本管理 |
| [REPORTS/](./REPORTS/) | Sprint Report 体系 |

---

## 项目结构

```
Howard-AIOS/
├── apps/                        # 应用层
│   ├── api/                     # Fastify API 服务
│   └── web/                     # Next.js 前端
├── packages/                    # 共享基础包
│   ├── config/                  # 全局配置
│   ├── database/                # Prisma 数据库层
│   ├── types/                   # 共享类型定义
│   └── utils/                   # 工具函数
├── services/                    # 业务服务
│   ├── ai/                      # AI 服务
│   ├── auth/                    # 认证服务
│   ├── information/             # 信息引擎
│   ├── knowledge/               # 知识服务
│   ├── rbac/                    # 权限服务
│   └── workflow/                # 工作流服务
├── connectors/                  # 外部连接器（待建设）
├── agents/                      # AI Agent（待建设）
├── workflows/                   # 工作流定义（待建设）
├── prompts/                     # AI Prompt 模板
├── scripts/                     # 脚本工具
├── tests/                       # 集成测试
├── docker/                      # Docker 配置
├── docs/                        # 产品与技术文档
└── development/                 # 开发管理体系（本目录）
```

---

## Sprint 流程

### 1. 规划阶段

- 从 `TODO.md` 中选取当前 Sprint 目标
- 确定范围和优先级（P0 > P1 > P2）
- 评估风险
- 创建 Sprint 文档（参照 `SPRINTS/README.md` 模板）

### 2. 开发阶段

- 严格遵守 `AI-CTO.md` 开发规范
- 每个 Sprint 只做明确定义的范围
- 不做范围蔓延（Scope Creep）
- 每次修改必须通过 typecheck + test

### 3. 审查阶段

- 运行 `pnpm typecheck` — 全部通过
- 运行 `pnpm test` — 全部通过
- 运行 `pnpm lint` — 全部通过
- 检查 `DECISIONS.md` 是否需要新增决策

### 4. 收尾阶段

- 更新 `CHANGELOG.md`
- 更新 `TODO.md`（标记完成项，新增发现项）
- 创建 Sprint 总结文档
- 规划下一步 Sprint

---

## Review 流程

### 代码审查清单

- [ ] TypeScript 严格模式无错误
- [ ] 所有测试通过
- [ ] ESLint 无警告
- [ ] 无硬编码配置
- [ ] 无敏感信息泄露
- [ ] 新增功能有对应测试
- [ ] 符合 `AI-CTO.md` 规范
- [ ] 无跨层调用（如 API 直接调用 Prisma）
- [ ] 依赖关系合理（无循环依赖）

### 审查原则

- 每个 PR 只做一件事
- 变更必须可验证
- 架构变更需要记录到 `DECISIONS.md`
- 破坏性变更需要明确标注

---

## Git 流程

### 分支策略

| 分支 | 用途 |
|------|------|
| `main` | 生产分支，永远可部署 |
| `feat/<sprint>-<feature>` | Sprint 功能分支 |
| `fix/<description>` | 紧急修复 |

### Commit 规范（Commitlint + Husky 强制执行）

```
<type>(<scope>): <subject>

type:  feat | fix | docs | style | refactor | perf | test | build | ci | chore | revert
scope: api | web | database | types | utils | information | auth | rbac | ...
```

示例：

```
feat(information): 添加信息引擎 CRUD API
fix(database): 修复 Memory 模型缺少 organizationId
docs(development): 建立开发管理体系
```

---

## 文档职责

| 文档 | 负责人 | 更新频率 |
|------|--------|----------|
| `CHANGELOG.md` | 每次发版 | 每个 Sprint 结束 |
| `TODO.md` | 项目负责人 | 持续更新 |
| `DECISIONS.md` | 架构师 | 有新决策时 |
| `AI-CTO.md` | 项目负责人 | 规范变更时 |
| `SPRINTS/` | Sprint 负责人 | 每个 Sprint |
| `PROMPTS/` | AI 开发者 | 有新 Prompt 时 |

---

## 技术栈速查

| 类别 | 技术 |
|------|------|
| 语言 | TypeScript |
| 运行时 | Node.js 22+ |
| 包管理 | pnpm (workspace) |
| 构建编排 | Turbo |
| API 框架 | Fastify |
| Web 框架 | Next.js 15 |
| 数据库 | PostgreSQL |
| ORM | Prisma |
| 向量数据库 | Qdrant |
| 测试 | Vitest |
| 代码规范 | ESLint + Prettier |
| 提交规范 | Commitlint + Husky |
| 部署 | Docker |
