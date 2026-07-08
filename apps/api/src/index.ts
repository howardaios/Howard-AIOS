import Fastify, { type FastifyError, type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { AIOS_NAME, AIOS_VERSION } from '@howard-aios/types';
import { createLogger, loadEnv, isDev } from '@howard-aios/utils';
import { registerRoutes } from './plugins/routes';
import { registerAuth } from './plugins/auth';

const logger = createLogger('server');

/**
 * Build the Fastify server instance with all plugins registered.
 */
export async function buildServer(overrides?: {
  port?: number;
  host?: string;
}): Promise<FastifyInstance> {
  const env = loadEnv();
  const port = overrides?.port ?? env.PORT;
  const host = overrides?.host ?? env.HOST;

  const app = Fastify({
    logger: {
      level: env.LOG_LEVEL,
    },
    disableRequestLogging: !isDev(),
  });

  // ── Core Plugins ──────────────────────────────────────────────────────
  await app.register(cors, { origin: env.CORS_ORIGIN });

  await app.register(swagger, {
    openapi: {
      info: {
        title: `${AIOS_NAME} API`,
        version: AIOS_VERSION,
        description: 'Howard AIOS RESTful API — Production Grade',
      },
      servers: [{ url: `http://${host}:${port}` }],
    },
  });

  await app.register(swaggerUi, {
    routePrefix: '/docs',
  });

  // ── Hooks ─────────────────────────────────────────────────────────────
  app.addHook('onReady', async () => {
    const routeCount = app.printRoutes().split('\n').filter(Boolean).length;
    logger.info('═══════════════════════════════════════');
    logger.info('  Howard AIOS API — Server Ready');
    logger.info('═══════════════════════════════════════');
    logger.info(`  Port:        ${port}`);
    logger.info(`  Host:        ${host}`);
    logger.info(`  Environment: ${env.NODE_ENV}`);
    logger.info(`  Routes:      ${routeCount}`);
    logger.info(`  Swagger:     http://${host}:${port}/docs`);
    logger.info(`  Health:      http://${host}:${port}/api/health`);
    logger.info(`  Node.js:     ${process.version}`);
    logger.info('═══════════════════════════════════════');
  });

  app.addHook('onClose', async () => {
    logger.info('Server shutting down gracefully');
  });

  app.setErrorHandler((err: FastifyError, _request, reply) => {
    const statusCode = err.statusCode ?? 500;
    logger.error(`Request error: ${err.message}`, { statusCode });
    reply.status(statusCode).send({
      success: false,
      code: statusCode,
      message: err.message,
      data: null,
    });
  });

  // ── Auth Plugin ────────────────────────────────────────────────────
  await registerAuth(app);

  // ── Routes ────────────────────────────────────────────────────────────
  await registerRoutes(app);

  return app;
}

/**
 * Start the server.
 */
async function start(): Promise<void> {
  const app = await buildServer();

  try {
    const env = loadEnv();
    await app.listen({ port: env.PORT, host: env.HOST });
    logger.info(`Server running at http://${env.HOST}:${env.PORT}`);
  } catch (err) {
    logger.error('Failed to start server');
    console.error(err);
    process.exit(1);
  }
}

// Only start server when run directly (not imported by tests)
const isMainModule = process.argv[1]?.endsWith('index.ts') || process.argv[1]?.endsWith('index.js') || process.argv[1]?.endsWith('.bundle.cjs');
if (isMainModule) {
  start();
}
