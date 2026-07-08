import { z } from 'zod';
import type { Information, SourceType, InformationStatus } from '@howard-aios/database';

// ─── Re-export Prisma types as domain types ───────────────────────────────────

export type { Information, SourceType, InformationStatus };

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

export const InformationStatusValues = [
  'RECEIVED',
  'NORMALIZED',
  'STORED',
  'ARCHIVED',
] as const;

export const CreateInformationSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  content: z.string().min(1),
  sourceType: z.enum(SourceTypeValues),
  sourceDetail: z.string().max(500).optional(),
  rawPayload: z.unknown().optional(),
  submittedById: z.string().uuid().optional(),
  organizationId: z.string().uuid(),
});

export const UpdateInformationSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  content: z.string().min(1).optional(),
  sourceType: z.enum(SourceTypeValues).optional(),
  sourceDetail: z.string().max(500).optional(),
  rawPayload: z.unknown().optional(),
  status: z.enum(InformationStatusValues).optional(),
});

export const InformationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().max(500).optional(),
  sourceType: z.enum(SourceTypeValues).optional(),
  status: z.enum(InformationStatusValues).optional(),
  sortBy: z.enum(['createdAt', 'updatedAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ─── DTO Types ────────────────────────────────────────────────────────────────

export type CreateInformationInput = z.infer<typeof CreateInformationSchema>;
export type UpdateInformationInput = z.infer<typeof UpdateInformationSchema>;
export type InformationQuery = z.input<typeof InformationQuerySchema>;
