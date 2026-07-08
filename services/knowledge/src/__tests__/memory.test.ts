import { describe, it, expect } from 'vitest';
import { MemoryService } from '../memory';

/**
 * Test pure logic methods of MemoryService.
 * Service CRUD methods require Prisma (integration tests).
 */
describe('Memory Service - Pure Logic', () => {
  // Access private methods via type cast for unit testing
  function getPrivateMethod(svc: MemoryService, name: string) {
    return (svc as unknown as Record<string, (...args: unknown[]) => unknown>)[name].bind(svc);
  }

  it('should calculate importance correctly', () => {
    const svc = new MemoryService();
    const calc = getPrivateMethod(svc, 'calculateImportance') as (text: string) => number;

    expect(calc('A regular note')).toBeLessThanOrEqual(0.6);
    expect(calc('This is critical and urgent')).toBeGreaterThanOrEqual(0.7);
    expect(calc('Important decision was agreed and approved')).toBeGreaterThan(0.8);
    expect(calc('A'.repeat(150))).toBeGreaterThan(0.5);
  });

  it('should extract relevant tags', () => {
    const svc = new MemoryService();
    const extract = getPrivateMethod(svc, 'extractTags') as (text: string) => string[];

    expect(extract('The meeting discussion was productive')).toContain('meeting');
    expect(extract('This is a task that needs to be done')).toContain('task');
    expect(extract('The decision was agreed upon')).toContain('decision');
    expect(extract('There is a risk concern with this approach')).toContain('risk');
    expect(extract('Random text without tags')).toHaveLength(0);
  });

  it('should calculate similarity correctly', () => {
    const svc = new MemoryService();
    const sim = getPrivateMethod(svc, 'similarity') as (a: string, b: string) => number;

    expect(sim('the quick brown fox', 'the quick brown fox')).toBe(1);
    expect(sim('hello world', 'goodbye universe')).toBe(0);
    expect(sim('TypeScript is great for building apps', 'TypeScript is good for creating apps')).toBeGreaterThan(0.4);
  });

  it('should have higher similarity for near-duplicate text', () => {
    const svc = new MemoryService();
    const sim = getPrivateMethod(svc, 'similarity') as (a: string, b: string) => number;

    const high = sim('Decision to use TypeScript for the project', 'Decision to use TypeScript for the new project');
    const low = sim('TypeScript is great', 'Python is good for data science');
    expect(high).toBeGreaterThan(low);
  });

  it('should handle edge cases in similarity', () => {
    const svc = new MemoryService();
    const sim = getPrivateMethod(svc, 'similarity') as (a: string, b: string) => number;

    // Empty strings both produce [''] from split, so Jaccard = 1
    expect(sim('', '')).toBe(1);
    expect(sim('hello', 'hello')).toBe(1);
  });

  it('should cap importance at 1.0', () => {
    const svc = new MemoryService();
    const calc = getPrivateMethod(svc, 'calculateImportance') as (text: string) => number;

    const text = 'critical urgent important must key essential deadline asap immediately decision agreed approved rejected ' + 'x'.repeat(100);
    expect(calc(text)).toBeLessThanOrEqual(1);
  });
});
