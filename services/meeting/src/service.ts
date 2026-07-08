import type { Meeting, Prisma } from '@howard-aios/database';
import type { MeetingRepository } from './repository';
import { PrismaMeetingRepository } from './repository';
import { CreateMeetingSchema, UpdateMeetingSchema, MeetingQuerySchema, BatchMeetingSchema, MeetingNotFoundError, MeetingValidationError, type CreateMeetingInput, type UpdateMeetingInput, type MeetingQuery, type BatchMeetingInput, type MeetingStats } from './types';
import { MeetingIntelligenceService } from './meeting-intelligence';

export class MeetingService {
  private repo: MeetingRepository;
  private intelligence: MeetingIntelligenceService;

  constructor(repo?: MeetingRepository) {
    this.repo = repo ?? new PrismaMeetingRepository();
    this.intelligence = new MeetingIntelligenceService();
  }

  async findById(id: string): Promise<Meeting> {
    const m = await this.repo.findById(id);
    if (!m) throw new MeetingNotFoundError(id);
    return m;
  }

  async findMany(orgId: string, raw: Partial<MeetingQuery>): Promise<{ items: Meeting[]; total: number; page: number; pageSize: number }> {
    const v = MeetingQuerySchema.safeParse(raw);
    if (!v.success) throw new MeetingValidationError('Invalid query', v.error.flatten());
    const q = v.data;
    const [items, total] = await Promise.all([this.repo.findMany(orgId, q), this.repo.count(orgId, q)]);
    return { items, total, page: q.page, pageSize: q.pageSize };
  }

  async create(orgId: string, raw: CreateMeetingInput): Promise<Meeting> {
    const v = CreateMeetingSchema.safeParse(raw);
    if (!v.success) throw new MeetingValidationError('Invalid input', v.error.flatten());
    const d = v.data;
    return this.repo.create({
      title: d.title,
      description: d.description,
      location: d.location,
      status: d.status ?? 'SCHEDULED',
      startedAt: d.startedAt,
      endedAt: d.endedAt,
      durationMin: d.durationMin,
      participants: d.participants ?? [],
      tags: d.tags ?? [],
      summary: d.summary,
      transcript: d.transcript,
      attachments: (d.attachments as Prisma.InputJsonValue | undefined) ?? undefined,
      metadata: (d.metadata as Prisma.InputJsonValue | undefined) ?? undefined,
      organization: { connect: { id: orgId } },
    });
  }

  async update(id: string, raw: UpdateMeetingInput): Promise<Meeting> {
    await this.findById(id);
    const v = UpdateMeetingSchema.safeParse(raw);
    if (!v.success) throw new MeetingValidationError('Invalid input', v.error.flatten());
    const d = v.data;
    return this.repo.update(id, {
      title: d.title,
      description: d.description,
      location: d.location,
      status: d.status,
      startedAt: d.startedAt,
      endedAt: d.endedAt,
      durationMin: d.durationMin,
      participants: d.participants,
      tags: d.tags,
      summary: d.summary,
      transcript: d.transcript,
      attachments: (d.attachments as Prisma.InputJsonValue | undefined) ?? undefined,
      metadata: (d.metadata as Prisma.InputJsonValue | undefined) ?? undefined,
    });
  }

  async delete(id: string): Promise<Meeting> {
    await this.findById(id);
    return this.repo.delete(id);
  }

  async batch(_orgId: string, raw: BatchMeetingInput): Promise<{ count: number }> {
    const v = BatchMeetingSchema.safeParse(raw);
    if (!v.success) throw new MeetingValidationError('Invalid batch', v.error.flatten());
    if (v.data.action === 'complete') return this.repo.updateMany(v.data.ids, { status: 'COMPLETED', endedAt: new Date() });
    return this.repo.deleteMany(v.data.ids);
  }

  async stats(orgId: string): Promise<MeetingStats> {
    return this.repo.stats(orgId);
  }

  async generateSummary(id: string): Promise<{
    summary: string;
    executiveSummary: string;
    actionItems: unknown[];
    decisions: unknown[];
    risks: unknown[];
    openQuestions: string[];
    followUp: string[];
    timeline: unknown[];
  }> {
    const meeting = await this.findById(id);
    const transcript = meeting.transcript ?? meeting.summary ?? '';

    if (!transcript || transcript.length < 10) {
      return {
        summary: 'No transcript available for AI summary generation.',
        executiveSummary: '',
        actionItems: [],
        decisions: [],
        risks: [],
        openQuestions: [],
        followUp: [],
        timeline: [],
      };
    }

    const result = this.intelligence.processMeeting({
      meetingId: id,
      transcript,
      participants: meeting.participants,
      title: meeting.title,
    });

    // Update meeting with AI-generated data
    await this.repo.update(id, {
      summary: result.summary.executiveSummary,
      executiveSummary: result.summary.executiveSummary,
      actionItems: result.summary.actionItems as unknown as Prisma.InputJsonValue,
      decisions: result.summary.decisions as unknown as Prisma.InputJsonValue,
      risks: result.summary.risks as unknown as Prisma.InputJsonValue,
      openQuestions: result.summary.openQuestions as unknown as Prisma.InputJsonValue,
      followUp: result.summary.followUp as unknown as Prisma.InputJsonValue,
      timelineEvents: result.summary.timeline as unknown as Prisma.InputJsonValue,
      processingStatus: 'COMPLETED',
    });

    return {
      summary: result.summary.executiveSummary,
      executiveSummary: result.summary.executiveSummary,
      actionItems: result.summary.actionItems,
      decisions: result.summary.decisions,
      risks: result.summary.risks,
      openQuestions: result.summary.openQuestions,
      followUp: result.summary.followUp,
      timeline: result.summary.timeline,
    };
  }

  getIntelligenceService(): MeetingIntelligenceService {
    return this.intelligence;
  }
}

export { MeetingNotFoundError, MeetingValidationError };
