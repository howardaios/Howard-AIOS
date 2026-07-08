# Sprint-FIX-004 — Monorepo Environment Hardening (Prisma + Dev Experience)

**Sprint**: Sprint-FIX-004  
**状态**: ✅ 完成  
**日期**: 2026-07-07  
**目标**: 将 Howard AIOS 开发环境升级到企业级 Monorepo 体验

---

## 1. 为什么以前失败

### 问题链

```
开发者执行 pnpm --filter @howard-aios/database db:push
  → Prisma 启动，读取 schema.prisma
  → schema 声明 url = env("DATABASE_URL")
  → Prisma 在当前 CWD 查找 .env
  → CWD = packages/database/ (非项目根目录)
  → packages/database/.env 不存在
  → 报错: Environment variable not found: DATABASE_URL
```

### 根因

Prisma 的 `.env` 查找行为:
1. 首先查找 **CWD 下的 `.env`** (即 `packages/database/.env`)
2. 然后查找 **schema 目录下的 `.env`** (即 `packages/database/prisma/.env`)
3. **不会** 向上查找 Monorepo 根目录的 `.env`

而项目的 `.env` 在 **Howard-AIOS/** 根目录，不在 `packages/database/` 下。

---

## 2. 为什么 export 能成功

```bash
export DATABASE_URL=postgresql://...
```

当 `DATABASE_URL` 被 export 到 shell 环境中:

```
shell 环境变量包含 DATABASE_URL
  → pnpm 启动子进程
  → 子进程继承 shell 环境
  → Prisma 在 process.env 中找到 DATABASE_URL
  → 连接成功
```

**问题**: export 是临时的，关闭终端即丢失。每个新开发者、每个新终端窗口都需要手动 export。

---

## 3. 为什么 Root .env 没被读取

| 文件位置 | Prisma 是否读取 |
|----------|----------------|
| `packages/database/.env` | ✅ 会读取 |
| `packages/database/prisma/.env` | ✅ 会读取 |
| `Howard-AIOS/.env` (Monorepo 根) | ❌ **不会读取** |

Prisma 没有 Monorepo 感知。它不知道 `.env` 在项目根目录。需要外部工具桥接。

---

## 4. 为什么新的方案彻底解决

### 方案: `dotenv-cli` 桥接

```json
// packages/database/package.json
{
  "scripts": {
    "db:push": "dotenv -e ../../.env -- prisma db push"
  }
}
```

**执行流程**:

```
pnpm prisma:push (根目录)
  → pnpm --filter @howard-aios/database db:push
  → dotenv -e ../../.env -- prisma db push
  → dotenv-cli 加载 Howard-AIOS/.env 到子进程环境
  → prisma db push 在子进程中运行
  → DATABASE_URL 存在于 process.env
  → ✅ 连接成功
```

**优势**:
- **零手动操作**: 无需 export, 无需复制 .env
- **单一数据源**: 只有根目录一个 .env
- **显式透明**: 每个脚本清楚标明数据来源
- **跨版本兼容**: 不依赖 Prisma 7+ 的 prisma.config.ts

---

## 5. Prisma 官方推荐方式

| 方式 | 适用版本 | 适用场景 |
|------|---------|---------|
| `package.json#prisma` | Prisma 5 | ❌ 已废弃 (Prisma 6 警告, Prisma 7 移除) |
| `prisma.config.ts` | Prisma 7+ | 未来方向，但 Prisma 6 尚未完全支持 |
| `dotenv-cli` | 所有版本 | ✅ **当前最佳实践** |
| 手动 export | 所有版本 | 不推荐 (易丢失) |

### Howard AIOS 选择 `dotenv-cli` 的原因

1. Prisma 6.19 尚不完全支持 `prisma.config.ts` (语法解析失败)
2. `dotenv-cli` 在所有 Prisma 版本下稳定工作
3. 显式优于隐式 — 每个脚本清晰声明依赖的 .env 路径
4. 无额外学习成本 — 标准 npm 生态工具

---

## 6. Monorepo 最佳实践

### 环境变量管理

```
✅ 单一 .env (Monorepo 根)
✅ dotenv-cli 桥接到各子包
✅ dev.sh 启动前预检 DATABASE_URL
✅ pnpm doctor 一键诊断环境

❌ 不要复制 .env 到子包
❌ 不要 export DATABASE_URL
❌ 不要在 package.json#prisma 中配置 seed
```

### 脚本统一入口

```
✅ pnpm prisma:generate    (从根目录执行)
✅ pnpm prisma:push        (从根目录执行)
✅ pnpm prisma:seed        (从根目录执行)
✅ pnpm prisma:studio      (从根目录执行)
✅ pnpm doctor             (环境诊断)

❌ 不要 pnpm --filter @howard-aios/database ...
❌ 不要 cd packages/database && prisma ...
```

---

## 7. 所有修改文件

### 新建

| 文件 | 说明 |
|------|------|
| `scripts/doctor.sh` | 8 项环境健康检查 (189 行) |
| `docs/DevelopmentEnvironment.md` | 开发环境架构文档 (164 行, 含 Mermaid) |

### 修改

| 文件 | 修改内容 |
|------|----------|
| `package.json` | 添加 `doctor`, `prisma:generate/push/pull/migrate/seed/studio` 脚本 |
| `packages/database/package.json` | 移除 `prisma.seed` (deprecated), 添加 `dotenv-cli`, 所有 db:* 脚本改用 `dotenv -e ../../.env` |
| `dev.sh` | 添加 DATABASE_URL 预检 (Step 2), 使用 `pnpm prisma:*` 替代 `--filter` |
| `README.md` | 新增 Monorepo Environment 章节 + Prisma 命令速查 |

### 删除

| 文件 | 原因 |
|------|------|
| `packages/database/prisma.config.ts` | Prisma 6 不支持该语法 (解析失败) |

---

## 8. 所有验证结果

### Prisma 命令 (无需 export)

```
$ pnpm prisma:generate
✔ Generated Prisma Client (v6.19.3) in 299ms

$ pnpm prisma:push
The database is already in sync with the Prisma schema.

$ pnpm prisma:seed
✅ Seed completed successfully!
   4 organizations, 14 users, 29 tasks, 20 decisions
```

### pnpm doctor

```
  Howard AIOS Doctor
  ─────────────────────────────────────

  ✔ Docker 29.6.1
  ✔ PostgreSQL — running (Docker)
  ✔ Redis — running (Docker)
  ✔ Qdrant — running (Docker)
  ✔ DATABASE_URL — configured (postgresql://***:***@localhost:5432/howard_aios)
  ✔ Prisma Client — generated (6.19.3)
  ✘ API — not running        ← 预期 (doctor 在 start 前执行)
  ✘ Web — not running        ← 预期 (doctor 在 start 前执行)

  ─────────────────────────────────────
  ✘ 2 issue(s) found (6/8 checks passed)
```

### 无 Deprecated 警告

```
Before:
  warn The configuration property `package.json#prisma` is deprecated
  and will be removed in Prisma 7.

After:
  (无警告)
```

---

## 9. Guardian 结果

```
Build:     ✅ 6/6     (14s)
Typecheck: ✅ 23/23   (27s)
Lint:      ✅ 23/23   (26s)
Test:      ✅ 23/23   (19s)
```

---

## 10. 是否达到 Enterprise Ready

### 验收标准对照

| 标准 | 状态 |
|------|------|
| 新开发者 clone 后无需 export DATABASE_URL | ✅ |
| 所有 Prisma 命令统一从根目录执行 | ✅ |
| 无 package.json#prisma deprecated 警告 | ✅ |
| 提供 pnpm doctor 一键环境诊断 | ✅ |
| dev.sh 自动检查环境并给出明确提示 | ✅ |
| Guardian (Build/Typecheck/Lint/Test) 全部通过 | ✅ |
| 输出完整 Review 文档 | ✅ |

### 开发者体验对比

**Before (Alpha)**:
```bash
git clone ...
cd Howard-AIOS
pnpm install
export DATABASE_URL=postgresql://...        # ← 必须手动
pnpm --filter @howard-aios/database db:push # ← 需要记住 filter
pnpm start                                   # ← 如果没 export, Prisma 才报错
```

**After (Enterprise)**:
```bash
git clone ...
cd Howard-AIOS
pnpm install
pnpm doctor                                  # ← 一键诊断
pnpm start                                   # ← 自动加载 .env, 预检通过
```

### 结论

**✅ 达到 Enterprise Ready**

Howard AIOS 开发环境已达到企业级 Monorepo 标准:
- 零配置 Prisma 命令
- 一键环境诊断 (`pnpm doctor`)
- 启动前自动预检 (`dev.sh` DATABASE_URL check)
- 完整的文档体系 (README + DevelopmentEnvironment.md)
- 面向 Prisma 7 的前瞻设计 (`dotenv-cli` 跨版本兼容)
