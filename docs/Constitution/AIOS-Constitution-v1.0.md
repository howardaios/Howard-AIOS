# Howard AIOS Constitution v1.0

> 本文档是 Howard AIOS 项目的最高纲领。
> 所有架构决策、代码实现、产品设计、文档编写，均以本文档为最终依据。
> 任何与本文档冲突的设计或实现，必须修正以符合本文档。

版本：v1.0
状态：Active
批准日期：2026-07-07
批准人：Howard Zhang

---

## 1. Mission

Howard AIOS 是 Founder 的 AI Operating System。

它不是聊天机器人。它不是知识库。它不是办公软件。它不是 SaaS 工具。

Howard AIOS 是创始人的第二大脑（Second Brain）和第二执行系统（Second Execution System）。它的使命是统一管理创始人的企业经营、团队协作、会议、知识、决策、自动化和 AI Agent，最终形成一个能够持续学习、持续思考、持续执行的智能系统。

AIOS 存在的唯一理由：让 Founder 用更少的时间做出更好的决策，同时让系统自动执行那些不需要人类判断的工作。

AIOS 不替代 Founder。AIOS 增强 Founder。最终决策永远由人类完成。

---

## 2. Vision

Howard AIOS 的五年愿景：

**第一年：信息基础设施**

建立完整的信息输入管道。所有来源的信息（PLAUD、企业微信、微信、邮件、飞书、文档、OCR、API、Webhook）统一接入系统，经过标准化处理后持久化存储。Information Engine 成为所有数据的唯一入口。

**第二年：知识引擎**

从海量信息中自动提取结构化知识。构建人物、公司、项目、会议、任务、决策之间的关系图谱。Memory 层和 Knowledge 层协同工作，让系统拥有真正的长期记忆。

**第三年：智能决策**

Reasoning 层上线，AI 能够基于积累的知识提供风险分析、经营建议、战略洞察。AI Agent 开始在特定领域辅助 Founder 决策，但所有重大决策仍由人类确认。

**第四年：自动化执行**

Workflow 层和 Execution 层协同工作，实现端到端的业务自动化。会议结束自动生成待办，待办自动分配给团队成员，执行结果自动汇报给 Founder。

**第五年：数字孪生**

AIOS 成为 Founder 的 Digital Twin。它理解 Founder 的思维方式、决策偏好和管理风格，能够在 Founder 不在时维持系统的正常运转，在 Founder 在场时提供最优建议。

---

## 3. Core Principles

### 3.1 Everything is Information

任何信息都可以成为系统的输入。语音、文字、图片、视频、文档、网页、API 调用、传感器数据，没有任何信息类型被排除在外。系统必须能够接收、存储和处理任何形式的信息。

### 3.2 Information Never Disappears

一旦信息进入系统，它永远不会丢失。Information Engine 是持久化的、多租户的、可追溯的。每条信息都有明确的来源、时间戳和归属。即使原始来源删除了数据，AIOS 中的副本依然存在。

### 3.3 Everything becomes Knowledge

所有输入最终都会转化为结构化知识。知识不是文件，不是文档，不是笔记。知识是人物、公司、项目、会议、任务、决策、风险、财务之间的关系。Knowledge Graph 是 AIOS 的核心资产。

### 3.4 Everything creates Action

每一条信息都应该触发某种行动。一个会议记录可能产生待办事项，一封邮件可能触发审批流程，一个风险信号可能启动预警机制。系统不应该只是存储信息，它应该让信息流动并产生价值。

### 3.5 Human Always Wins

AI 提供分析、建议、提醒、预测和执行能力。但最终决策永远由 Founder 完成。AI 不得在未经人类确认的情况下做出不可逆的决策。在 AI 判断与人类判断冲突时，人类判断优先。

### 3.6 AI Must Be Explainable

AI 的每一个输出都必须可解释。系统必须能够说明：为什么给出这个建议、基于哪些数据、使用了什么推理路径。黑箱 AI 不被允许。如果 AI 无法解释自己的推理过程，该输出必须被标记为低置信度。

### 3.7 Event Driven

系统采用事件驱动架构。每条信息的创建、更新、删除都是事件。事件触发下游处理管道：Parser 解析、Knowledge 提取、Memory 存储、Workflow 触发。事件是系统各层之间通信的唯一方式。

### 3.8 Multi-Tenant First

系统从设计之初就必须支持多租户。每条数据、每个实体、每次操作都必须归属于一个 Organization。不允许存在不属于任何组织的全局数据。多租户不是后期附加的功能，而是架构的基础约束。

---

## 4. Architecture Principles

Howard AIOS 采用八层架构。每一层有明确的职责边界，层与层之间通过事件通信，不允许跨层调用。

### Layer 1 — Information Layer

接收、归一化和存储所有来源的原始信息。Information Engine 是本层的核心服务。本层不做解析、不做推理、不做过滤。所有信息原样保存，由下游层处理。

输入：来自连接器、API、Webhook 的原始信息。
输出：标准化的 Information 记录。
依赖：无上游依赖。

### Layer 2 — Parser Layer

解析结构化与非结构化内容。从 Information 中提取实体（人物、公司、项目、会议、任务、风险）和关系。本层是系统理解信息含义的关键环节。

输入：Information 记录。
输出：结构化实体和关系数据。
依赖：Information Layer。

### Layer 3 — Knowledge Layer

构建知识图谱与实体关系。将 Parser 提取的实体组织成 Knowledge Graph，建立 People、Company、Project、Meeting、Task、Decision 之间的关系网络。

输入：结构化实体和关系。
输出：Knowledge Graph 更新。
依赖：Parser Layer。

### Layer 4 — Memory Layer

组织多租户记忆与上下文。将信息和知识转化为可检索的长期记忆，支持语义搜索和向量检索。Memory 是 AI 推理的上下文来源。

输入：Information 记录和 Knowledge 实体。
输出：Memory 记录和向量嵌入。
依赖：Information Layer、Knowledge Layer。

### Layer 5 — Reasoning Layer

执行逻辑推理与决策生成。基于 Knowledge 和 Memory 提供的上下文，AI 进行风险分析、趋势预测、战略建议。本层是 AI 智能的核心。

输入：Knowledge Graph 和 Memory 上下文。
输出：分析结果、建议、预测。
依赖：Knowledge Layer、Memory Layer。

### Layer 6 — Workflow Layer

编排自动化流程与任务调度。将 Reasoning 的输出转化为可执行的工作流：会议结束生成待办，风险预警触发审批，日报自动汇总。

输入：事件和 Reasoning 输出。
输出：工作流定义和执行计划。
依赖：Reasoning Layer。

### Layer 7 — Execution Layer

调用 API、工具与外部服务。执行 Workflow 定义的具体操作：发送通知、创建日历事件、更新 Notion 页面、调用第三方 API。

输入：Workflow 执行计划。
输出：执行结果和状态反馈。
依赖：Workflow Layer。

### Layer 8 — Dashboard Layer

提供可视化监控与人机交互界面。Founder 通过 Dashboard 查看企业状态、知识图谱、AI 建议、工作流进度。Dashboard 是人类与系统交互的唯一入口。

输入：所有层的状态数据。
输出：可视化界面和交互操作。
依赖：所有下层。

### 架构约束

- 每一层只依赖其直接上层，不允许跨层调用。
- 层与层之间通过事件通信，不允许直接函数调用。
- 每层必须有明确的输入格式和输出格式。
- 每层必须能够独立部署和扩展。
- 新模块必须归属于且仅归属于一个层。

---

## 5. Engineering Principles

### 5.1 Readable

代码的首要目标是可读。命名必须表达意图，函数必须短小且职责单一，复杂逻辑必须有注释。六个月后重新阅读代码时，必须能够立即理解其功能。

### 5.2 Composable

模块必须可组合。每个服务、每个函数、每个类型都应该像积木一样，可以独立使用，也可以与其他模块组合。避免上帝对象和巨型函数。依赖注入优于硬编码依赖。

### 5.3 Scalable

架构必须支持水平和垂直扩展。无状态服务优先，状态通过数据库和缓存管理。每层必须能够独立扩展。数据库查询必须考虑数据增长，避免 O(n) 扫描。

### 5.4 Observable

系统必须可观测。所有服务必须有结构化日志、健康检查端点和性能指标。当系统出现异常时，必须能够在五分钟内定位问题根因。日志使用统一的 Logger，禁止散落的 console.log。

### 5.5 Testable

所有业务逻辑必须有测试覆盖。单元测试覆盖 Service 层，集成测试覆盖 API 层。测试必须可重复执行，不依赖外部服务。Mock 用于隔离外部依赖，Repository 接口用于数据层测试。

---

## 6. AI Principles

### 6.1 AI 的角色

AI 在 AIOS 中扮演三个角色：

**分析者**：分析积累的数据，发现模式、趋势和异常。
**建议者**：基于分析结果，为 Founder 提供决策建议。
**执行者**：在人类确认后，自动执行具体操作。

AI 永远不是决策者。AI 永远不拥有最终决定权。

### 6.2 AI 的边界

- AI 不得在未经人类确认的情况下执行不可逆操作（删除数据、发送外部消息、签署协议）。
- AI 不得修改自身的推理规则，除非通过明确的配置接口。
- AI 不得隐藏其推理过程。所有 AI 输出必须附带推理路径说明。
- AI 不得在多个租户之间共享学习结果，除非明确配置。
- AI 调用 LLM 时必须可插拔，不绑定任何单一 LLM 供应商。

### 6.3 AI 安全

- 所有 AI 操作必须记录审计日志。
- AI 生成的内容必须标记来源（标记为 AI 生成）。
- AI 建议的置信度必须量化并展示给用户。
- AI 出错时必须有降级方案，系统不能因为 AI 失败而停止运转。

---

## 7. Product Principles

### 7.1 Founder First

所有产品设计以 Founder 的需求为中心。Founder 需要的是决策支持，不是信息过载。Dashboard 展示的是洞察和行动项，不是原始数据堆砌。

### 7.2 Zero Configuration Start

系统必须能够在最少配置下开始工作。连接一个信息源，系统就应该开始学习和积累。不需要 Founder 花三天时间配置系统才能使用。

### 7.3 Progressive Complexity

简单的事情简单做，复杂的事情可能做。系统的基础功能必须简单直觉，高级功能可以复杂但必须可选。不允许因为高级功能的学习成本影响基础功能的易用性。

### 7.4 Multi-Company Native

AIOS 从设计之初就支持管理多个公司。Founder 可能同时经营多个业务，系统必须能够跨公司分析、跨公司关联、跨公司汇报。

### 7.5 Privacy by Design

每个组织的数据严格隔离。一个公司的数据绝不能泄露到另一个公司。多租户隔离不仅是功能需求，更是安全底线。

---

## 8. Coding Principles

### 8.1 TypeScript Strict

全项目启用 TypeScript 严格模式。不允许使用 `any` 类型，除非有充分的理由并在代码中标注原因。类型定义必须精确，宁可通过编译时报错也不在运行时出问题。

### 8.2 Prisma 是唯一真相来源

所有数据库相关的类型（实体、枚举、关系）仅在 Prisma Schema 中定义。`@howard-aios/types` 只存放业务级共享类型（ApiResponse、Paginated 等），不允许定义与 Prisma 重复的实体接口。消费者通过 `@howard-aios/database` 获取 Prisma 生成类型。

### 8.3 Repository 模式

所有数据库操作必须通过 Repository 层。Service 层不直接调用 Prisma Client。Repository 定义接口，Prisma 实现具体逻辑。这种分离使得测试可以用 Mock Repository，未来也可以替换存储后端。

### 8.4 Zod 验证

所有外部输入必须经过 Zod 验证。API 请求体、查询参数、环境变量，未经验证的数据不允许进入业务逻辑。验证失败返回标准化的错误响应。

### 8.5 异步优先

所有 I/O 操作必须异步。不允许同步文件读取、同步 HTTP 请求、同步数据库查询。Node.js 的事件循环是单线程的，阻塞操作会影响所有并发请求。

### 8.6 依赖方向

apps 依赖 services，services 依赖 packages。不允许反向依赖。packages 之间：database 可以依赖 types，其他包不允许互相依赖。不允许循环依赖。

### 8.7 命名规范

- 文件和变量：camelCase
- 类型和接口：PascalCase
- 常量：UPPER_SNAKE_CASE
- Prisma 枚举：UPPER_SNAKE_CASE
- 包名：`@howard-aios/<name>`，目录名与包名一致

### 8.8 错误处理

自定义错误类型必须以 Error 结尾（如 `InformationNotFoundError`）。错误必须在合适的层级捕获和处理。不允许静默吞掉错误。所有错误必须有日志记录。

---

## 9. Documentation Principles

### 9.1 文档即代码

文档与代码同等重要。每次架构变更必须同步更新文档。过时的文档比没有文档更危险，因为它会误导开发者。

### 9.2 单一权威来源

每个概念只在一个地方详细记录。其他地方通过链接引用。Architecture 只在 `docs/Architecture.md` 中详细定义，Roadmap 只在 `docs/Roadmap.md` 中维护，架构决策只在 `development/DECISIONS.md` 中记录。

### 9.3 Blueprint 维护

架构 Blueprint 必须反映系统的当前实际状态。如果代码与 Blueprint 不一致，必须修正其中之一。不允许出现 Blueprint 描述八层架构但代码实现偏离的情况。

### 9.4 ADR 维护

所有重大架构决策必须记录为 Architecture Decision Record。每个 ADR 包含：背景、可选方案、决策、理由、后果。ADR 不可修改，如需更正必须创建新的 ADR 并标注替代关系。

### 9.5 Roadmap 维护

Roadmap 是活文档，随项目演进持续更新。已完成的阶段标记状态，未完成的阶段保持更新。Roadmap 的优先级必须与 `development/TODO.md` 保持一致。

### 9.6 文档语言

项目文档统一使用中文。代码注释可以使用英文。API 响应消息使用英文。

---

## 10. Definition of Done

一个 Sprint 被认定为完成，必须满足以下全部条件：

### 代码质量

- `pnpm typecheck` 全部通过，零错误。
- `pnpm test` 全部通过，零失败。
- `pnpm lint` 全部通过，零警告。
- 新增功能有对应的单元测试。
- 无遗留的调试代码（console.log、debugger）。
- 无未解决的 TODO 标注。

### 文档更新

- `development/CHANGELOG.md` 已更新本次变更内容。
- `development/TODO.md` 已标记完成项并新增发现项。
- 如有架构变更，`development/DECISIONS.md` 已新增 ADR。
- 如有架构变更，`docs/Architecture.md` 已同步更新。

### Sprint Report

- 按 `development/REPORTS/TEMPLATE.md` 格式生成 Sprint Report。
- Report 中所有章节已完整填写。
- Report 已存放在 `development/REPORTS/` 目录下。

### 验证

- Prisma Schema 变更已执行 `prisma generate`。
- 所有包依赖已正确安装（`pnpm install` 无错误）。
- 无循环依赖引入。

### 审查

- 代码变更已通过 Code Review。
- 无安全问题（密钥泄露、注入风险）。
- 符合 `development/AI-CTO.md` 中的所有规范。

---

## 11. Long-term Vision

Howard AIOS 的最终目标是成为 Founder Digital Twin。

这意味着 AIOS 将：

**理解 Founder 的思维模式**：通过分析 Founder 过去的决策记录、沟通偏好和管理风格，AIOS 能够预测 Founder 在特定场景下可能做出的选择。

**自主维持业务运转**：在 Founder 不在时，AIOS 能够处理日常事务、分配任务、响应常规请求、维持业务流程的正常运转。

**跨公司协同智能**：当 Founder 管理多个公司时，AIOS 能够在不同公司之间建立知识关联，发现跨公司的协同机会，提供全局视角的战略建议。

**持续进化**：AIOS 不是静态系统。它随着每一次交互、每一次决策、每一条新信息不断学习和进化。今天的 AIOS 比昨天更聪明，明天的 AIOS 比今天更强大。

**成为不可替代的基础设施**：AIOS 不是一个可以随时替换的工具。它是 Founder 经营生涯中积累的所有知识、关系和决策逻辑的载体。它的价值随着使用时间的增长而指数级增长。

这不是一个产品。这是一个与 Founder 共同成长的智能伙伴。

---

> 本 Constitution 由 Howard Zhang 批准生效。
> 修改本 Constitution 需要 Founder 明确批准。
> 所有 Sprint、所有代码、所有架构决策，均以本 Constitution 为最高准则。
