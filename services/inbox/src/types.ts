import { z } from 'zod';
import type { InboxItem, SourceType, InformationStatus, InboxPriority } from '@howard-aios/database';

// ─── Re-export Prisma types as domain types ───────────────────────────────────

export type { InboxItem, SourceType, InformationStatus, InboxPriority };

// ─── Zod Schemas ──────────────────────────────────────────────────────────────

export const SourceTypeValues = [
  'MANUAL',
  'WECHAT',
  'DINGTALK',
  'FEISHU',
  'EMAIL',
  'PLAUD',
  'FILE',
  'OCR',
  'API',
  'WEBHOOK',
] as const;

export const InboxStatusValues = [
  'RECEIVED',
  'NORMALIZED',
  'STORED',
  'ARCHIVED',
] as const;

export const InboxPriorityValues = [
  'LOW',
  'NORMAL',
  'HIGH',
  'URGENT',
] as const;

export const CreateInboxItemSchema = z.object({
  sourceType: z.enum(SourceTypeValues),
  sourceDetail: z.string().max(500).optional(),
  title: z.string().min(1).max(500).optional(),
  content: z.string().min(1),
  priority: z.enum(InboxPriorityValues).default('NORMAL'),
  rawPayload: z.unknown().optional(),
  metadata: z.unknown().optional(),
  tags: z.array(z.string()).default([]),
  organizationId: z.string().uuid(),
  submittedById: z.string().uuid().optional(),
});

export const UpdateInboxItemSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  content: z.string().min(1).optional(),
  priority: z.enum(InboxPriorityValues).optional(),
  status: z.enum(InboxStatusValues).optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.unknown().optional(),
});

export const InboxQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().max(500).optional(),
  sourceType: z.enum(SourceTypeValues).optional(),
  status: z.enum(InboxStatusValues).optional(),
  priority: z.enum(InboxPriorityValues).optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'priority']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const BatchInboxSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(100),
  action: z.enum(['archive', 'delete']),
});

// ─── DTO Types ────────────────────────────────────────────────────────────────

export type CreateInboxItemInput = z.input<typeof CreateInboxItemSchema>;
export type UpdateInboxItemInput = z.infer<typeof UpdateInboxItemSchema>;
export type InboxQuery = z.input<typeof InboxQuerySchema>;
export type BatchInboxInput = z.infer<typeof BatchInboxSchema>;
