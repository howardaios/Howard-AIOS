'use client';

import { useState, useEffect, useCallback } from 'react';
import { Input, Badge, Button, EmptyState, Loading, ErrorState } from '../../components/ui';

interface InboxItem {
  id: string;
  sourceType: string;
  sourceDetail?: string;
  title?: string;
  content: string;
  priority: string;
  status: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

const PRIORITY_COLORS: Record<string, string> = {
  URGENT: 'var(--accent-red)',
  HIGH: 'var(--accent-yellow)',
  NORMAL: 'var(--accent-blue)',
  LOW: 'var(--text-muted)',
};

const STATUS_BADGES: Record<string, string> = {
  RECEIVED: '📥',
  NORMALIZED: '📝',
  STORED: '💾',
  ARCHIVED: '📦',
};

const SOURCE_LABELS: Record<string, string> = {
  MANUAL: '手动', WECHAT: '微信', DINGTALK: '钉钉', FEISHU: '飞书',
  EMAIL: '邮件', PLAUD: 'Plaud', FILE: '文件', OCR: 'OCR', API: 'API', WEBHOOK: 'Webhook',
};

export default function InboxPage() {
  const [items, setItems] = useState<InboxItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<InboxItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pageSize = 20;

  const fetchInbox = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
      ...(search && { search }),
      ...(sourceFilter && { sourceType: sourceFilter }),
      ...(priorityFilter && { priority: priorityFilter }),
    });
    fetch(`/api/inbox?${params}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setItems(res.data.items ?? res.data ?? []);
          setTotal(res.data.total ?? 0);
        }
      })
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, [page, search, sourceFilter, priorityFilter]);

  useEffect(() => { fetchInbox(); }, [fetchInbox]);

  const handleSelect = (item: InboxItem) => {
    setSelectedId(item.id);
    setSelectedItem(item);
  };

  if (error) return <ErrorState message={error} onRetry={fetchInbox} />;

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 120px)' }}>
      {/* List Panel */}
      <div style={{ width: '50%', borderRight: '1px solid var(--border-primary)', display: 'flex', flexDirection: 'column' }}>
        {/* Search + Filters */}
        <div style={{ padding: 'var(--space-lg)', borderBottom: '1px solid var(--border-primary)' }}>
          <div style={{ marginBottom: 'var(--space-sm)' }}>
            <Input value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="搜索收件箱..." />
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
            <select value={sourceFilter} onChange={(e) => { setSourceFilter(e.target.value); setPage(1); }} style={selectStyle}>
              <option value="">全部来源</option>
              {Object.entries(SOURCE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <select value={priorityFilter} onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }} style={selectStyle}>
              <option value="">全部优先级</option>
              {Object.keys(PRIORITY_COLORS).map((k) => <option key={k} value={k}>{k}</option>)}
            </select>
          </div>
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <Loading />
          ) : items.length === 0 ? (
            <EmptyState icon="📭" text="收件箱为空" />
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                onClick={() => handleSelect(item)}
                style={{
                  padding: 'var(--space-md) var(--space-lg)',
                  borderBottom: '1px solid var(--border-primary)',
                  cursor: 'pointer',
                  background: selectedId === item.id ? 'var(--bg-hover)' : 'transparent',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-xs)' }}>
                  <span style={{ fontWeight: 600, fontSize: 'var(--font-base)' }}>
                    {STATUS_BADGES[item.status] ?? '📄'} {item.title || '无标题'}
                  </span>
                  <Badge color={PRIORITY_COLORS[item.priority] ?? 'var(--text-muted)'}>{item.priority}</Badge>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-sm)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.content.slice(0, 80)}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--space-xs)' }}>
                  <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-disabled)' }}>{SOURCE_LABELS[item.sourceType] ?? item.sourceType}</span>
                  <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-disabled)' }}>{new Date(item.createdAt).toLocaleDateString('zh-CN')}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        <div style={{ padding: 'var(--space-sm) var(--space-lg)', borderTop: '1px solid var(--border-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--font-sm)', color: 'var(--text-muted)' }}>
          <span>第 {page} 页 / 共 {totalPages} 页 · 共 {total} 条</span>
          <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
            <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>上一页</Button>
            <Button variant="ghost" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>下一页</Button>
          </div>
        </div>
      </div>

      {/* Detail Panel */}
      <div style={{ flex: 1, padding: 'var(--space-xl)', overflowY: 'auto' }}>
        {selectedItem ? (
          <div>
            <div style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)' }}>
              <Badge color={PRIORITY_COLORS[selectedItem.priority] ?? 'var(--text-muted)'}>{selectedItem.priority}</Badge>
              <Badge>{selectedItem.status}</Badge>
              <Badge>{SOURCE_LABELS[selectedItem.sourceType] ?? selectedItem.sourceType}</Badge>
            </div>
            <h2 style={{ fontSize: 'var(--font-xl)', fontWeight: 600, marginBottom: 'var(--space-sm)' }}>
              {selectedItem.title || '无标题'}
            </h2>
            <div style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)', marginBottom: 'var(--space-lg)' }}>
              {new Date(selectedItem.createdAt).toLocaleString('zh-CN')}
            </div>
            <div style={{
              padding: 'var(--space-lg)', borderRadius: 'var(--radius-lg)',
              background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)',
              color: 'var(--text-secondary)', fontSize: 'var(--font-base)', lineHeight: '1.8',
              whiteSpace: 'pre-wrap',
            }}>
              {selectedItem.content}
            </div>
            {selectedItem.tags.length > 0 && (
              <div style={{ display: 'flex', gap: '6px', marginTop: 'var(--space-md)', flexWrap: 'wrap' }}>
                {selectedItem.tags.map((t) => <Badge key={t}>{t}</Badge>)}
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
            <p>选择一条信息查看详情</p>
          </div>
        )}
      </div>
    </div>
  );
}

const selectStyle: React.CSSProperties = {
  flex: 1,
  padding: '6px 8px',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border-primary)',
  background: 'var(--bg-tertiary)',
  color: 'var(--text-primary)',
  fontSize: 'var(--font-sm)',
};
