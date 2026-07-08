# Sprint-DIAG-002 Review: Chrome vs Qoder Browser 认证差异诊断

## Root Cause（唯一）

**Sprint-AUTH-001 遗漏了 4 个页面文件 + 1 个 API 封装文件，共 10 处裸 `fetch()` 未替换为 `authFetch()`。**

Chrome 和 Qoder Browser 行为完全一致，不存在浏览器差异。两者在访问已修复页面（Dashboard、CEO Office 等）时均正常 200，在访问未修复页面（meetings、inbox）时均 401。

用户观察到"Chrome 大量 401"的原因是：用户在 Chrome 中访问了 meetings/inbox 等未修复页面，而这些页面的裸 `fetch()` 不携带 Authorization header。

## 验证一：localStorage 对比

| 项目 | Chrome | Qoder Browser |
|------|--------|---------------|
| auth_token 前20位 | `eyJhbGciOiJIUzI1NiIs` | `eyJhbGciOiJIUzI1NiIs` |
| auth_token 长度 | 328 chars | 328 chars |
| organizationId | `10000000-0000-0000-0000-000000000001` | `10000000-0000-0000-0000-000000000001` |
| role | `FOUNDER` | `FOUNDER` |
| refresh_token | 存在 | 存在 |
| localStorage keys | `auth_token, auth_user, auth_refresh_token` | 相同 |

**结论：完全一致，无差异。**

## 验证二：Network Request Headers

### 200 OK 页面（使用 authFetch）

| 页面 | API | Authorization | x-organization-id |
|------|-----|:---:|:---:|
| /dashboard | /api/dashboard | ✓ Bearer | ✓ |
| /dashboard | /api/llm/status | ✓ Bearer | ✓ |
| /dashboard | /api/pipelines/status | ✓ Bearer | ✓ |
| /dashboard | /api/knowledge/stats | ✓ Bearer | ✓ |
| /dashboard | /api/memories/stats | ✓ Bearer | ✓ |
| /ceo | /api/ceo/overview | ✓ Bearer | ✓ |
| /ceo | /api/ceo/kpi | ✓ Bearer | ✓ |
| /ceo/inbox | /api/ceo/inbox | ✓ Bearer | ✓ |
| /upload | /api/documents | ✓ Bearer | ✓ |
| /knowledge | /api/knowledge/graph | ✓ Bearer | ✓ |
| /pipelines | /api/pipelines/status | ✓ Bearer | ✓ |
| /pipelines | /api/pipelines/queue | ✓ Bearer | ✓ |

### 401 页面（裸 fetch）

| 页面 | API | Authorization | x-organization-id |
|------|-----|:---:|:---:|
| /meetings | /api/meetings?page=1&pageSize=20 | ✗ 无 | ✗ 无 |
| /inbox | /api/inbox?page=1&pageSize=20 | ✗ 无 | ✗ 无 |

**结论：Header 在 Browser 层就未附加，不是 Proxy 或 Fastify 丢失。**

## 验证三：authFetch() 调用检查

- `authFetch` 是 ES Module export（`apps/web/src/lib/auth-fetch.ts`），不是 `window` 全局函数
- 已修复的 9 个页面通过 `import { authFetch }` 使用 → 正确附加 header
- 未修复的 4 个页面未 import → 使用裸 `fetch()` → 无 header
- Fetch 拦截器日志确认：每次 API 调用的 header 状态与上述一致

## 验证四：React Context / AuthProvider

- AuthProvider 正常初始化，无错误
- `useAuth()` 在所有页面正常返回 `token` + `user`
- Dashboard 和 CEO 使用同一个 AuthProvider Context
- **AuthProvider 无问题**

## 验证五：401 对应代码行

| 文件 | 行号 | 代码 |
|------|------|------|
| `apps/web/src/app/meetings/page.tsx` | L52 | `fetch('/api/meetings?...')` |
| `apps/web/src/app/meetings/[id]/page.tsx` | L56 | `fetch('/api/meetings/${id}')` |
| `apps/web/src/app/meetings/[id]/page.tsx` | L68 | `fetch('/api/meetings/${id}/process', ...)` |
| `apps/web/src/app/meetings/[id]/page.tsx` | L71 | `fetch('/api/meetings/${id}')` |
| `apps/web/src/app/meetings/[id]/page.tsx` | L80 | `fetch('/api/meetings/${id}/summary', ...)` |
| `apps/web/src/app/meetings/[id]/page.tsx` | L82 | `fetch('/api/meetings/${id}')` |
| `apps/web/src/app/meetings/[id]/page.tsx` | L353 | `fetch('/api/meetings/.../transcribe', ...)` |
| `apps/web/src/app/inbox/page.tsx` | L60 | `fetch('/api/inbox?...')` |
| `apps/web/src/app/search/page.tsx` | L41 | `fetch('/api/search?...')` |
| `apps/web/src/lib/api-client.ts` | L17 | `fetch(url, { ... })` |

**总计：10 处裸 fetch，分布在 5 个文件中。**

## 下一步修复建议

1. 替换 4 个页面文件中的裸 `fetch()` 为 `authFetch()`
2. 修复 `api-client.ts` 的 `request()` 函数，添加 auth headers
3. 全局搜索确认无遗漏
4. 考虑添加 ESLint 规则禁止裸 `fetch('/api/` 调用
