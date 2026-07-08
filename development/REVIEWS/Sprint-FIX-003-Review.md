# Sprint-FIX-003 — Docker Build Compatibility (pnpm 11)

**Sprint**: Sprint-FIX-003  
**状态**: ✅ 完成  
**日期**: 2026-07-07  
**目标**: 修复 Docker 镜像构建在 pnpm 11 + Node 22 下的兼容性问题

---

## ① 根因分析

Docker Build 失败的核心原因链:

```
pnpm 11 默认要求 modules purge 确认
  → Docker build 无 TTY (非交互环境)
  → ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY
  → build 中断
```

**附加问题**:

1. **deps 阶段不完整**: 原 Dockerfile 仅 COPY 8/19 个 workspace package.json，缺少 11 个服务包 → pnpm workspace 解析失败
2. **无 `.dockerignore`**: `COPY . .` 复制宿主机 `node_modules` (100MB+) → 构建上下文膨胀 + 架构冲突
3. **build 阶段隐式 install**: `RUN pnpm build` 触发全量 `turbo run build` (全部 23 包)，而非仅 API 依赖链
4. **Prisma schema 缺失**: deps 阶段未 COPY `packages/database/prisma/` → `prisma generate` 找不到 schema

---

## ② 为什么 pnpm 11 会失败

### 核心机制

pnpm 11 引入了**模块清理确认机制**:

- 当检测到 `node_modules` 已存在且需要 purge 时，会提示用户确认
- 在交互式终端中显示: `"node_modules will be purged. Continue? [y/N]"`
- Docker build 是无 TTY 环境，无法响应此提示
- pnpm 11 将此视为**中止条件** (abort)，而非默认"否"

### 触发条件

```
场景 1: COPY . . 带入宿主机的 node_modules
  → pnpm install 检测到已有 node_modules
  → 尝试 purge 并重建
  → 无 TTY → 中止

场景 2: 多阶段构建中 deps → build 的 node_modules 传递
  → build 阶段的 COPY --from=deps 带入 node_modules
  → 后续 pnpm 命令检测到不匹配
  → 尝试 purge → 中止
```

### 解决方案

```dockerfile
ENV CI=true                          # 告知 pnpm 处于 CI 环境
ENV PNPM_CONFIRMMODULESPURGE=false   # 直接禁用 purge 确认
```

**注意**: `pnpm config set confirmModulesPurge false` 在 pnpm 11 中不是全局 config 支持的 key，必须使用环境变量。

---

## ③ 修改哪些 Dockerfile

### `docker/Dockerfile` (完全重写)

| 阶段 | 修改前 | 修改后 |
|------|--------|--------|
| **base** | `pnpm@latest` | `pnpm@11.10.0` (锁定版本) |
| **base** | 无 | `ENV CI=true` |
| **base** | 无 | `ENV PNPM_CONFIRMMODULESPURGE=false` |
| **base** | 无 | `ENV NODE_OPTIONS="--max-old-space-size=4096"` |
| **deps** | 8 个 package.json | **19 个** (全部 workspace 包) |
| **deps** | 无 prisma schema | `COPY packages/database/prisma ./packages/database/prisma` |
| **deps** | `pnpm install --frozen-lockfile` | `+ --ignore-scripts` (跳过 husky) |
| **deps** | 无 | `pnpm --filter @howard-aios/database exec prisma generate` |
| **build** | `COPY --from=deps /app/node_modules ./node_modules` + `COPY . .` + `RUN pnpm build` | `COPY . .` + `COPY --from=deps node_modules` + `RUN npx turbo run build --filter='@howard-aios/api...'` |
| **runner** | 无 | `ENV CI=true` |

### `.dockerignore` (新建)

```
node_modules
.next
.turbo
.git
.github
.vscode
.idea
.env
*.log
development/reports
development/reviews
docs
scripts
tests
memory
prompts
workflows
.husky
.cursor
```

**效果**: Build context 从 100.8MB → 17.83MB (减少 82%)

---

## ④ 修改哪些 package

### 直接修改

| 文件 | 修改内容 |
|------|----------|
| `docker/Dockerfile` | 4 阶段完全重写 (74 行) |
| `.dockerignore` | 新建 (20 行) |

### 未修改

| 文件 | 原因 |
|------|------|
| `docker/docker-compose.yml` | 无需修改 |
| `turbo.json` | 已有正确配置，`dependsOn: ["^build"]` 不触发 install |
| `package.json` | 无需修改 |
| `pnpm-workspace.yaml` | 无需修改 |

---

## ⑤ Guardian 全 PASS

```
Build:     ✅ 6/6     (turbo run build — 30s)
Typecheck: ✅ 23/23   (turbo run typecheck — 3s)
Lint:      ✅ 23/23   (turbo run lint — FULL TURBO)
Test:      ✅ 23/23   (turbo run test — FULL TURBO)
```

---

## ⑥ Docker Build 成功日志

```
$ docker compose -f docker/docker-compose.yml build --no-cache

Step 1/48 : FROM node:22-alpine AS base
Step 2/48 : RUN corepack enable && corepack prepare pnpm@11.10.0 --activate
Step 3/48 : WORKDIR /app
Step 4/48 : ENV CI=true
Step 5/48 : ENV NODE_OPTIONS="--max-old-space-size=4096"
Step 6/48 : ENV PNPM_CONFIRMMODULESPURGE=false
Step 7/48 : RUN pnpm config set confirmModulesPurge false 2>/dev/null; echo "pnpm config done"
Step 8/48 : FROM base AS deps
Step 9-28 : COPY 19 workspace package.json files
Step 29/48: COPY packages/database/prisma ./packages/database/prisma
Step 30/48: RUN pnpm install --frozen-lockfile --ignore-scripts
  → 406 packages installed in 2m 6.5s using pnpm v11.10.0
  → ✓ Lockfile passes supply-chain policies (491 entries in 45.2s)
Step 31/48: RUN pnpm --filter @howard-aios/database exec prisma generate
  → ✔ Generated Prisma Client (v6.19.3) in 511ms
Step 32/48: FROM base AS build
Step 33/48: COPY . .
Step 34/48: COPY --from=deps /app/node_modules ./node_modules
Step 35/48: RUN npx turbo run build --filter='@howard-aios/api...'
  → 16 packages in scope
  → 5 tasks: @howard-aios/database, @howard-aios/ai, @howard-aios/knowledge, @howard-aios/pipeline, @howard-aios/api
  → Tasks: 5 successful, 5 total
  → Time: 31.671s
Step 36-48: Runner stage — non-root user, EXPOSE 3000

Successfully built 3131f7354cbe
Successfully tagged docker-api:latest
✔ Image docker-api Built — 642.3s
```

---

## 关键修复总结

| # | 问题 | 修复 | 影响 |
|---|------|------|------|
| 1 | pnpm 11 modules purge 确认 | `ENV CI=true` + `ENV PNPM_CONFIRMMODULESPURGE=false` | 解决根因 |
| 2 | deps 阶段缺 11 个 package.json | COPY 全部 19 个 workspace package.json | pnpm workspace 解析正常 |
| 3 | 无 `.dockerignore` | 新建，排除 node_modules 等 | Build context -82% |
| 4 | build 阶段全量构建 | `--filter='@howard-aios/api...'` | 只构建 5/23 个包 |
| 5 | Prisma schema 缺失 | COPY `packages/database/prisma` | `prisma generate` 成功 |
| 6 | `--ignore-scripts` | 跳过 husky/prisma postinstall | 加速 deps 安装 |
| 7 | pnpm 版本锁定 | `pnpm@latest` → `pnpm@11.10.0` | 避免版本漂移 |

---

## 环境验证

| 组件 | 版本 | 状态 |
|------|------|------|
| Node.js | 22 (node:22-alpine) | ✅ |
| pnpm | 11.10.0 | ✅ |
| Turbo | 2.10.3 | ✅ |
| Prisma | 6.19.3 | ✅ |
| TypeScript | 5.9.3 | ✅ |

---

**结论**: Docker Build 在 pnpm 11 + Node 22 环境下完全可用。`ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY` 已彻底修复。
