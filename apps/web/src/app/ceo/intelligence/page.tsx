'use client';

import { useState, useEffect } from 'react';
import { Loading, ErrorState, Badge } from '../../../components/ui';
import { authFetch } from '../../../lib/auth-fetch';

interface IntelligenceData {
  scores: {
    health: { value: number; label: string };
    risk: { value: number; label: string };
    growth: { value: number; label: string };
  };
  analysis: {
    strategic: { risks: Array<{ id: string; title: string; confidence: number; content: string | null; createdAt: string }>; count: number };
    operational: { executionRate: number; pendingDecisions: number };
    organizational: { totalMeetings: number; urgentInbox: number };
  };
  riskDetails: Array<{ id: string; title: string; content: string | null; confidence: number; createdAt: string }>;
}

interface RecommendationData {
  topActions: Array<{ rank: number; type: string; id: string; title: string; priority: string }>;
  topDecisions: Array<{ rank: number; type: string; id: string; title: string; pendingDays: number }>;
  topRisks: Array<{ rank: number; type: string; id: string; title: string; confidence: number }>;
  opportunities: Array<{ rank: number; type: string; id: string; title: string }>;
  quickWins: Array<{ rank: number; type: string; id: string; title: string }>;
  overdue: Array<{ id: string; title: string; dueAt: string | null; priority: string }>;
  generatedAt: string;
}

function ScoreRing({ value, label, color }: { value: number; label: string; color: string }) {
  const circumference = 2 * Math.PI * 40;
  const offset = circumference - (value / 100) * circumference;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div style={{ position: 'relative', width: 96, height: 96 }}>
        <svg width="96" height="96" viewBox="0 0 96 96" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="48" cy="48" r="40" fill="none" stroke="var(--bg-tertiary)" strokeWidth="6" />
          <circle cx="48" cy="48" r="40" fill="none" stroke={color} strokeWidth="6" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} style={{ transition: 'stroke-dashoffset 0.5s' }} />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700 }}>{value}</div>
      </div>
      <div style={{ fontSize: 12, fontWeight: 600, color }}>{label}</div>
    </div>
  );
}

export default function CEOIntelligencePage() {
  const [intel, setIntel] = useState<IntelligenceData | null>(null);
  const [recs, setRecs] = useState<RecommendationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = () => {
    setLoading(true);
    Promise.all([
      authFetch('/api/ceo/intelligence').then((r) => r.json()),
      authFetch('/api/ceo/recommendations').then((r) => r.json()),
    ])
      .then(([i, r]) => {
        if (i.success) setIntel(i.data);
        if (r.success) setRecs(r.data);
      })
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAll(); }, []);

  if (loading) return <Loading text="Analyzing intelligence..." />;
  if (error) return <ErrorState message={error} onRetry={fetchAll} />;
  if (!intel) return <ErrorState message="No data" />;

  const s = intel.scores;

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Executive Intelligence</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>AI-powered analysis of your organization</p>
      </div>

      {/* Score Rings */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 48, padding: 32, borderRadius: 12, background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', marginBottom: 32 }}>
        <ScoreRing value={s.health.value} label={`Health: ${s.health.label}`} color={s.health.value >= 70 ? 'var(--accent-green)' : s.health.value >= 40 ? 'var(--accent-yellow)' : 'var(--accent-red)'} />
        <ScoreRing value={s.risk.value} label={`Risk: ${s.risk.label}`} color={s.risk.value <= 30 ? 'var(--accent-green)' : s.risk.value <= 60 ? 'var(--accent-yellow)' : 'var(--accent-red)'} />
        <ScoreRing value={s.growth.value} label={`Growth: ${s.growth.label}`} color={s.growth.value >= 60 ? 'var(--accent-blue)' : s.growth.value >= 30 ? 'var(--accent-yellow)' : 'var(--accent-red)'} />
      </div>

      {/* Analysis Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, marginBottom: 32 }}>
        {/* Strategic */}
        <div style={{ padding: 20, borderRadius: 12, background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}>
          <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>🎯 Strategic Risk</h3>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>{intel.analysis.strategic.count} strategic risks identified</div>
          {intel.analysis.strategic.risks.slice(0, 3).map((r) => (
            <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--border-primary)', fontSize: 12 }}>
              <span>{r.title}</span>
              <Badge color={r.confidence >= 0.7 ? 'var(--accent-red)' : 'var(--accent-yellow)'}>{Math.round(r.confidence * 100)}%</Badge>
            </div>
          ))}
        </div>

        {/* Operational */}
        <div style={{ padding: 20, borderRadius: 12, background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}>
          <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>⚙️ Operational</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <div style={{ fontSize: 24, fontWeight: 700, color: intel.analysis.operational.executionRate >= 60 ? 'var(--accent-green)' : 'var(--accent-yellow)' }}>{intel.analysis.operational.executionRate}%</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Execution Rate</div>
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--accent-purple)' }}>{intel.analysis.operational.pendingDecisions}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Pending Decisions</div>
            </div>
          </div>
        </div>

        {/* Organizational */}
        <div style={{ padding: 20, borderRadius: 12, background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}>
          <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>🏢 Organizational</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <div style={{ fontSize: 24, fontWeight: 700 }}>{intel.analysis.organizational.totalMeetings}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Total Meetings</div>
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 700, color: intel.analysis.organizational.urgentInbox > 0 ? 'var(--accent-red)' : 'var(--accent-green)' }}>{intel.analysis.organizational.urgentInbox}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Urgent Inbox</div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Recommendations */}
      {recs && (
        <>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>AI Recommendations</h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16, marginBottom: 24 }}>
            {/* Top Actions */}
            <div style={{ padding: 20, borderRadius: 12, background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}>
              <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>🔥 Top Actions</h3>
              {recs.topActions.slice(0, 5).map((a) => (
                <div key={a.rank} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid var(--border-primary)', fontSize: 12 }}>
                  <span style={{ color: 'var(--text-muted)', minWidth: 20 }}>#{a.rank}</span>
                  <span style={{ flex: 1 }}>{a.title}</span>
                  <Badge color={a.priority === 'CRITICAL' ? 'var(--accent-red)' : 'var(--accent-yellow)'}>{a.priority}</Badge>
                </div>
              ))}
            </div>

            {/* Top Decisions */}
            <div style={{ padding: 20, borderRadius: 12, background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}>
              <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>⚖️ Decisions Needed</h3>
              {recs.topDecisions.slice(0, 5).map((d) => (
                <div key={d.rank} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid var(--border-primary)', fontSize: 12 }}>
                  <span style={{ color: 'var(--text-muted)', minWidth: 20 }}>#{d.rank}</span>
                  <span style={{ flex: 1 }}>{d.title}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{d.pendingDays}d</span>
                </div>
              ))}
            </div>

            {/* Top Risks */}
            <div style={{ padding: 20, borderRadius: 12, background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}>
              <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>⚠️ Top Risks</h3>
              {recs.topRisks.slice(0, 5).map((r) => (
                <div key={r.rank} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid var(--border-primary)', fontSize: 12 }}>
                  <span style={{ color: 'var(--text-muted)', minWidth: 20 }}>#{r.rank}</span>
                  <span style={{ flex: 1 }}>{r.title}</span>
                  <Badge color="var(--accent-red)">{Math.round(r.confidence * 100)}%</Badge>
                </div>
              ))}
            </div>

            {/* Quick Wins */}
            <div style={{ padding: 20, borderRadius: 12, background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}>
              <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>⚡ Quick Wins</h3>
              {recs.quickWins.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>No quick wins identified</div>
              ) : recs.quickWins.map((w) => (
                <div key={w.rank} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid var(--border-primary)', fontSize: 12 }}>
                  <span style={{ color: 'var(--accent-green)', minWidth: 20 }}>#{w.rank}</span>
                  <span style={{ flex: 1 }}>{w.title}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Overdue */}
          {recs.overdue.length > 0 && (
            <div style={{ padding: 20, borderRadius: 12, background: 'var(--bg-secondary)', border: '1px solid var(--accent-red)33' }}>
              <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent-red)', marginBottom: 12 }}>🚨 Overdue Items</h3>
              {recs.overdue.map((o) => (
                <div key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid var(--border-primary)', fontSize: 12 }}>
                  <span style={{ flex: 1 }}>{o.title}</span>
                  <Badge color="var(--accent-red)">{o.priority}</Badge>
                  {o.dueAt && <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>Due: {new Date(o.dueAt).toLocaleDateString()}</span>}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
