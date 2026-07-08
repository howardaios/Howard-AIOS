import { describe, it, expect } from 'vitest';
import { buildServer } from '../index';

describe('api health', () => {
  it('should return healthy status', async () => {
    const app = await buildServer();
    const response = await app.inject({
      method: 'GET',
      url: '/api/health',
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(['healthy', 'degraded']).toContain(body.status);
    expect(body.service).toBe('Howard AIOS API');
    expect(body.version).toBeDefined();
    expect(body.uptime).toBeDefined();
    expect(body.system).toBeDefined();

    await app.close();
  });

  it('should return root info', async () => {
    const app = await buildServer();
    const response = await app.inject({
      method: 'GET',
      url: '/',
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.success).toBe(true);
    expect(body.data.name).toBe('Howard AIOS API');
    expect(body.data.version).toBeDefined();

    await app.close();
  });
});
