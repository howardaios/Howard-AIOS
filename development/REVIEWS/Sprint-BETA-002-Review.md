# Sprint-BETA-002 Review: Dashboard Recovery

## Root Cause

Dashboard 页面所有数据无法显示，根本原因是 **前端 fetch 请求未携带 Authorization header**。

在生产模式下，API 服务要求所有非公开路由携带有效 JWT token。Dashboard 页面的 `fetch()` 调用没有传递 `Authorization: Bearer <token>`，导致所有 API 返回 401 Unauthorized，前端将其静默处理为 0 值和空数据。

次要问题：
- AI Provider Status API 返回扁平结构 `{openai: false, ...}`，前端期望嵌套结构 `{providers: {...}}`，导致数据无法正确渲染
- `next-env.d.ts` 未被 ESLint/Prettier 忽略，导致 Husky pre-commit hook 失败

## Modified Files

| 文件 | 修改内容 |
|------|----------|
| `apps/web/src/app/dashboard/page.tsx` | 添加 auth headers（Authorization + x-organization-id）；AI 数据结构归一化；公司/用户名显示；Loading→Empty/Idle/Unavailable 状态处理 |
| `eslint.config.mjs` | 添加 `**/next-env.d.ts` 到 ignores 列表 |
| `.prettierignore` | 添加 `next-env.d.ts` |
| `.gitignore` | 添加 `*.tsbuildinfo` |

## Reason

1. **auth headers**：`useAuth()` context 提供了 token 和 user.organizationId，但 Dashboard 页面未使用它们构造请求头
2. **AI 数据归一化**：`/api/llm/status` 返回 `{openai: false, deepseek: false, ...}` 而非 `{providers: {...}}`，前端需要兼容两种格式
3. **状态文案**：无数据时显示 Empty/Idle/Unavailable，而非永远 Loading
4. **ESLint**：`next-env.d.ts` 是 Next.js 自动生成的文件，不应被 lint 检查

## Verification

### API 验证（curl，带 auth token）
- `GET /api/dashboard` → 200 OK，返回 stats + recent
- `GET /api/llm/status` → 200 OK，返回 5 个 provider 状态
- `GET /api/pipelines/status` → 200 OK，返回 queue + registered pipelines
- `GET /api/knowledge/stats` → 200 OK，返回 9 种知识类型计数
- `GET /api/memories/stats` → 200 OK，返回 total/active/merged/archived

### 浏览器验证
- Dashboard 页面正常加载，无 Loading 残留
- 统计卡片显示真实数字（当前为 0，因数据库无业务数据）
- AI Provider 显示 Unavailable（未配置 API Key，预期行为）
- Pipeline 显示 Queue 状态和已注册 pipeline 列表
- Knowledge/Memory 显示 Empty（无数据，预期）
- 最近会议/收件/上传显示"暂无"（无数据，预期）
- 用户信息显示 "Admin · FOUNDER"
- 无 Console 错误

### 构建验证
- `turbo run typecheck` → 6/6 成功
- `turbo run lint` → 6/6 成功，0 warnings/errors

## Remaining Issues

无。所有 Sprint 目标已达成。

## Next Sprint

建议：
1. 向数据库插入种子数据（会议、收件箱、文档），验证 Dashboard 在有数据时的展示效果
2. 配置至少一个 AI Provider API Key，验证 Available 状态展示
3. Dashboard 添加"最近上传"对应的 Upload API 数据源
4. 考虑为 Dashboard 统计数据添加缓存/刷新机制
