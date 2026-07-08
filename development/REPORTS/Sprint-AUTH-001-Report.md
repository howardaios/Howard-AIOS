# Sprint-AUTH-001 Report: Authentication Flow Recovery

## 目标

修复登录后所有业务 API 返回 401 Unauthorized 的问题，打通完整认证链路。

## 完成内容

| 项目 | 状态 |
|------|------|
| Root Cause 定位 | ✓ 前端裸 fetch 未携带 Authorization header |
| 全局 authFetch 创建 | ✓ `apps/web/src/lib/auth-fetch.ts` |
| 9 个页面修复 | ✓ 全部替换为 authFetch |
| Dashboard 重构 | ✓ 移除内联 auth，改用全局 authFetch |
| Typecheck | ✓ 通过 |
| Lint | ✓ 通过 |
| 浏览器验证 | ✓ 5 页面全部正常 |
| 401 错误 | ✓ 0 个 |
| Git Commit | ✓ `Sprint-AUTH-001 Authentication Flow Recovery` |
| Git Push | ✓ origin/git-test |

## 测试结果

### 构建
- typecheck: 1/1 ✓
- lint: 1/1 ✓（0 warnings/errors）

### 浏览器验证（5 页面）
- /dashboard → 正常 ✓
- /ceo → 正常（KPI、Company Health、AI Providers） ✓
- /ceo/inbox → 正常（7 items） ✓
- /ceo/brief → 正常（Daily Brief 完整） ✓
- /ceo/intelligence → 正常（Health 94, Risk 0, Growth 19） ✓

### API 验证
11 个 API 端点全部返回 200 ✓

## 风险

1. Token 过期后无自动刷新机制，用户需手动重新登录
2. 401 响应当前被页面静默处理为空数据，不会自动跳转登录页
3. `authFetch` 直接读 localStorage，SSR 场景下 `typeof window` 检查返回空 headers（当前所有页面均为 client-side，暂无影响）
