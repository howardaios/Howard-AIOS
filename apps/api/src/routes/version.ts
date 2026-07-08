import type { FastifyPluginAsync } from 'fastify';
import { AIOS_NAME, AIOS_VERSION } from '@howard-aios/types';

export const versionRoutes: FastifyPluginAsync = async (app) => {
  app.get('/version', async () => {
    return {
      success: true,
      code: 0,
      message: 'OK',
      data: {
        name: AIOS_NAME,
        version: AIOS_VERSION,
        node: process.version,
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      },
    };
  });
};
