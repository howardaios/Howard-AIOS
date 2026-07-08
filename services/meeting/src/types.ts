import { z } from 'zod';
export type { Meeting } from '@howard-aios/database';
export type { Prisma } from '@howard-aios/database';
export const MeetingStatusValues = ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] as const;
export type MeetingStatus = (typeof MeetingStatusValues)[number];
export const CreateMeetingSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().max(5000).optional(),
  location: z.string().max(500).optional(),
  status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).default('SCHEDULED'),
  startedAt: z.coerce.date(),
  endedAt: z.coerce.date().optional(),
  durationMin: z.number().int().positive().optional(),
  participants: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  summary: z.string().max(10000).optional(),
  transcript: z.string().optional(),
  attachments: z.unknown().optional(),
  metadata: z.unknown().optional(),
});
export const UpdateMeetingSchema = CreateMeetingSchema.partial();
export const MeetingQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  search: z.string().optional(),
  tag: z.string().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  sort: z.enum(['startedAt', 'createdAt', 'title']).default('startedAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
});
export const BatchMeetingSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(100),
  action: z.enum(['delete', 'complete']),
});
export type CreateMeetingInput = z.input<typeof CreateMeetingSchema>;
export type UpdateMeetingInput = z.input<typeof UpdateMeetingSchema>;
export type MeetingQuery = z.infer<typeof MeetingQuerySchema>;
export type BatchMeetingInput = z.infer<typeof BatchMeetingSchema>;
export interface MeetingParticipant { name: string; email?: string; role?: 'host' | 'participant' | 'observer'; }
export interface MeetingTimeline { id: string; title: string; status: MeetingStatus; startedAt: Date; endedAt: Date | null; participants: string[]; summary: string | null; }
export interface MeetingStats { total: number; scheduled: number; completed: number; cancelled: number; }
export class MeetingNotFoundError extends Error { constructor(id: string) { super(`Meeting not found: ${id}`); this.name = 'MeetingNotFoundError'; } }
export class MeetingValidationError extends Error { details: unknown; constructor(message: string, details?: unknown) { super(message); this.name = 'MeetingValidationError'; this.details = details; } }
