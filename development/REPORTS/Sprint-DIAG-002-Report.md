# Sprint-DIAG-002 Report: Chrome vs Qoder Browser 认证差异诊断

## 目标

解释为什么 Chrome 和 Qoder Browser 登录同一账号后页面行为不同。纯诊断，不修复。

## 完成内容

| 诊断项 | 状态 |
|--------|------|
| localStorage 对比 | ✓ 完全一致 |
| Network Headers 抓包 | ✓ 12 个 200 + 2 个 401 |
| authFetch() 调用检查 | ✓ 9 页面使用 / 4 页面未使用 |
| React Context 检查 | ✓ AuthProvider 正常 |
| 401 代码行定位 | ✓ 10 处裸 fetch |

## 测试结果

### localStorage（两者一致）
- token 前20位: `eyJhbGciOiJIUzI1NiIs`
- organizationId: `10000000-0000-0000-0000-000000000001`
- role: `FOUNDER`
- refresh_token: 存在

### 浏览器页面结果
- /dashboard → 200 ✓（authFetch）
- /ceo → 200 ✓（authFetch）
- /ceo/inbox → 200 ✓（authFetch）
- /upload → 200 ✓（authFetch）
- /knowledge → 200 ✓（authFetch）
- /pipelines → 200 ✓（authFetch）
- /meetings → **401** ✗（裸 fetch）
- /inbox → **401** ✗（裸 fetch）

## Root Cause

**不存在浏览器差异。** Sprint-AUTH-001 遗漏了 5 个文件（10 处裸 fetch）：meetings/page.tsx、meetings/[id]/page.tsx、inbox/page.tsx、search/page.tsx、api-client.ts。

## 风险

1. meetings 详情页有 6 处裸 fetch，修复时需注意完整覆盖
2. api-client.ts 是封装层，修复一处即覆盖所有 apiClient 调用者
3. 未来新页面可能再次遗漏
