import type { FastifyPluginAsync } from 'fastify';
import { SearchService } from '@howard-aios/search';
const svc = new SearchService();
export const searchRoutes: FastifyPluginAsync = async (app) => {
  app.get('/search', { schema: { description: 'Unified search', tags: ['Search'], querystring: { type: 'object', required: ['q'], properties: { q: { type: 'string' }, domains: { type: 'string' }, limit: { type: 'number', default: 20 }, offset: { type: 'number', default: 0 } } } } }, async (req, reply) => {
    const orgId = req.headers['x-organization-id'] as string ?? '10000000-0000-0000-0000-000000000001';
    const q = req.query as { q: string; domains?: string; limit?: number; offset?: number };
    const domains = q.domains ? q.domains.split(',') as Array<'meeting'|'inbox'|'document'|'memory'|'knowledge'> : undefined;
    const r = await svc.search({ query: q.q, domains, limit: q.limit, offset: q.offset, organizationId: orgId });
    return reply.send({ success: true, code: 200, message: 'OK', data: r });
  });
};
