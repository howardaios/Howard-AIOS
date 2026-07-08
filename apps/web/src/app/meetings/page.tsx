'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { PageHeader, Input, Badge, Loading, EmptyState, Button } from '../../components/ui';

interface Meeting {
  id: string;
  title: string;
  description?: string;
  location?: string;
  status: string;
  startedAt: string;
  endedAt?: string;
  durationMin?: number;
  participants: string[];
  tags: string[];
  summary?: string;
}

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: 'var(--accent-blue)',
  IN_PROGRESS: 'var(--accent-yellow)',
  COMPLETED: 'var(--accent-green)',
  CANCELLED: 'var(--text-muted)',
};

const STATUS_LABELS: Record<string, string> = {
  SCHEDULED: '已安排',
  IN_PROGRESS: '进行中',
  COMPLETED: '已完成',
  CANCELLED: '已取消',
};

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const pageSize = 20;

  const fetchMeetings = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
      ...(search && { search }),
      ...(statusFilter && { status: statusFilter }),
    });
    fetch(`/api/meetings?${params}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setMeetings(res.data.items ?? []);
          setTotal(res.data.total ?? 0);
        }
      })
      .catch(() => setMeetings([]))
      .finally(() => setLoading(false));
  }, [page, search, statusFilter]);

  useEffect(() => { fetchMeetings(); }, [fetchMeetings]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div>
      <PageHeader title="会议" subtitle={`共 ${total} 条`} />

      {/* Filters */}
      <div style={{ display: 'flex', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)' }}>
        <Input
          value={search}
          onChange={(v) => { setSearch(v); setPage(1); }}
          placeholder="搜索会议..."
        />
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          style={{
            padding: 'var(--space-sm) var(--space-md)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-primary)',
            background: 'var(--bg-tertiary)',
            color: 'var(--text-primary)',
            fontSize: 'var(--font-base)',
          }}
        >
          <option value="">全部状态</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {/* List */}
      {loading ? (
        <Loading />
      ) : meetings.length === 0 ? (
        <EmptyState icon="📅" text="暂无会议" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
          {meetings.map((m) => (
            <Link
              key={m.id}
              href={`/meetings/${m.id}`}
              style={{
                display: 'block',
                padding: 'var(--space-lg) var(--space-xl)',
                borderRadius: 'var(--radius-lg)',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-primary)',
                textDecoration: 'none',
                color: 'var(--text-primary)',
                transition: 'border-color 0.15s',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-sm)' }}>
                <span style={{ fontWeight: 600, fontSize: 'var(--font-lg)' }}>{m.title}</span>
                <Badge color={STATUS_COLORS[m.status] ?? 'var(--text-muted)'}>
                  {STATUS_LABELS[m.status] ?? m.status}
                </Badge>
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-lg)', fontSize: 'var(--font-sm)', color: 'var(--text-muted)' }}>
                <span>📆 {new Date(m.startedAt).toLocaleString('zh-CN')}</span>
                {m.location && <span>📍 {m.location}</span>}
                {m.participants.length > 0 && <span>👥 {m.participants.length} 人</span>}
              </div>
              {m.tags.length > 0 && (
                <div style={{ display: 'flex', gap: '6px', marginTop: 'var(--space-sm)', flexWrap: 'wrap' }}>
                  {m.tags.map((t) => (
                    <Badge key={t}>{t}</Badge>
                  ))}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--space-xl)', padding: 'var(--space-md) 0', borderTop: '1px solid var(--border-primary)' }}>
        <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)' }}>第 {page} / {totalPages} 页</span>
        <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
          <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>上一页</Button>
          <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>下一页</Button>
        </div>
      </div>
    </div>
  );
}
