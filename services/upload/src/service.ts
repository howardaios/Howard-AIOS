import type { Document, Prisma } from '@howard-aios/database';
import type { DocumentRepository } from './repository';
import { PrismaDocumentRepository } from './repository';
import { CreateDocumentSchema, UpdateDocumentSchema, DocumentQuerySchema, BatchDocumentSchema, DocumentNotFoundError, UploadValidationError, type CreateDocumentInput, type UpdateDocumentInput, type DocumentQuery, type BatchDocumentInput, type UploadStats } from './types';
export class UploadService {
  private repo: DocumentRepository;
  constructor(repo?: DocumentRepository) { this.repo = repo ?? new PrismaDocumentRepository(); }
  async findById(id: string): Promise<Document> { const d = await this.repo.findById(id); if (!d) throw new DocumentNotFoundError(id); return d; }
  async findMany(orgId: string, raw: Partial<DocumentQuery>): Promise<{ items: Document[]; total: number; page: number; pageSize: number }> {
    const v = DocumentQuerySchema.safeParse(raw); if (!v.success) throw new UploadValidationError('Invalid query', v.error.flatten());
    const q = v.data;
    const [items, total] = await Promise.all([this.repo.findMany(orgId, q), this.repo.count(orgId, q)]);
    return { items, total, page: q.page, pageSize: q.pageSize };
  }
  async create(orgId: string, raw: CreateDocumentInput): Promise<Document> {
    const v = CreateDocumentSchema.safeParse(raw); if (!v.success) throw new UploadValidationError('Invalid input', v.error.flatten());
    const d = v.data;
    return this.repo.create({ title: d.title, content: d.content, source: d.source ?? 'upload', type: d.type, mimeType: d.mimeType, fileSize: d.fileSize, fileUrl: d.fileUrl, status: d.status ?? 'COMPLETED', tags: d.tags ?? [], metadata: (d.metadata as Prisma.InputJsonValue | undefined) ?? undefined, organization: { connect: { id: orgId } } });
  }
  async update(id: string, raw: UpdateDocumentInput): Promise<Document> {
    await this.findById(id);
    const v = UpdateDocumentSchema.safeParse(raw); if (!v.success) throw new UploadValidationError('Invalid input', v.error.flatten());
    const d = v.data;
    return this.repo.update(id, { title: d.title, content: d.content, source: d.source, type: d.type, mimeType: d.mimeType, fileSize: d.fileSize, fileUrl: d.fileUrl, status: d.status, tags: d.tags, metadata: (d.metadata as Prisma.InputJsonValue | undefined) ?? undefined });
  }
  async delete(id: string): Promise<Document> { await this.findById(id); return this.repo.delete(id); }
  async batch(_orgId: string, raw: BatchDocumentInput): Promise<{count:number}> {
    const v = BatchDocumentSchema.safeParse(raw); if (!v.success) throw new UploadValidationError('Invalid batch', v.error.flatten());
    if (v.data.action === 'archive') return this.repo.updateMany(v.data.ids, { status: 'COMPLETED' });
    return this.repo.deleteMany(v.data.ids);
  }
  async stats(orgId: string): Promise<UploadStats> { const s = await this.repo.stats(orgId); return { ...s, totalSize: 0 }; }
  async simulateUpload(orgId: string, fileName: string, mimeType: string, fileSize: number): Promise<Document> {
    return this.create(orgId, { title: fileName, type: fileName.split('.').pop() ?? 'unknown', mimeType, fileSize, status: 'COMPLETED', source: 'upload' });
  }
}
export { DocumentNotFoundError, UploadValidationError };
