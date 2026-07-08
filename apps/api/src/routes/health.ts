import type { FastifyPluginAsync } from 'fastify';
import { prisma } from '@howard-aios/database';
import { AIOS_VERSION } from '@howard-aios/types';

export const healthRoutes: FastifyPluginAsync = async (app) => {
  app.get('/health', async () => {
    const checks: Record<string, { status: string; latency?: number }> = {};

    // PostgreSQL check
    const dbStart = Date.now();
    try {
      await prisma.$queryRaw`SELECT 1`;
      checks.postgresql = { status: 'connected', latency: Date.now() - dbStart };
    } catch {
      checks.postgresql = { status: 'disconnected' };
    }

    // AI provider availability
    const providers = [
      { name: 'openai', available: !!process.env.OPENAI_API_KEY },
      { name: 'deepseek', available: !!process.env.DEEPSEEK_API_KEY },
      { name: 'qwen', available: !!process.env.QWEN_API_KEY },
      { name: 'claude', available: !!process.env.ANTHROPIC_API_KEY },
      { name: 'gemini', available: !!process.env.GEMINI_API_KEY },
    ];
    const aiAvailable = providers.filter((p) => p.available).length;

    return {
      status: checks.postgresql.status === 'connected' ? 'healthy' : 'degraded',
      service: 'Howard AIOS API',
      version: AIOS_VERSION,
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      checks,
      ai: {
        providers: aiAvailable,
        total: providers.length,
        details: providers,
      },
      system: {
        node: process.version,
        platform: process.platform,
        memoryMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      },
    };
  });
};
