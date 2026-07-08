'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Loading, ErrorState, Badge, Tabs } from '../../../components/ui';
import { authFetch } from '../../../lib/auth-fetch';

interface CEOInboxData {
  meetings: Array<{ id: string; title: string; status: string; startedAt: string; participants: string[] }>;
  inbox: Array<{ id: string; title: string | null; content: string; sourceType: string; priority: string; status: string; createdAt: string }>;
  tasks: Array<{ id: string; title: string; status: string; priority: string; dueAt: string | null }>;
  decisions: Array<{ id: string; title: string; status: string; createdAt: string }>;
  risks: Array<{ id: string; title: string; content: string | null; confidence: number; createdAt: string }>;
  summary: { meetings: number; inbox: number; tasks: number; decisions: number; risks: number };
}

const PRIORITY_COLORS: Record<string, string> = { URGENT: 'var(--accent-red)', HIGH: 'var(--accent-yellow)', NORMAL: 'var(--accent-blue)', LOW: 'var(--text-muted)' };

export default function CEOInboxPage() {
  const [data, setData] = useState<CEOInboxData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState('All');

  const fetchData = () => {
    setLoading(true);
    authFetch('/api/ceo/inbox').then((r) => r.json()).then((j) => { if (j.success) setData(j.data); }).catch((e) => setError(String(e))).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) return <Loading text="Loading CEO Inbox..." />;
  if (error) return <ErrorState message={error} onRetry={fetchData} />;
  if (!data) return <ErrorState message="No data" />;

  const tabs = ['All', 'Meetings', 'Tasks', 'Decisions', 'Risks', 'Inbox'];

  const renderMeetings = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {data.meetings.length === 0 ? <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 32 }}>No meetings</div> : data.meetings.map((m) => (
        <Link key={m.id} href={`/meetings/${m.id}`} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 8, background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', textDecoration: 'none', color: 'var(--text-primary)', fontSize: 13 }}>
          <span style={{ fontSize: 16 }}>📅</span>
          <span style={{ flex: 1 }}>{m.title}</span>
          <Badge color={m.status === 'COMPLETED' ? 'var(--accent-green)' : 'var(--accent-yellow)'}>{m.status}</Badge>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(m.startedAt).toLocaleDateString()}</span>
        </Link>
      ))}
    </div>
  );

  const renderTasks = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {data.tasks.length === 0 ? <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 32 }}>No pending tasks</div> : data.tasks.map((t) => (
        <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 8, background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', fontSize: 13 }}>
          <span style={{ fontSize: 16 }}>✅</span>
          <span style={{ flex: 1 }}>{t.title}</span>
          <Badge color={PRIORITY_COLORS[t.priority] ?? 'var(--accent-blue)'}>{t.priority}</Badge>
          <Badge>{t.status}</Badge>
        </div>
      ))}
    </div>
  );

  const renderDecisions = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {data.decisions.length === 0 ? <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 32 }}>No pending decisions</div> : data.decisions.map((d) => (
        <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 8, background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', fontSize: 13 }}>
          <span style={{ fontSize: 16 }}>⚖️</span>
          <span style={{ flex: 1 }}>{d.title}</span>
          <Badge color="var(--accent-purple)">{d.status}</Badge>
        </div>
      ))}
    </div>
  );

  const renderRisks = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {data.risks.length === 0 ? <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 32 }}>No risks</div> : data.risks.map((r) => (
        <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 8, background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', fontSize: 13 }}>
          <span style={{ fontSize: 16 }}>⚠️</span>
          <span style={{ flex: 1 }}>{r.title}</span>
          <Badge color={r.confidence >= 0.7 ? 'var(--accent-red)' : 'var(--accent-yellow)'}>{Math.round(r.confidence * 100)}%</Badge>
        </div>
      ))}
    </div>
  );

  const renderInbox = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {data.inbox.length === 0 ? <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 32 }}>Inbox empty</div> : data.inbox.map((item) => (
        <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 8, background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', fontSize: 13 }}>
          <span style={{ fontSize: 16 }}>📥</span>
          <span style={{ flex: 1 }}>{item.title || 'Untitled'}</span>
          <Badge color={PRIORITY_COLORS[item.priority] ?? 'var(--accent-blue)'}>{item.priority}</Badge>
          <Badge>{item.sourceType}</Badge>
        </div>
      ))}
    </div>
  );

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>CEO Inbox</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
          {data.summary.meetings + data.summary.inbox + data.summary.tasks + data.summary.decisions + data.summary.risks} items across all categories
        </p>
      </div>

      <Tabs tabs={tabs} active={tab} onChange={setTab} />

      {(tab === 'All' || tab === 'Meetings') && (<><div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8, marginTop: 16 }}>Meetings ({data.summary.meetings})</div>{renderMeetings()}</>)}
      {(tab === 'All' || tab === 'Tasks') && (<><div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8, marginTop: 16 }}>Tasks ({data.summary.tasks})</div>{renderTasks()}</>)}
      {(tab === 'All' || tab === 'Decisions') && (<><div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8, marginTop: 16 }}>Decisions ({data.summary.decisions})</div>{renderDecisions()}</>)}
      {(tab === 'All' || tab === 'Risks') && (<><div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8, marginTop: 16 }}>Risks ({data.summary.risks})</div>{renderRisks()}</>)}
      {(tab === 'All' || tab === 'Inbox') && (<><div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8, marginTop: 16 }}>Inbox ({data.summary.inbox})</div>{renderInbox()}</>)}
    </div>
  );
}
