# Sprint-DIAG-001 Report: 认证链路全面诊断

## 目标

定位 Chrome 登录后所有业务 API 返回 401 Unauthorized 的 Root Cause。纯诊断，不修复。

## 完成内容

| 诊断任务 | 状态 |
|----------|------|
| API 有/无 header 测试 | ✓ |
| Next.js Proxy header 转发测试 | ✓ |
| Fastify Auth Plugin 行为分析 | ✓ |
| 401 发生层定位 | ✓ Fastify Auth Plugin（第③层） |
| Chrome vs Qoder Browser 对比 | ✓ 无差异 |
| 遗漏文件定位 | ✓ 5 个文件 10 处裸 fetch |

## 测试结果

### API 直连测试（port 3000）
- 无 header → 401 ✓
- 带 header → 200 ✓

### Next.js Proxy 测试（port 3001）
- 无 header → 401 ✓（Proxy 透传）
- 带 header → 200 ✓（Proxy 透传）

### 浏览器测试（Qoder Browser agent）
- Dashboard → 200 ✓
- CEO Office → 200 ✓
- CEO Inbox → 200 ✓
- Daily Brief → 200 ✓
- Intelligence → 200 ✓
- Meetings → **401** ✗
- Inbox → **401** ✗
- Search → **401** ✗

### localStorage 验证
- auth_token → 存在 ✓
- auth_user → 存在 ✓
- auth_refresh_token → 存在 ✓

## Root Cause

Sprint-AUTH-001 遗漏了 5 个文件（4 页面 + 1 API Client），共 10 处裸 `fetch()` 调用未替换为 `authFetch()`。

## 风险

1. 遗漏的 meetings 页面有 7 处 fetch（含详情页 6 处），修复时需注意完整性
2. `api-client.ts` 是封装层，修复后所有使用 `apiClient.get/post` 的调用都会自动获得认证
3. 未来新增页面如果不使用 `authFetch` 会再次出现此问题
