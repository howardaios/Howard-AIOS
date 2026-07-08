import { describe, it, expect } from 'vitest';

describe('rbac service', () => {
  it('should export types', async () => {
    const mod = await import('../index');
    expect(mod).toBeDefined();
  });
});
