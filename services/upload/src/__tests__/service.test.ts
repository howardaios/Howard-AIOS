import { describe, it, expect, beforeEach } from 'vitest';
import type { Document } from '@howard-aios/database';
import type { DocumentRepository } from '../repository';
import { UploadService } from '../service';
import { DocumentNotFoundError, UploadValidationError } from '../types';
function mockRepo(): DocumentRepository {
  const s = new Map<string, Document>();
  const O = '10000000-0000-0000-0000-000000000001';
  return {
    findById: async (id) => s.get(id) ?? null,
    findMany: async () => Array.from(s.values()),
    count: async () => s.size,
    create: async (d: Record<string, unknown>) => { const id = '00000000-0000-0000-0000-'+String(s.size+1).padStart(12,'0'); const n = new Date(); const doc: Document = { id, title: (d.title as string)??'', content: (d.content as string)??null, source: (d.source as string)??'upload', type: (d.type as string)??'pdf', mimeType: (d.mimeType as string)??null, fileSize: (d.fileSize as number)??null, fileUrl: (d.fileUrl as string)??null, status: (d.status as Document['status'])??'COMPLETED', tags: (d.tags as string[])??[], metadata: null, organizationId: O, createdAt: n, updatedAt: n }; s.set(id, doc); return doc; },
    update: async (id, d: Record<string, unknown>) => { const e = s.get(id); if (!e) throw new Error('nf'); const u = {...e,...d,updatedAt:new Date()}; s.set(id, u); return u; },
    delete: async (id) => { const e = s.get(id); if (!e) throw new Error('nf'); s.delete(id); return e; },
    deleteMany: async (ids) => { let c=0; for (const id of ids) if (s.delete(id)) c++; return {count:c}; },
    updateMany: async (ids, d: Record<string, unknown>) => { let c=0; for (const id of ids) { const e=s.get(id); if(e){s.set(id,{...e,...d,updatedAt:new Date()});c++;} } return {count:c}; },
    stats: async () => ({ total: s.size, uploading: 0, processing: 0, completed: s.size, failed: 0 }),
  };
}
describe('UploadService', () => {
  let svc: UploadService;
  const O = '10000000-0000-0000-0000-000000000001';
  beforeEach(() => { svc = new UploadService(mockRepo()); });
  it('creates', async () => { const d = await svc.create(O, { title: 'R.pdf', type: 'pdf', mimeType: 'application/pdf', fileSize: 1024 }); expect(d.title).toBe('R.pdf'); });
  it('findById', async () => { const c = await svc.create(O, { title: 'T.pdf', type: 'pdf' }); const f = await svc.findById(c.id); expect(f.title).toBe('T.pdf'); });
  it('not found', async () => { await expect(svc.findById('00000000-0000-0000-0000-999999999999')).rejects.toThrow(DocumentNotFoundError); });
  it('lists', async () => { await svc.create(O, { title: 'A', type: 'pdf' }); await svc.create(O, { title: 'B', type: 'doc' }); const r = await svc.findMany(O, {}); expect(r.items).toHaveLength(2); });
  it('deletes', async () => { const d = await svc.create(O, { title: 'D', type: 'pdf' }); await svc.delete(d.id); await expect(svc.findById(d.id)).rejects.toThrow(DocumentNotFoundError); });
  it('batch delete', async () => { const a = await svc.create(O, { title: 'A', type: 'pdf' }); const b = await svc.create(O, { title: 'B', type: 'pdf' }); const r = await svc.batch(O, { ids: [a.id, b.id], action: 'delete' }); expect(r.count).toBe(2); });
  it('validates', async () => { await expect(svc.create(O, { title: '', type: '' })).rejects.toThrow(UploadValidationError); });
  it('simulate', async () => { const d = await svc.simulateUpload(O, 'photo.jpg', 'image/jpeg', 2048); expect(d.title).toBe('photo.jpg'); });
});
