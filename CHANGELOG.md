# Changelog

All notable changes to Howard AIOS are documented in this file.

## [0.6.0] — AI CEO Office (EPIC-005)

### Added

- **CEO Dashboard**: New homepage (`/ceo`) with Today's Focus, Company Health, KPI, Organization Status, AI Status
- **CEO Inbox**: Aggregated inbox (`/ceo/inbox`) — Meetings, Tasks, Decisions, Risks, Inbox items with tabs and priority filters
- **CEO Daily Brief**: Auto-generated brief (`/ceo/brief`) — Morning/Afternoon/Evening with schedule, tasks, risks, decisions, tomorrow plan
- **Executive Intelligence**: AI-powered analysis (`/ceo/intelligence`) — Health/Risk/Growth scores, strategic/operational/organizational analysis
- **AI Recommendations**: Top Actions, Top Decisions, Top Risks, Quick Wins, Overdue items
- **7 CEO API Endpoints**: companies, overview, inbox, brief, intelligence, recommendations, kpi
- **Meeting Integration**: Auto-creates CEO inbox entry when meeting is completed
- **Multi-Company Support**: All CEO APIs support `x-organization-id` header
- **Modern SaaS UX**: Card-based layout, metric cards, progress bars, SVG score rings, responsive grid
- **CEO Tests**: 7 endpoint tests for route registration and data structure validation

### Changed

- **Homepage**: Root redirect changed from `/dashboard` to `/ceo`
- **Navigation**: CEO Office, CEO Inbox, Daily Brief, Intelligence added as first nav items
- **Meeting Completion**: `POST /meetings/:id/complete` now auto-creates CEO inbox entry

## [0.5.0] — Alpha Product Hardening (EPIC-004)

### Added

- **Authentication**: JWT login/logout/refresh with Session management (access token 15m + refresh token 7d)
- **RBAC**: 6-role permission matrix (FOUNDER/ADMIN/MANAGER/MEMBER/VIEWER/GUEST)
- **Login Page**: Dedicated `/login` page with demo user auto-fill
- **AuthContext**: React context with localStorage persistence
- **Knowledge Persistence**: KnowledgeService migrated from in-memory Map to Prisma
- **Memory Persistence**: MemoryService migrated from in-memory Map to Prisma
- **Knowledge Graph Models**: KnowledgeNode + KnowledgeEdge Prisma models
- **Session Model**: JWT session storage with Prisma
- **5 Real LLM Providers**: OpenAI, DeepSeek, Qwen, Claude, Gemini (native fetch, no SDK)
- **Whisper Integration**: Real speech-to-text via OpenAI Whisper API
- **SSE Streaming**: Server-Sent Events endpoint for LLM responses (`/api/llm/stream`)
- **CSS Theme System**: CSS Variables with dark/light mode via `data-theme`
- **Component Library**: 15+ shared components (Button, Card, StatCard, Badge, Input, Skeleton, EmptyState, ErrorState, Loading, PageHeader, Tabs, useToast, StatusDot)
- **AppShell Upgrade**: next/link navigation, active state, responsive sidebar, header with theme toggle + user info
- **Dashboard Enhancements**: `/today`, `/pipeline-status`, `/ai-status` API endpoints
- **Meeting Processing Pipeline**: validate → prepare → complete pipeline
- **Health Check**: PostgreSQL connectivity + AI provider availability + system info
- **dev.sh**: Environment checks (node/pnpm/docker), port checks, .env auto-setup, startup banner
- **Startup Logs**: Server ready banner with port/host/env/routes info
- **Demo Workspace**: 30 meetings, 20 inbox items, 10 documents, 5 recordings

### Changed

- **User Model**: Added `passwordHash`, `lastLoginAt` fields
- **UserRole Enum**: Added `MANAGER`, `GUEST` roles
- **Memory Model**: Added `sourceId`, `importance`, `accessCount`, `status`, `mergedFrom` fields
- **UI Migration**: All 10 pages migrated from inline styles to shared component library
- **Version**: Bumped to 0.5.0 (Alpha)
- **Utils**: Fixed duplicate barrel exports

### Fixed

- Knowledge/Memory services now properly persist data (survives restarts)
- Pipeline execution uses `ctx.input` instead of non-existent `previousResults`
- Health endpoint reports actual database connectivity status

## [0.2.0] — Foundation (EPIC-001 ~ EPIC-003)

### Added

- TypeScript monorepo with pnpm workspace + Turbo
- Fastify 5 API with Swagger documentation
- Next.js 15 App Router frontend
- Prisma 6 ORM with PostgreSQL schema (16 models)
- 14 API route modules
- 10 web pages (Dashboard, Meetings, Inbox, Upload, Search, Pipelines, Knowledge, LLM, etc.)
- Pipeline engine with TransformNode/PassThroughNode
- Knowledge/Memory services (in-memory Map)
- AI service with mock providers
- Speech service placeholder
- Docker Compose (PostgreSQL, Redis, Qdrant)
- Vitest test framework
- ESLint + Prettier + Commitlint + Husky
