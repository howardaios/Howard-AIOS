import { describe, it, expect } from 'vitest';

describe('auth service', () => {
  it('should export types', async () => {
    const mod = await import('../index');
    expect(mod).toBeDefined();
  });
});
