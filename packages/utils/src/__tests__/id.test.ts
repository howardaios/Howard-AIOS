import { describe, it, expect } from 'vitest';
import { generateId, isValidUuid } from '../id';

describe('id', () => {
  it('should generate a valid UUID', () => {
    const id = generateId();
    expect(id).toBeDefined();
    expect(isValidUuid(id)).toBe(true);
  });

  it('should validate correct UUIDs', () => {
    expect(isValidUuid('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    expect(isValidUuid('not-a-uuid')).toBe(false);
    expect(isValidUuid('')).toBe(false);
  });
});
