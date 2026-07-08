'use client';

import { useState, useEffect } from 'react';
import { Loading, ErrorState, Badge } from '../../../components/ui';
import { authFetch } from '../../../lib/auth-fetch';

interface BriefData {
  type: string;
  date: string;
  generatedAt: string;
  summary: { meetingsToday: number; pendingHighPriorityTasks: number; urgentInboxItems: number; activeRisks: number; pendingDecisions: number };
  sections: {
    todaySchedule: Array<{ id: string; title: string; status: string; startedAt: string; participants: string[] }>;
    highPriorityTasks: Array<{ id: string; title: string; status: string; priority: string; dueAt: string | null }>;
    urgentItems: Array<{ id: string; title: string | null; content: string; priority: string; createdAt: string }>;
    activeRisks: Array<{ id: string; title: string; content: string | null; confidence: number }>;
    pendingDecisions: Array<{ id: string; title: string; status: string; createdAt: string }>;
    tomorrowPlan: Array<{ title: string; type: string }>;
  };
}

function BriefSection({ icon, title, count, children }: { icon: string; title: string; count?: number; children: React.ReactNode }) {
  return (
    <div style={{ padding: 20, borderRadius: 12, background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        <h3 style={{ fontSize: 14, fontWeight: 600 }}>{title}</h3>
        {count !== undefined && <Badge color={count > 0 ? 'var(--accent-yellow)' : 'var(--accent-green)'}>{count}</Badge>}
      </div>
      {children}
    </div>
  );
}

export default function CEOBriefPage() {
  const [brief, setBrief] = useState<BriefData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBrief = () => {
    setLoading(true);
    authFetch('/api/ceo/brief').then((r) => r.json()).then((j) => { if (j.success) setBrief(j.data); }).catch((e) => setError(String(e))).finally(() => setLoading(false));
  };

  useEffect(() => { fetchBrief(); }, []);

  if (loading) return <Loading text="Generating Daily Brief..." />;
  if (error) return <ErrorState message={error} onRetry={fetchBrief} />;
  if (!brief) return <ErrorState message="No brief data" />;

  const s = brief.sections;

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>Daily Brief</h1>
          <Badge color={brief.type === 'morning' ? 'var(--accent-yellow)' : brief.type === 'afternoon' ? 'var(--accent-blue)' : 'var(--accent-purple)'}>
            {brief.type === 'morning' ? '☀️ Morning' : brief.type === 'afternoon' ? '🌤 Afternoon' : '🌙 Evening'}
          </Badge>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>{brief.date} · Generated {new Date(brief.generatedAt).toLocaleTimeString()}</p>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Meetings', value: brief.summary.meetingsToday, color: 'var(--accent-blue)' },
          { label: 'Tasks', value: brief.summary.pendingHighPriorityTasks, color: 'var(--accent-yellow)' },
          { label: 'Urgent', value: brief.summary.urgentInboxItems, color: 'var(--accent-red)' },
          { label: 'Risks', value: brief.summary.activeRisks, color: 'var(--accent-red)' },
          { label: 'Decisions', value: brief.summary.pendingDecisions, color: 'var(--accent-purple)' },
        ].map((item) => (
          <div key={item.label} style={{ padding: 16, borderRadius: 10, background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: item.color }}>{item.value}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{item.label}</div>
          </div>
        ))}
      </div>

      {/* Today's Schedule */}
      <BriefSection icon="📅" title="Today's Schedule" count={s.todaySchedule.length}>
        {s.todaySchedule.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No meetings scheduled</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {s.todaySchedule.map((m) => (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, background: 'var(--bg-tertiary)', fontSize: 13 }}>
                <span style={{ color: 'var(--text-muted)', fontSize: 11, minWidth: 50 }}>{new Date(m.startedAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</span>
                <span style={{ flex: 1 }}>{m.title}</span>
                <Badge color={m.status === 'COMPLETED' ? 'var(--accent-green)' : 'var(--accent-yellow)'}>{m.status}</Badge>
              </div>
            ))}
          </div>
        )}
      </BriefSection>

      {/* High Priority Tasks */}
      <BriefSection icon="🔥" title="High Priority Tasks" count={s.highPriorityTasks.length}>
        {s.highPriorityTasks.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No high priority tasks</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {s.highPriorityTasks.map((t) => (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, background: 'var(--bg-tertiary)', fontSize: 13 }}>
                <span style={{ flex: 1 }}>{t.title}</span>
                <Badge color={t.priority === 'CRITICAL' ? 'var(--accent-red)' : 'var(--accent-yellow)'}>{t.priority}</Badge>
              </div>
            ))}
          </div>
        )}
      </BriefSection>

      {/* Urgent Items */}
      <BriefSection icon="🚨" title="Urgent Items" count={s.urgentItems.length}>
        {s.urgentItems.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No urgent items</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {s.urgentItems.map((item) => (
              <div key={item.id} style={{ padding: '8px 12px', borderRadius: 8, background: 'var(--bg-tertiary)', fontSize: 13 }}>
                <div style={{ fontWeight: 500 }}>{item.title || 'Untitled'}</div>
                {item.content && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{item.content.slice(0, 100)}</div>}
              </div>
            ))}
          </div>
        )}
      </BriefSection>

      {/* Active Risks */}
      <BriefSection icon="⚠️" title="Active Risks" count={s.activeRisks.length}>
        {s.activeRisks.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No active risks</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {s.activeRisks.map((r) => (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, background: 'var(--bg-tertiary)', fontSize: 13 }}>
                <span style={{ flex: 1 }}>{r.title}</span>
                <Badge color={r.confidence >= 0.7 ? 'var(--accent-red)' : 'var(--accent-yellow)'}>{Math.round(r.confidence * 100)}%</Badge>
              </div>
            ))}
          </div>
        )}
      </BriefSection>

      {/* Pending Decisions */}
      <BriefSection icon="⚖️" title="Pending Decisions" count={s.pendingDecisions.length}>
        {s.pendingDecisions.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No pending decisions</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {s.pendingDecisions.map((d) => (
              <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, background: 'var(--bg-tertiary)', fontSize: 13 }}>
                <span style={{ flex: 1 }}>{d.title}</span>
                <Badge color="var(--accent-purple)">{d.status}</Badge>
              </div>
            ))}
          </div>
        )}
      </BriefSection>

      {/* Tomorrow Plan */}
      <BriefSection icon="📋" title="Tomorrow Plan" count={s.tomorrowPlan.length}>
        {s.tomorrowPlan.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No follow-ups planned</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {s.tomorrowPlan.map((p, i) => (
              <div key={i} style={{ padding: '8px 12px', borderRadius: 8, background: 'var(--bg-tertiary)', fontSize: 13, color: 'var(--text-secondary)' }}>
                → {p.title}
              </div>
            ))}
          </div>
        )}
      </BriefSection>
    </div>
  );
}
