/**
 * @howard-aios/database — barrel export
 *
 * Prisma Client is the single source of truth for database types.
 * This package provides client access, base repository, and transaction helpers.
 */

export { prisma } from './client';
export { PrismaClient, Prisma } from '@prisma/client';
export type * from '@prisma/client';
export { RepositoryBase } from './repository-base';
export type { ListOptions, ListResult } from './repository-base';
export { withTransaction } from './transaction';
export type { TransactionClient } from './transaction';
