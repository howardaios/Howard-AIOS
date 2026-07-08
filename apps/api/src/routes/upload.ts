import type { FastifyPluginAsync } from 'fastify';
import { UploadService, CreateDocumentSchema, UpdateDocumentSchema, BatchDocumentSchema } from '@howard-aios/upload';
const svc = new UploadService();
export const uploadRoutes: FastifyPluginAsync = async (app) => {
  app.post('/documents', { schema: { description: 'Create document', tags: ['Upload'] } }, async (req, reply) => {
    const orgId = req.headers['x-organization-id'] as string ?? '10000000-0000-0000-0000-000000000001';
    const body = CreateDocumentSchema.parse(req.body); const d = await svc.create(orgId, body);
    return reply.status(201).send({ success: true, code: 201, message: 'Created', data: d });
  });
  app.get('/documents', { schema: { description: 'List documents', tags: ['Upload'] } }, async (req, reply) => {
    const orgId = req.headers['x-organization-id'] as string ?? '10000000-0000-0000-0000-000000000001';
    const r = await svc.findMany(orgId, req.query as Record<string, unknown>);
    return reply.send({ success: true, code: 200, message: 'OK', data: r });
  });
  app.get('/documents/stats', { schema: { description: 'Doc stats', tags: ['Upload'] } }, async (req, reply) => {
    const orgId = req.headers['x-organization-id'] as string ?? '10000000-0000-0000-0000-000000000001';
    return reply.send({ success: true, code: 200, message: 'OK', data: await svc.stats(orgId) });
  });
  app.get('/documents/:id', { schema: { description: 'Get document', tags: ['Upload'] } }, async (req, reply) => {
    const { id } = req.params as { id: string }; return reply.send({ success: true, code: 200, message: 'OK', data: await svc.findById(id) });
  });
  app.patch('/documents/:id', { schema: { description: 'Update document', tags: ['Upload'] } }, async (req, reply) => {
    const { id } = req.params as { id: string }; const body = UpdateDocumentSchema.parse(req.body);
    return reply.send({ success: true, code: 200, message: 'Updated', data: await svc.update(id, body) });
  });
  app.delete('/documents/:id', { schema: { description: 'Delete document', tags: ['Upload'] } }, async (req, reply) => {
    const { id } = req.params as { id: string }; await svc.delete(id);
    return reply.send({ success: true, code: 200, message: 'Deleted', data: null });
  });
  app.post('/documents/batch', { schema: { description: 'Batch docs', tags: ['Upload'] } }, async (req, reply) => {
    const orgId = req.headers['x-organization-id'] as string ?? '10000000-0000-0000-0000-000000000001';
    const body = BatchDocumentSchema.parse(req.body);
    return reply.send({ success: true, code: 200, message: 'Done', data: await svc.batch(orgId, body) });
  });
  app.post('/documents/simulate-upload', { schema: { description: 'Simulate upload', tags: ['Upload'] } }, async (req, reply) => {
    const orgId = req.headers['x-organization-id'] as string ?? '10000000-0000-0000-0000-000000000001';
    const body = req.body as { fileName: string; mimeType: string; fileSize: number };
    const d = await svc.simulateUpload(orgId, body.fileName, body.mimeType, body.fileSize);
    return reply.status(201).send({ success: true, code: 201, message: 'Uploaded', data: d });
  });
};
