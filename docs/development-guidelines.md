# Howard AIOS Development Guidelines

Version: V2.0

---

# Mission

Build a world-class Founder Operating System.

---

# Tech Stack

| Category           | Technology                        |
| ------------------ | --------------------------------- |
| Language           | TypeScript                        |
| Runtime            | Node.js 22                        |
| Package Manager    | pnpm (workspace)                  |
| Build Orchestrator | Turbo                             |
| API Framework      | Fastify                           |
| Web Framework      | Next.js 15                        |
| Database           | PostgreSQL                        |
| ORM                | Prisma                            |
| Vector Database    | Qdrant                            |
| Workflow           | n8n                               |
| LLM                | OpenAI, Claude, Gemini            |
| Test               | Vitest                            |
| Lint               | ESLint (flat config)              |
| Format             | Prettier                          |
| Commit             | Commitlint + Husky                |
| Deployment         | Docker, GitHub Actions            |

---

# Architecture Rules

Use Domain Driven Design.

Use Event Driven Architecture.

Use Clean Architecture.

Keep modules independent.

Avoid business logic inside connectors.

Never duplicate knowledge.

Everything should become structured memory.

---

# Monorepo Rules

All workspace packages live under `apps/`, `packages/`, or `services/`.

Use `workspace:*` protocol for internal dependencies.

Use `turbo run <task>` for cross-package commands.

Each package must have its own `tsconfig.json` extending the root.

---

# Git Rules

Branch

main

Commit Format (enforced by Commitlint + Husky)

feat:

fix:

docs:

style:

refactor:

perf:

test:

build:

ci:

chore:

revert:

---

# Coding Rules

TypeScript strict mode.

ESLint + Prettier enforced.

Async First.

Logging Required.

Unit Test Required (Vitest).

No hard-coded configuration.

---

# AI Rules

AI never changes database directly.

AI proposes.

Workflow executes.

Founder confirms.

---

# Design Principles

Simple

Modular

Observable

Scalable

Maintainable

AI Native

Security First
