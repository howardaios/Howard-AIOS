import { describe, it, expect } from 'vitest';
import { LLMService, OpenAIProvider, DeepSeekProvider, QwenProvider, ClaudeProvider, GeminiProvider } from '../index';

describe('LLM Service', () => {
  const llm = new LLMService();

  it('should list all 5 providers', async () => {
    const providers = await llm.listProviders();
    expect(providers.length).toBe(5);
    expect(providers.map((p) => p.name)).toEqual(['openai', 'deepseek', 'qwen', 'claude', 'gemini']);
  });

  it('should chat with fallback to mock when no API key', async () => {
    const response = await llm.chat({ messages: [{ role: 'user', content: 'Hello world' }] });
    expect(response.content).toBeDefined();
    expect(response.usage.totalTokens).toBeGreaterThan(0);
    expect(response.finishReason).toBe('stop');
  });

  it('should chat with specific provider', async () => {
    const response = await llm.chat({ messages: [{ role: 'user', content: 'Test' }] }, 'deepseek');
    expect(response.provider).toBe('deepseek');
  });

  it('should report provider status', async () => {
    const status = await llm.getProviderStatus();
    expect(typeof status.openai).toBe('boolean');
    expect(typeof status.claude).toBe('boolean');
    expect(typeof status.gemini).toBe('boolean');
  });

  it('should have models for each provider', async () => {
    const providers = await llm.listProviders();
    for (const p of providers) {
      expect(p.models.length).toBeGreaterThan(0);
    }
  });

  it('should stream responses', async () => {
    const chunks: string[] = [];
    const stream = llm.stream({ messages: [{ role: 'user', content: 'Stream test' }] });
    for await (const chunk of stream) {
      if (chunk.delta) chunks.push(chunk.delta);
    }
    expect(chunks.length).toBeGreaterThan(0);
  });
});

describe('Individual Providers', () => {
  it('OpenAI provider should work (mock fallback)', async () => {
    const p = new OpenAIProvider();
    const r = await p.chat({ messages: [{ role: 'user', content: 'test' }] });
    expect(r.provider).toBe('openai');
    expect(r.content).toBeDefined();
  });

  it('DeepSeek provider should work (mock fallback)', async () => {
    const p = new DeepSeekProvider();
    const r = await p.chat({ messages: [{ role: 'user', content: 'test' }] });
    expect(r.provider).toBe('deepseek');
  });

  it('Qwen provider should work (mock fallback)', async () => {
    const p = new QwenProvider();
    const r = await p.chat({ messages: [{ role: 'user', content: 'test' }] });
    expect(r.provider).toBe('qwen');
  });

  it('Claude provider should work (mock fallback)', async () => {
    const p = new ClaudeProvider();
    const r = await p.chat({ messages: [{ role: 'user', content: 'test' }] });
    expect(r.provider).toBe('claude');
  });

  it('Gemini provider should work (mock fallback)', async () => {
    const p = new GeminiProvider();
    const r = await p.chat({ messages: [{ role: 'user', content: 'test' }] });
    expect(r.provider).toBe('gemini');
  });
});
