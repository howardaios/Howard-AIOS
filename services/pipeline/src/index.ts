import { randomUUID } from 'node:crypto';

// ─── Core Types ──────────────────────────────────────────────────────────────

export type NodeStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped' | 'retrying';

export interface PipelineContext {
  id: string;
  organizationId: string;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  errors: Array<{ nodeId: string; error: string; timestamp: Date }>;
  metadata: Record<string, unknown>;
  startedAt: Date;
  completedAt?: Date;
}

export interface PipelineNode {
  id: string;
  name: string;
  execute(ctx: PipelineContext): Promise<Record<string, unknown>>;
  canExecute?(ctx: PipelineContext): boolean;
  onError?(ctx: PipelineContext, error: Error): 'retry' | 'skip' | 'abort';
}

export interface PipelineDefinition {
  id: string;
  name: string;
  description?: string;
  nodes: PipelineNode[];
  maxRetries?: number;
  retryDelayMs?: number;
  timeoutMs?: number;
}

export interface PipelineResult {
  context: PipelineContext;
  status: 'completed' | 'failed' | 'timeout';
  nodeResults: Map<string, { status: NodeStatus; output?: Record<string, unknown>; error?: string; durationMs: number }>;
  totalDurationMs: number;
}

// ─── Pipeline Executor ───────────────────────────────────────────────────────

export class PipelineExecutor {
  private retryCount: number;
  private retryDelay: number;
  private timeout: number;

  constructor(opts?: { maxRetries?: number; retryDelayMs?: number; timeoutMs?: number }) {
    this.retryCount = opts?.maxRetries ?? 3;
    this.retryDelay = opts?.retryDelayMs ?? 1000;
    this.timeout = opts?.timeoutMs ?? 60000;
  }

  async execute(definition: PipelineDefinition, input: Record<string, unknown>, organizationId: string): Promise<PipelineResult> {
    const ctx: PipelineContext = {
      id: randomUUID(),
      organizationId,
      input,
      output: {},
      errors: [],
      metadata: { pipelineId: definition.id, pipelineName: definition.name },
      startedAt: new Date(),
    };

    const maxRetries = definition.maxRetries ?? this.retryCount;
    const retryDelay = definition.retryDelayMs ?? this.retryDelay;
    const timeout = definition.timeoutMs ?? this.timeout;
    const nodeResults = new Map<string, { status: NodeStatus; output?: Record<string, unknown>; error?: string; durationMs: number }>();

    const start = Date.now();

    // Execute with timeout
    const timeoutPromise = new Promise<PipelineResult>((_, reject) =>
      setTimeout(() => reject(new Error('Pipeline timeout')), timeout)
    );

    const execPromise = (async (): Promise<PipelineResult> => {
      for (const node of definition.nodes) {
        const nodeStart = Date.now();

        // Check if node can execute
        if (node.canExecute && !node.canExecute(ctx)) {
          nodeResults.set(node.id, { status: 'skipped', durationMs: Date.now() - nodeStart });
          continue;
        }

        // Execute with retry
        let attempts = 0;
        let success = false;

        while (attempts <= maxRetries && !success) {
          try {
            if (attempts > 0) {
              nodeResults.set(node.id, { status: 'retrying', durationMs: Date.now() - nodeStart });
              await this.delay(retryDelay * attempts);
            }

            const output = await node.execute(ctx);
            ctx.output = { ...ctx.output, ...output };
            nodeResults.set(node.id, { status: 'completed', output, durationMs: Date.now() - nodeStart });
            success = true;
          } catch (err) {
            attempts++;
            const error = err instanceof Error ? err : new Error(String(err));
            ctx.errors.push({ nodeId: node.id, error: error.message, timestamp: new Date() });

            if (node.onError) {
              const action = node.onError(ctx, error);
              if (action === 'skip') {
                nodeResults.set(node.id, { status: 'skipped', error: error.message, durationMs: Date.now() - nodeStart });
                success = true;
              } else if (action === 'abort') {
                nodeResults.set(node.id, { status: 'failed', error: error.message, durationMs: Date.now() - nodeStart });
                ctx.completedAt = new Date();
                return { context: ctx, status: 'failed', nodeResults, totalDurationMs: Date.now() - start };
              }
              // 'retry' continues loop
            } else if (attempts > maxRetries) {
              nodeResults.set(node.id, { status: 'failed', error: error.message, durationMs: Date.now() - nodeStart });
              ctx.completedAt = new Date();
              return { context: ctx, status: 'failed', nodeResults, totalDurationMs: Date.now() - start };
            }
          }
        }
      }

      ctx.completedAt = new Date();
      return { context: ctx, status: 'completed', nodeResults, totalDurationMs: Date.now() - start };
    })();

    try {
      return await Promise.race([execPromise, timeoutPromise]);
    } catch {
      ctx.completedAt = new Date();
      return { context: ctx, status: 'timeout', nodeResults, totalDurationMs: Date.now() - start };
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// ─── Task Queue ──────────────────────────────────────────────────────────────

export interface QueuedTask {
  id: string;
  pipelineId: string;
  input: Record<string, unknown>;
  organizationId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  result?: PipelineResult;
  error?: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export class TaskQueue {
  private queue: QueuedTask[] = [];
  private processing = false;
  private executor: PipelineExecutor;
  private definitions = new Map<string, PipelineDefinition>();

  constructor(executor?: PipelineExecutor) {
    this.executor = executor ?? new PipelineExecutor();
  }

  register(def: PipelineDefinition) { this.definitions.set(def.id, def); }

  enqueue(pipelineId: string, input: Record<string, unknown>, organizationId: string): QueuedTask {
    const task: QueuedTask = {
      id: randomUUID(),
      pipelineId,
      input,
      organizationId,
      status: 'queued',
      createdAt: new Date(),
    };
    this.queue.push(task);
    // Defer processing to next microtask so caller can inspect queued state
    Promise.resolve().then(() => this.processNext());
    return task;
  }

  getTask(id: string): QueuedTask | undefined { return this.queue.find((t) => t.id === id); }
  listTasks(status?: QueuedTask['status']): QueuedTask[] { return status ? this.queue.filter((t) => t.status === status) : [...this.queue]; }
  getQueueSize(): number { return this.queue.filter((t) => t.status === 'queued').length; }

  private async processNext(): Promise<void> {
    if (this.processing) return;
    const task = this.queue.find((t) => t.status === 'queued');
    if (!task) return;

    this.processing = true;
    task.status = 'processing';
    task.startedAt = new Date();

    try {
      const def = this.definitions.get(task.pipelineId);
      if (!def) throw new Error(`Pipeline not found: ${task.pipelineId}`);
      task.result = await this.executor.execute(def, task.input, task.organizationId);
      task.status = task.result.status === 'completed' ? 'completed' : 'failed';
    } catch (err) {
      task.status = 'failed';
      task.error = err instanceof Error ? err.message : String(err);
    } finally {
      task.completedAt = new Date();
      this.processing = false;
      this.processNext();
    }
  }
}

// ─── Built-in Nodes ──────────────────────────────────────────────────────────

export class PassThroughNode implements PipelineNode {
  id: string;
  name = 'pass-through';
  constructor(id?: string) { this.id = id ?? 'pass-through'; }
  async execute(ctx: PipelineContext) { return ctx.input; }
}

export class TransformNode implements PipelineNode {
  id: string;
  name = 'transform';
  private transform: (ctx: PipelineContext) => Promise<Record<string, unknown>>;
  constructor(id: string, transform: (ctx: PipelineContext) => Promise<Record<string, unknown>>) {
    this.id = id;
    this.transform = transform;
  }
  async execute(ctx: PipelineContext) { return this.transform(ctx); }
}

export class ConditionalNode implements PipelineNode {
  id: string;
  name = 'conditional';
  private condition: (ctx: PipelineContext) => boolean;
  private onTrue: (ctx: PipelineContext) => Promise<Record<string, unknown>>;
  private onFalse: (ctx: PipelineContext) => Promise<Record<string, unknown>>;

  constructor(id: string, opts: {
    condition: (ctx: PipelineContext) => boolean;
    onTrue: (ctx: PipelineContext) => Promise<Record<string, unknown>>;
    onFalse?: (ctx: PipelineContext) => Promise<Record<string, unknown>>;
  }) {
    this.id = id;
    this.condition = opts.condition;
    this.onTrue = opts.onTrue;
    this.onFalse = opts.onFalse ?? (async () => ({}));
  }

  async execute(ctx: PipelineContext) {
    return this.condition(ctx) ? this.onTrue(ctx) : this.onFalse(ctx);
  }
}
