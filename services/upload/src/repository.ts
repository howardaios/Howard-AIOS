import { prisma } from '@howard-aios/database';
import type { Prisma } from '@howard-aios/database';
import type { Document } from '@howard-aios/database';
import type { DocumentQuery } from './types';
export interface DocumentRepository {
  findById(id: string): Promise<Document | null>;
  findMany(orgId: string, q: DocumentQuery): Promise<Document[]>;
  count(orgId: string, q: DocumentQuery): Promise<number>;
  create(data: Prisma.DocumentCreateInput): Promise<Document>;
  update(id: string, data: Prisma.DocumentUpdateInput): Promise<Document>;
  delete(id: string): Promise<Document>;
  deleteMany(ids: string[]): Promise<{count:number}>;
  updateMany(ids: string[], data: Prisma.DocumentUpdateInput): Promise<{count:number}>;
  stats(orgId: string): Promise<{total:number;uploading:number;processing:number;completed:number;failed:number}>;
}
function buildWhere(orgId: string, q: DocumentQuery): Prisma.DocumentWhereInput {
  const w: Prisma.DocumentWhereInput = { organizationId: orgId };
  if (q.type) w.type = q.type; if (q.status) w.status = q.status; if (q.tag) w.tags = { has: q.tag };
  if (q.search) w.OR = [{ title: { contains: q.search, mode: 'insensitive' } }, { content: { contains: q.search, mode: 'insensitive' } }];
  return w;
}
export class PrismaDocumentRepository implements DocumentRepository {
  async findById(id: string) { return prisma.document.findUnique({ where: { id } }); }
  async findMany(orgId: string, q: DocumentQuery) { return prisma.document.findMany({ where: buildWhere(orgId,q), skip: (q.page-1)*q.pageSize, take: q.pageSize, orderBy: { [q.sort]: q.order } }); }
  async count(orgId: string, q: DocumentQuery) { return prisma.document.count({ where: buildWhere(orgId,q) }); }
  async create(data: Prisma.DocumentCreateInput) { return prisma.document.create({ data }); }
  async update(id: string, data: Prisma.DocumentUpdateInput) { return prisma.document.update({ where: { id }, data }); }
  async delete(id: string) { return prisma.document.delete({ where: { id } }); }
  async deleteMany(ids: string[]) { return prisma.document.deleteMany({ where: { id: { in: ids } } }); }
  async updateMany(ids: string[], data: Prisma.DocumentUpdateInput) { return prisma.document.updateMany({ where: { id: { in: ids } }, data }); }
  async stats(orgId: string) {
    const b = { organizationId: orgId };
    const [total,uploading,processing,completed,failed] = await Promise.all([prisma.document.count({where:b}), prisma.document.count({where:{...b,status:'UPLOADING'}}), prisma.document.count({where:{...b,status:'PROCESSING'}}), prisma.document.count({where:{...b,status:'COMPLETED'}}), prisma.document.count({where:{...b,status:'FAILED'}})]);
    return { total, uploading, processing, completed, failed };
  }
}
