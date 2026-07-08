'use client';

import { useState, useEffect } from 'react';
import { PageHeader, Button, Badge, Loading, EmptyState } from '../../components/ui';
import { authFetch } from '../../lib/auth-fetch';

interface KNode { id: string; type: string; title: string; content: string; confidence: number; source: string }
interface KEdge { id: string; fromId: string; toId: string; type: string; weight: number }

export default function KnowledgePage() {
  const [nodes, setNodes] = useState<KNode[]>([]);
  const [edges, setEdges] = useState<KEdge[]>([]);
  const [extractText, setExtractText] = useState('');
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('');

  useEffect(() => {
    authFetch('/api/knowledge/graph').then((r) => r.json()).then((res) => {
      if (res.success) { setNodes(res.data.nodes ?? []); setEdges(res.data.edges ?? []); }
    }).finally(() => setLoading(false));
  }, []);

  const handleExtract = () => {
    if (!extractText.trim()) return;
    authFetch('/api/knowledge/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: extractText, source: 'manual' }),
    }).then((r) => r.json()).then(() => {
      setExtractText('');
      authFetch('/api/knowledge/graph').then((r) => r.json()).then((res) => {
        if (res.success) { setNodes(res.data.nodes ?? []); setEdges(res.data.edges ?? []); }
      });
    });
  };

  const filtered = filterType ? nodes.filter((n) => n.type === filterType) : nodes;
  const typeColors: Record<string, string> = {
    person: 'var(--accent-blue)', company: 'var(--accent-purple)', task: 'var(--accent-yellow)',
    decision: 'var(--accent-green)', risk: 'var(--accent-red)', keyword: 'var(--text-muted)', timeline: 'var(--accent-blue)',
  };

  if (loading) return <Loading />;

  return (
    <div>
      <PageHeader title="Knowledge Graph" />

      <div style={{ display: 'flex', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)' }}>
        <textarea
          value={extractText}
          onChange={(e) => setExtractText(e.target.value)}
          placeholder="Paste text to extract knowledge (meetings, articles, notes)..."
          rows={3}
          style={{
            flex: 1, padding: 'var(--space-md)', borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-primary)', background: 'var(--bg-tertiary)',
            color: 'var(--text-primary)', fontSize: 'var(--font-base)', resize: 'vertical',
          }}
        />
        <Button variant="secondary" onClick={handleExtract} style={{ alignSelf: 'flex-start' }}>
          Extract
        </Button>
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)', flexWrap: 'wrap' }}>
        <button
          onClick={() => setFilterType('')}
          style={{
            padding: 'var(--space-xs) var(--space-md)', borderRadius: 'var(--radius-md)',
            border: `1px solid ${!filterType ? 'var(--accent-blue)' : 'var(--border-primary)'}`,
            background: !filterType ? 'var(--bg-hover)' : 'var(--bg-secondary)',
            color: !filterType ? 'var(--accent-blue)' : 'var(--text-muted)',
            fontSize: 'var(--font-sm)', cursor: 'pointer',
          }}
        >
          All ({nodes.length})
        </button>
        {['person', 'company', 'task', 'decision', 'risk', 'keyword', 'timeline'].map((t) => (
          <button
            key={t}
            onClick={() => setFilterType(t)}
            style={{
              padding: 'var(--space-xs) var(--space-md)', borderRadius: 'var(--radius-md)',
              border: `1px solid ${filterType === t ? (typeColors[t] ?? 'var(--border-primary)') : 'var(--border-primary)'}`,
              background: filterType === t ? 'var(--bg-hover)' : 'var(--bg-secondary)',
              color: filterType === t ? (typeColors[t] ?? 'var(--text-muted)') : 'var(--text-muted)',
              fontSize: 'var(--font-sm)', cursor: 'pointer',
            }}
          >
            {t} ({nodes.filter((n) => n.type === t).length})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="🧠" text="No knowledge nodes yet. Paste text above to extract." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {filtered.map((n) => (
            <div key={n.id} style={{ padding: 'var(--space-md) var(--space-lg)', borderRadius: 'var(--radius-lg)', background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-xs)' }}>
                <span style={{ fontWeight: 600, fontSize: 'var(--font-base)' }}>{n.title}</span>
                <Badge color={typeColors[n.type] ?? 'var(--text-muted)'}>{n.type}</Badge>
              </div>
              <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)', margin: 0 }}>{n.content.slice(0, 120)}</p>
            </div>
          ))}
        </div>
      )}
      {edges.length > 0 && (
        <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-disabled)', marginTop: 'var(--space-lg)' }}>{edges.length} connections between nodes</p>
      )}
    </div>
  );
}
