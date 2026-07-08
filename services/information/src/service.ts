import type { Information, Prisma } from '@howard-aios/database';
import type { InformationRepository } from './repository';
import type { Paginated } from '@howard-aios/types';
import {
  CreateInformationSchema,
  UpdateInformationSchema,
  InformationQuerySchema,
} from './types';
import type {
  CreateInformationInput,
  UpdateInformationInput,
  InformationQuery,
} from './types';

// ─── Errors ───────────────────────────────────────────────────────────────────

export class InformationNotFoundError extends Error {
  constructor(id: string) {
    super(`Information not found: ${id}`);
    this.name = 'InformationNotFoundError';
  }
}

export class InformationValidationError extends Error {
  constructor(
    message: string,
    public readonly issues: unknown,
  ) {
    super(message);
    this.name = 'InformationValidationError';
  }
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class InformationService {
  constructor(private readonly repository: InformationRepository) {}

  async getById(id: string): Promise<Information> {
    const record = await this.repository.findById(id);
    if (!record) throw new InformationNotFoundError(id);
    return record;
  }

  async list(organizationId: string, raw: InformationQuery): Promise<Paginated<Information>> {
    const query = InformationQuerySchema.parse(raw);
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

  async create(raw: CreateInformationInput): Promise<Information> {
    const validated = CreateInformationSchema.safeParse(raw);
    if (!validated.success) {
      throw new InformationValidationError('Invalid create input', validated.error.flatten());
    }

    const data: Prisma.InformationCreateInput = {
      content: validated.data.content,
      sourceType: validated.data.sourceType,
      organization: { connect: { id: validated.data.organizationId } },
    };

    if (validated.data.title !== undefined) data.title = validated.data.title;
    if (validated.data.sourceDetail !== undefined) data.sourceDetail = validated.data.sourceDetail;
    if (validated.data.rawPayload !== undefined) {
      data.rawPayload = validated.data.rawPayload as Prisma.InputJsonValue;
    }
    if (validated.data.submittedById !== undefined) {
      data.submittedBy = { connect: { id: validated.data.submittedById } };
    }

    return this.repository.create(data);
  }

  async update(id: string, raw: UpdateInformationInput): Promise<Information> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new InformationNotFoundError(id);

    const validated = UpdateInformationSchema.safeParse(raw);
    if (!validated.success) {
      throw new InformationValidationError('Invalid update input', validated.error.flatten());
    }

    const data: Prisma.InformationUpdateInput = {};
    if (validated.data.title !== undefined) data.title = validated.data.title;
    if (validated.data.content !== undefined) data.content = validated.data.content;
    if (validated.data.sourceType !== undefined) data.sourceType = validated.data.sourceType;
    if (validated.data.sourceDetail !== undefined) data.sourceDetail = validated.data.sourceDetail;
    if (validated.data.rawPayload !== undefined) {
      data.rawPayload = validated.data.rawPayload as Prisma.InputJsonValue;
    }
    if (validated.data.status !== undefined) data.status = validated.data.status;

    return this.repository.update(id, data);
  }

  async delete(id: string): Promise<Information> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new InformationNotFoundError(id);
    return this.repository.delete(id);
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildWhere(organizationId: string, query: InformationQuery): Prisma.InformationWhereInput {
  const where: Prisma.InformationWhereInput = { organizationId };

  if (query.sourceType) where.sourceType = query.sourceType;
  if (query.status) where.status = query.status;
  if (query.search) {
    where.OR = [
      { title: { contains: query.search, mode: 'insensitive' } },
      { content: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  return where;
}
