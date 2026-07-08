# Sprint-DIAG-001 Review: 认证链路全面诊断

## Root Cause

Sprint-AUTH-001 创建了全局 `authFetch` 并修复了 9 个页面，但**遗漏了 4 个页面 + 1 个 API Client 封装**，它们仍使用裸 `fetch()`，不携带 Authorization header。

**遗漏文件：**

| 文件 | 裸 fetch 次数 |
|------|--------------|
| `apps/web/src/app/meetings/page.tsx` | 1 |
| `apps/web/src/app/meetings/[id]/page.tsx` | 6 |
| `apps/web/src/app/inbox/page.tsx` | 1 |
| `apps/web/src/app/search/page.tsx` | 1 |
| `apps/web/src/lib/api-client.ts` | 1（封装层） |

总计：**10 处裸 fetch 调用**未修复。

## 认证链路分析（Call Chain）

```
Chrome Browser
  ↓
  页面 JS: fetch('/api/meetings')  ← 无 Authorization header
  ↓
Next.js Dev Server (port 3001)
  ↓ rewrites 代理到 localhost:3000
  ↓ Header 透传（无丢失）
  ↓
Fastify API (port 3000)
  ↓ plugins/auth.ts preHandler hook
  ↓ extractToken(req) → null（无 header）
  ↓ NODE_ENV=production → throw AuthError(401)
  ↓
Response: 401 Unauthorized
  ↓
Next.js Proxy 透传 401
  ↓
Chrome: 显示 No Data / Loading / Empty
```

**401 发生于：③ Fastify Auth Plugin 层。** Header 在 ① Browser 层就没有被附加，② Proxy 层正常透传。

## 各层验证结果

### ① Browser 层
- `authFetch` 从 `localStorage.getItem('auth_token')` 读取 token
- 已修复的 9 个页面：正确读取 + 附加 header → 200
- **未修复的 5 个文件：使用裸 fetch → 无 header → 401**

### ② Next.js Proxy 层
- `curl` 测试：带 header 通过 3001 → 3000 → 200 ✓
- `curl` 测试：无 header 通过 3001 → 3000 → 401 ✓
- **Proxy 正确透传所有 headers，无丢失**

### ③ Fastify Auth Plugin 层
- `plugins/auth.ts` preHandler hook 正确执行
- `extractToken(req)` 检查 `Authorization: Bearer` header
- 无 token → production 模式 → 401
- **逻辑正确，401 是预期行为**

### ④ JWT Verify 层
- `authService.validateToken(token)` → `verifyToken(token)`
- Token 签名 + 过期时间验证正常
- **未到达此层（因为没有 token）**

### ⑤ Route Handler 层
- Route handler 正常注册和执行
- **未到达此层（被 auth hook 拦截）**

## Chrome vs Qoder Browser 差异分析

**结论：两者行为一致，没有浏览器差异。**

- Qoder Browser agent 测试了已修复的 5 个页面（Dashboard + CEO 4页）→ 全部 200 ✓
- Qoder Browser agent 也触发了未修复的页面（meetings, inbox, search）→ 全部 401 ✓
- Chrome 用户在 Dashboard/CEO 页面看到正常，但在 meetings/inbox/search 看到 401
- **如果 Chrome 用户主要访问 meetings 页面，会认为"所有 401"**
- localStorage 中 token + user + refreshToken 均正确存在
- Cookie 不参与认证（纯 Bearer token + localStorage）
- 无 Service Worker、无 Cache 问题

## 涉及文件

**已修复（Sprint-AUTH-001）：**
- `apps/web/src/lib/auth-fetch.ts` — 全局 authFetch
- `apps/web/src/app/ceo/page.tsx` ✓
- `apps/web/src/app/ceo/inbox/page.tsx` ✓
- `apps/web/src/app/ceo/brief/page.tsx` ✓
- `apps/web/src/app/ceo/intelligence/page.tsx` ✓
- `apps/web/src/app/pipelines/page.tsx` ✓
- `apps/web/src/app/llm/page.tsx` ✓
- `apps/web/src/app/knowledge/page.tsx` ✓
- `apps/web/src/app/upload/page.tsx` ✓
- `apps/web/src/app/dashboard/page.tsx` ✓

**未修复（本 Sprint 定位）：**
- `apps/web/src/app/meetings/page.tsx` — 1 处
- `apps/web/src/app/meetings/[id]/page.tsx` — 6 处
- `apps/web/src/app/inbox/page.tsx` — 1 处
- `apps/web/src/app/search/page.tsx` — 1 处
- `apps/web/src/lib/api-client.ts` — 1 处（封装层，无 auth）

## 下一步修复建议

1. 将 4 个遗漏页面的裸 `fetch()` 替换为 `authFetch()`
2. 修复 `api-client.ts`：在 `request()` 函数中添加 auth headers（调用 `getAuthHeaders()` from `auth-fetch.ts`）
3. 全局搜索 `fetch('/api/` 确保无遗漏
4. 考虑添加 CI lint 规则：禁止在非 auth-fetch 文件中使用裸 `fetch('/api/`
