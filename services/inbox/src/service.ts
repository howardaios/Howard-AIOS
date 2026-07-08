import type { InboxItem, Prisma } from '@howard-aios/database';
import type { InboxRepository } from './repository';
import type { Paginated } from '@howard-aios/types';
import {
  CreateInboxItemSchema,
  UpdateInboxItemSchema,
  InboxQuerySchema,
  BatchInboxSchema,
} from './types';
import type {
  CreateInboxItemInput,
  UpdateInboxItemInput,
  InboxQuery,
  BatchInboxInput,
} from './types';

// ─── Errors ───────────────────────────────────────────────────────────────────

export class InboxItemNotFoundError extends Error {
  constructor(id: string) {
    super(`Inbox item not found: ${id}`);
    this.name = 'InboxItemNotFoundError';
  }
}

export class InboxValidationError extends Error {
  constructor(
    message: string,
    public readonly issues: unknown,
  ) {
    super(message);
    this.name = 'InboxValidationError';
  }
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class InboxService {
  constructor(private readonly repository: InboxRepository) {}

  async getById(id: string): Promise<InboxItem> {
    const item = await this.repository.findById(id);
    if (!item) throw new InboxItemNotFoundError(id);
    return item;
  }

  async list(organizationId: string, raw: InboxQuery): Promise<Paginated<InboxItem>> {
    const query = InboxQuerySchema.parse(raw);
    const where = buildWhere(organizationId, query);

    const [data, total] = await Promise.all([
      this.repository.findMany({
        where,
        orderBy: { [query.sortBy]: query.sortOrder },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.repository.count({ where }),
    ]);

    return {
      data,
      total,
      page: query.page,
      pageSize: query.pageSize,
      hasMore: query.page * query.pageSize < total,
    };
  }

  async create(raw: CreateInboxItemInput): Promise<InboxItem> {
    const validated = CreateInboxItemSchema.safeParse(raw);
    if (!validated.success) {
      throw new InboxValidationError('Invalid create input', validated.error.flatten());
    }

    const data: Prisma.InboxItemCreateInput = {
      content: validated.data.content,
      sourceType: validated.data.sourceType,
      organization: { connect: { id: validated.data.organizationId } },
    };

    if (validated.data.title !== undefined) data.title = validated.data.title;
    if (validated.data.sourceDetail !== undefined) data.sourceDetail = validated.data.sourceDetail;
    if (validated.data.priority !== undefined) data.priority = validated.data.priority;
    if (validated.data.rawPayload !== undefined) {
      data.rawPayload = validated.data.rawPayload as Prisma.InputJsonValue;
    }
    if (validated.data.metadata !== undefined) {
      data.metadata = validated.data.metadata as Prisma.InputJsonValue;
    }
    if (validated.data.tags !== undefined) data.tags = validated.data.tags;
    if (validated.data.submittedById !== undefined) {
      data.submittedBy = { connect: { id: validated.data.submittedById } };
    }

    return this.repository.create(data);
  }

  async update(id: string, raw: UpdateInboxItemInput): Promise<InboxItem> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new InboxItemNotFoundError(id);

    const validated = UpdateInboxItemSchema.safeParse(raw);
    if (!validated.success) {
      throw new InboxValidationError('Invalid update input', validated.error.flatten());
    }

    const data: Prisma.InboxItemUpdateInput = {};
    if (validated.data.title !== undefined) data.title = validated.data.title;
    if (validated.data.content !== undefined) data.content = validated.data.content;
    if (validated.data.priority !== undefined) data.priority = validated.data.priority;
    if (validated.data.status !== undefined) data.status = validated.data.status;
    if (validated.data.tags !== undefined) data.tags = validated.data.tags;
    if (validated.data.metadata !== undefined) {
      data.metadata = validated.data.metadata as Prisma.InputJsonValue;
    }

    return this.repository.update(id, data);
  }

  async delete(id: string): Promise<InboxItem> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new InboxItemNotFoundError(id);
    return this.repository.delete(id);
  }

  async archive(id: string): Promise<InboxItem> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new InboxItemNotFoundError(id);
    return this.repository.update(id, {
      status: 'ARCHIVED',
      archivedAt: new Date(),
    });
  }

  async batch(_organizationId: string, raw: BatchInboxInput): Promise<{ count: number }> {
    const validated = BatchInboxSchema.safeParse(raw);
    if (!validated.success) {
      throw new InboxValidationError('Invalid batch input', validated.error.flatten());
    }

    if (validated.data.action === 'archive') {
      return this.repository.updateMany(validated.data.ids, {
        status: 'ARCHIVED',
        archivedAt: new Date(),
      });
    }

    return this.repository.deleteMany(validated.data.ids);
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildWhere(organizationId: string, query: InboxQuery): Prisma.InboxItemWhereInput {
  const where: Prisma.InboxItemWhereInput = { organizationId };

  if (query.sourceType) where.sourceType = query.sourceType;
  if (query.status) where.status = query.status;
  if (query.priority) where.priority = query.priority;
  if (query.search) {
    where.OR = [
      { title: { contains: query.search, mode: 'insensitive' } },
      { content: { contains: query.search, mode: 'insensitive' } },
      { sourceDetail: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  return where;
}
