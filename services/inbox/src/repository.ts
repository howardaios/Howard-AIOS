import type { PrismaClient, InboxItem, Prisma } from '@howard-aios/database';

// ─── Repository Interface ─────────────────────────────────────────────────────

export interface InboxRepository {
  findById(id: string): Promise<InboxItem | null>;
  findMany(args: InboxFindManyArgs): Promise<InboxItem[]>;
  count(args: InboxCountArgs): Promise<number>;
  create(data: Prisma.InboxItemCreateInput): Promise<InboxItem>;
  update(id: string, data: Prisma.InboxItemUpdateInput): Promise<InboxItem>;
  delete(id: string): Promise<InboxItem>;
  deleteMany(ids: string[]): Promise<{ count: number }>;
  updateMany(ids: string[], data: Prisma.InboxItemUpdateInput): Promise<{ count: number }>;
}

export interface InboxFindManyArgs {
  where?: Prisma.InboxItemWhereInput;
  orderBy?: Prisma.InboxItemOrderByWithRelationInput;
  skip?: number;
  take?: number;
}

export interface InboxCountArgs {
  where?: Prisma.InboxItemWhereInput;
}

// ─── Prisma Implementation ────────────────────────────────────────────────────

export class PrismaInboxRepository implements InboxRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<InboxItem | null> {
    return this.prisma.inboxItem.findUnique({ where: { id } });
  }

  async findMany(args: InboxFindManyArgs): Promise<InboxItem[]> {
    return this.prisma.inboxItem.findMany(args);
  }

  async count(args: InboxCountArgs): Promise<number> {
    return this.prisma.inboxItem.count(args);
  }

  async create(data: Prisma.InboxItemCreateInput): Promise<InboxItem> {
    return this.prisma.inboxItem.create({ data });
  }

  async update(id: string, data: Prisma.InboxItemUpdateInput): Promise<InboxItem> {
    return this.prisma.inboxItem.update({ where: { id }, data });
  }

  async delete(id: string): Promise<InboxItem> {
    return this.prisma.inboxItem.delete({ where: { id } });
  }

  async deleteMany(ids: string[]): Promise<{ count: number }> {
    return this.prisma.inboxItem.deleteMany({ where: { id: { in: ids } } });
  }

  async updateMany(
    ids: string[],
    data: Prisma.InboxItemUpdateInput,
  ): Promise<{ count: number }> {
    return this.prisma.inboxItem.updateMany({ where: { id: { in: ids } }, data });
  }
}
