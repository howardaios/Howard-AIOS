import type { FastifyPluginAsync, FastifyRequest } from 'fastify';
import { KnowledgeService } from '@howard-aios/knowledge';

const svc = new KnowledgeService();

const ORG_ID = '10000000-0000-0000-0000-000000000001';

function getOrgId(req: FastifyRequest): string {
  const header = req.headers['x-organization-id'];
  const user = (req as unknown as { user: { organizationId?: string } | null }).user;
  return user?.organizationId ?? (Array.isArray(header) ? header[0] : header) ?? ORG_ID;
}

export const knowledgeRoutes: FastifyPluginAsync = async (app) => {
  app.post('/knowledge/extract', { schema: { description: 'Extract knowledge', tags: ['Knowledge'] } }, async (req, reply) => {
    const orgId = getOrgId(req);
    const body = req.body as { text: string; source: string; sourceId?: string };
    const result = await svc.extractAndStore(body.text ?? '', body.source ?? 'api', body.sourceId, orgId);
    return reply.status(201).send({ success: true, code: 201, message: 'Extracted', data: { nodesCreated: result.nodes.length, edgesCreated: result.edges.length, result } });
  });

  app.get('/knowledge/nodes', { schema: { description: 'List knowledge nodes', tags: ['Knowledge'] } }, async (req, reply) => {
    const orgId = getOrgId(req);
    const type = (req.query as Record<string, string>).type;
    return reply.send({ success: true, code: 200, message: 'OK', data: await svc.listNodes(type as 'person' | 'company' | 'task' | 'decision' | 'risk' | 'keyword' | 'timeline' | 'concept' | 'fact' | undefined, orgId) });
  });

  app.get('/knowledge/graph', { schema: { description: 'Get knowledge graph', tags: ['Knowledge'] } }, async (req, reply) => {
    const orgId = getOrgId(req);
    const type = (req.query as Record<string, string>).type;
    return reply.send({ success: true, code: 200, message: 'OK', data: await svc.getGraph(type as 'person' | 'company' | 'task' | 'decision' | 'risk' | 'keyword' | 'timeline' | 'concept' | 'fact' | undefined, orgId) });
  });

  app.get('/knowledge/stats', { schema: { description: 'Knowledge stats', tags: ['Knowledge'] } }, async (req, reply) => {
    const orgId = getOrgId(req);
    return reply.send({ success: true, code: 200, message: 'OK', data: await svc.getStats(orgId) });
  });

  app.get('/knowledge/search', { schema: { description: 'Search knowledge', tags: ['Knowledge'] } }, async (req, reply) => {
    const orgId = getOrgId(req);
    const q = (req.query as Record<string, string>).q ?? '';
    return reply.send({ success: true, code: 200, message: 'OK', data: await svc.search(q, 20, orgId) });
  });

  app.get('/knowledge/nodes/:id', { schema: { description: 'Get knowledge node', tags: ['Knowledge'] } }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const node = await svc.getNode(id);
    if (!node) return reply.status(404).send({ success: false, code: 404, message: 'Not found', data: null });
    return reply.send({ success: true, code: 200, message: 'OK', data: node });
  });

  app.delete('/knowledge/nodes/:id', { schema: { description: 'Delete knowledge node', tags: ['Knowledge'] } }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const deleted = await svc.deleteNode(id);
    return reply.send({ success: deleted, code: deleted ? 200 : 404, message: deleted ? 'Deleted' : 'Not found', data: null });
  });
};
