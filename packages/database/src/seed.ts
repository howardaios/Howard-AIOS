// packages/database/src/seed.ts
// Database seed script — creates 4 demo companies with users, tasks, and decisions

import { prisma } from './client';

// ── Pre-computed bcrypt hash for 'demo1234' (10 rounds) ────────────────────
const DEMO_PASSWORD = '$2b$10$NKrfA2eXAO19wuVgr8rY/e2Uckut7dmz0plyWpuNHB3WCc3OlVef.';

// ── Organization IDs ──────────────────────────────────────────────────────
const ORG_IDS = {
  hatton: '10000000-0000-0000-0000-000000000001',
  auto: '20000000-0000-0000-0000-000000000001',
  security: '30000000-0000-0000-0000-000000000001',
  tech: '40000000-0000-0000-0000-000000000001',
} as const;

// ── Organization definitions ──────────────────────────────────────────────
const ORGS = [
  { id: ORG_IDS.hatton, name: '北京哈顿幼儿园', shortName: '哈顿幼儿园', industry: 'Education', description: '北京市朝阳区高端私立幼儿园，提供国际化双语教育' },
  { id: ORG_IDS.auto, name: '长春汽车营销', shortName: '汽车营销', industry: 'Automotive', description: '长春市领先的汽车营销与品牌策划公司' },
  { id: ORG_IDS.security, name: '长春安保', shortName: '长春安保', industry: 'Security', description: '专业安保服务提供商，覆盖企业和住宅安保' },
  { id: ORG_IDS.tech, name: '郑州互联网公司', shortName: '郑州互联网', industry: 'Technology', description: '郑州新兴互联网科技公司，专注SaaS产品开发' },
] as const;

// ── User definitions per org ──────────────────────────────────────────────
interface SeedUser {
  id: string;
  email: string;
  name: string;
  role: 'FOUNDER' | 'ADMIN' | 'MANAGER' | 'MEMBER';
}

const USERS: Record<string, SeedUser[]> = {
  [ORG_IDS.hatton]: [
    { id: 'a1000000-0000-0000-0000-000000000001', email: 'liu@hatton.edu', name: '刘芳', role: 'FOUNDER' },
    { id: 'a1000000-0000-0000-0000-000000000002', email: 'wang@hatton.edu', name: '王丽', role: 'ADMIN' },
    { id: 'a1000000-0000-0000-0000-000000000003', email: 'chen@hatton.edu', name: '陈静', role: 'MANAGER' },
    { id: 'a1000000-0000-0000-0000-000000000004', email: 'zhang@hatton.edu', name: '张敏', role: 'MEMBER' },
  ],
  [ORG_IDS.auto]: [
    { id: 'b1000000-0000-0000-0000-000000000001', email: 'sun@auto.cc', name: '孙强', role: 'FOUNDER' },
    { id: 'b1000000-0000-0000-0000-000000000002', email: 'li@auto.cc', name: '李军', role: 'ADMIN' },
    { id: 'b1000000-0000-0000-0000-000000000003', email: 'zhou@auto.cc', name: '周涛', role: 'MANAGER' },
  ],
  [ORG_IDS.security]: [
    { id: 'c1000000-0000-0000-0000-000000000001', email: 'zhao@anbao.cc', name: '赵刚', role: 'FOUNDER' },
    { id: 'c1000000-0000-0000-0000-000000000002', email: 'ma@anbao.cc', name: '马亮', role: 'ADMIN' },
    { id: 'c1000000-0000-0000-0000-000000000003', email: 'yang@anbao.cc', name: '杨帆', role: 'MANAGER' },
  ],
  [ORG_IDS.tech]: [
    { id: 'd1000000-0000-0000-0000-000000000001', email: 'hu@tech.cc', name: '胡磊', role: 'FOUNDER' },
    { id: 'd1000000-0000-0000-0000-000000000002', email: 'wu@tech.cc', name: '吴婷', role: 'ADMIN' },
    { id: 'd1000000-0000-0000-0000-000000000003', email: 'xu@tech.cc', name: '徐峰', role: 'MANAGER' },
    { id: 'd1000000-0000-0000-0000-000000000004', email: 'lin@tech.cc', name: '林雨', role: 'MEMBER' },
  ],
};

// ── Task definitions per org ──────────────────────────────────────────────
interface SeedTask {
  title: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  assigneeIdx: number;
  dueDaysFromNow: number;
}

const TASKS: Record<string, SeedTask[]> = {
  [ORG_IDS.hatton]: [
    { title: '秋季招生方案策划', status: 'IN_PROGRESS', priority: 'HIGH', assigneeIdx: 1, dueDaysFromNow: 7 },
    { title: '双语课程大纲更新', status: 'TODO', priority: 'CRITICAL', assigneeIdx: 2, dueDaysFromNow: 14 },
    { title: '消防安全检查整改', status: 'TODO', priority: 'HIGH', assigneeIdx: 0, dueDaysFromNow: 3 },
    { title: '家长满意度调查', status: 'DONE', priority: 'MEDIUM', assigneeIdx: 3, dueDaysFromNow: -2 },
    { title: '教师培训计划制定', status: 'IN_PROGRESS', priority: 'MEDIUM', assigneeIdx: 1, dueDaysFromNow: 21 },
    { title: '食堂卫生标准升级', status: 'DONE', priority: 'HIGH', assigneeIdx: 2, dueDaysFromNow: -5 },
    { title: '户外活动场地改造', status: 'TODO', priority: 'LOW', assigneeIdx: 0, dueDaysFromNow: 30 },
    { title: '新学期教材采购', status: 'DONE', priority: 'MEDIUM', assigneeIdx: 3, dueDaysFromNow: -1 },
  ],
  [ORG_IDS.auto]: [
    { title: 'Q3新车发布会筹备', status: 'IN_PROGRESS', priority: 'CRITICAL', assigneeIdx: 1, dueDaysFromNow: 10 },
    { title: '线上营销渠道拓展', status: 'TODO', priority: 'HIGH', assigneeIdx: 0, dueDaysFromNow: 14 },
    { title: '客户CRM系统升级', status: 'IN_PROGRESS', priority: 'MEDIUM', assigneeIdx: 2, dueDaysFromNow: 21 },
    { title: '4S店员工培训', status: 'DONE', priority: 'MEDIUM', assigneeIdx: 1, dueDaysFromNow: -3 },
    { title: '二手车评估标准制定', status: 'TODO', priority: 'HIGH', assigneeIdx: 0, dueDaysFromNow: 7 },
    { title: '月度销售数据报告', status: 'DONE', priority: 'LOW', assigneeIdx: 2, dueDaysFromNow: -1 },
  ],
  [ORG_IDS.security]: [
    { title: '新安保方案审批', status: 'TODO', priority: 'CRITICAL', assigneeIdx: 0, dueDaysFromNow: 5 },
    { title: '保安队伍扩招50人', status: 'IN_PROGRESS', priority: 'HIGH', assigneeIdx: 1, dueDaysFromNow: 30 },
    { title: '监控设备采购更新', status: 'IN_PROGRESS', priority: 'HIGH', assigneeIdx: 2, dueDaysFromNow: 14 },
    { title: '应急预案演练', status: 'TODO', priority: 'MEDIUM', assigneeIdx: 0, dueDaysFromNow: 21 },
    { title: '客户满意度回访', status: 'DONE', priority: 'MEDIUM', assigneeIdx: 1, dueDaysFromNow: -2 },
    { title: 'ISO认证材料准备', status: 'IN_PROGRESS', priority: 'HIGH', assigneeIdx: 2, dueDaysFromNow: 45 },
    { title: '季度安保绩效评估', status: 'DONE', priority: 'MEDIUM', assigneeIdx: 0, dueDaysFromNow: -7 },
  ],
  [ORG_IDS.tech]: [
    { title: 'SaaS平台v2.0开发', status: 'IN_PROGRESS', priority: 'CRITICAL', assigneeIdx: 1, dueDaysFromNow: 60 },
    { title: '前端UI框架迁移', status: 'IN_PROGRESS', priority: 'HIGH', assigneeIdx: 2, dueDaysFromNow: 30 },
    { title: 'API性能优化', status: 'TODO', priority: 'HIGH', assigneeIdx: 3, dueDaysFromNow: 14 },
    { title: '用户增长策略方案', status: 'TODO', priority: 'MEDIUM', assigneeIdx: 0, dueDaysFromNow: 21 },
    { title: 'CI/CD流水线搭建', status: 'DONE', priority: 'HIGH', assigneeIdx: 2, dueDaysFromNow: -5 },
    { title: '竞品分析报告', status: 'DONE', priority: 'MEDIUM', assigneeIdx: 1, dueDaysFromNow: -3 },
    { title: '投资人路演材料', status: 'IN_PROGRESS', priority: 'CRITICAL', assigneeIdx: 0, dueDaysFromNow: 7 },
    { title: '技术团队招聘3人', status: 'TODO', priority: 'MEDIUM', assigneeIdx: 3, dueDaysFromNow: 30 },
  ],
};

// ── Decision definitions per org ──────────────────────────────────────────
interface SeedDecision {
  title: string;
  status: 'PROPOSED' | 'DISCUSSED' | 'DECIDED' | 'ARCHIVED';
  madeByIdx: number;
  decidedDaysAgo: number | null;
}

const DECISIONS: Record<string, SeedDecision[]> = {
  [ORG_IDS.hatton]: [
    { title: '引入蒙特梭利教育体系', status: 'DISCUSSED', madeByIdx: 0, decidedDaysAgo: null },
    { title: '扩建户外游乐区', status: 'PROPOSED', madeByIdx: 1, decidedDaysAgo: null },
    { title: '学费上调5%方案', status: 'DECIDED', madeByIdx: 0, decidedDaysAgo: 14 },
    { title: '增设英语外教岗位', status: 'DECIDED', madeByIdx: 0, decidedDaysAgo: 30 },
    { title: '园车路线优化', status: 'ARCHIVED', madeByIdx: 2, decidedDaysAgo: 60 },
  ],
  [ORG_IDS.auto]: [
    { title: '开拓新能源车型代理', status: 'DISCUSSED', madeByIdx: 0, decidedDaysAgo: null },
    { title: '线上直播卖车试点', status: 'PROPOSED', madeByIdx: 1, decidedDaysAgo: null },
    { title: 'Q2销售冠军奖励方案', status: 'DECIDED', madeByIdx: 0, decidedDaysAgo: 7 },
    { title: '汽车金融合作伙伴选择', status: 'DECIDED', madeByIdx: 0, decidedDaysAgo: 21 },
  ],
  [ORG_IDS.security]: [
    { title: '引入AI智能监控系统', status: 'PROPOSED', madeByIdx: 0, decidedDaysAgo: null },
    { title: '建立快速响应部队', status: 'DISCUSSED', madeByIdx: 1, decidedDaysAgo: null },
    { title: '员工薪酬体系改革', status: 'DECIDED', madeByIdx: 0, decidedDaysAgo: 10 },
    { title: '政府项目投标策略', status: 'DECIDED', madeByIdx: 0, decidedDaysAgo: 45 },
    { title: '装备升级预算分配', status: 'ARCHIVED', madeByIdx: 2, decidedDaysAgo: 90 },
  ],
  [ORG_IDS.tech]: [
    { title: '采用微服务架构重构', status: 'DISCUSSED', madeByIdx: 0, decidedDaysAgo: null },
    { title: '开源核心组件策略', status: 'PROPOSED', madeByIdx: 1, decidedDaysAgo: null },
    { title: 'A轮融资目标估值', status: 'PROPOSED', madeByIdx: 0, decidedDaysAgo: null },
    { title: '远程办公政策制定', status: 'DECIDED', madeByIdx: 0, decidedDaysAgo: 5 },
    { title: '技术栈选型确认', status: 'DECIDED', madeByIdx: 2, decidedDaysAgo: 20 },
    { title: '产品定价策略', status: 'ARCHIVED', madeByIdx: 0, decidedDaysAgo: 60 },
  ],
};

// ── Helpers ───────────────────────────────────────────────────────────────
function daysFromNow(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

function daysAgo(n: number): Date {
  return daysFromNow(-n);
}

// ── Main seed ─────────────────────────────────────────────────────────────
async function main() {
  console.log('Seed: Creating demo data for 4 companies...\n');

  // ── 1. Create Organizations ─────────────────────────────────────────────
  for (const org of ORGS) {
    await prisma.organization.upsert({
      where: { id: org.id },
      update: { name: org.name, shortName: org.shortName, industry: org.industry, description: org.description },
      create: { id: org.id, name: org.name, shortName: org.shortName, industry: org.industry, description: org.description },
    });
    console.log(`  ✅ Organization: ${org.name}`);
  }

  // ── 2. Create Users ─────────────────────────────────────────────────────
  console.log('\nCreating users...');
  for (const [orgId, users] of Object.entries(USERS)) {
    for (const u of users) {
      await prisma.user.upsert({
        where: { id: u.id },
        update: { name: u.name, role: u.role },
        create: { id: u.id, email: u.email, name: u.name, passwordHash: DEMO_PASSWORD, role: u.role, organizationId: orgId },
      });
    }
    console.log(`  ✅ ${users.length} users for org ${orgId.slice(0, 8)}...`);
  }

  // ── 3. Create Tasks ─────────────────────────────────────────────────────
  console.log('\nCreating tasks...');
  let taskCount = 0;
  for (const [orgId, tasks] of Object.entries(TASKS)) {
    const orgUsers = USERS[orgId];
    for (let i = 0; i < tasks.length; i++) {
      const t = tasks[i];
      const taskId = `${orgId.slice(0, 8)}-task-${String(i + 1).padStart(4, '0')}`;
      const assignee = orgUsers[t.assigneeIdx];
      await prisma.task.upsert({
        where: { id: taskId },
        update: {},
        create: {
          id: taskId,
          title: t.title,
          description: `${t.title}的详细描述和背景信息`,
          status: t.status,
          priority: t.priority,
          assigneeId: assignee.id,
          organizationId: orgId,
          dueAt: daysFromNow(t.dueDaysFromNow),
        },
      });
      taskCount++;
    }
  }
  console.log(`  ✅ ${taskCount} tasks created`);

  // ── 4. Create Decisions ─────────────────────────────────────────────────
  console.log('\nCreating decisions...');
  let decisionCount = 0;
  for (const [orgId, decisions] of Object.entries(DECISIONS)) {
    const orgUsers = USERS[orgId];
    for (let i = 0; i < decisions.length; i++) {
      const d = decisions[i];
      const decisionId = `${orgId.slice(0, 8)}-decision-${String(i + 1).padStart(4, '0')}`;
      const madeBy = orgUsers[d.madeByIdx];
      await prisma.decision.upsert({
        where: { id: decisionId },
        update: {},
        create: {
          id: decisionId,
          title: d.title,
          description: `${d.title}的详细分析和讨论记录`,
          status: d.status,
          madeById: madeBy.id,
          organizationId: orgId,
          decidedAt: d.decidedDaysAgo !== null ? daysAgo(d.decidedDaysAgo) : null,
        },
      });
      decisionCount++;
    }
  }
  console.log(`  ✅ ${decisionCount} decisions created`);

  // ── Summary ─────────────────────────────────────────────────────────────
  console.log('\n✅ Seed completed successfully!');
  console.log(`   ${ORGS.length} organizations`);
  console.log(`   ${Object.values(USERS).flat().length} users`);
  console.log(`   ${taskCount} tasks`);
  console.log(`   ${decisionCount} decisions`);
  console.log('\n   Demo login: any user / password: demo1234');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
