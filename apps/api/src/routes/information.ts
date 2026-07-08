import type { FastifyPluginAsync } from 'fastify';
import { prisma } from '@howard-aios/database';
import { success, error } from '@howard-aios/utils';
import {
  InformationService,
  PrismaInformationRepository,
  CreateInformationSchema,
  UpdateInformationSchema,
  InformationQuerySchema,
  InformationNotFoundError,
  InformationValidationError,
} from '@howard-aios/information';

// ─── Service Instance ─────────────────────────────────────────────────────────

const repository = new PrismaInformationRepository(prisma);
const informationService = new InformationService(repository);

// ─── Routes ───────────────────────────────────────────────────────────────────

export const informationRoutes: FastifyPluginAsync = async (app) => {
  // GET /api/information?page=1&pageSize=20&sourceType=EMAIL&search=hello
  app.get('/information', async (request, reply) => {
    const queryParsed = InformationQuerySchema.safeParse(request.query);
    if (!queryParsed.success) {
      return reply.status(400).send(error('Invalid query parameters', 400));
    }

    // TODO: extract organizationId from auth context (Sprint 3.2+)
    const organizationId =
      (request.headers['x-organization-id'] as string) || '10000000-0000-0000-0000-000000000001';

    const result = await informationService.list(organizationId, queryParsed.data);
    return reply.send(success(result));
  });

  // GET /api/information/:id
  app.get<{ Params: { id: string } }>('/information/:id', async (request, reply) => {
    try {
      const record = await informationService.getById(request.params.id);
      return reply.send(success(record));
    } catch (err) {
      if (err instanceof InformationNotFoundError) {
        return reply.status(404).send(error(err.message, 404));
      }
      throw err;
    }
  });

  // POST /api/information
  app.post('/information', async (request, reply) => {
    const parsed = CreateInformationSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send(error('Invalid input', 400));
    }

    try {
      const record = await informationService.create(parsed.data);
      return reply.status(201).send(success(record));
    } catch (err) {
      if (err instanceof InformationValidationError) {
        return reply.status(400).send(error(err.message, 400));
      }
      throw err;
    }
  });

  // PATCH /api/information/:id
  app.patch<{ Params: { id: string } }>('/information/:id', async (request, reply) => {
    const parsed = UpdateInformationSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send(error('Invalid input', 400));
    }

    try {
      const record = await informationService.update(request.params.id, parsed.data);
      return reply.send(success(record));
    } catch (err) {
      if (err instanceof InformationNotFoundError) {
        return reply.status(404).send(error(err.message, 404));
      }
      if (err instanceof InformationValidationError) {
        return reply.status(400).send(error(err.message, 400));
      }
      throw err;
    }
  });

  // DELETE /api/information/:id
  app.delete<{ Params: { id: string } }>('/information/:id', async (request, reply) => {
    try {
      const record = await informationService.delete(request.params.id);
      return reply.send(success(record));
    } catch (err) {
      if (err instanceof InformationNotFoundError) {
        return reply.status(404).send(error(err.message, 404));
      }
      throw err;
    }
  });
};
