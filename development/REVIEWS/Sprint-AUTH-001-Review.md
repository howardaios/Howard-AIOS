# Sprint-AUTH-001 Review: Authentication Flow Recovery

## Root Cause

登录成功后所有业务 API 返回 401 Unauthorized 的根本原因：

**前端所有页面使用裸 `fetch('/api/...')` 调用 API，未携带 Authorization header。**

详细链路分析：

1. **Login API** 正常工作：`POST /api/auth/login` 返回 `accessToken` + `refreshToken` + `user`
2. **Auth Context** 正确保存：`localStorage.auth_token` 存储 accessToken
3. **问题出在消费端**：所有业务页面（CEO Office、CEO Inbox、Daily Brief、Intelligence、Pipeline、Knowledge、LLM、Upload）直接使用 `fetch('/api/...')` 发起请求，**没有从 localStorage 读取 token 并附加到 Authorization header**
4. **Fastify Auth Plugin** 在 `NODE_ENV=production`（Docker 环境）下，对缺少 Bearer token 的请求返回 401
5. 前端收到 401 后静默处理为 `No Data` / `Loading` / `0`，导致用户看到空白页面

Dashboard 页面在 Sprint-BETA-002 中单独修复过（内联 authHeaders），但属于 per-page hack，未覆盖其他页面。

## Modified Files

| 文件 | 修改内容 |
|------|----------|
| `apps/web/src/lib/auth-fetch.ts` | **新建** — 全局认证 fetch 封装，从 localStorage 读取 token + organizationId，自动附加 Authorization + x-organization-id header |
| `apps/web/src/app/ceo/page.tsx` | `fetch` → `authFetch` |
| `apps/web/src/app/ceo/inbox/page.tsx` | `fetch` → `authFetch` |
| `apps/web/src/app/ceo/brief/page.tsx` | `fetch` → `authFetch` |
| `apps/web/src/app/ceo/intelligence/page.tsx` | `fetch` → `authFetch` |
| `apps/web/src/app/pipelines/page.tsx` | `fetch` → `authFetch` |
| `apps/web/src/app/llm/page.tsx` | `fetch` → `authFetch` |
| `apps/web/src/app/knowledge/page.tsx` | `fetch` → `authFetch` |
| `apps/web/src/app/upload/page.tsx` | `fetch` → `authFetch` |
| `apps/web/src/app/dashboard/page.tsx` | 移除内联 authHeaders/authFetch，改用全局 `authFetch` |

## Reason

- **统一认证机制**：创建单一 `authFetch` 函数，所有页面共用，从 localStorage 读取 token 和 user，自动附加 `Authorization: Bearer <token>` 和 `x-organization-id` header
- **零侵入**：`authFetch` 是 `fetch` 的 drop-in 替换，API 完全兼容，只需改函数名 + 加 import
- **不修改后端**：Fastify Auth Plugin 逻辑正确，问题在前端，不需要改后端
- **不修改 Docker/Schema/Git**：严格遵守 Sprint 约束

## 认证链路图

```
Login (POST /api/auth/login)
  ↓ 返回 accessToken + refreshToken + user
  ↓
Auth Context (auth-context.tsx)
  ↓ localStorage.setItem('auth_token', accessToken)
  ↓ localStorage.setItem('auth_user', JSON.stringify(user))
  ↓
authFetch (auth-fetch.ts)
  ↓ localStorage.getItem('auth_token') → Bearer token
  ↓ localStorage.getItem('auth_user') → organizationId
  ↓ headers: { Authorization, x-organization-id }
  ↓
Next.js Rewrites (/api/* → localhost:3000/api/*)
  ↓
Fastify Auth Plugin (plugins/auth.ts)
  ↓ extractToken(req) → Bearer token
  ↓ authService.validateToken(token) → JwtPayload
  ↓ req.user = payload
  ↓
Route Handler
  ↓ 正常处理请求
  ↓
Response (200 OK)
```

## Verification

### 构建验证
- `turbo run typecheck` → 1/1 成功（web）
- `turbo run lint` → 1/1 成功，0 warnings/errors

### 浏览器验证（5 页面逐一验证）

| 页面 | 状态 | 401 错误 | Loading 残留 |
|------|------|----------|-------------|
| /dashboard | ✓ 正常 | 无 | 无 |
| /ceo | ✓ 正常（显示 KPI、Company Health、AI Providers） | 无 | 无 |
| /ceo/inbox | ✓ 正常（7 items，5 Tasks + 2 Decisions） | 无 | 无 |
| /ceo/brief | ✓ 正常（Daily Brief 完整渲染） | 无 | 无 |
| /ceo/intelligence | ✓ 正常（Health 94, Risk 0, Growth 19） | 无 | 无 |

### API 验证（curl，带 Bearer token）
- `GET /api/dashboard` → 200
- `GET /api/llm/status` → 200
- `GET /api/pipelines/status` → 200
- `GET /api/knowledge/stats` → 200
- `GET /api/memories/stats` → 200
- `GET /api/ceo/overview` → 200
- `GET /api/ceo/kpi` → 200
- `GET /api/ceo/inbox` → 200
- `GET /api/ceo/brief` → 200
- `GET /api/ceo/intelligence` → 200
- `GET /api/ceo/recommendations` → 200

## Remaining Issues

无。所有 Sprint 目标已达成。

## Next Sprint

建议：
1. Token 过期自动刷新（refresh token 机制）
2. 401 时自动跳转登录页（当前静默处理）
3. 考虑将 authFetch 封装为 React Hook（`useApi`），支持 loading/error 状态管理
4. CEO Overview 页面的 AI Providers 状态来自 `/api/ceo/overview` 的嵌套字段，与 Dashboard 的 `/api/llm/status` 独立，数据可能不一致
