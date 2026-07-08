import { z } from 'zod';
export type { Document } from '@howard-aios/database';
export type { Prisma } from '@howard-aios/database';
export const UploadStatusValues = ['UPLOADING', 'PROCESSING', 'COMPLETED', 'FAILED'] as const;
export type UploadStatus = (typeof UploadStatusValues)[number];
export const SUPPORTED_FILE_TYPES = ['audio/mpeg','audio/wav','video/mp4','video/webm','application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','application/vnd.ms-powerpoint','text/markdown','text/plain','image/jpeg','image/png','image/gif','image/webp','application/zip'] as const;
export const FILE_TYPE_LABELS: Record<string, string> = { audio: 'Audio', video: 'Video', pdf: 'PDF', word: 'Word', excel: 'Excel', powerpoint: 'PPT', markdown: 'Markdown', text: 'TXT', image: 'Image', zip: 'ZIP' };
export const MAX_FILE_SIZE = 500 * 1024 * 1024;
export const CreateDocumentSchema = z.object({ title: z.string().min(1).max(500), content: z.string().max(100000).optional(), source: z.string().max(500).default('upload'), type: z.string().min(1).max(50), mimeType: z.string().optional(), fileSize: z.number().int().positive().optional(), fileUrl: z.string().optional(), status: z.enum(['UPLOADING','PROCESSING','COMPLETED','FAILED']).default('COMPLETED'), tags: z.array(z.string()).default([]), metadata: z.unknown().optional() });
export const UpdateDocumentSchema = CreateDocumentSchema.partial();
export const DocumentQuerySchema = z.object({ page: z.coerce.number().int().positive().default(1), pageSize: z.coerce.number().int().min(1).max(100).default(20), type: z.string().optional(), status: z.enum(['UPLOADING','PROCESSING','COMPLETED','FAILED']).optional(), search: z.string().optional(), tag: z.string().optional(), sort: z.enum(['createdAt','title','fileSize']).default('createdAt'), order: z.enum(['asc','desc']).default('desc') });
export const BatchDocumentSchema = z.object({ ids: z.array(z.string().uuid()).min(1).max(100), action: z.enum(['delete','archive']) });
export type CreateDocumentInput = z.input<typeof CreateDocumentSchema>;
export type UpdateDocumentInput = z.input<typeof UpdateDocumentSchema>;
export type DocumentQuery = z.infer<typeof DocumentQuerySchema>;
export type BatchDocumentInput = z.infer<typeof BatchDocumentSchema>;
export interface UploadProgress { id: string; fileName: string; progress: number; status: 'pending'|'uploading'|'processing'|'completed'|'failed'; error?: string; }
export interface UploadStats { total: number; uploading: number; processing: number; completed: number; failed: number; totalSize: number; }
export class DocumentNotFoundError extends Error { constructor(id: string) { super('Document not found: '+id); this.name='DocumentNotFoundError'; } }
export class UploadValidationError extends Error { details: unknown; constructor(m: string, d?: unknown) { super(m); this.name='UploadValidationError'; this.details=d; } }
