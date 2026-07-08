import { describe, it, expect, vi } from 'vitest';

vi.mock('@prisma/client', () => {
  return {
    PrismaClient: vi.fn().mockImplementation(() => ({
      $connect: vi.fn(),
      $disconnect: vi.fn(),
      user: { findMany: vi.fn() },
    })),
  };
});

describe('database', () => {
  it('should export prisma singleton from client.ts', async () => {
    const { prisma } = await import('../client');
    expect(prisma).toBeDefined();
    expect(prisma.$connect).toBeDefined();
    expect(prisma.$disconnect).toBeDefined();
  });

  it('should export prisma from index', async () => {
    const { prisma, PrismaClient } = await import('../index');
    expect(prisma).toBeDefined();
    expect(PrismaClient).toBeDefined();
  });

  it('should return same instance (singleton)', async () => {
    const mod1 = await import('../client');
    const mod2 = await import('../client');
    expect(mod1.prisma).toBe(mod2.prisma);
  });
});
