# Howard AIOS

## Vision

Howard AIOS is a Founder Operating System.

It is designed to become the unified intelligence platform for managing companies, knowledge, meetings, workflows, communication, and AI agents.

## Core Principles

- Everything is Input.
- Everything becomes Knowledge.
- Everything is Connected.
- AI assists every decision.
- Human remains the final decision maker.

## Architecture

Eight layers:

- **L1 Input** — PLAUD, WeChat, Enterprise WeChat, Email, OCR, Voice, API
- **L2 Connector** — Third-party integrations (Notion, GitHub, Google Drive, MCP)
- **L3 Parser** — Entity recognition (Company, Person, Meeting, Task, Risk)
- **L4 Memory** — Long-term unified memory store
- **L5 Knowledge** — Knowledge graph and entity relationships
- **L6 Intelligence** — AI reasoning, risk prediction, strategy analysis
- **L7 Workflow** — Automation engine (meeting → todo → notify → calendar)
- **L8 Dashboard** — Founder unified dashboard

## Tech Stack

| Category        | Technology                    |
| --------------- | ----------------------------- |
| Language        | TypeScript                    |
| Runtime         | Node.js 22                    |
| Package Manager | pnpm (workspace)              |
| Build           | Turbo                         |
| API             | Fastify                       |
| Web             | Next.js 15                    |
| Database        | PostgreSQL + Prisma           |
| Vector DB       | Qdrant                        |
| Test            | Vitest                        |
| Lint / Format   | ESLint + Prettier             |
| Commit          | Commitlint + Husky            |
| Deploy          | Docker                        |

## Monorepo Structure

```
apps/
  api/              — Fastify API service
  web/              — Next.js dashboard
packages/
  config/           — Shared ESLint / TSConfig / Prettier presets
  types/            — Shared TypeScript types and entities
  utils/            — Shared utility functions (logger, id, response)
  database/         — Prisma ORM + PostgreSQL schema
services/
  auth/             — Authentication service
  rbac/             — Role-based access control
  workflow/         — Workflow automation engine
  ai/               — AI reasoning and intelligence
  knowledge/        — Knowledge graph service
agents/             — AI agents (placeholder)
connectors/         — Third-party connectors (placeholder)
memory/             — Memory layer (placeholder)
prompts/            — LLM prompts (placeholder)
workflows/          — Workflow definitions (placeholder)
tests/              — E2E tests (placeholder)
scripts/            — Build & deploy scripts (placeholder)
docker/             — Dockerfile + docker-compose
docs/               — Architecture, Roadmap, Guidelines, PRD
```

## Quick Start

```bash
# Clone and setup
git clone <repo-url> && cd Howard-AIOS
pnpm install

# Check environment health
pnpm doctor

# Start development server (auto-starts Docker + Prisma + Turbo)
pnpm start

# Generate demo data (4 companies, ~30 meetings, 32 inbox, 20 docs, 12 recordings)
pnpm demo

# Stop all services
pnpm stop
```

### Prisma Commands (from root — no `export DATABASE_URL` needed)

```bash
pnpm prisma:generate    # Generate Prisma Client
pnpm prisma:push        # Push schema to database
pnpm prisma:migrate     # Run migrations
pnpm prisma:seed        # Seed demo data
pnpm prisma:studio      # Open Prisma Studio
```

### Demo Account

- Email: `demo@howard.ai`
- Password: `demo1234`

### Endpoints

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3001 |
| API | http://localhost:3000 |
| Swagger Docs | http://localhost:3000/docs |
| Health Check | http://localhost:3000/api/health |

### Port Allocation

| Service | Port |
|---------|------|
| Web (Next.js) | 3001 |
| API (Fastify) | 3000 |
| Prisma Studio | 5555 |
| PostgreSQL | 5432 |
| Redis | 6379 |
| Qdrant | 6333 |

## Monorepo Environment

### Why Root `.env`?

All Prisma commands and services read environment variables from the **Monorepo root `.env`** file. This is achieved via `dotenv-cli` which injects `../../.env` into each Prisma subprocess.

- **Do NOT** copy `.env` into `packages/database/`
- **Do NOT** `export DATABASE_URL` manually
- **Do** run all Prisma commands from the project root using `pnpm prisma:*`

### Environment Flow

```
Howard-AIOS/.env          ← Single source of truth
    ↓ dotenv-cli
packages/database/db:push  ← Reads ../../.env automatically
    ↓ Prisma
PostgreSQL                 ← Connection via DATABASE_URL
```

### Environment Health Check

```bash
pnpm doctor    # Checks Docker, PostgreSQL, Redis, Qdrant, DATABASE_URL, Prisma, API, Web
```

### No Deprecated Warnings

The project removed `package.json#prisma` configuration (deprecated in Prisma 6, removed in Prisma 7). All seed configuration is handled via root `pnpm prisma:seed` script.

## Documentation

| 文档 | 说明 |
|------|------|
| [Constitution](./docs/Constitution/AIOS-Constitution-v1.0.md) | 项目最高纲领（Mission、Vision、Core Principles） |
| [Vision](./docs/Blueprint/00-Vision.md) | 产品愿景蓝图（AIOS 是什么、为谁服务、解决什么问题） |
| [Architecture Blueprint](./docs/Blueprint/01-Architecture.md) | 八层架构详细蓝图（分层设计、依赖规则、数据流） |
| [Domain Model](./docs/Blueprint/02-Domain-Model.md) | DDD 领域模型蓝图（实体、聚合、事件、仓储） |
| [Information Engine](./docs/Blueprint/05-Information-Engine.md) | 信息引擎蓝图（信息管道、生命周期、元数据） |
| [Knowledge Engine](./docs/Blueprint/06-Knowledge-Engine.md) | 知识引擎蓝图（知识图谱、语义层、RAG） |
| [Memory Engine](./docs/Blueprint/07-Memory-Engine.md) | 记忆引擎蓝图（记忆分层、召回、压缩） |
| [Reasoning Engine](./docs/Blueprint/08-Reasoning-Engine.md) | 推理引擎蓝图（意图识别、多步规划、置信度） |
| [Workflow Engine](./docs/Blueprint/09-Workflow-Engine.md) | 工作流引擎蓝图（DAG 执行、事件驱动、监控） |
| [Application Layer](./docs/Blueprint/10-Application-Layer.md) | 应用层蓝图（14 个功能模块、Dashboard、AI 助手） |
| [Interface Layer](./docs/Blueprint/11-Interface-Layer.md) | 接入层蓝图（13 种渠道、Web/Mobile/Desktop/API） |
| [Infrastructure Layer](./docs/Blueprint/12-Infrastructure-Layer.md) | 基础设施蓝图（Monorepo、CI/CD、Docker、监控） |
| [Data Model](./docs/Blueprint/13-Data-Model.md) | 数据模型蓝图（Prisma、存储策略、向量、备份） |
| [API Design](./docs/Blueprint/14-API-Design.md) | API 设计蓝图（REST、WebSocket、SDK、错误码） |
| [Security](./docs/Blueprint/15-Security.md) | 安全架构蓝图（RBAC、加密、AI 安全、审计） |
| [Deployment](./docs/Blueprint/16-Deployment.md) | 部署架构蓝图（Docker、K8s、CI/CD、监控） |
| [Master Blueprint](./docs/Blueprint/17-AIOS-Master-Blueprint.md) | AIOS 总设计文档（全局视图、路线图、2035 愿景） |
| [Architecture](./docs/Architecture.md) | 八层架构概览 |
| [Roadmap](./docs/Roadmap.md) | 项目路线图 |
| [Product](./docs/product.md) | 产品规格 |
| [Development Guidelines](./docs/development-guidelines.md) | 开发指南 |
| [Development System](./development/README.md) | 开发管理体系 |

## Companies

- Beijing Kindergarten
- Changchun Automotive Marketing
- Changchun Security
- Zhengzhou Internet Company

## Status

Current Version: v0.6.0 (Beta)
Development Stage: EPIC-005 Complete — CEO Office, Intelligence, Daily Brief
