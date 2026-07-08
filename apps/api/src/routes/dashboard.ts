import type { FastifyPluginAsync } from 'fastify';
import { prisma } from '@howard-aios/database';

export const dashboardRoutes: FastifyPluginAsync = async (app) => {
  // ── Main Dashboard ─────────────────────────────────────────────────────
  app.get('/dashboard', { schema: { description: 'Dashboard stats', tags: ['Dashboard'] } }, async (req, reply) => {
    const orgId = (req.headers['x-organization-id'] as string) ?? '10000000-0000-0000-0000-000000000001';
    const base = { organizationId: orgId };
    const today = new Date(); today.setHours(0, 0, 0, 0);

    const [meetingStats, inboxStats, docCount, recentMeetings, recentInbox, recentDocs] = await Promise.all([
      Promise.all([
        prisma.meeting.count({ where: base }),
        prisma.meeting.count({ where: { ...base, startedAt: { gte: today } } }),
        prisma.meeting.count({ where: { ...base, status: 'SCHEDULED' } }),
      ]).then(([total, todayCount, scheduled]) => ({ total, today: todayCount, scheduled })),
      Promise.all([
        prisma.inboxItem.count({ where: base }),
        prisma.inboxItem.count({ where: { ...base, status: 'RECEIVED' } }),
        prisma.inboxItem.count({ where: { ...base, priority: 'URGENT' } }),
      ]).then(([total, unread, urgent]) => ({ total, unread, urgent })),
      prisma.document.count({ where: base }),
      prisma.meeting.findMany({ where: base, orderBy: { startedAt: 'desc' }, take: 5, select: { id: true, title: true, status: true, startedAt: true, participants: true } }),
      prisma.inboxItem.findMany({ where: base, orderBy: { createdAt: 'desc' }, take: 5, select: { id: true, title: true, sourceType: true, status: true, priority: true, createdAt: true } }),
      prisma.document.findMany({ where: base, orderBy: { createdAt: 'desc' }, take: 5, select: { id: true, title: true, type: true, status: true, createdAt: true } }),
    ]);

    return reply.send({
      success: true, code: 200, message: 'OK',
      data: {
        stats: { meetings: meetingStats, inbox: inboxStats, documents: { total: docCount } },
        recent: { meetings: recentMeetings, inbox: recentInbox, documents: recentDocs },
      },
    });
  });

  // ── Today's Data ───────────────────────────────────────────────────────
  app.get('/dashboard/today', { schema: { description: "Today's meetings and tasks", tags: ['Dashboard'] } }, async (req, reply) => {
    const orgId = (req.headers['x-organization-id'] as string) ?? '10000000-0000-0000-0000-000000000001';
    const base = { organizationId: orgId };
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);

    const [meetings, pendingTasks, recentDecisions] = await Promise.all([
      prisma.meeting.findMany({
        where: { ...base, startedAt: { gte: today, lt: tomorrow } },
        orderBy: { startedAt: 'asc' },
        select: { id: true, title: true, status: true, startedAt: true, participants: true, location: true },
      }),
      prisma.inboxItem.findMany({
        where: { ...base, status: { in: ['RECEIVED', 'NORMALIZED'] } },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { id: true, title: true, priority: true, status: true, createdAt: true },
      }),
      prisma.knowledgeNode.findMany({
        where: { ...base, type: 'DECISION' },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { id: true, title: true, content: true, confidence: true, createdAt: true },
      }),
    ]);

    return reply.send({
      success: true, code: 200, message: 'OK',
      data: { meetings, pendingTasks, recentDecisions },
    });
  });

  // ── Pipeline Status ────────────────────────────────────────────────────
  app.get('/dashboard/pipeline-status', { schema: { description: 'Pipeline engine status', tags: ['Dashboard'] } }, async (_req, reply) => {
    try {
      // Try to get from pipeline routes if available
      return reply.send({
        success: true, code: 200, message: 'OK',
        data: { status: 'available' },
      });
    } catch {
      return reply.send({
        success: true, code: 200, message: 'OK',
        data: { status: 'unavailable' },
      });
    }
  });

  // ── AI Status ──────────────────────────────────────────────────────────
  app.get('/dashboard/ai-status', { schema: { description: 'AI provider availability', tags: ['Dashboard'] } }, async (_req, reply) => {
    const providers = [
      { name: 'openai', available: !!process.env.OPENAI_API_KEY },
      { name: 'deepseek', available: !!process.env.DEEPSEEK_API_KEY },
      { name: 'qwen', available: !!process.env.QWEN_API_KEY },
      { name: 'claude', available: !!process.env.ANTHROPIC_API_KEY },
      { name: 'gemini', available: !!process.env.GEMINI_API_KEY },
      { name: 'whisper', available: !!process.env.OPENAI_API_KEY },
    ];

    return reply.send({
      success: true, code: 200, message: 'OK',
      data: { providers },
    });
  });
};
