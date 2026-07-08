import { describe, it, expect } from 'vitest';
import { KnowledgeExtractor } from '../index';

describe('Knowledge Extractor', () => {
  const extractor = new KnowledgeExtractor();

  it('should extract people from text', () => {
    const result = extractor.extract('John Smith said we need to improve performance. Jane Doe agreed with the plan.', 'meeting', 'm1');
    const people = result.nodes.filter((n) => n.type === 'person');
    expect(people.length).toBeGreaterThan(0);
  });

  it('should extract tasks', () => {
    const result = extractor.extract('TODO: fix the login bug. We need to deploy the new feature by Friday.', 'meeting', 'm2');
    const tasks = result.nodes.filter((n) => n.type === 'task');
    expect(tasks.length).toBeGreaterThan(0);
  });

  it('should extract decisions', () => {
    const result = extractor.extract('We decided to use PostgreSQL for the database. The team agreed on TypeScript.', 'meeting', 'm3');
    const decisions = result.nodes.filter((n) => n.type === 'decision');
    expect(decisions.length).toBeGreaterThan(0);
  });

  it('should extract risks', () => {
    const result = extractor.extract('Risk: the deadline might be too tight. Concern: we have limited testing coverage.', 'meeting', 'm4');
    const risks = result.nodes.filter((n) => n.type === 'risk');
    expect(risks.length).toBeGreaterThan(0);
  });

  it('should extract keywords', () => {
    const result = extractor.extract('The database performance optimization requires careful indexing strategy for PostgreSQL queries.', 'doc', 'd1');
    const keywords = result.nodes.filter((n) => n.type === 'keyword');
    expect(keywords.length).toBeGreaterThan(0);
  });

  it('should extract dates', () => {
    const result = extractor.extract('The meeting is scheduled for 2026-07-15 and the deadline is 2026-08-01.', 'meeting', 'm5');
    const timeline = result.nodes.filter((n) => n.type === 'timeline');
    expect(timeline.length).toBe(2);
  });

  it('should create edges between co-occurring people', () => {
    const result = extractor.extract('John Smith said hello. Jane Doe mentioned the project. Bob Wilson agreed.', 'meeting', 'm6');
    const people = result.nodes.filter((n) => n.type === 'person');
    expect(people.length).toBeGreaterThanOrEqual(2);
    expect(result.edges.length).toBeGreaterThan(0);
    expect(result.edges[0].type).toBe('related_to');
  });

  it('should return correct extraction result structure', () => {
    const result = extractor.extract('TODO: review the architecture.', 'meeting', 'm7');
    expect(result.source).toBe('meeting');
    expect(result.sourceId).toBe('m7');
    expect(Array.isArray(result.nodes)).toBe(true);
    expect(Array.isArray(result.edges)).toBe(true);
  });
});
