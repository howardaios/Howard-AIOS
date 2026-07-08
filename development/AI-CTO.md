# Howard AIOS — AI 最高开发规范

> 本文档是整个项目的最高开发规范。
> 所有 AI 修改代码前必须遵守。
> 任何与本文件冲突的规则，以本文件为准。

版本：v1.0
最后更新：2026-07-07

---

## 一、开发原则

### 1.1 核心原则

1. **最小变更原则** — 只修改当前任务明确要求的内容
2. **唯一真相来源原则** — 每种数据只有一个权威定义
3. **可验证原则** — 每次修改必须通过 typecheck + test + lint
4. **不假设原则** — 不确定的信息必须先查证，不可假设

### 1.2 代码原则

1. TypeScript 严格模式，不允许 `any`（除非有充分理由并标注）
2. 异步优先（Async First）
3. 所有日志必须使用 `@howard-aios/utils` 的 `createLogger`
4. 所有验证必须使用 Zod
5. 所有数据库操作必须通过 Repository 层
6. 新增功能必须有对应单元测试

### 1.3 架构原则

1. **分层架构** — 遵循八层架构（L1-L8），不允许跨层调用
2. **依赖方向** — apps → services → packages，不允许反向依赖
3. **Repository 模式** — 数据访问层接口与实现分离
4. **Prisma 是唯一真相来源** — 所有实体类型从 `@howard-aios/database` 获取
5. **`@howard-aios/types` 仅存放业务级共享类型** — ApiResponse、Paginated、ListQueryParams 等

---

## 二、禁止事项

### 绝对禁止

- ❌ 禁止在未经确认的情况下修改 `schema.prisma`
- ❌ 禁止修改 API 的已有接口签名
- ❌ 禁止删除或重命名已有的公开导出
- ❌ 禁止引入循环依赖
- ❌ 禁止硬编码配置（所有配置走环境变量）
- ❌ 禁止在代码中包含密钥、Token 等敏感信息
- ❌ 禁止在 `packages/types` 中定义与 Prisma 重复的实体类型
- ❌ 禁止在 Service 层直接使用 Prisma Client（必须通过 Repository）
- ❌ 禁止跳过 typecheck 或 test

### 当前阶段禁止（Sprint 3.x）

- ❌ 禁止实现 AI 推理或 LLM 调用
- ❌ 禁止实现 Workflow 引擎
- ❌ 禁止修改项目根目录结构
- ❌ 禁止创建占位符代码（写了就必须实现）

---

## 三、架构规范

### 3.1 包依赖方向

```
apps/api ──→ services/* ──→ packages/database
         ──→ packages/types    packages/utils
         ──→ packages/utils
```

- `apps/` 可以依赖 `services/` 和 `packages/`
- `services/` 可以依赖 `packages/`
- `packages/` 之间：`database` 可以依赖 `types`，其他包不可互相依赖
- 不允许反向依赖

### 3.2 新增包规范

新增 service 包必须包含：

```
services/<name>/
├── package.json          # 包含 @howard-aios/types + @howard-aios/database 依赖
├── tsconfig.json         # extends 根配置
├── vitest.config.ts      # 测试配置
└── src/
    ├── index.ts          # 公共导出
    ├── types.ts          # 类型定义（Zod schemas + DTO）
    ├── repository.ts     # 数据访问层（接口 + 实现）
    ├── service.ts        # 业务逻辑层
    └── __tests__/        # 单元测试
```

### 3.3 API 路由规范

- 所有路由注册在 `apps/api/src/routes/` 下
- 路由文件导出 `FastifyPluginAsync`
- 在 `apps/api/src/index.ts` 中注册，统一前缀 `/api`
- 使用 `@howard-aios/utils` 的 `success()` / `error()` 返回标准响应

---

## 四、命名规范

### 4.1 文件命名

| 类型 | 规范 | 示例 |
|------|------|------|
| 模块文件 | camelCase | `service.ts`、`repository.ts` |
| 测试文件 | `<name>.test.ts` | `service.test.ts` |
| 配置文件 | camelCase | `vitest.config.ts` |
| 路由文件 | camelCase | `information.ts` |
| 类型文件 | camelCase | `types.ts` |

### 4.2 代码命名

| 类型 | 规范 | 示例 |
|------|------|------|
| 变量/函数 | camelCase | `findById`、`sourceType` |
| 常量 | UPPER_SNAKE | `SOURCE_TYPE_VALUES` |
| 类型/接口 | PascalCase | `InformationService`、`CreateInput` |
| 枚举（Prisma） | UPPER_SNAKE | `FOUNDER`、`RECEIVED` |
| 错误类 | PascalCase + Error | `InformationNotFoundError` |
| Zod Schema | PascalCase + Schema | `CreateInformationSchema` |

### 4.3 包命名

- 格式：`@howard-aios/<name>`
- 目录名与包名一致
- 内部依赖使用 `workspace:*`

---

## 五、Review 规范

### 每次提交前必须检查

1. `pnpm typecheck` — 所有包通过
2. `pnpm test` — 所有包通过
3. `pnpm lint` — 所有包通过
4. 无遗留 TODO（除非标注了跟进 Sprint）
5. 无调试代码（`console.log`、`debugger` 等）
6. 新增错误类型已在 `index.ts` 导出

### Review 标准

- **可读性**：代码意图清晰，不需要额外注释解释
- **可测试性**：新功能有测试，修改功能有回归测试
- **安全性**：输入已验证，无注入风险
- **性能**：无 N+1 查询，无不必要的同步操作

---

## 六、Sprint 规范

### Sprint 生命周期

```
规划 → 开发 → 审查 → 收尾
```

### Sprint 文档要求

每个 Sprint 必须在 `development/SPRINTS/` 中创建记录，格式参照模板。

### Sprint 约束

- 每个 Sprint 只做明确定义的范围
- 禁止范围蔓延（Scope Creep）
- 发现新问题记录到 `TODO.md`，不在当前 Sprint 中处理
- 破坏性变更需要单独评估

---

## 七、Git Commit 规范

### 格式（Commitlint + Husky 强制执行）

```
<type>(<scope>): <中文描述>

[可选正文]
```

### Type 列表

| Type | 用途 |
|------|------|
| `feat` | 新功能 |
| `fix` | 修复 Bug |
| `docs` | 文档变更 |
| `style` | 代码格式（不影响逻辑） |
| `refactor` | 重构（不改变功能） |
| `perf` | 性能优化 |
| `test` | 测试相关 |
| `build` | 构建系统变更 |
| `ci` | CI/CD 变更 |
| `chore` | 其他杂项 |
| `revert` | 回滚 |

### Scope 列表

```
api | web | database | types | utils | config | information | auth | rbac | knowledge | workflow | ai | development
```

### 示例

```
feat(information): 添加信息引擎 CRUD API
fix(database): 修复 Memory 模型缺少 organizationId
docs(development): 建立开发管理体系
refactor(types): 移除重复实体类型定义
test(information): 添加 16 个单元测试
```
