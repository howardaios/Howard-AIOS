'use client';

import { useState, useCallback } from 'react';
import { PageHeader, Input, Button, Badge, Loading, EmptyState } from '../../components/ui';
import { authFetch } from '../../lib/auth-fetch';

interface SearchResult {
  id: string;
  domain: string;
  title: string;
  content: string;
  score: number;
  url?: string;
  metadata?: Record<string, unknown>;
}

const DOMAINS = [
  { key: 'meeting', label: '会议', icon: '📅' },
  { key: 'inbox', label: '收件箱', icon: '📥' },
  { key: 'document', label: '文档', icon: '📄' },
  { key: 'memory', label: '记忆', icon: '🧠' },
  { key: 'knowledge', label: '知识', icon: '📚' },
];

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  const [searched, setSearched] = useState(false);

  const doSearch = useCallback(() => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    const params = new URLSearchParams({
      q: query,
      limit: '50',
      ...(selectedDomains.length > 0 && { domains: selectedDomains.join(',') }),
    });
    authFetch(`/api/search?${params}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setResults(res.data.results ?? []);
          setTotal(res.data.total ?? 0);
        }
      })
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, [query, selectedDomains]);

  const toggleDomain = (key: string) => {
    setSelectedDomains((prev) => prev.includes(key) ? prev.filter((d) => d !== key) : [...prev, key]);
  };

  return (
    <div>
      <PageHeader title="统一搜索" />

      {/* Search Bar */}
      <div style={{ display: 'flex', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)' }}>
        <Input
          value={query}
          onChange={setQuery}
          placeholder="搜索会议、收件箱、文档、记忆、知识..."
          style={{ padding: 'var(--space-md) var(--space-lg)', fontSize: 'var(--font-lg)' }}
        />
        <Button onClick={doSearch} loading={loading} size="lg">
          搜索
        </Button>
      </div>

      {/* Domain Filters */}
      <div style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-xl)', flexWrap: 'wrap' }}>
        {DOMAINS.map((d) => {
          const active = selectedDomains.length === 0 || selectedDomains.includes(d.key);
          return (
            <button
              key={d.key}
              onClick={() => toggleDomain(d.key)}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-md)',
                border: `1px solid ${active ? 'var(--accent-blue)' : 'var(--border-primary)'}`,
                background: active ? 'var(--bg-hover)' : 'var(--bg-secondary)',
                color: active ? 'var(--accent-blue)' : 'var(--text-muted)',
                fontSize: 'var(--font-sm)',
                cursor: 'pointer',
              }}
            >
              {d.icon} {d.label}
            </button>
          );
        })}
      </div>

      {/* Results */}
      {loading ? (
        <Loading text="搜索中..." />
      ) : !searched ? (
        <EmptyState icon="🔍" text="输入关键词开始搜索" />
      ) : results.length === 0 ? (
        <EmptyState icon="😔" text="未找到结果" />
      ) : (
        <div>
          <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)', marginBottom: 'var(--space-lg)' }}>找到 {total} 条结果</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
            {results.map((r, idx) => {
              const domainInfo = DOMAINS.find((d) => d.key === r.domain);
              return (
                <div key={`${r.domain}-${r.id}-${idx}`} style={{ padding: 'var(--space-lg) var(--space-xl)', borderRadius: 'var(--radius-lg)', background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 600, fontSize: 'var(--font-base)' }}>
                      {domainInfo?.icon ?? '📄'} {r.title}
                    </span>
                    <Badge>{domainInfo?.label ?? r.domain}</Badge>
                  </div>
                  <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {r.content.slice(0, 200)}
                  </p>
                  {r.score > 0 && (
                    <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-disabled)', marginTop: 'var(--space-xs)', display: 'inline-block' }}>
                      相关度: {Math.round(r.score * 100)}%
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
