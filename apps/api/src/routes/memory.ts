import type { FastifyPluginAsync, FastifyRequest } from 'fastify';
import { MemoryService } from '@howard-aios/knowledge/memory';

const svc = new MemoryService();

const ORG_ID = '10000000-0000-0000-0000-000000000001';

function getOrgId(req: FastifyRequest): string {
  const header = req.headers['x-organization-id'];
  const user = (req as unknown as { user: { organizationId?: string } | null }).user;
  return user?.organizationId ?? (Array.isArray(header) ? header[0] : header) ?? ORG_ID;
}

export const memoryRoutes: FastifyPluginAsync = async (app) => {
  app.post('/memories/extract', { schema: { description: 'Extract memories', tags: ['Memory'] } }, async (req, reply) => {
    const orgId = getOrgId(req);
    const body = req.body as { text: string; source: string; sourceId?: string };
    const memories = await svc.extract(body.text ?? '', body.source ?? 'api', body.sourceId, orgId);
    return reply.status(201).send({ success: true, code: 201, message: 'Extracted', data: { count: memories.length, memories } });
  });

  app.post('/memories/create', { schema: { description: 'Create memory', tags: ['Memory'] } }, async (req, reply) => {
    const orgId = getOrgId(req);
    const body = req.body as { content: string; source: string; importance?: number };
    const m = await svc.create(body.content, body.source ?? 'api', undefined, body.importance, orgId);
    return reply.status(201).send({ success: true, code: 201, message: 'Created', data: m });
  });

  app.post('/memories/merge', { schema: { description: 'Merge memories', tags: ['Memory'] } }, async (req, reply) => {
    const orgId = getOrgId(req);
    const body = req.body as { ids: string[] };
    const merged = await svc.merge(body.ids ?? [], orgId);
    return reply.send({ success: true, code: 200, message: 'Merged', data: merged });
  });

  app.post('/memories/auto-merge', { schema: { description: 'Auto-merge similar', tags: ['Memory'] } }, async (req, reply) => {
    const orgId = getOrgId(req);
    const body = req.body as { threshold?: number };
    const merged = await svc.autoMerge(body.threshold ?? 0.7, orgId);
    return reply.send({ success: true, code: 200, message: 'Auto-merged', data: { count: merged.length, merged } });
  });

  app.get('/memories/rank', { schema: { description: 'Rank memories', tags: ['Memory'] } }, async (req, reply) => {
    const orgId = getOrgId(req);
    const limit = Number((req.query as Record<string, string>).limit) || 50;
    return reply.send({ success: true, code: 200, message: 'OK', data: await svc.rank(limit, orgId) });
  });

  app.post('/memories/archive', { schema: { description: 'Archive old memories', tags: ['Memory'] } }, async (req, reply) => {
    const orgId = getOrgId(req);
    const body = req.body as { days: number };
    const count = await svc.archiveOlderThan(body.days ?? 30, orgId);
    return reply.send({ success: true, code: 200, message: 'Archived', data: { archived: count } });
  });

  app.get('/memories', { schema: { description: 'List memories', tags: ['Memory'] } }, async (req, reply) => {
    const orgId = getOrgId(req);
    return reply.send({ success: true, code: 200, message: 'OK', data: await svc.listActive(orgId) });
  });

  app.get('/memories/stats', { schema: { description: 'Memory stats', tags: ['Memory'] } }, async (req, reply) => {
    const orgId = getOrgId(req);
    return reply.send({ success: true, code: 200, message: 'OK', data: await svc.getStats(orgId) });
  });

  app.get('/memories/search', { schema: { description: 'Search memories', tags: ['Memory'] } }, async (req, reply) => {
    const orgId = getOrgId(req);
    const q = (req.query as Record<string, string>).q ?? '';
    return reply.send({ success: true, code: 200, message: 'OK', data: await svc.search(q, 20, orgId) });
  });

  app.get('/memories/:id', { schema: { description: 'Get memory', tags: ['Memory'] } }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const m = await svc.get(id);
    if (!m) return reply.status(404).send({ success: false, code: 404, message: 'Not found', data: null });
    return reply.send({ success: true, code: 200, message: 'OK', data: m });
  });

  app.delete('/memories/:id', { schema: { description: 'Delete memory', tags: ['Memory'] } }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const deleted = await svc.delete(id);
    return reply.send({ success: deleted, code: deleted ? 200 : 404, message: deleted ? 'Deleted' : 'Not found', data: null });
  });
};
