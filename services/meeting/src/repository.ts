import { prisma } from '@howard-aios/database';
import type { Prisma } from '@howard-aios/database';
import type { Meeting } from '@howard-aios/database';
import type { MeetingQuery } from './types';
export interface MeetingRepository {
  findById(id: string): Promise<Meeting | null>;
  findMany(organizationId: string, query: MeetingQuery): Promise<Meeting[]>;
  count(organizationId: string, query: MeetingQuery): Promise<number>;
  create(data: Prisma.MeetingCreateInput): Promise<Meeting>;
  update(id: string, data: Prisma.MeetingUpdateInput): Promise<Meeting>;
  delete(id: string): Promise<Meeting>;
  deleteMany(ids: string[]): Promise<{ count: number }>;
  updateMany(ids: string[], data: Prisma.MeetingUpdateInput): Promise<{ count: number }>;
  stats(organizationId: string): Promise<{ total: number; scheduled: number; completed: number; cancelled: number }>;
}
function buildWhere(organizationId: string, query: MeetingQuery): Prisma.MeetingWhereInput {
  const where: Prisma.MeetingWhereInput = { organizationId };
  if (query.status) where.status = query.status;
  if (query.search) {
    where.OR = [
      { title: { contains: query.search, mode: 'insensitive' } },
      { description: { contains: query.search, mode: 'insensitive' } },
      { summary: { contains: query.search, mode: 'insensitive' } },
    ];
  }
  if (query.tag) where.tags = { has: query.tag };
  if (query.from || query.to) {
    where.startedAt = {};
    if (query.from) (where.startedAt as Record<string, Date>).gte = query.from;
    if (query.to) (where.startedAt as Record<string, Date>).lte = query.to;
  }
  return where;
}
export class PrismaMeetingRepository implements MeetingRepository {
  async findById(id: string) { return prisma.meeting.findUnique({ where: { id } }); }
  async findMany(organizationId: string, query: MeetingQuery) {
    const where = buildWhere(organizationId, query);
    return prisma.meeting.findMany({ where, skip: (query.page - 1) * query.pageSize, take: query.pageSize, orderBy: { [query.sort]: query.order } });
  }
  async count(organizationId: string, query: MeetingQuery) { return prisma.meeting.count({ where: buildWhere(organizationId, query) }); }
  async create(data: Prisma.MeetingCreateInput) { return prisma.meeting.create({ data }); }
  async update(id: string, data: Prisma.MeetingUpdateInput) { return prisma.meeting.update({ where: { id }, data }); }
  async delete(id: string) { return prisma.meeting.delete({ where: { id } }); }
  async deleteMany(ids: string[]) { return prisma.meeting.deleteMany({ where: { id: { in: ids } } }); }
  async updateMany(ids: string[], data: Prisma.MeetingUpdateInput) { return prisma.meeting.updateMany({ where: { id: { in: ids } }, data }); }
  async stats(organizationId: string) {
    const base = { organizationId };
    const [total, scheduled, completed, cancelled] = await Promise.all([
      prisma.meeting.count({ where: base }),
      prisma.meeting.count({ where: { ...base, status: 'SCHEDULED' } }),
      prisma.meeting.count({ where: { ...base, status: 'COMPLETED' } }),
      prisma.meeting.count({ where: { ...base, status: 'CANCELLED' } }),
    ]);
    return { total, scheduled, completed, cancelled };
  }
}
