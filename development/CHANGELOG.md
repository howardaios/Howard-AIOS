# Howard AIOS 版本变更记录

格式：基于 [Keep a Changelog](https://keepachangelog.com/)

---

## Sprint-002 — Inbox Module

日期：2026-07-07

### Added
- `services/inbox/` — Complete Inbox service package
- `services/inbox/src/types.ts` — Domain types + Zod schemas
- `services/inbox/src/repository.ts` — InboxRepository + Prisma impl
- `services/inbox/src/service.ts` — InboxService (7 methods)
- `services/inbox/src/parser.ts` — Parser interface
- `services/inbox/src/webhook.ts` — Webhook interface + registry
- `apps/web/src/app/inbox/` — Inbox dashboard (page/loading/error)
- `apps/api/src/__tests__/inbox.test.ts` — API tests
- `services/inbox/src/__tests__/service.test.ts` — Service tests
- `development/SPRINTS/Sprint-002.md` — Sprint report
- `development/REVIEWS/Sprint-002-Review.md` — Sprint review

### Changed
- `packages/database/prisma/schema.prisma` — +InboxItem model, +InboxPriority enum
- `apps/api/package.json` — +@howard-aios/inbox dep
- `apps/api/src/routes/inbox.ts` — Full REST API (7 endpoints)
- `apps/api/src/index.ts` — Conditional server start

---

## Sprint-001 — AIOS Core Foundation

日期：2026-07-07

### Added
- `packages/types` — Result<T>, errors, constants, enums
- `packages/utils` — env loader, error-handler
- `packages/database` — RepositoryBase, withTransaction, seed data
- `apps/api` — Plugin architecture, Swagger, version route
- `apps/web` — Dashboard layout, ErrorBoundary, Loading, API client
- `.github/workflows/ci.yml` — CI pipeline
- `.lintstagedrc.json` — Lint-staged config
- `development/SPRINTS/Sprint-001.md` — Sprint report
- `development/REVIEWS/Sprint-001-Review.md` — Sprint review

### Changed
- `packages/types/src/index.ts` — Barrel export
- `packages/utils/src/index.ts` — Barrel export
- `packages/database/src/index.ts` — Barrel export
- `packages/database/src/seed.ts` — Real seed data
- `apps/api/src/index.ts` — Plugin architecture + Swagger
- `apps/web/src/app/layout.tsx` — Dark theme
- `.husky/pre-commit` — lint-staged
- `package.json` — lint-staged dependency

---

## Documentation Pack-004 — Final Blueprints

日期：2026-07-07

### 新增

- `docs/Blueprint/13-Data-Model.md` — 数据模型蓝图（Prisma 映射、存储策略、向量、备份）
- `docs/Blueprint/14-API-Design.md` — API 设计蓝图（REST、WebSocket、SDK、错误码）
- `docs/Blueprint/15-Security.md` — 安全架构蓝图（RBAC、加密、AI 安全、审计）
- `docs/Blueprint/16-Deployment.md` — 部署架构蓝图（Docker、K8s、CI/CD、监控）
- `docs/Blueprint/17-AIOS-Master-Blueprint.md` — AIOS 总设计文档（全局视图、路线图、2035 愿景）

### 变更

- `README.md` — Documentation 表格新增 5 个蓝图链接

---

## Documentation Pack-003 — Complete Blueprint

日期：2026-07-07

### 新增

- `docs/Blueprint/08-Reasoning-Engine.md` — 推理引擎蓝图（意图识别、上下文构建、多步规划、置信度、反思机制）
- `docs/Blueprint/09-Workflow-Engine.md` — 工作流引擎蓝图（DAG 执行、事件触发、重试策略、监控体系）
- `docs/Blueprint/10-Application-Layer.md` — 应用层蓝图（14 个功能模块、Dashboard、AI Assistant）
- `docs/Blueprint/11-Interface-Layer.md` — 接入层蓝图（13 种渠道、Web/Desktop/Mobile/API/第三方）
- `docs/Blueprint/12-Infrastructure-Layer.md` — 基础设施蓝图（Monorepo、CI/CD、Docker、监控、备份）

### 变更

- `README.md` — Documentation 表格新增 5 个蓝图链接

---

## Documentation Pack-002 — Engine Blueprints

日期：2026-07-07

### 新增

- `docs/Blueprint/05-Information-Engine.md` — 信息引擎蓝图（信息管道、生命周期、15 种信息源、元数据设计）
- `docs/Blueprint/06-Knowledge-Engine.md` — 知识引擎蓝图（知识图谱、语义层、RAG、实体提取、Hybrid Search）
- `docs/Blueprint/07-Memory-Engine.md` — 记忆引擎蓝图（8 种记忆类型、召回流程、压缩策略、向量存储）

### 变更

- `README.md` — Documentation 表格新增 3 个引擎蓝图链接

---

## v0.1.0 — Foundation

日期：2026-07-07

### 新增

**Phase 0 — 基础设施**

- Git 仓库初始化
- GitHub 远程仓库
- TypeScript Monorepo 架构
- pnpm workspace 配置
- 项目目录结构

**Phase 1 — 架构设计**

- 产品规格文档（PRD）
- 八层架构设计文档
- 开发指南（Development Guidelines）
- 技术栈选型
- ADR 架构决策框架

**Phase 2 — 内核**

- Fastify API 服务（`apps/api`）
- 全局配置包（`packages/config`）
- Logger 工具（`packages/utils`）
- Prisma 数据库层（`packages/database`）
- 共享类型定义（`packages/types`）
- Docker 配置
- ESLint + Prettier + Commitlint + Husky

**Sprint 2.5 — Foundation Fix（P0 架构修复）**

- 统一枚举定义：Prisma 枚举（UPPERCASE）作为唯一真相来源
- 删除 `packages/types/entities.ts` 中所有重复实体类型
- Memory 模型添加 `organizationId` 多租户关系
- `@howard-aios/types` 仅保留业务级共享类型

**Sprint 3.1 — Information Engine Foundation**

- 新增 `services/information/` 信息引擎服务
- 新增 Prisma 模型：`Information`、`SourceType` 枚举、`InformationStatus` 枚举
- 实现 Repository 层 + Service 层 + Zod 验证
- 实现 CRUD API（GET / POST / PATCH / DELETE）
- 支持 10 种信息源类型
- 16 个单元测试全部通过

**Sprint 0 — 开发管理体系**

- 建立 `development/` 开发管理目录
- 建立版本变更记录（CHANGELOG.md）
- 建立统一待办事项（TODO.md）
- 建立架构决策记录（DECISIONS.md）
- 建立 AI 最高开发规范（AI-CTO.md）
- 建立 Sprint 模板（SPRINTS/）
- 建立 Prompt 管理规范（PROMPTS/）
