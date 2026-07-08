import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildServer } from '../index';
import type { FastifyInstance } from 'fastify';

describe('inbox api', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildServer({ port: 0, host: '127.0.0.1' });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /api/inbox should reject invalid input', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/inbox',
      payload: { invalid: true },
    });

    expect(res.statusCode).toBe(400);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(false);
  });

  it('POST /api/inbox should reject missing content', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/inbox',
      payload: {
        sourceType: 'MANUAL',
        organizationId: '10000000-0000-0000-0000-000000000001',
      },
    });

    expect(res.statusCode).toBe(400);
  });

  it('POST /api/inbox/batch should reject invalid batch', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/inbox/batch',
      payload: { ids: [], action: 'archive' },
    });

    expect(res.statusCode).toBe(400);
  });

  it('GET /api/inbox should reject invalid page size', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/inbox?pageSize=999',
      headers: { 'x-organization-id': '10000000-0000-0000-0000-000000000001' },
    });

    expect(res.statusCode).toBe(400);
  });
});
