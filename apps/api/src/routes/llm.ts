import type { FastifyPluginAsync } from 'fastify';
import { LLMService, type LLMMessage } from '@howard-aios/ai';

const llm = new LLMService();

export const llmRoutes: FastifyPluginAsync = async (app) => {
  app.post('/llm/chat', { schema: { description: 'LLM Chat', tags: ['LLM'] } }, async (req, reply) => {
    const body = req.body as { messages: Array<{ role: string; content: string }>; model?: string; provider?: string };
    const messages: LLMMessage[] = (body.messages ?? [{ role: 'user', content: 'Hello' }]).map(
      (m) => ({ role: m.role as LLMMessage['role'], content: m.content }),
    );
    const result = await llm.chat(
      { messages, model: body.model },
      body.provider as 'openai' | 'deepseek' | 'qwen' | 'claude' | 'gemini' | undefined,
    );
    return reply.send({ success: true, code: 200, message: 'OK', data: result });
  });

  app.post('/llm/stream', { schema: { description: 'LLM Streaming Chat', tags: ['LLM'] } }, async (req, reply) => {
    const body = req.body as { messages: Array<{ role: string; content: string }>; model?: string; provider?: string };
    const messages: LLMMessage[] = (body.messages ?? [{ role: 'user', content: 'Hello' }]).map(
      (m) => ({ role: m.role as LLMMessage['role'], content: m.content }),
    );

    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });

    try {
      const stream = llm.stream(
        { messages, model: body.model, stream: true },
        body.provider as 'openai' | 'deepseek' | 'qwen' | 'claude' | 'gemini' | undefined,
      );

      for await (const chunk of stream) {
        reply.raw.write(`data: ${JSON.stringify(chunk)}\n\n`);
      }
      reply.raw.write('data: [DONE]\n\n');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Stream error';
      reply.raw.write(`data: ${JSON.stringify({ error: msg })}\n\n`);
    } finally {
      reply.raw.end();
    }
  });

  app.get('/llm/providers', { schema: { description: 'List LLM providers', tags: ['LLM'] } }, async (_req, reply) => {
    return reply.send({ success: true, code: 200, message: 'OK', data: await llm.listProviders() });
  });

  app.get('/llm/status', { schema: { description: 'LLM provider status', tags: ['LLM'] } }, async (_req, reply) => {
    return reply.send({ success: true, code: 200, message: 'OK', data: await llm.getProviderStatus() });
  });
};
