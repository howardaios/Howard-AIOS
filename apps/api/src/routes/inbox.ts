import type { FastifyPluginAsync } from 'fastify';
import { prisma } from '@howard-aios/database';
import { success, error } from '@howard-aios/utils';
import {
  InboxService,
  PrismaInboxRepository,
  CreateInboxItemSchema,
  UpdateInboxItemSchema,
  InboxQuerySchema,
  BatchInboxSchema,
  InboxItemNotFoundError,
  InboxValidationError,
} from '@howard-aios/inbox';

// ─── Service Instance ─────────────────────────────────────────────────────────

const repository = new PrismaInboxRepository(prisma);
const inboxService = new InboxService(repository);

// ─── Routes ───────────────────────────────────────────────────────────────────

export const inboxRoutes: FastifyPluginAsync = async (app) => {
  // POST /api/inbox
  app.post('/inbox', async (request, reply) => {
    const parsed = CreateInboxItemSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send(error('Invalid input', 400));
    }

    try {
      const item = await inboxService.create(parsed.data);
      return reply.status(201).send(success(item));
    } catch (err) {
      if (err instanceof InboxValidationError) {
        return reply.status(400).send(error(err.message, 400));
      }
      throw err;
    }
  });

  // GET /api/inbox
  app.get('/inbox', async (request, reply) => {
    const queryParsed = InboxQuerySchema.safeParse(request.query);
    if (!queryParsed.success) {
      return reply.status(400).send(error('Invalid query parameters', 400));
    }

    const organizationId =
      (request.headers['x-organization-id'] as string) || '10000000-0000-0000-0000-000000000001';

    const result = await inboxService.list(organizationId, queryParsed.data);
    return reply.send(success(result));
  });

  // GET /api/inbox/:id
  app.get<{ Params: { id: string } }>('/inbox/:id', async (request, reply) => {
    try {
      const item = await inboxService.getById(request.params.id);
      return reply.send(success(item));
    } catch (err) {
      if (err instanceof InboxItemNotFoundError) {
        return reply.status(404).send(error(err.message, 404));
      }
      throw err;
    }
  });

  // PATCH /api/inbox/:id
  app.patch<{ Params: { id: string } }>('/inbox/:id', async (request, reply) => {
    const parsed = UpdateInboxItemSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send(error('Invalid input', 400));
    }

    try {
      const item = await inboxService.update(request.params.id, parsed.data);
      return reply.send(success(item));
    } catch (err) {
      if (err instanceof InboxItemNotFoundError) {
        return reply.status(404).send(error(err.message, 404));
      }
      if (err instanceof InboxValidationError) {
        return reply.status(400).send(error(err.message, 400));
      }
      throw err;
    }
  });

  // DELETE /api/inbox/:id
  app.delete<{ Params: { id: string } }>('/inbox/:id', async (request, reply) => {
    try {
      const item = await inboxService.delete(request.params.id);
      return reply.send(success(item));
    } catch (err) {
      if (err instanceof InboxItemNotFoundError) {
        return reply.status(404).send(error(err.message, 404));
      }
      throw err;
    }
  });

  // POST /api/inbox/:id/archive
  app.post<{ Params: { id: string } }>('/inbox/:id/archive', async (request, reply) => {
    try {
      const item = await inboxService.archive(request.params.id);
      return reply.send(success(item));
    } catch (err) {
      if (err instanceof InboxItemNotFoundError) {
        return reply.status(404).send(error(err.message, 404));
      }
      throw err;
    }
  });

  // POST /api/inbox/batch
  app.post('/inbox/batch', async (request, reply) => {
    const parsed = BatchInboxSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send(error('Invalid input', 400));
    }

    const organizationId =
      (request.headers['x-organization-id'] as string) || '10000000-0000-0000-0000-000000000001';

    try {
      const result = await inboxService.batch(organizationId, parsed.data);
      return reply.send(success(result));
    } catch (err) {
      if (err instanceof InboxValidationError) {
        return reply.status(400).send(error(err.message, 400));
      }
      throw err;
    }
  });
};
