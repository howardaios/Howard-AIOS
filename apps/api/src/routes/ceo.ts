import type { FastifyPluginAsync } from 'fastify';
import { prisma } from '@howard-aios/database';

function getOrgId(req: { headers: Record<string, string | undefined> }): string {
  return (req.headers['x-organization-id'] as string) ?? '10000000-0000-0000-0000-000000000001';
}

function startOfDay(d = new Date()): Date {
  const t = new Date(d);
  t.setHours(0, 0, 0, 0);
  return t;
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return startOfDay(d);
}

export const ceoRoutes: FastifyPluginAsync = async (app) => {
  // ── GET /ceo/companies — List all companies ───────────────────────────
  app.get('/ceo/companies', { schema: { description: 'List all companies', tags: ['CEO'] } }, async (_req, reply) => {
    const companies = await prisma.organization.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, shortName: true, industry: true, description: true },
    });
    return reply.send({ success: true, code: 200, message: 'OK', data: { companies } });
  });

  // ── GET /ceo/overview — CEO Dashboard (comprehensive) ─────────────────
  app.get('/ceo/overview', { schema: { description: 'CEO dashboard overview', tags: ['CEO'] } }, async (req, reply) => {
    const orgId = getOrgId(req as { headers: Record<string, string | undefined> });
    const base = { organizationId: orgId };
    const today = startOfDay();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const weekAgo = daysAgo(7);
    const monthAgo = daysAgo(30);

    const [
      meetingTotal, meetingToday, meetingWeek, meetingMonth,
      taskTotal, taskDone, taskPending,
      decisionTotal, decisionPending,
      inboxTotal, inboxUnread, inboxUrgent,
      knowledgeTotal, knowledgeWeek,
      memoryTotal, memoryWeek,
      docTotal, recordingTotal,
      recentMeetings, todayMeetings,
      risks,
    ] = await Promise.all([
      prisma.meeting.count({ where: base }),
      prisma.meeting.count({ where: { ...base, startedAt: { gte: today, lt: tomorrow } } }),
      prisma.meeting.count({ where: { ...base, startedAt: { gte: weekAgo } } }),
      prisma.meeting.count({ where: { ...base, startedAt: { gte: monthAgo } } }),
      prisma.task.count({ where: base }),
      prisma.task.count({ where: { ...base, status: 'DONE' } }),
      prisma.task.count({ where: { ...base, status: { in: ['TODO', 'IN_PROGRESS'] } } }),
      prisma.decision.count({ where: base }),
      prisma.decision.count({ where: { ...base, status: { in: ['PROPOSED', 'DISCUSSED'] } } }),
      prisma.inboxItem.count({ where: base }),
      prisma.inboxItem.count({ where: { ...base, status: 'RECEIVED' } }),
      prisma.inboxItem.count({ where: { ...base, priority: 'URGENT' } }),
      prisma.knowledgeNode.count({ where: base }),
      prisma.knowledgeNode.count({ where: { ...base, createdAt: { gte: weekAgo } } }),
      prisma.memory.count({ where: base }),
      prisma.memory.count({ where: { ...base, createdAt: { gte: weekAgo } } }),
      prisma.document.count({ where: base }),
      prisma.recording.count({ where: base }),
      prisma.meeting.findMany({
        where: base, orderBy: { startedAt: 'desc' }, take: 5,
        select: { id: true, title: true, status: true, startedAt: true, participants: true },
      }),
      prisma.meeting.findMany({
        where: { ...base, startedAt: { gte: today, lt: tomorrow } },
        orderBy: { startedAt: 'asc' },
        select: { id: true, title: true, status: true, startedAt: true, location: true, participants: true },
      }),
      prisma.knowledgeNode.findMany({
        where: { ...base, type: 'RISK' }, orderBy: { createdAt: 'desc' }, take: 10,
        select: { id: true, title: true, content: true, confidence: true, createdAt: true },
      }),
    ]);

    const executionRate = taskTotal > 0 ? Math.round((taskDone / taskTotal) * 100) : 0;

    return reply.send({
      success: true, code: 200, message: 'OK',
      data: {
        todayFocus: {
          meetingsToday: meetingToday,
          todayMeetings,
          pendingTasks: taskPending,
          pendingDecisions: decisionPending,
          urgentInbox: inboxUrgent,
          criticalRisks: risks.filter((r) => (r.confidence ?? 1) >= 0.7).length,
        },
        companyHealth: {
          executionRate,
          taskCompletion: `${taskDone}/${taskTotal}`,
          decisionRate: decisionTotal > 0 ? Math.round(((decisionTotal - decisionPending) / decisionTotal) * 100) : 0,
          inboxBacklog: inboxUnread,
          inboxTotal,
        },
        kpi: {
          weekly: { meetings: meetingWeek, knowledge: knowledgeWeek, memories: memoryWeek },
          monthly: { meetings: meetingMonth },
        },
        growth: {
          meetingTotal,
          knowledgeTotal, knowledgeWeek,
          memoryTotal, memoryWeek,
          documentTotal: docTotal,
          recordingTotal,
        },
        recent: { meetings: recentMeetings, risks },
        systemStatus: {
          aiProviders: [
            { name: 'openai', ok: !!process.env.OPENAI_API_KEY },
            { name: 'deepseek', ok: !!process.env.DEEPSEEK_API_KEY },
            { name: 'qwen', ok: !!process.env.QWEN_API_KEY },
            { name: 'claude', ok: !!process.env.ANTHROPIC_API_KEY },
            { name: 'gemini', ok: !!process.env.GEMINI_API_KEY },
          ],
        },
      },
    });
  });

  // ── GET /ceo/inbox — Aggregated CEO Inbox ─────────────────────────────
  app.get('/ceo/inbox', { schema: { description: 'CEO aggregated inbox', tags: ['CEO'] } }, async (req, reply) => {
    const orgId = getOrgId(req as { headers: Record<string, string | undefined> });
    const base = { organizationId: orgId };
    const { filter, priority, unread, archived } = (req as { query: Record<string, string | undefined> }).query ?? {};

    const inboxWhere: Record<string, unknown> = { ...base };
    if (priority) inboxWhere.priority = priority;
    if (unread === 'true') inboxWhere.status = 'RECEIVED';
    if (archived === 'true') inboxWhere.status = 'ARCHIVED';

    const [meetings, inbox, tasks, decisions, risks] = await Promise.all([
      prisma.meeting.findMany({
        where: { ...base, ...(filter === 'meetings' ? {} : {}) },
        orderBy: { startedAt: 'desc' }, take: 20,
        select: { id: true, title: true, status: true, startedAt: true, participants: true },
      }),
      prisma.inboxItem.findMany({
        where: inboxWhere,
        orderBy: { createdAt: 'desc' }, take: 20,
        select: { id: true, title: true, content: true, sourceType: true, priority: true, status: true, createdAt: true },
      }),
      prisma.task.findMany({
        where: { ...base, status: { in: ['TODO', 'IN_PROGRESS'] } },
        orderBy: { createdAt: 'desc' }, take: 20,
        select: { id: true, title: true, status: true, priority: true, dueAt: true },
      }),
      prisma.decision.findMany({
        where: { ...base, status: { in: ['PROPOSED', 'DISCUSSED'] } },
        orderBy: { createdAt: 'desc' }, take: 20,
        select: { id: true, title: true, status: true, createdAt: true },
      }),
      prisma.knowledgeNode.findMany({
        where: { ...base, type: 'RISK' },
        orderBy: { createdAt: 'desc' }, take: 20,
        select: { id: true, title: true, content: true, confidence: true, createdAt: true },
      }),
    ]);

    return reply.send({
      success: true, code: 200, message: 'OK',
      data: {
        meetings, inbox, tasks, decisions, risks,
        summary: {
          meetings: meetings.length,
          inbox: inbox.length,
          tasks: tasks.length,
          decisions: decisions.length,
          risks: risks.length,
        },
      },
    });
  });

  // ── GET /ceo/brief — Daily Brief ──────────────────────────────────────
  app.get('/ceo/brief', { schema: { description: 'CEO daily brief', tags: ['CEO'] } }, async (req, reply) => {
    const orgId = getOrgId(req as { headers: Record<string, string | undefined> });
    const base = { organizationId: orgId };
    const today = startOfDay();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [todayMeetings, pendingTasks, urgentInbox, risks, todayDecisions] = await Promise.all([
      prisma.meeting.findMany({
        where: { ...base, startedAt: { gte: today, lt: tomorrow } },
        orderBy: { startedAt: 'asc' },
        select: { id: true, title: true, status: true, startedAt: true, participants: true },
      }),
      prisma.task.findMany({
        where: { ...base, status: { in: ['TODO', 'IN_PROGRESS'] }, priority: { in: ['HIGH', 'CRITICAL'] } },
        orderBy: { createdAt: 'desc' }, take: 10,
        select: { id: true, title: true, status: true, priority: true, dueAt: true },
      }),
      prisma.inboxItem.findMany({
        where: { ...base, priority: 'URGENT', status: 'RECEIVED' },
        orderBy: { createdAt: 'desc' }, take: 10,
        select: { id: true, title: true, content: true, priority: true, createdAt: true },
      }),
      prisma.knowledgeNode.findMany({
        where: { ...base, type: 'RISK' },
        orderBy: { createdAt: 'desc' }, take: 10,
        select: { id: true, title: true, content: true, confidence: true },
      }),
      prisma.decision.findMany({
        where: { ...base, status: { in: ['PROPOSED', 'DISCUSSED'] } },
        orderBy: { createdAt: 'desc' }, take: 10,
        select: { id: true, title: true, status: true, createdAt: true },
      }),
    ]);

    const hour = new Date().getHours();
    const briefType = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';

    return reply.send({
      success: true, code: 200, message: 'OK',
      data: {
        type: briefType,
        date: today.toISOString().split('T')[0],
        generatedAt: new Date().toISOString(),
        summary: {
          meetingsToday: todayMeetings.length,
          pendingHighPriorityTasks: pendingTasks.length,
          urgentInboxItems: urgentInbox.length,
          activeRisks: risks.length,
          pendingDecisions: todayDecisions.length,
        },
        sections: {
          todaySchedule: todayMeetings,
          highPriorityTasks: pendingTasks,
          urgentItems: urgentInbox,
          activeRisks: risks,
          pendingDecisions: todayDecisions,
          tomorrowPlan: todayMeetings.slice(0, 3).map((m) => ({
            title: `Follow up: ${m.title}`,
            type: 'follow-up',
          })),
        },
      },
    });
  });

  // ── GET /ceo/intelligence — Executive Intelligence ────────────────────
  app.get('/ceo/intelligence', { schema: { description: 'Executive intelligence analysis', tags: ['CEO'] } }, async (req, reply) => {
    const orgId = getOrgId(req as { headers: Record<string, string | undefined> });
    const base = { organizationId: orgId };

    const [taskTotal, taskDone, riskNodes, decisionPending, inboxUrgent, meetingTotal, knowledgeTotal] = await Promise.all([
      prisma.task.count({ where: base }),
      prisma.task.count({ where: { ...base, status: 'DONE' } }),
      prisma.knowledgeNode.findMany({ where: { ...base, type: 'RISK' }, select: { id: true, title: true, confidence: true, content: true, createdAt: true } }),
      prisma.decision.count({ where: { ...base, status: { in: ['PROPOSED', 'DISCUSSED'] } } }),
      prisma.inboxItem.count({ where: { ...base, priority: 'URGENT' } }),
      prisma.meeting.count({ where: base }),
      prisma.knowledgeNode.count({ where: base }),
    ]);

    const executionRate = taskTotal > 0 ? (taskDone / taskTotal) * 100 : 0;
    const riskCount = riskNodes.length;
    const avgRiskConfidence = riskCount > 0 ? riskNodes.reduce((s, r) => s + (r.confidence ?? 0.5), 0) / riskCount : 0;

    // Computed scores (0-100)
    const healthScore = Math.round(Math.max(0, 100 - (inboxUrgent * 5) - (decisionPending * 3) - (avgRiskConfidence * 20)));
    const riskScore = Math.round(Math.min(100, (avgRiskConfidence * 40) + (riskCount * 5) + (inboxUrgent * 3)));
    const growthScore = Math.round(Math.min(100, (knowledgeTotal * 2) + (executionRate * 0.5)));

    return reply.send({
      success: true, code: 200, message: 'OK',
      data: {
        scores: {
          health: { value: healthScore, label: healthScore >= 70 ? 'Healthy' : healthScore >= 40 ? 'Needs Attention' : 'Critical' },
          risk: { value: riskScore, label: riskScore <= 30 ? 'Low' : riskScore <= 60 ? 'Moderate' : 'High' },
          growth: { value: growthScore, label: growthScore >= 60 ? 'Growing' : growthScore >= 30 ? 'Stable' : 'Stagnant' },
        },
        analysis: {
          strategic: { risks: riskNodes.filter((r) => (r.confidence ?? 0.5) >= 0.7), count: riskNodes.filter((r) => (r.confidence ?? 0.5) >= 0.7).length },
          operational: { executionRate: Math.round(executionRate), pendingDecisions: decisionPending },
          organizational: { totalMeetings: meetingTotal, urgentInbox: inboxUrgent },
        },
        riskDetails: riskNodes,
      },
    });
  });

  // ── GET /ceo/recommendations — AI Recommendations ─────────────────────
  app.get('/ceo/recommendations', { schema: { description: 'AI-generated recommendations', tags: ['CEO'] } }, async (req, reply) => {
    const orgId = getOrgId(req as { headers: Record<string, string | undefined> });
    const base = { organizationId: orgId };

    const [topTasks, topDecisions, topRisks, urgentInbox, overdueTasks] = await Promise.all([
      prisma.task.findMany({
        where: { ...base, status: { in: ['TODO', 'IN_PROGRESS'] }, priority: { in: ['HIGH', 'CRITICAL'] } },
        orderBy: { priority: 'asc' }, take: 10,
        select: { id: true, title: true, status: true, priority: true, dueAt: true },
      }),
      prisma.decision.findMany({
        where: { ...base, status: { in: ['PROPOSED', 'DISCUSSED'] } },
        orderBy: { createdAt: 'asc' }, take: 5,
        select: { id: true, title: true, status: true, createdAt: true },
      }),
      prisma.knowledgeNode.findMany({
        where: { ...base, type: 'RISK' },
        orderBy: { confidence: 'desc' }, take: 5,
        select: { id: true, title: true, content: true, confidence: true },
      }),
      prisma.inboxItem.findMany({
        where: { ...base, priority: 'URGENT', status: 'RECEIVED' },
        orderBy: { createdAt: 'desc' }, take: 5,
        select: { id: true, title: true, content: true, createdAt: true },
      }),
      prisma.task.findMany({
        where: { ...base, status: { in: ['TODO', 'IN_PROGRESS'] }, dueAt: { lt: new Date() } },
        orderBy: { dueAt: 'asc' }, take: 5,
        select: { id: true, title: true, dueAt: true, priority: true },
      }),
    ]);

    const quickWins = topTasks.filter((t) => t.priority !== 'CRITICAL').slice(0, 3);

    return reply.send({
      success: true, code: 200, message: 'OK',
      data: {
        topActions: topTasks.map((t, i) => ({ rank: i + 1, type: 'task', id: t.id, title: t.title, priority: t.priority })),
        topDecisions: topDecisions.map((d, i) => ({ rank: i + 1, type: 'decision', id: d.id, title: d.title, pendingDays: Math.floor((Date.now() - new Date(d.createdAt).getTime()) / 86400000) })),
        topRisks: topRisks.map((r, i) => ({ rank: i + 1, type: 'risk', id: r.id, title: r.title, confidence: r.confidence })),
        opportunities: urgentInbox.map((item, i) => ({ rank: i + 1, type: 'inbox', id: item.id, title: item.title ?? 'Urgent item' })),
        quickWins: quickWins.map((t, i) => ({ rank: i + 1, type: 'quick-win', id: t.id, title: t.title })),
        overdue: overdueTasks.map((t) => ({ id: t.id, title: t.title, dueAt: t.dueAt, priority: t.priority })),
        generatedAt: new Date().toISOString(),
      },
    });
  });

  // ── GET /ceo/kpi — Weekly/Monthly KPI ─────────────────────────────────
  app.get('/ceo/kpi', { schema: { description: 'KPI metrics', tags: ['CEO'] } }, async (req, reply) => {
    const orgId = getOrgId(req as { headers: Record<string, string | undefined> });
    const base = { organizationId: orgId };
    const weekAgo = daysAgo(7);
    const monthAgo = daysAgo(30);

    const [weeklyMeetings, monthlyMeetings, weeklyTasks, monthlyTasks, weeklyKnowledge, monthlyKnowledge, weeklyDecisions, monthlyDecisions] = await Promise.all([
      prisma.meeting.count({ where: { ...base, startedAt: { gte: weekAgo } } }),
      prisma.meeting.count({ where: { ...base, startedAt: { gte: monthAgo } } }),
      prisma.task.count({ where: { ...base, status: 'DONE', updatedAt: { gte: weekAgo } } }),
      prisma.task.count({ where: { ...base, status: 'DONE', updatedAt: { gte: monthAgo } } }),
      prisma.knowledgeNode.count({ where: { ...base, createdAt: { gte: weekAgo } } }),
      prisma.knowledgeNode.count({ where: { ...base, createdAt: { gte: monthAgo } } }),
      prisma.decision.count({ where: { ...base, status: 'DECIDED', decidedAt: { gte: weekAgo } } }),
      prisma.decision.count({ where: { ...base, status: 'DECIDED', decidedAt: { gte: monthAgo } } }),
    ]);

    return reply.send({
      success: true, code: 200, message: 'OK',
      data: {
        weekly: { meetings: weeklyMeetings, tasksCompleted: weeklyTasks, knowledgeNodes: weeklyKnowledge, decisions: weeklyDecisions },
        monthly: { meetings: monthlyMeetings, tasksCompleted: monthlyTasks, knowledgeNodes: monthlyKnowledge, decisions: monthlyDecisions },
      },
    });
  });
};
