# Sprint-AUTH-002 Review: 全面认证修复

## Root Cause

Chrome 中**所有** API 返回 401（包括之前 Sprint-AUTH-001 已修复的 Dashboard/CEO 页面），原因有两个：

### 原因一：Sprint-AUTH-001 遗漏 4 个页面 + 1 个封装层

| 遗漏文件 | 裸 fetch 次数 |
|----------|:---:|
| `meetings/page.tsx` | 1 |
| `meetings/[id]/page.tsx` | 6 |
| `inbox/page.tsx` | 1 |
| `search/page.tsx` | 1 |
| `lib/api-client.ts` | 1 |

### 原因二：Chrome 缓存旧版 JS Bundle

Chrome 的 Service Worker / HTTP Cache 缓存了 Sprint-AUTH-001 之前的旧 JS bundle，导致即使代码已修复，Chrome 仍运行旧版裸 `fetch()` 代码。Qoder Browser 是全新实例，无缓存，所以正常。

## 修复内容

### 1. 遗漏页面修复（10 处裸 fetch → authFetch）

| 文件 | 修改 |
|------|------|
| `meetings/page.tsx` | +import authFetch, 1 处替换 |
| `meetings/[id]/page.tsx` | +import authFetch, 6 处替换 |
| `inbox/page.tsx` | +import authFetch, 1 处替换 |
| `search/page.tsx` | +import authFetch, 1 处替换 |
| `lib/api-client.ts` | +import getAuthHeaders, 注入 auth headers |

### 2. Chrome 缓存问题

- 清除 `.next/cache` 强制 Next.js 重新编译
- 用户需 Chrome 硬刷新（Cmd+Shift+R）或清除站点数据

## 验证结果

### 代码验证
- TypeScript typecheck: **通过**
- ESLint: **通过**
- 编译 chunk 验证: 所有 13 个页面 chunk 包含 `authFetch`/`getAuthHeaders`

### 全面页面审计

**13 个业务页面全部使用 authFetch（0 遗漏）：**

| 页面 | authFetch 调用数 |
|------|:---:|
| dashboard | 5 |
| ceo | 2 |
| ceo/inbox | 1 |
| ceo/brief | 1 |
| ceo/intelligence | 2 |
| meetings | 1 |
| meetings/[id] | 6 |
| inbox | 1 |
| search | 1 |
| upload | 2 |
| knowledge | 2 |
| pipelines | 3 |
| llm | 1 |

**不需要修改的文件：**
- `contexts/auth-context.tsx` — 3 处裸 fetch 用于 `/api/auth/login`、`/api/auth/demo-user`、`/api/auth/logout`（公开路由，不需要 auth header）
- `lib/auth-fetch.ts` — authFetch 内部使用裸 fetch（正确）
- `login/page.tsx` — 登录页，不发送业务 API

## 涉及文件

- `apps/web/src/lib/auth-fetch.ts` — 全局认证 fetch（已存在）
- `apps/web/src/lib/api-client.ts` — API 封装层（+auth headers）
- `apps/web/src/app/meetings/page.tsx` — 修复
- `apps/web/src/app/meetings/[id]/page.tsx` — 修复
- `apps/web/src/app/inbox/page.tsx` — 修复
- `apps/web/src/app/search/page.tsx` — 修复

## 下一步建议

1. 启动 Docker（colima）
2. Chrome 硬刷新（Cmd+Shift+R）或 DevTools → Clear site data
3. 重新登录，验证所有页面 200
