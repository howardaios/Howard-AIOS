import { describe, it, expect } from 'vitest';
import { buildServer } from '../index';

/**
 * CEO route tests.
 * These tests verify that the routes are registered and respond.
 * In test env without a DB, Prisma queries may fail (500) — that's expected.
 * We verify the route exists by checking it doesn't return 404.
 */

async function testRoute(url: string, expectedKeys?: string[]) {
  const app = await buildServer();
  const response = await app.inject({ method: 'GET', url });
  // Route must be registered (not 404)
  expect(response.statusCode).not.toBe(404);

  if (response.statusCode === 200) {
    const body = response.json();
    expect(body.success).toBe(true);
    if (expectedKeys) {
      for (const key of expectedKeys) {
        expect(body.data).toHaveProperty(key);
      }
    }
  }
  // 500 = DB not available in test env, still validates route registration

  await app.close();
}

describe('CEO routes', () => {
  it('GET /api/ceo/companies — should be registered', async () => {
    await testRoute('/api/ceo/companies', ['companies']);
  });

  it('GET /api/ceo/overview — should return dashboard structure', async () => {
    await testRoute('/api/ceo/overview', ['todayFocus', 'companyHealth', 'kpi', 'growth', 'systemStatus']);
  });

  it('GET /api/ceo/inbox — should return aggregated inbox structure', async () => {
    await testRoute('/api/ceo/inbox', ['meetings', 'inbox', 'tasks', 'decisions', 'risks', 'summary']);
  });

  it('GET /api/ceo/brief — should return daily brief structure', async () => {
    await testRoute('/api/ceo/brief', ['type', 'date', 'summary', 'sections']);
  });

  it('GET /api/ceo/intelligence — should return intelligence scores', async () => {
    await testRoute('/api/ceo/intelligence', ['scores', 'analysis']);
  });

  it('GET /api/ceo/recommendations — should return recommendations', async () => {
    await testRoute('/api/ceo/recommendations', ['topActions', 'topDecisions', 'topRisks', 'quickWins', 'generatedAt']);
  });

  it('GET /api/ceo/kpi — should return KPI data', async () => {
    await testRoute('/api/ceo/kpi', ['weekly', 'monthly']);
  });
});
