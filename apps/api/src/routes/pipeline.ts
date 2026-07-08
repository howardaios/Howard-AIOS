import type { FastifyPluginAsync } from 'fastify';
import { PipelineExecutor, TaskQueue, PassThroughNode, TransformNode, type PipelineDefinition } from '@howard-aios/pipeline';

const executor = new PipelineExecutor();
const queue = new TaskQueue(executor);

// ── Demo Pipeline ────────────────────────────────────────────────────────────
const demoPipeline: PipelineDefinition = {
  id: 'demo-pipeline',
  name: 'Demo Processing Pipeline',
  description: 'A demo pipeline with pass-through and transform nodes',
  nodes: [
    new PassThroughNode('step-1'),
    new TransformNode('step-2', async (ctx) => ({
      processed: true,
      processedAt: new Date().toISOString(),
      inputKeys: Object.keys(ctx.input),
    })),
  ],
};
queue.register(demoPipeline);

// ── Meeting Processing Pipeline ──────────────────────────────────────────────
const meetingPipeline: PipelineDefinition = {
  id: 'meeting-processing',
  name: 'Meeting Processing Pipeline',
  description: 'Full meeting processing: validate → prepare → complete',
  nodes: [
    new TransformNode('validate', async (ctx) => {
      const { meetingId } = ctx.input;
      if (!meetingId) throw new Error('meetingId is required');
      return { meetingId, validated: true, validatedAt: new Date().toISOString() };
    }),
    new TransformNode('prepare', async (ctx) => {
      return {
        meetingId: ctx.input.meetingId,
        prepared: true,
        preparedAt: new Date().toISOString(),
        note: 'In production: triggers speech transcription and LLM processing',
      };
    }),
    new TransformNode('complete', async (ctx) => {
      return {
        meetingId: ctx.input.meetingId,
        completed: true,
        completedAt: new Date().toISOString(),
        pipeline: 'meeting-processing',
      };
    }),
  ],
};
queue.register(meetingPipeline);

export const pipelineRoutes: FastifyPluginAsync = async (app) => {
  app.post('/pipelines/execute', { schema: { description: 'Execute pipeline', tags: ['Pipeline'] } }, async (req, reply) => {
    const body = req.body as { pipelineId: string; input: Record<string, unknown> };
    const orgId = (req.headers['x-organization-id'] as string) ?? '10000000-0000-0000-0000-000000000001';

    const pipelines: Record<string, PipelineDefinition> = {
      'demo-pipeline': demoPipeline,
      'meeting-processing': meetingPipeline,
    };
    const def = pipelines[body.pipelineId];
    if (!def) {
      return reply.status(404).send({ success: false, code: 404, message: `Pipeline '${body.pipelineId}' not found`, data: null });
    }

    const result = await executor.execute(def, body.input ?? {}, orgId);
    const nodeResults: Record<string, unknown> = {};
    for (const [k, v] of result.nodeResults) nodeResults[k] = v;
    return reply.send({ success: true, code: 200, message: 'Pipeline executed', data: { ...result, nodeResults } });
  });

  app.post('/pipelines/enqueue', { schema: { description: 'Enqueue pipeline task', tags: ['Pipeline'] } }, async (req, reply) => {
    const body = req.body as { pipelineId: string; input: Record<string, unknown> };
    const orgId = (req.headers['x-organization-id'] as string) ?? '10000000-0000-0000-0000-000000000001';
    const task = queue.enqueue(body.pipelineId ?? 'demo-pipeline', body.input ?? {}, orgId);
    return reply.status(202).send({ success: true, code: 202, message: 'Queued', data: task });
  });

  app.get('/pipelines/queue', { schema: { description: 'List queued tasks', tags: ['Pipeline'] } }, async (req, reply) => {
    const status = (req.query as Record<string, string>).status as 'queued' | 'processing' | 'completed' | 'failed' | undefined;
    return reply.send({ success: true, code: 200, message: 'OK', data: { tasks: queue.listTasks(status), queueSize: queue.getQueueSize() } });
  });

  app.get('/pipelines/queue/:id', { schema: { description: 'Get task status', tags: ['Pipeline'] } }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const task = queue.getTask(id);
    if (!task) return reply.status(404).send({ success: false, code: 404, message: 'Not found', data: null });
    return reply.send({ success: true, code: 200, message: 'OK', data: task });
  });

  app.get('/pipelines/status', { schema: { description: 'Pipeline system status', tags: ['Pipeline'] } }, async (_req, reply) => {
    return reply.send({
      success: true, code: 200, message: 'OK',
      data: {
        executor: { maxRetries: 3, retryDelayMs: 1000, timeoutMs: 60000 },
        queue: { size: queue.getQueueSize(), totalTasks: queue.listTasks().length },
        registeredPipelines: ['demo-pipeline', 'meeting-processing'],
      },
    });
  });
};
