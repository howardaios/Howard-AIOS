import { describe, it, expect } from 'vitest';
import { PipelineExecutor, TaskQueue, PassThroughNode, TransformNode, ConditionalNode, type PipelineDefinition } from '../index';

describe('Pipeline Engine', () => {
  const executor = new PipelineExecutor({ maxRetries: 1, retryDelayMs: 10 });

  it('should execute a simple pipeline', async () => {
    const def: PipelineDefinition = {
      id: 'test-1', name: 'Test', nodes: [
        new PassThroughNode('step-1'),
        new TransformNode('step-2', async (ctx) => ({ doubled: (ctx.input.value as number) * 2 })),
      ],
    };
    const result = await executor.execute(def, { value: 5 }, 'org-1');
    expect(result.status).toBe('completed');
    expect(result.context.output.doubled).toBe(10);
  });

  it('should handle node failure with retry', async () => {
    let attempts = 0;
    const def: PipelineDefinition = {
      id: 'test-retry', name: 'Retry Test', nodes: [
        new TransformNode('flaky', async () => {
          attempts++;
          if (attempts < 2) throw new Error('fail');
          return { success: true };
        }),
      ],
    };
    const result = await executor.execute(def, {}, 'org-1');
    expect(result.status).toBe('completed');
    expect(attempts).toBeGreaterThanOrEqual(2);
  });

  it('should skip nodes that cannot execute', async () => {
    const def: PipelineDefinition = {
      id: 'test-skip', name: 'Skip Test', nodes: [
        new TransformNode('conditional', async () => ({ ran: true }), ),
        { id: 'skipped', name: 'skip-me', execute: async () => ({ shouldNotRun: true }), canExecute: () => false },
      ],
    };
    const result = await executor.execute(def, {}, 'org-1');
    expect(result.status).toBe('completed');
    expect(result.nodeResults.get('skipped')?.status).toBe('skipped');
  });

  it('should handle conditional nodes', async () => {
    const def: PipelineDefinition = {
      id: 'test-cond', name: 'Cond Test', nodes: [
        new ConditionalNode('branch', {
          condition: (ctx) => (ctx.input.flag as boolean) === true,
          onTrue: async () => ({ branch: 'true' }),
          onFalse: async () => ({ branch: 'false' }),
        }),
      ],
    };
    const r1 = await executor.execute(def, { flag: true }, 'org-1');
    expect(r1.context.output.branch).toBe('true');
    const r2 = await executor.execute(def, { flag: false }, 'org-1');
    expect(r2.context.output.branch).toBe('false');
  });

  it('should timeout long-running pipelines', async () => {
    const def: PipelineDefinition = {
      id: 'test-timeout', name: 'Timeout Test', timeoutMs: 50,
      nodes: [new TransformNode('slow', async () => { await new Promise((r) => setTimeout(r, 5000)); return {}; })],
    };
    const result = await executor.execute(def, {}, 'org-1');
    expect(result.status).toBe('timeout');
  });
});

describe('Task Queue', () => {
  it('should enqueue and process tasks', async () => {
    const executor = new PipelineExecutor();
    const queue = new TaskQueue(executor);
    queue.register({ id: 'q-test', name: 'Q Test', nodes: [new PassThroughNode('p')] });
    const task = queue.enqueue('q-test', { hello: 'world' }, 'org-1');
    expect(task.id).toBeDefined();
    expect(task.status).toBe('queued');
    // Wait for processing
    await new Promise((r) => setTimeout(r, 200));
    const updated = queue.getTask(task.id);
    expect(updated?.status).toBe('completed');
  });

  it('should track queue size', () => {
    const queue = new TaskQueue();
    queue.register({ id: 'p1', name: 'P1', nodes: [] });
    queue.enqueue('p1', {}, 'org-1');
    expect(queue.listTasks().length).toBeGreaterThanOrEqual(1);
  });
});
