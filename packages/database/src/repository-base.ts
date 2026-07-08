/**
 * @howard-aios/database — Generic repository base class
 *
 * Provides common CRUD operations for all Prisma models.
 * All repositories must extend this class and enforce organizationId
 * for multi-tenant isolation.
 */

import type { PrismaClient } from '@prisma/client';

export interface ListOptions {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ListResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export abstract class RepositoryBase<TModel> {
  protected readonly prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Build pagination arguments for Prisma queries.
   */
  protected buildPagination(options: ListOptions): { skip: number; take: number } {
    const page = Math.max(options.page ?? 1, 1);
    const pageSize = Math.min(Math.max(options.pageSize ?? 20, 1), 100);
    return {
      skip: (page - 1) * pageSize,
      take: pageSize,
    };
  }

  /**
   * Build a paginated result.
   */
  protected buildListResult(
    data: TModel[],
    total: number,
    options: ListOptions,
  ): ListResult<TModel> {
    const page = Math.max(options.page ?? 1, 1);
    const pageSize = Math.min(Math.max(options.pageSize ?? 20, 1), 100);
    return {
      data,
      total,
      page,
      pageSize,
      hasMore: page * pageSize < total,
    };
  }
}
