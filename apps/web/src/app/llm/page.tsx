'use client';

import { useState } from 'react';
import { PageHeader, Button, Input, EmptyState } from '../../components/ui';
import { authFetch } from '../../lib/auth-fetch';

interface ChatMsg { role: 'user' | 'assistant' | 'system'; content: string; provider?: string; model?: string }

const PROVIDERS = ['openai', 'deepseek', 'qwen', 'claude', 'gemini'];

export default function LLMPage() {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [provider, setProvider] = useState('openai');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg: ChatMsg = { role: 'user', content: input };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await authFetch('/api/llm/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages.map((m) => ({ role: m.role, content: m.content })), provider }),
      });
      const json = await res.json();
      if (json.success) {
        setMessages([...newMessages, { role: 'assistant', content: json.data.content, provider: json.data.provider, model: json.data.model }]);
      }
    } catch {
      setMessages([...newMessages, { role: 'assistant', content: 'Error: Failed to get response' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
        <PageHeader title="AI Chat" />
        <select
          value={provider}
          onChange={(e) => setProvider(e.target.value)}
          style={{
            padding: '6px 12px', borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-primary)', background: 'var(--bg-tertiary)',
            color: 'var(--text-primary)', fontSize: 'var(--font-sm)',
          }}
        >
          {PROVIDERS.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', marginBottom: 'var(--space-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
        {messages.length === 0 ? (
          <EmptyState icon="🤖" text="Send a message to start chatting" />
        ) : (
          messages.map((msg, i) => (
            <div
              key={i}
              style={{
                padding: 'var(--space-md) var(--space-lg)',
                borderRadius: 'var(--radius-lg)',
                background: msg.role === 'user' ? 'var(--bg-hover)' : 'var(--bg-secondary)',
                border: '1px solid var(--border-primary)',
                maxWidth: '80%',
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              }}
            >
              <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', marginBottom: 'var(--space-xs)' }}>
                {msg.role === 'user' ? 'You' : `${msg.provider ?? 'AI'} ${msg.model ? `(${msg.model})` : ''}`}
              </div>
              <p style={{ margin: 0, fontSize: 'var(--font-base)', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>{msg.content}</p>
            </div>
          ))
        )}
        {loading && <div style={{ padding: 'var(--space-md)', color: 'var(--text-muted)', fontSize: 'var(--font-sm)' }}>Thinking...</div>}
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
        <Input
          value={input}
          onChange={setInput}
          placeholder="Type a message..."
          style={{ padding: 'var(--space-md) var(--space-lg)' }}
        />
        <Button onClick={handleSend} loading={loading} size="lg">
          Send
        </Button>
      </div>
    </div>
  );
}
