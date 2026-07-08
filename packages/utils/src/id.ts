import { randomUUID } from 'node:crypto';
import type { ID } from '@howard-aios/types';

export function generateId(): ID {
  return randomUUID();
}

export function isValidUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}
