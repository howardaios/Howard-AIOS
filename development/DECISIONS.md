# Howard AIOS 架构决策记录

记录所有重要架构决策，确保项目演进过程可追溯。

格式：每个决策包含状态、背景、决策、后果。

---

## Decision-001：为什么采用 Monorepo

状态：已采纳
日期：2026-06

### 背景

Howard AIOS 包含多个模块：API、Web、数据库、类型、工具、业务服务、连接器、Agent。需要一种高效的方式管理这些模块之间的依赖关系。

### 可选方案

1. **多仓库（Polyrepo）** — 每个模块独立仓库
2. **Monorepo** — 所有模块在同一仓库
3. **混合模式** — 核心模块 Monorepo，外部连接器独立仓库

### 决策

采用 **Monorepo**（pnpm workspace + Turbo）。

### 理由

- **原子变更**：跨模块修改在同一个 PR 中完成，无需协调多仓库版本
- **类型共享**：TypeScript 类型可以在包之间直接引用，无需发布到 npm
- **统一工具链**：ESLint、Prettier、Vitest 配置统一管理
- **快速迭代**：项目早期阶段需要频繁调整架构，Monorepo 减少摩擦
- **依赖提升**：pnpm workspace 自动处理内部依赖的版本对齐

### 后果

- 需要 Turbo 编排跨包任务（typecheck、test、build）
- 需要严格的包边界规范，避免循环依赖
- 仓库体积会随模块增长而增大

---

## Decision-002：为什么采用 AI First Architecture

状态：已采纳
日期：2026-06

### 背景

Howard AIOS 的核心价值是将所有输入转化为可操作的知识。传统软件架构是"人驱动"的，而 AIOS 需要"AI 驱动"的架构。

### 决策

采用 **AI First Architecture**，核心原则：

1. **万物皆输入**（Everything is Input）— 任何信息都可以成为系统输入
2. **万物皆知识**（Everything becomes Knowledge）— 所有输入最终转化为结构化知识
3. **万物皆连接**（Everything is Connected）— 知识之间形成关系图谱
4. **AI 辅助每个决策** — AI 提供分析、建议、预测
5. **人类最终决策** — Founder 保持最终决策权

### 理由

- 项目的核心价值是 AI 辅助创始人决策
- 八层架构（Input → Connector → Parser → Memory → Knowledge → Intelligence → Workflow → Dashboard）天然适合分层处理信息流
- AI 不是附加功能，而是系统的核心驱动力

### 后果

- 每个模块设计时必须考虑 AI 集成点
- 数据流必须从输入到知识全链路可追踪
- 需要向量数据库（Qdrant）支持语义搜索
- LLM 调用必须可插拔（支持 OpenAI、Claude、Gemini 等）

---

## Decision-003：为什么采用 Information Engine

状态：已采纳
日期：2026-07

### 背景

系统需要一个统一的入口来处理所有来源的信息。在 Sprint 3.1 之前，信息通过 `POST /api/inbox` 接收但没有持久化和标准化管理。

### 决策

建立 **Information Engine** 作为 L1 输入层的核心服务：

- 统一接收所有来源的信息
- 标准化存储格式
- 提供完整的 CRUD 管理
- 为下游 Parser、Memory、Knowledge 层提供结构化数据源

### 设计要点

1. **SourceType 枚举**：10 种信息源（MANUAL、WECHAT、DINGTALK、FEISHU、EMAIL、PLAUD、FILE、OCR、API、WEBHOOK），可扩展
2. **InformationStatus 状态机**：RECEIVED → NORMALIZED → STORED → ARCHIVED
3. **Repository 模式**：接口与实现分离，便于测试和未来替换存储后端
4. **Zod 验证**：输入输出严格验证，运行时安全
5. **多租户**：每条 Information 必须关联 Organization

### 理由

- 避免未来每个连接器各自实现存储逻辑
- 统一的数据格式让 Parser 层可以标准化处理
- 清晰的职责边界：Information Engine 只负责接收和存储，不做 AI 推理

### 后果

- 所有连接器必须通过 Information Engine 写入数据
- Parser 层依赖 Information 的数据格式
- 需要在后续 Sprint 中实现 Inbox → Information 的桥接

---

## Decision-004：Prisma 枚举作为唯一真相来源

状态：已采纳
日期：2026-07

### 背景

Sprint 2.5 发现 Prisma 枚举使用 UPPERCASE（`FOUNDER`、`ADMIN`），而 `packages/types` 使用 lowercase（`'founder'`、`'admin'`），导致运行时不一致。

### 决策

- Prisma Schema 是所有数据库相关类型的**唯一真相来源**
- `packages/types` 不再定义实体接口和枚举
- 消费者通过 `@howard-aios/database` 获取 Prisma 生成类型

### 理由

- 避免两处定义不同步
- Prisma generate 自动更新类型，无需手动同步
- 减少维护成本

### 后果

- `@howard-aios/types` 仅保留业务级共享类型（ApiResponse、Paginated 等）
- 所有需要实体类型的地方必须从 `@howard-aios/database` 导入
