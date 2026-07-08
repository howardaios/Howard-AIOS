# Howard AIOS 统一待办事项

最后更新：2026-07-07

---

## P0 — 必须立即完成

> 阻塞性问题，不解决将影响整个项目。

- [ ] Auth 认证集成 — 从 JWT/Session 提取 organizationId，替换当前 header 占位
- [ ] Inbox → Information 桥接 — POST /api/inbox 接入 Information Engine
- [ ] 数据库迁移 — Information 表 + Memory 表 organizationId 迁移
- [ ] Seed 数据 — 初始化组织、用户等基础数据

---

## P1 — 本阶段完成

> 核心功能，影响 MVP 交付。

- [ ] PLAUD 连接器 — 会议录音自动同步
- [ ] 企业微信连接器 — 消息自动同步
- [ ] Information Parser — 从 Information 提取结构化数据（人物、公司、项目等）
- [ ] Memory Engine 基础 — 将 Information 转化为长期记忆
- [ ] Knowledge Graph 基础 — 构建实体关系
- [ ] SourceType 扩展接口 — 为每种 SourceType 设计专属验证规则
- [ ] 批量操作 — POST /api/information/batch
- [ ] 事件通知 — Information 创建后触发领域事件

---

## P2 — 下一阶段规划

> 重要但不紧急，按阶段推进。

- [ ] 微信连接器
- [ ] 飞书连接器
- [ ] Email 连接器（IMAP）
- [ ] Notion 连接器
- [ ] Webhook 通用连接器
- [ ] OCR 服务集成
- [ ] 向量数据库集成（Qdrant）
- [ ] 语义搜索
- [ ] Founder Dashboard 基础（Web）
- [ ] Daily Brief 日报生成

---

## Backlog — 长期规划

> 未来可能实现，当前不承诺。

- [ ] AI Agent 体系（CEO Agent、会议 Agent、知识 Agent）
- [ ] Workflow Engine（n8n 集成）
- [ ] Task Engine — 自动任务生成与分配
- [ ] Approval Engine — 审批自动化
- [ ] Notification Engine — 统一通知
- [ ] 投资 Agent
- [ ] 招聘 Agent
- [ ] 法务 Agent
- [ ] 安全 Agent
- [ ] Mobile 端
- [ ] Business Prediction（经营预测）
- [ ] Auto Strategy（自动策略）
- [ ] Digital Twin（数字孪生）
- [ ] Multi-Agent Collaboration（多 Agent 协同）

---

## 已完成

- [x] Phase 0 — 基础设施搭建
- [x] Phase 1 — 架构设计
- [x] Phase 2 — 内核（Fastify API + Prisma + Docker）
- [x] Sprint 2.5 — Foundation Fix（枚举统一 + Memory 多租户 + 类型同步）
- [x] Sprint 3.1 — Information Engine Foundation（CRUD + 10 种信息源 + 单元测试）
- [x] Sprint 0 — 开发管理体系建立
