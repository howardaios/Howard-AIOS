import { describe, it, expect, beforeEach } from 'vitest';
import type { Meeting } from '@howard-aios/database';
import type { MeetingRepository } from '../repository';
import { MeetingService } from '../service';
import { MeetingNotFoundError, MeetingValidationError } from '../types';
function mockRepo(): MeetingRepository {
  const s = new Map<string, Meeting>();
  const O = '10000000-0000-0000-0000-000000000001';
  return {
    findById: async (id) => s.get(id) ?? null,
    findMany: async () => Array.from(s.values()),
    count: async () => s.size,
    create: async (d: Record<string, unknown>) => { const id = `00000000-0000-0000-0000-${String(s.size+1).padStart(12,'0')}`; const n = new Date(); const m: Meeting = { id, title: (d.title as string)??'', description: (d.description as string)??null, location: (d.location as string)??null, status: (d.status as Meeting['status'])??'SCHEDULED', startedAt: (d.startedAt as Date)??n, endedAt: (d.endedAt as Date)??null, durationMin: (d.durationMin as number)??null, participants: (d.participants as string[])??[], tags: (d.tags as string[])??[], summary: (d.summary as string)??null, transcript: (d.transcript as string)??null, attachments: null, metadata: null, executiveSummary: null, actionItems: null, decisions: null, risks: null, openQuestions: null, followUp: null, timelineEvents: null, processingStatus: null, recordingUrl: null, organizationId: O, createdAt: n, updatedAt: n }; s.set(id, m); return m; },
    update: async (id, d: Record<string, unknown>) => { const e = s.get(id); if (!e) throw new Error('nf'); const u = {...e,...d,updatedAt:new Date()}; s.set(id, u); return u; },
    delete: async (id) => { const e = s.get(id); if (!e) throw new Error('nf'); s.delete(id); return e; },
    deleteMany: async (ids) => { let c=0; for (const id of ids) if (s.delete(id)) c++; return {count:c}; },
    updateMany: async (ids, d: Record<string, unknown>) => { let c=0; for (const id of ids) { const e=s.get(id); if(e) { s.set(id,{...e,...d,updatedAt:new Date()}); c++; } } return {count:c}; },
    stats: async () => ({ total: s.size, scheduled: 0, completed: 0, cancelled: 0 }),
  };
}
describe('MeetingService', () => {
  let svc: MeetingService;
  const O = '10000000-0000-0000-0000-000000000001';
  beforeEach(() => { svc = new MeetingService(mockRepo()); });
  it('creates', async () => { const m = await svc.create(O, { title: 'Test', startedAt: new Date() }); expect(m.title).toBe('Test'); });
  it('findById', async () => { const c = await svc.create(O, { title: 'X', startedAt: new Date() }); const f = await svc.findById(c.id); expect(f.title).toBe('X'); });
  it('not found', async () => { await expect(svc.findById('00000000-0000-0000-0000-999999999999')).rejects.toThrow(MeetingNotFoundError); });
  it('updates', async () => { const c = await svc.create(O, { title: 'Old', startedAt: new Date() }); const u = await svc.update(c.id, { title: 'New' }); expect(u.title).toBe('New'); });
  it('deletes', async () => { const c = await svc.create(O, { title: 'Del', startedAt: new Date() }); await svc.delete(c.id); await expect(svc.findById(c.id)).rejects.toThrow(MeetingNotFoundError); });
  it('lists', async () => { await svc.create(O, { title: 'A', startedAt: new Date() }); await svc.create(O, { title: 'B', startedAt: new Date() }); const r = await svc.findMany(O, { page: 1, pageSize: 10 }); expect(r.items).toHaveLength(2); });
  it('validates', async () => { await expect(svc.create(O, { title: '', startedAt: new Date() })).rejects.toThrow(MeetingValidationError); });
  it('batch', async () => { const a = await svc.create(O, { title: 'A', startedAt: new Date() }); const b = await svc.create(O, { title: 'B', startedAt: new Date() }); const r = await svc.batch(O, { ids: [a.id, b.id], action: 'complete' }); expect(r.count).toBe(2); });
  it('stats', async () => { await svc.create(O, { title: 'S', startedAt: new Date() }); const s = await svc.stats(O); expect(s.total).toBe(1); });
});
