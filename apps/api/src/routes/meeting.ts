import type { FastifyPluginAsync, FastifyRequest } from 'fastify';
import { MeetingService, CreateMeetingSchema, UpdateMeetingSchema, BatchMeetingSchema, RecordingService, MeetingIntelligenceService } from '@howard-aios/meeting';
import { SpeechService } from '@howard-aios/speech';
import { KnowledgeService } from '@howard-aios/knowledge';
import { MemoryService } from '@howard-aios/knowledge/memory';
import { prisma } from '@howard-aios/database';

const svc = new MeetingService();
const recordingSvc = new RecordingService();
const intelligence = new MeetingIntelligenceService();
const speechSvc = new SpeechService();
const knowledgeSvc = new KnowledgeService();
const memorySvc = new MemoryService();

const ORG_ID = '10000000-0000-0000-0000-000000000001';

function getOrgId(req: FastifyRequest): string {
  const header = req.headers['x-organization-id'];
  return (Array.isArray(header) ? header[0] : header) ?? ORG_ID;
}

export const meetingRoutes: FastifyPluginAsync = async (app) => {
  // ── Meeting CRUD ────────────────────────────────────────────────────────────

  app.post('/meetings', { schema: { description: 'Create meeting', tags: ['Meeting'] } }, async (req, reply) => {
    const orgId = getOrgId(req);
    const body = CreateMeetingSchema.parse(req.body);
    const m = await svc.create(orgId, body);
    return reply.status(201).send({ success: true, code: 201, message: 'Created', data: m });
  });

  app.get('/meetings', { schema: { description: 'List meetings', tags: ['Meeting'] } }, async (req, reply) => {
    const orgId = getOrgId(req);
    const r = await svc.findMany(orgId, req.query as Record<string, unknown>);
    return reply.send({ success: true, code: 200, message: 'OK', data: r });
  });

  app.get('/meetings/stats', { schema: { description: 'Meeting stats', tags: ['Meeting'] } }, async (req, reply) => {
    const orgId = getOrgId(req);
    return reply.send({ success: true, code: 200, message: 'OK', data: await svc.stats(orgId) });
  });

  app.get('/meetings/:id', { schema: { description: 'Get meeting', tags: ['Meeting'] } }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const meeting = await svc.findById(id);
    const recordings = await recordingSvc.findByMeetingId(id);
    return reply.send({ success: true, code: 200, message: 'OK', data: { ...meeting, recordings } });
  });

  app.patch('/meetings/:id', { schema: { description: 'Update meeting', tags: ['Meeting'] } }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const body = UpdateMeetingSchema.parse(req.body);
    return reply.send({ success: true, code: 200, message: 'Updated', data: await svc.update(id, body) });
  });

  app.delete('/meetings/:id', { schema: { description: 'Delete meeting', tags: ['Meeting'] } }, async (req, reply) => {
    const { id } = req.params as { id: string };
    await svc.delete(id);
    return reply.send({ success: true, code: 200, message: 'Deleted', data: null });
  });

  app.post('/meetings/:id/complete', { schema: { description: 'Complete meeting', tags: ['Meeting'] } }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const meeting = await svc.findById(id);
    const updated = await svc.update(id, { status: 'COMPLETED', endedAt: new Date() });

    // Auto-create CEO inbox entry
    try {
      await prisma.inboxItem.create({
        data: {
          sourceType: 'API',
          title: `Meeting Completed: ${meeting.title}`,
          content: `Meeting "${meeting.title}" has been completed. Participants: ${(meeting.participants ?? []).join(', ')}`,
          priority: 'NORMAL',
          status: 'RECEIVED',
          organizationId: meeting.organizationId,
          tags: ['meeting', 'ceo-inbox'],
        },
      });
    } catch {
      // Non-critical: don't fail the completion if inbox creation fails
    }

    return reply.send({ success: true, code: 200, message: 'Completed', data: updated });
  });

  app.post('/meetings/batch', { schema: { description: 'Batch meetings', tags: ['Meeting'] } }, async (req, reply) => {
    const orgId = getOrgId(req);
    const body = BatchMeetingSchema.parse(req.body);
    return reply.send({ success: true, code: 200, message: 'Done', data: await svc.batch(orgId, body) });
  });

  // ── AI Summary ──────────────────────────────────────────────────────────────

  app.post('/meetings/:id/summary', { schema: { description: 'Generate AI summary', tags: ['Meeting'] } }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const result = await svc.generateSummary(id);
    return reply.send({ success: true, code: 200, message: 'Summary generated', data: result });
  });

  // ── Full Processing Pipeline ────────────────────────────────────────────────

  app.post('/meetings/:id/process', { schema: { description: 'Full meeting processing (AI summary + knowledge + memory)', tags: ['Meeting'] } }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const meeting = await svc.findById(id);

    // Get transcript from meeting or recordings
    let transcript = meeting.transcript ?? '';
    if (!transcript) {
      const recordings = await recordingSvc.findByMeetingId(id);
      for (const rec of recordings) {
        if (rec.transcript) transcript += rec.transcript + '\n';
      }
    }

    if (!transcript || transcript.length < 10) {
      return reply.send({ success: false, code: 400, message: 'No transcript available for processing', data: null });
    }

    // Generate AI summary
    const result = intelligence.processMeeting({
      meetingId: id,
      transcript,
      participants: meeting.participants,
      title: meeting.title,
    });

    // Update meeting with summary
    await svc.update(id, {
      summary: result.summary.executiveSummary,
    });

    // Extract knowledge
    const knowledgeText = intelligence.extractKnowledgeText(result.summary);
    const knowledgeResult = await knowledgeSvc.extractAndStore(knowledgeText, 'meeting', id, meeting.organizationId);

    // Extract memories
    const memoryText = intelligence.extractMemoryText(result.summary, meeting.title);
    const memories = await memorySvc.extract(memoryText, 'meeting', id, meeting.organizationId);

    return reply.send({
      success: true,
      code: 200,
      message: 'Meeting processed',
      data: {
        summary: result.summary,
        knowledgeNodesCreated: knowledgeResult.nodes.length,
        knowledgeEdgesCreated: knowledgeResult.edges.length,
        memoriesCreated: memories.length,
        processingTimeMs: result.processingTimeMs,
      },
    });
  });

  // ── Meeting Intelligence ────────────────────────────────────────────────────

  app.get('/meetings/:id/tasks', { schema: { description: 'Get meeting tasks', tags: ['Meeting'] } }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const meeting = await svc.findById(id);
    const text = meeting.transcript ?? meeting.summary ?? '';
    const tasks = intelligence.extractTasks(text, meeting.participants);
    return reply.send({ success: true, code: 200, message: 'OK', data: tasks });
  });

  app.get('/meetings/:id/decisions', { schema: { description: 'Get meeting decisions', tags: ['Meeting'] } }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const meeting = await svc.findById(id);
    const text = meeting.transcript ?? meeting.summary ?? '';
    const decisions = intelligence.extractDecisions(text);
    return reply.send({ success: true, code: 200, message: 'OK', data: decisions });
  });

  app.get('/meetings/:id/timeline', { schema: { description: 'Get meeting timeline', tags: ['Meeting'] } }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const meeting = await svc.findById(id);
    const timelineEvents = (meeting as Record<string, unknown>).timelineEvents ?? [];
    return reply.send({ success: true, code: 200, message: 'OK', data: timelineEvents });
  });

  app.get('/meetings/:id/knowledge', { schema: { description: 'Get meeting knowledge', tags: ['Meeting'] } }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const nodes = await knowledgeSvc.search(id, 50);
    return reply.send({ success: true, code: 200, message: 'OK', data: nodes });
  });

  // ── Recordings ──────────────────────────────────────────────────────────────

  app.get('/meetings/:id/recordings', { schema: { description: 'List meeting recordings', tags: ['Recording'] } }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const recordings = await recordingSvc.findByMeetingId(id);
    return reply.send({ success: true, code: 200, message: 'OK', data: recordings });
  });

  app.post('/meetings/:id/recordings', { schema: { description: 'Upload recording', tags: ['Recording'] } }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const orgId = getOrgId(req);
    const body = req.body as { title: string; fileName?: string; mimeType?: string; fileSize?: number; duration?: number; speakerCount?: number; language?: string };
    const recording = await recordingSvc.create(orgId, {
      meetingId: id,
      title: body.title,
      fileName: body.fileName,
      mimeType: body.mimeType,
      fileSize: body.fileSize,
      duration: body.duration,
      speakerCount: body.speakerCount,
      language: body.language,
    });
    return reply.status(201).send({ success: true, code: 201, message: 'Recording uploaded', data: recording });
  });

  app.post('/meetings/:id/recordings/:recId/transcribe', { schema: { description: 'Transcribe recording', tags: ['Recording'] } }, async (req, reply) => {
    const { recId } = req.params as { id: string; recId: string };
    const recording = await recordingSvc.findById(recId);
    if (!recording) return reply.status(404).send({ success: false, code: 404, message: 'Recording not found', data: null });

    await recordingSvc.updateStatus(recId, 'TRANSCRIBING');

    // Use speech service to transcribe
    const transcript = await speechSvc.transcribe({
      mimeType: recording.mimeType ?? 'audio/mpeg',
      language: recording.language,
      speakerCount: recording.speakerCount,
    });

    await recordingSvc.updateTranscript(recId, transcript.text, transcript);

    // Also update meeting transcript if not set
    const meeting = await svc.findById(recording.meetingId);
    if (!meeting.transcript) {
      await svc.update(meeting.id, { transcript: transcript.text });
    }

    return reply.send({ success: true, code: 200, message: 'Transcribed', data: transcript });
  });

  app.get('/recordings/:recId/progress', { schema: { description: 'Get upload progress', tags: ['Recording'] } }, async (req, reply) => {
    const { recId } = req.params as { recId: string };
    const progress = recordingSvc.getProgress(recId);
    if (!progress) return reply.status(404).send({ success: false, code: 404, message: 'Not found', data: null });
    return reply.send({ success: true, code: 200, message: 'OK', data: progress });
  });

  app.get('/recordings', { schema: { description: 'List all recordings', tags: ['Recording'] } }, async (req, reply) => {
    const orgId = getOrgId(req);
    const recordings = await recordingSvc.listByOrg(orgId);
    return reply.send({ success: true, code: 200, message: 'OK', data: recordings });
  });
};
