# EPIC-FIX-001: Environment Port Conflict Fix — Review

## 1. 修改了哪些文件

| File | Change |
|------|--------|
| `apps/web/package.json` | `"dev": "next dev"` → `"dev": "next dev -p 3001"`, `"start"` 同理 |
| `packages/database/package.json` | `"dev"` 和 `"db:studio"` 显式指定 `--port 5555` |
| `package.json` (root) | 新增 `"studio"` script 启动 Prisma Studio |
| `.env.example` | 新增 `PORT=3000` 和 `HOST=0.0.0.0` 显式声明 |
| `dev.sh` | 新增 Prisma Studio 端口信息输出 |
| `README.md` | 新增 Port Allocation 表格 + 版本号更新 |

## 2. 为什么发生端口冲突

**根本原因**: `apps/web/package.json` 的 `"dev": "next dev"` 未指定端口。

- Next.js `next dev` 默认监听 **3000**
- Fastify API (`apps/api`) 也默认监听 **3000**（通过 `loadEnv()` 的 `PORT: Number(process.env.PORT) || 3000`）
- `pnpm turbo dev` 同时启动两者，导致端口冲突
- Next.js 检测到 3000 被占用后尝试 3001，但时序不确定，导致 `dev.sh` 打开 `localhost:3001` 时无服务

## 3. 如何避免以后再次出现

1. **显式指定端口**: 所有服务的 `dev` 和 `start` 命令必须显式指定端口
2. **环境变量文档化**: `.env.example` 中包含 PORT 配置
3. **README 端口表**: Port Allocation 表格作为单一信息源
4. **CI 检查**: `scripts/check.sh` 确保构建通过
5. **代码审查规则**: 任何新增的网络服务必须显式声明端口，不得依赖默认值

## 4. 最终端口分配表

| Service | Port | Config Source |
|---------|------|---------------|
| Web (Next.js) | **3001** | `apps/web/package.json` → `next dev -p 3001` |
| API (Fastify) | **3000** | `packages/utils/src/env.ts` → `PORT || 3000` |
| Prisma Studio | **5555** | `packages/database/package.json` → `prisma studio --port 5555` |
| PostgreSQL | **5432** | `docker/docker-compose.yml` |
| Redis | **6379** | `docker/docker-compose.yml` |
| Qdrant | **6333** | `docker/docker-compose.yml` |

## Guardian 结果

| Check | Result |
|-------|--------|
| Build | 6/6 ✅ |
| Typecheck | 23/23 ✅ |
| Lint | 23/23 ✅ |
| Test | 23/23 ✅ |
