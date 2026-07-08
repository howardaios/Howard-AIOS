import { randomUUID } from 'node:crypto';

// ─── LLM Types ───────────────────────────────────────────────────────────────

export type LLMProviderName = 'openai' | 'deepseek' | 'qwen' | 'claude' | 'gemini';

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMRequest {
  messages: LLMMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  timeoutMs?: number;
}

export interface LLMResponse {
  id: string;
  content: string;
  model: string;
  provider: LLMProviderName;
  usage: { promptTokens: number; completionTokens: number; totalTokens: number };
  finishReason: 'stop' | 'length' | 'error' | 'timeout';
  latencyMs: number;
}

export interface LLMStreamChunk {
  id: string;
  delta: string;
  done: boolean;
}

export interface LLMProvider {
  name: LLMProviderName;
  models: string[];
  chat(request: LLMRequest): Promise<LLMResponse>;
  stream?(request: LLMRequest): AsyncGenerator<LLMStreamChunk>;
  isAvailable(): Promise<boolean>;
}

// ─── Mock Response Helper ─────────────────────────────────────────────────────

function mockResponse(name: LLMProviderName, model: string, request: LLMRequest): LLMResponse {
  const lastMsg = request.messages[request.messages.length - 1]?.content ?? '';
  const content = `[${name}:mock] Response to: "${lastMsg.slice(0, 80)}"`;
  const promptTokens = request.messages.reduce((sum, m) => sum + Math.ceil(m.content.length / 4), 0);
  const completionTokens = Math.ceil(content.length / 4);
  return {
    id: randomUUID(),
    content,
    model,
    provider: name,
    usage: { promptTokens, completionTokens, totalTokens: promptTokens + completionTokens },
    finishReason: 'stop',
    latencyMs: 5,
  };
}

async function* mockStream(name: LLMProviderName, model: string, request: LLMRequest): AsyncGenerator<LLMStreamChunk> {
  const response = mockResponse(name, model, request);
  const words = response.content.split(' ');
  for (let i = 0; i < words.length; i++) {
    yield { id: response.id, delta: words[i] + (i < words.length - 1 ? ' ' : ''), done: i === words.length - 1 };
  }
}

// ─── OpenAI-Compatible Base Provider ─────────────────────────────────────────

abstract class OpenAICompatibleProvider implements LLMProvider {
  abstract name: LLMProviderName;
  abstract models: string[];
  protected abstract baseUrl: string;
  protected abstract envKey: string;

  protected get apiKey(): string | undefined {
    return process.env[this.envKey];
  }

  async isAvailable(): Promise<boolean> {
    return !!this.apiKey;
  }

  async chat(request: LLMRequest): Promise<LLMResponse> {
    const model = request.model ?? this.models[0];
    if (!this.apiKey) return mockResponse(this.name, model, request);

    const start = Date.now();
    const controller = new AbortController();
    const timer = request.timeoutMs ? setTimeout(() => controller.abort(), request.timeoutMs) : null;

    try {
      const res = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: request.messages,
          temperature: request.temperature ?? 0.7,
          max_tokens: request.maxTokens ?? 2048,
          stream: false,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`${this.name} API error ${res.status}: ${errText.slice(0, 200)}`);
      }

      const data = await res.json() as {
        id: string;
        choices: Array<{ message: { content: string }; finish_reason: string }>;
        usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
      };

      return {
        id: data.id ?? randomUUID(),
        content: data.choices[0]?.message?.content ?? '',
        model,
        provider: this.name,
        usage: data.usage
          ? { promptTokens: data.usage.prompt_tokens, completionTokens: data.usage.completion_tokens, totalTokens: data.usage.total_tokens }
          : { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        finishReason: (data.choices[0]?.finish_reason as LLMResponse['finishReason']) ?? 'stop',
        latencyMs: Date.now() - start,
      };
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  async *stream(request: LLMRequest): AsyncGenerator<LLMStreamChunk> {
    const model = request.model ?? this.models[0];
    if (!this.apiKey) { yield* mockStream(this.name, model, request); return; }

    const controller = new AbortController();
    const timer = request.timeoutMs ? setTimeout(() => controller.abort(), request.timeoutMs) : null;
    const id = randomUUID();

    try {
      const res = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: request.messages,
          temperature: request.temperature ?? 0.7,
          max_tokens: request.maxTokens ?? 2048,
          stream: true,
        }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        yield* mockStream(this.name, model, request);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;
          const data = trimmed.slice(6);
          if (data === '[DONE]') {
            yield { id, delta: '', done: true };
            return;
          }
          try {
            const parsed = JSON.parse(data) as { choices?: Array<{ delta?: { content?: string } }> };
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) yield { id, delta, done: false };
          } catch { /* skip malformed chunks */ }
        }
      }

      yield { id, delta: '', done: true };
    } finally {
      if (timer) clearTimeout(timer);
    }
  }
}

// ─── Claude Provider (Anthropic Messages API) ────────────────────────────────

abstract class BaseProvider implements LLMProvider {
  abstract name: LLMProviderName;
  abstract models: string[];
  abstract chat(request: LLMRequest): Promise<LLMResponse>;
  abstract isAvailable(): Promise<boolean>;
  stream?(request: LLMRequest): AsyncGenerator<LLMStreamChunk>;
}

// ─── Provider Implementations ────────────────────────────────────────────────

export class OpenAIProvider extends OpenAICompatibleProvider {
  name: LLMProviderName = 'openai';
  models = ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'];
  protected baseUrl = 'https://api.openai.com/v1';
  protected envKey = 'OPENAI_API_KEY';
}

export class DeepSeekProvider extends OpenAICompatibleProvider {
  name: LLMProviderName = 'deepseek';
  models = ['deepseek-chat', 'deepseek-coder', 'deepseek-reasoner'];
  protected baseUrl = 'https://api.deepseek.com/v1';
  protected envKey = 'DEEPSEEK_API_KEY';
}

export class QwenProvider extends OpenAICompatibleProvider {
  name: LLMProviderName = 'qwen';
  models = ['qwen-max', 'qwen-plus', 'qwen-turbo', 'qwen-long'];
  protected baseUrl = 'https://dashscope.aliyuncs.com/compatible-mode/v1';
  protected envKey = 'QWEN_API_KEY';
}

export class ClaudeProvider extends BaseProvider {
  name: LLMProviderName = 'claude';
  models = ['claude-sonnet-4-20250514', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229'];

  private get apiKey(): string | undefined { return process.env.ANTHROPIC_API_KEY; }
  async isAvailable(): Promise<boolean> { return !!this.apiKey; }

  async chat(request: LLMRequest): Promise<LLMResponse> {
    const model = request.model ?? this.models[0];
    if (!this.apiKey) return mockResponse(this.name, model, request);

    const start = Date.now();
    const systemMsg = request.messages.find((m) => m.role === 'system');
    const nonSystemMsgs = request.messages.filter((m) => m.role !== 'system');

    const controller = new AbortController();
    const timer = request.timeoutMs ? setTimeout(() => controller.abort(), request.timeoutMs) : null;

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model,
          max_tokens: request.maxTokens ?? 2048,
          system: systemMsg?.content,
          messages: nonSystemMsgs.map((m) => ({ role: m.role, content: m.content })),
          temperature: request.temperature ?? 0.7,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Claude API error ${res.status}: ${errText.slice(0, 200)}`);
      }

      const data = await res.json() as {
        id: string;
        content: Array<{ type: string; text: string }>;
        usage?: { input_tokens: number; output_tokens: number };
        stop_reason: string;
      };

      const content = data.content?.map((c) => c.text).join('') ?? '';
      return {
        id: data.id ?? randomUUID(),
        content,
        model,
        provider: this.name,
        usage: data.usage
          ? { promptTokens: data.usage.input_tokens, completionTokens: data.usage.output_tokens, totalTokens: data.usage.input_tokens + data.usage.output_tokens }
          : { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        finishReason: data.stop_reason === 'end_turn' ? 'stop' : (data.stop_reason as LLMResponse['finishReason']) ?? 'stop',
        latencyMs: Date.now() - start,
      };
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  async *stream(request: LLMRequest): AsyncGenerator<LLMStreamChunk> {
    const model = request.model ?? this.models[0];
    if (!this.apiKey) { yield* mockStream(this.name, model, request); return; }
    // For simplicity, fall back to non-streaming mock for Claude
    const response = await this.chat(request);
    const words = response.content.split(' ');
    for (let i = 0; i < words.length; i++) {
      yield { id: response.id, delta: words[i] + (i < words.length - 1 ? ' ' : ''), done: i === words.length - 1 };
    }
  }
}

export class GeminiProvider extends BaseProvider {
  name: LLMProviderName = 'gemini';
  models = ['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'];

  private get apiKey(): string | undefined { return process.env.GEMINI_API_KEY; }
  async isAvailable(): Promise<boolean> { return !!this.apiKey; }

  async chat(request: LLMRequest): Promise<LLMResponse> {
    const model = request.model ?? this.models[0];
    if (!this.apiKey) return mockResponse(this.name, model, request);

    const start = Date.now();
    const systemMsg = request.messages.find((m) => m.role === 'system');
    const nonSystemMsgs = request.messages.filter((m) => m.role !== 'system');

    const controller = new AbortController();
    const timer = request.timeoutMs ? setTimeout(() => controller.abort(), request.timeoutMs) : null;

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: systemMsg ? { parts: [{ text: systemMsg.content }] } : undefined,
          contents: nonSystemMsgs.map((m) => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }],
          })),
          generationConfig: {
            temperature: request.temperature ?? 0.7,
            maxOutputTokens: request.maxTokens ?? 2048,
          },
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Gemini API error ${res.status}: ${errText.slice(0, 200)}`);
      }

      const data = await res.json() as {
        candidates?: Array<{ content?: { parts?: Array<{ text: string }> }; finishReason?: string }>;
        usageMetadata?: { promptTokenCount: number; candidatesTokenCount: number; totalTokenCount: number };
      };

      const content = data.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') ?? '';
      return {
        id: randomUUID(),
        content,
        model,
        provider: this.name,
        usage: data.usageMetadata
          ? { promptTokens: data.usageMetadata.promptTokenCount, completionTokens: data.usageMetadata.candidatesTokenCount, totalTokens: data.usageMetadata.totalTokenCount }
          : { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        finishReason: data.candidates?.[0]?.finishReason === 'STOP' ? 'stop' : 'stop',
        latencyMs: Date.now() - start,
      };
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  async *stream(request: LLMRequest): AsyncGenerator<LLMStreamChunk> {
    const model = request.model ?? this.models[0];
    if (!this.apiKey) { yield* mockStream(this.name, model, request); return; }
    const response = await this.chat(request);
    const words = response.content.split(' ');
    for (let i = 0; i < words.length; i++) {
      yield { id: response.id, delta: words[i] + (i < words.length - 1 ? ' ' : ''), done: i === words.length - 1 };
    }
  }
}

// ─── LLM Service with Fallback ───────────────────────────────────────────────

export interface LLMServiceOptions {
  defaultProvider?: LLMProviderName;
  defaultModel?: string;
  fallbackChain?: LLMProviderName[];
  maxRetries?: number;
  retryDelayMs?: number;
  defaultTimeoutMs?: number;
}

export class LLMService {
  private providers = new Map<LLMProviderName, LLMProvider>();
  private options: Required<LLMServiceOptions>;

  constructor(opts?: LLMServiceOptions) {
    this.register(new OpenAIProvider());
    this.register(new DeepSeekProvider());
    this.register(new QwenProvider());
    this.register(new ClaudeProvider());
    this.register(new GeminiProvider());

    this.options = {
      defaultProvider: opts?.defaultProvider ?? 'openai',
      defaultModel: opts?.defaultModel ?? '',
      fallbackChain: opts?.fallbackChain ?? ['openai', 'deepseek', 'qwen', 'claude', 'gemini'],
      maxRetries: opts?.maxRetries ?? 2,
      retryDelayMs: opts?.retryDelayMs ?? 1000,
      defaultTimeoutMs: opts?.defaultTimeoutMs ?? 30000,
    };
  }

  register(provider: LLMProvider) { this.providers.set(provider.name, provider); }

  async chat(request: LLMRequest, providerName?: LLMProviderName): Promise<LLMResponse> {
    // Build chain: prefer available providers with API keys, then fallback to mock
    const chain = providerName ? [providerName] : this.options.fallbackChain;
    let lastError: Error | null = null;

    // First pass: try providers with API keys
    for (const name of chain) {
      const provider = this.providers.get(name);
      if (!provider) continue;
      if (!(await provider.isAvailable())) continue;

      for (let attempt = 0; attempt <= this.options.maxRetries; attempt++) {
        try {
          if (attempt > 0) await new Promise((r) => setTimeout(r, this.options.retryDelayMs * attempt));
          const reqWithDefaults: LLMRequest = {
            ...request,
            model: request.model || this.options.defaultModel || provider.models[0],
            timeoutMs: request.timeoutMs ?? this.options.defaultTimeoutMs,
          };
          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('LLM timeout')), reqWithDefaults.timeoutMs),
          );
          return await Promise.race([provider.chat(reqWithDefaults), timeoutPromise]);
        } catch (err) {
          lastError = err instanceof Error ? err : new Error(String(err));
        }
      }
    }

    // Second pass: use first mock provider as fallback
    for (const name of chain) {
      const provider = this.providers.get(name);
      if (!provider) continue;
      const model = request.model || provider.models[0];
      return mockResponse(name, model, request);
    }

    throw lastError ?? new Error('No LLM provider available');
  }

  async *stream(request: LLMRequest, providerName?: LLMProviderName): AsyncGenerator<LLMStreamChunk> {
    const name = providerName ?? this.options.defaultProvider;
    const provider = this.providers.get(name);
    if (!provider?.stream) throw new Error(`Provider ${name} does not support streaming`);
    yield* provider.stream(request);
  }

  async listProviders(): Promise<Array<{ name: LLMProviderName; models: string[]; available: boolean }>> {
    const results: Array<{ name: LLMProviderName; models: string[]; available: boolean }> = [];
    for (const p of this.providers.values()) {
      results.push({ name: p.name, models: p.models, available: await p.isAvailable() });
    }
    return results;
  }

  async getProviderStatus(): Promise<Record<LLMProviderName, boolean>> {
    const result = {} as Record<LLMProviderName, boolean>;
    for (const [name, provider] of this.providers) {
      result[name] = await provider.isAvailable();
    }
    return result;
  }
}
