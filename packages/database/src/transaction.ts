/**
 * @howard-aios/database — Transaction helper
 *
 * Provides a safe transaction wrapper around Prisma's $transaction.
 */

import type { PrismaClient } from '@prisma/client';
import { prisma } from './client';

export type TransactionClient = Parameters<Parameters<PrismaClient['$transaction']>[0]>[0];

/**
 * Executes a callback inside a database transaction.
 * Automatically commits on success and rolls back on error.
 */
export async function withTransaction<T>(
  fn: (tx: TransactionClient) => Promise<T>,
  options?: { maxWait?: number; timeout?: number },
): Promise<T> {
  return prisma.$transaction(fn, {
    maxWait: options?.maxWait ?? 5000,
    timeout: options?.timeout ?? 10000,
  });
}
