'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Loading, ErrorState, Badge, StatusDot } from '../../components/ui';
import { authFetch } from '../../lib/auth-fetch';

interface OverviewData {
  todayFocus: {
    meetingsToday: number;
    todayMeetings: Array<{ id: string; title: string; status: string; startedAt: string; participants: string[] }>;
    pendingTasks: number;
    pendingDecisions: number;
    urgentInbox: number;
    criticalRisks: number;
  };
  companyHealth: { executionRate: number; taskCompletion: string; decisionRate: number; inboxBacklog: number; inboxTotal: number };
  kpi: { weekly: { meetings: number; knowledge: number; memories: number }; monthly: { meetings: number } };
  growth: { meetingTotal: number; knowledgeTotal: number; knowledgeWeek: number; memoryTotal: number; memoryWeek: number; documentTotal: number; recordingTotal: number };
  recent: {
    meetings: Array<{ id: string; title: string; status: string; startedAt: string }>;
    risks: Array<{ id: string; title: string; content: string | null; confidence: number; createdAt: string }>;
  };
  systemStatus: { aiProviders: Array<{ name: string; ok: boolean }> };
}

interface KpiData {
  weekly: { meetings: number; tasksCompleted: number; knowledgeNodes: number; decisions: number };
  monthly: { meetings: number; tasksCompleted: number; knowledgeNodes: number; decisions: number };
}

function MetricCard({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: string }) {
  return (
    <div style={{ padding: '20px', borderRadius: 12, background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color: accent ?? 'var(--text-primary)', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
      <h2 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{children}</h2>
      {action}
    </div>
  );
}

function ProgressBar({ value, color = 'var(--accent-blue)' }: { value: number; color?: string }) {
  return (
    <div style={{ height: 4, borderRadius: 2, background: 'var(--bg-tertiary)', width: '100%', overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${Math.min(100, Math.max(0, value))}%`, background: color, borderRadius: 2, transition: 'width 0.3s' }} />
    </div>
  );
}

export default function CEODashboard() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [kpi, setKpi] = useState<KpiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = () => {
    setLoading(true);
    Promise.all([
      authFetch('/api/ceo/overview').then((r) => r.json()),
      authFetch('/api/ceo/kpi').then((r) => r.json()),
    ])
      .then(([ov, kp]) => {
        if (ov.success) setData(ov.data);
        if (kp.success) setKpi(kp.data);
      })
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAll(); }, []);

  if (loading) return <Loading text="Loading CEO Office..." />;
  if (error) return <ErrorState message={error} onRetry={fetchAll} />;
  if (!data) return <ErrorState message="No data" />;

  const tf = data.todayFocus;
  const ch = data.companyHealth;
  const g = data.growth;

  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>{greeting}</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
          {now.toLocaleDateString('zh-CN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Today's Focus */}
      <SectionTitle action={<Link href="/ceo/brief" style={{ fontSize: 12, color: 'var(--accent-blue)' }}>View Brief →</Link>}>
        Today&apos;s Focus
      </SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 12, marginBottom: 32 }}>
        <MetricCard label="Meetings Today" value={tf.meetingsToday} accent="var(--accent-blue)" />
        <MetricCard label="Pending Tasks" value={tf.pendingTasks} accent="var(--accent-yellow)" />
        <MetricCard label="Pending Decisions" value={tf.pendingDecisions} accent="var(--accent-purple)" />
        <MetricCard label="Urgent Inbox" value={tf.urgentInbox} accent="var(--accent-red)" />
        <MetricCard label="Critical Risks" value={tf.criticalRisks} accent={tf.criticalRisks > 0 ? 'var(--accent-red)' : 'var(--accent-green)'} />
      </div>

      {/* Company Health */}
      <SectionTitle>Company Health</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12, marginBottom: 32 }}>
        <div style={{ padding: 20, borderRadius: 12, background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Execution Rate</span>
            <span style={{ fontSize: 20, fontWeight: 700, color: ch.executionRate >= 60 ? 'var(--accent-green)' : 'var(--accent-yellow)' }}>{ch.executionRate}%</span>
          </div>
          <ProgressBar value={ch.executionRate} color={ch.executionRate >= 60 ? 'var(--accent-green)' : 'var(--accent-yellow)'} />
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>{ch.taskCompletion} tasks completed</div>
        </div>
        <div style={{ padding: 20, borderRadius: 12, background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Decision Rate</span>
            <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--accent-blue)' }}>{ch.decisionRate}%</span>
          </div>
          <ProgressBar value={ch.decisionRate} color="var(--accent-blue)" />
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>Inbox backlog: {ch.inboxBacklog}/{ch.inboxTotal}</div>
        </div>
      </div>

      {/* KPI Section */}
      <SectionTitle>KPI</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12, marginBottom: 32 }}>
        {/* Weekly */}
        <div style={{ padding: 20, borderRadius: 12, background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>This Week</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><div style={{ fontSize: 22, fontWeight: 700 }}>{kpi?.weekly.meetings ?? data.kpi.weekly.meetings}</div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Meetings</div></div>
            <div><div style={{ fontSize: 22, fontWeight: 700 }}>{kpi?.weekly.tasksCompleted ?? 0}</div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Tasks Done</div></div>
            <div><div style={{ fontSize: 22, fontWeight: 700 }}>{kpi?.weekly.knowledgeNodes ?? data.kpi.weekly.knowledge}</div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Knowledge</div></div>
            <div><div style={{ fontSize: 22, fontWeight: 700 }}>{kpi?.weekly.decisions ?? 0}</div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Decisions</div></div>
          </div>
        </div>
        {/* Monthly */}
        <div style={{ padding: 20, borderRadius: 12, background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>This Month</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><div style={{ fontSize: 22, fontWeight: 700 }}>{kpi?.monthly.meetings ?? data.kpi.monthly.meetings}</div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Meetings</div></div>
            <div><div style={{ fontSize: 22, fontWeight: 700 }}>{kpi?.monthly.tasksCompleted ?? 0}</div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Tasks Done</div></div>
            <div><div style={{ fontSize: 22, fontWeight: 700 }}>{kpi?.monthly.knowledgeNodes ?? 0}</div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Knowledge</div></div>
            <div><div style={{ fontSize: 22, fontWeight: 700 }}>{kpi?.monthly.decisions ?? 0}</div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Decisions</div></div>
          </div>
        </div>
      </div>

      {/* Growth + System */}
      <SectionTitle>Organization Status</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12, marginBottom: 32 }}>
        <MetricCard label="Knowledge" value={g.knowledgeTotal} sub={`+${g.knowledgeWeek} this week`} accent="var(--accent-purple)" />
        <MetricCard label="Memories" value={g.memoryTotal} sub={`+${g.memoryWeek} this week`} accent="var(--accent-blue)" />
        <MetricCard label="Documents" value={g.documentTotal} accent="var(--accent-green)" />
        <MetricCard label="Recordings" value={g.recordingTotal} accent="var(--accent-yellow)" />
        <MetricCard label="Total Meetings" value={g.meetingTotal} accent="var(--accent-pink)" />
      </div>

      {/* Recent Meetings + Risks + AI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
        {/* Recent Meetings */}
        <div style={{ padding: 20, borderRadius: 12, background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Recent Meetings</div>
          {data.recent.meetings.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: 20 }}>No meetings yet</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {data.recent.meetings.map((m) => (
                <Link key={m.id} href={`/meetings/${m.id}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 8, background: 'var(--bg-tertiary)', textDecoration: 'none', color: 'var(--text-primary)', fontSize: 13, transition: 'background 0.15s' }}>
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.title}</span>
                  <Badge color={m.status === 'COMPLETED' ? 'var(--accent-green)' : 'var(--accent-yellow)'}>{m.status}</Badge>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Active Risks */}
        <div style={{ padding: 20, borderRadius: 12, background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Active Risks</div>
          {data.recent.risks.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: 20 }}>No risks identified</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {data.recent.risks.slice(0, 5).map((r) => (
                <div key={r.id} style={{ padding: '8px 12px', borderRadius: 8, background: 'var(--bg-tertiary)', fontSize: 13 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-primary)' }}>{r.title}</span>
                    <Badge color={r.confidence >= 0.7 ? 'var(--accent-red)' : 'var(--accent-yellow)'}>{Math.round(r.confidence * 100)}%</Badge>
                  </div>
                  {r.content && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{r.content.slice(0, 80)}</div>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AI Status */}
        <div style={{ padding: 20, borderRadius: 12, background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>AI Providers</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {data.systemStatus.aiProviders.map((p) => (
              <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, background: 'var(--bg-tertiary)', fontSize: 12 }}>
                <StatusDot ok={p.ok} />
                <span>{p.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ marginTop: 32, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Link href="/ceo/inbox" style={{ padding: '10px 20px', borderRadius: 8, background: 'var(--accent-blue)', color: '#fff', fontSize: 13, fontWeight: 500, textDecoration: 'none', transition: 'opacity 0.15s' }}>CEO Inbox →</Link>
        <Link href="/ceo/brief" style={{ padding: '10px 20px', borderRadius: 8, background: 'var(--bg-tertiary)', color: 'var(--text-primary)', fontSize: 13, fontWeight: 500, textDecoration: 'none', border: '1px solid var(--border-primary)', transition: 'opacity 0.15s' }}>Daily Brief →</Link>
        <Link href="/ceo/intelligence" style={{ padding: '10px 20px', borderRadius: 8, background: 'var(--bg-tertiary)', color: 'var(--text-primary)', fontSize: 13, fontWeight: 500, textDecoration: 'none', border: '1px solid var(--border-primary)', transition: 'opacity 0.15s' }}>Intelligence →</Link>
        <Link href="/upload" style={{ padding: '10px 20px', borderRadius: 8, background: 'var(--bg-tertiary)', color: 'var(--text-primary)', fontSize: 13, fontWeight: 500, textDecoration: 'none', border: '1px solid var(--border-primary)', transition: 'opacity 0.15s' }}>Upload →</Link>
      </div>
    </div>
  );
}
