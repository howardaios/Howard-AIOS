'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { StatCard, Card, Badge, Loading, ErrorState, EmptyState, Button } from '../../../components/ui';
import { authFetch } from '../../../lib/auth-fetch';

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
  transcript?: string;
  executiveSummary?: string;
  actionItems?: Array<{ id: string; title: string; owner?: string; priority: string; status: string; deadline?: string }>;
  decisions?: Array<{ id: string; title: string; status: string; decidedAt?: string }>;
  risks?: Array<{ id: string; description: string; severity: string }>;
  openQuestions?: string[];
  followUp?: string[];
  timelineEvents?: Array<{ id: string; timestamp: number; type: string; title: string; content?: string }>;
  processingStatus?: string;
  recordings?: Array<{ id: string; title: string; fileName?: string; duration?: number; speakerCount?: number; language?: string; status: string; transcript?: string }>;
  createdAt: string;
  updatedAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: 'var(--accent-blue)', IN_PROGRESS: 'var(--accent-yellow)', COMPLETED: 'var(--accent-green)', CANCELLED: 'var(--text-muted)',
};
const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'var(--text-muted)', MEDIUM: 'var(--accent-blue)', HIGH: 'var(--accent-yellow)', CRITICAL: 'var(--accent-red)',
};
const SEVERITY_COLORS: Record<string, string> = {
  LOW: 'var(--text-muted)', MEDIUM: 'var(--accent-yellow)', HIGH: 'var(--accent-red)',
};

type TabId = 'overview' | 'transcript' | 'summary' | 'tasks' | 'decisions' | 'risks' | 'knowledge' | 'timeline' | 'recordings';

export default function MeetingDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    authFetch(`/api/meetings/${id}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setMeeting(res.data);
        else setError('Meeting not found');
      })
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, [id]);

  const handleProcess = () => {
    setProcessing(true);
    authFetch(`/api/meetings/${id}/process`, { method: 'POST', headers: { 'Content-Type': 'application/json' } })
      .then((r) => r.json())
      .then((res) => {
        if (res.success) return authFetch(`/api/meetings/${id}`).then((r) => r.json());
      })
      .then((res) => { if (res?.success) setMeeting(res.data); })
      .catch(() => {})
      .finally(() => setProcessing(false));
  };

  const handleGenerateSummary = () => {
    setProcessing(true);
    authFetch(`/api/meetings/${id}/summary`, { method: 'POST', headers: { 'Content-Type': 'application/json' } })
      .then((r) => r.json())
      .then(() => authFetch(`/api/meetings/${id}`).then((r) => r.json()))
      .then((res) => { if (res?.success) setMeeting(res.data); })
      .catch(() => {})
      .finally(() => setProcessing(false));
  };

  if (loading) return <Loading />;
  if (error || !meeting) return (
    <ErrorState message={error || 'Meeting not found'} />
  );

  const tabs: Array<{ id: TabId; label: string; icon: string; count?: number }> = [
    { id: 'overview', label: 'Overview', icon: '📋' },
    { id: 'transcript', label: 'Transcript', icon: '📝' },
    { id: 'summary', label: 'AI Summary', icon: '🤖' },
    { id: 'tasks', label: 'Tasks', icon: '✅', count: meeting.actionItems?.length },
    { id: 'decisions', label: 'Decisions', icon: '⚖️', count: meeting.decisions?.length },
    { id: 'risks', label: 'Risks', icon: '⚠️', count: meeting.risks?.length },
    { id: 'timeline', label: 'Timeline', icon: '📅', count: meeting.timelineEvents?.length },
    { id: 'recordings', label: 'Recordings', icon: '🎤', count: meeting.recordings?.length },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 'var(--space-xl)' }}>
        <Link href="/meetings" style={{ color: 'var(--text-muted)', fontSize: 'var(--font-sm)', display: 'inline-block', marginBottom: 'var(--space-md)' }}>
          &larr; Back to meetings
        </Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
          <div>
            <h1 style={{ fontSize: 'var(--font-3xl)', fontWeight: 700, marginBottom: 'var(--space-sm)' }}>{meeting.title}</h1>
            <div style={{ display: 'flex', gap: 'var(--space-md)', fontSize: 'var(--font-sm)', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
              <span>📆 {new Date(meeting.startedAt).toLocaleString('zh-CN')}</span>
              {meeting.durationMin && <span>⏱ {meeting.durationMin} min</span>}
              {meeting.location && <span>📍 {meeting.location}</span>}
              <span>👥 {meeting.participants.length} participants</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'center' }}>
            <Badge color={STATUS_COLORS[meeting.status] ?? 'var(--text-muted)'}>{meeting.status}</Badge>
            {(meeting.transcript || meeting.recordings?.length) && (
              <Button variant="secondary" size="sm" onClick={handleProcess} loading={processing}>
                🔬 Process with AI
              </Button>
            )}
            <Button variant="secondary" size="sm" onClick={handleGenerateSummary} loading={processing}>
              🤖 Generate Summary
            </Button>
          </div>
        </div>
      </div>

      {/* Tags */}
      {meeting.tags.length > 0 && (
        <div style={{ display: 'flex', gap: '6px', marginBottom: 'var(--space-xl)', flexWrap: 'wrap' }}>
          {meeting.tags.map((t) => <Badge key={t}>{t}</Badge>)}
        </div>
      )}

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: 'var(--space-xl)', borderBottom: '1px solid var(--border-primary)', paddingBottom: 'var(--space-sm)', overflowX: 'auto' }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: 'var(--space-sm) var(--space-lg)',
              borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
              border: 'none',
              background: activeTab === tab.id ? 'var(--bg-hover)' : 'transparent',
              color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-muted)',
              fontSize: 'var(--font-sm)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              borderBottom: activeTab === tab.id ? '2px solid var(--accent-blue)' : '2px solid transparent',
            }}
          >
            {tab.icon} {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span style={{ marginLeft: '6px', fontSize: 'var(--font-xs)', padding: '1px 6px', borderRadius: 'var(--radius-full)', background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && <OverviewTab meeting={meeting} />}
      {activeTab === 'transcript' && <TranscriptTab transcript={meeting.transcript} />}
      {activeTab === 'summary' && <SummaryTab meeting={meeting} />}
      {activeTab === 'tasks' && <TasksTab tasks={meeting.actionItems ?? []} />}
      {activeTab === 'decisions' && <DecisionsTab decisions={meeting.decisions ?? []} />}
      {activeTab === 'risks' && <RisksTab risks={meeting.risks ?? []} />}
      {activeTab === 'timeline' && <TimelineTab events={meeting.timelineEvents ?? []} />}
      {activeTab === 'recordings' && <RecordingsTab recordings={meeting.recordings ?? []} meetingId={meeting.id} />}
    </div>
  );
}

function OverviewTab({ meeting }: { meeting: Meeting }) {
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)' }}>
        <StatCard icon="📆" label="Start" value={new Date(meeting.startedAt).toLocaleString('zh-CN')} />
        {meeting.endedAt && <StatCard icon="🕐" label="End" value={new Date(meeting.endedAt).toLocaleString('zh-CN')} />}
        {meeting.durationMin && <StatCard icon="⏱" label="Duration" value={`${meeting.durationMin} min`} />}
        <StatCard icon="👥" label="Participants" value={String(meeting.participants.length)} />
        <StatCard icon="✅" label="Tasks" value={String(meeting.actionItems?.length ?? 0)} color="var(--accent-green)" />
        <StatCard icon="⚖️" label="Decisions" value={String(meeting.decisions?.length ?? 0)} color="var(--accent-blue)" />
        <StatCard icon="⚠️" label="Risks" value={String(meeting.risks?.length ?? 0)} color="var(--accent-yellow)" />
        <StatCard icon="🎤" label="Recordings" value={String(meeting.recordings?.length ?? 0)} color="var(--accent-purple)" />
      </div>

      {meeting.description && (
        <Section title="Description">
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-base)', lineHeight: '1.6' }}>{meeting.description}</p>
        </Section>
      )}

      {meeting.participants.length > 0 && (
        <Section title="Participants">
          <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
            {meeting.participants.map((p) => (
              <span key={p} style={{ padding: '6px 12px', borderRadius: 'var(--radius-md)', background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', fontSize: 'var(--font-sm)' }}>👤 {p}</span>
            ))}
          </div>
        </Section>
      )}

      {(meeting.executiveSummary || meeting.summary) && (
        <Section title="Executive Summary">
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-base)', lineHeight: '1.6' }}>{meeting.executiveSummary || meeting.summary}</p>
        </Section>
      )}

      {meeting.openQuestions && meeting.openQuestions.length > 0 && (
        <Section title="Open Questions">
          {meeting.openQuestions.map((q, i) => (
            <div key={i} style={{ padding: 'var(--space-sm) var(--space-md)', borderRadius: 'var(--radius-md)', background: 'var(--bg-secondary)', marginBottom: '6px', fontSize: 'var(--font-sm)', color: 'var(--text-secondary)' }}>❓ {q}</div>
          ))}
        </Section>
      )}

      {meeting.followUp && meeting.followUp.length > 0 && (
        <Section title="Follow-up Items">
          {meeting.followUp.map((f, i) => (
            <div key={i} style={{ padding: 'var(--space-sm) var(--space-md)', borderRadius: 'var(--radius-md)', background: 'var(--bg-secondary)', marginBottom: '6px', fontSize: 'var(--font-sm)', color: 'var(--text-secondary)' }}>📌 {f}</div>
          ))}
        </Section>
      )}
    </div>
  );
}

function TranscriptTab({ transcript }: { transcript?: string }) {
  if (!transcript) return <EmptyState icon="📝" text="No transcript available. Upload a recording and transcribe to generate." />;
  return (
    <Card>
      <pre style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-base)', lineHeight: '1.8', whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: 0 }}>{transcript}</pre>
    </Card>
  );
}

function SummaryTab({ meeting }: { meeting: Meeting }) {
  if (!meeting.executiveSummary && !meeting.summary) return <EmptyState icon="🤖" text="No AI summary generated yet. Click 'Generate Summary' or 'Process with AI'." />;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
      <Card title="Executive Summary">
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-base)', lineHeight: '1.6' }}>{meeting.executiveSummary || meeting.summary}</p>
      </Card>
      {meeting.openQuestions && meeting.openQuestions.length > 0 && (
        <Card title="Open Questions">
          {meeting.openQuestions.map((q, i) => <div key={i} style={{ padding: '6px 0', fontSize: 'var(--font-sm)', color: 'var(--text-secondary)' }}>❓ {q}</div>)}
        </Card>
      )}
      {meeting.followUp && meeting.followUp.length > 0 && (
        <Card title="Follow-up Items">
          {meeting.followUp.map((f, i) => <div key={i} style={{ padding: '6px 0', fontSize: 'var(--font-sm)', color: 'var(--text-secondary)' }}>📌 {f}</div>)}
        </Card>
      )}
    </div>
  );
}

function TasksTab({ tasks }: { tasks: Array<{ id: string; title: string; owner?: string; priority: string; status: string; deadline?: string }> }) {
  if (tasks.length === 0) return <EmptyState icon="✅" text="No tasks extracted yet." />;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
      {tasks.map((t) => (
        <div key={t.id} style={{ padding: 'var(--space-lg)', borderRadius: 'var(--radius-lg)', background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontWeight: 600, fontSize: 'var(--font-base)' }}>{t.title}</span>
            <div style={{ display: 'flex', gap: '6px' }}>
              <Badge color={PRIORITY_COLORS[t.priority] ?? 'var(--text-muted)'}>{t.priority}</Badge>
              <Badge>{t.status}</Badge>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-lg)', fontSize: 'var(--font-sm)', color: 'var(--text-muted)' }}>
            {t.owner && <span>👤 {t.owner}</span>}
            {t.deadline && <span>📅 {t.deadline}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

function DecisionsTab({ decisions }: { decisions: Array<{ id: string; title: string; status: string; decidedAt?: string }> }) {
  if (decisions.length === 0) return <EmptyState icon="⚖️" text="No decisions extracted yet." />;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
      {decisions.map((d) => (
        <div key={d.id} style={{ padding: 'var(--space-lg)', borderRadius: 'var(--radius-lg)', background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 600, fontSize: 'var(--font-base)' }}>{d.title}</span>
            <Badge color={d.status === 'DECIDED' ? 'var(--accent-green)' : 'var(--accent-yellow)'}>{d.status}</Badge>
          </div>
          {d.decidedAt && <div style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)', marginTop: 'var(--space-xs)' }}>📅 {new Date(d.decidedAt).toLocaleString('zh-CN')}</div>}
        </div>
      ))}
    </div>
  );
}

function RisksTab({ risks }: { risks: Array<{ id: string; description: string; severity: string }> }) {
  if (risks.length === 0) return <EmptyState icon="⚠️" text="No risks extracted yet." />;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
      {risks.map((r) => (
        <div key={r.id} style={{ padding: 'var(--space-lg)', borderRadius: 'var(--radius-lg)', background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 'var(--font-base)' }}>{r.description}</span>
            <Badge color={SEVERITY_COLORS[r.severity] ?? 'var(--text-muted)'}>{r.severity}</Badge>
          </div>
        </div>
      ))}
    </div>
  );
}

function TimelineTab({ events }: { events: Array<{ id: string; timestamp: number; type: string; title: string; content?: string }> }) {
  if (events.length === 0) return <EmptyState icon="📅" text="No timeline events yet. Process the meeting with AI to generate." />;
  const TYPE_ICONS: Record<string, string> = { speech: '💬', decision: '⚖️', task: '✅', note: '📝', recording: '🎤', summary: '🤖', knowledge: '🧠' };
  return (
    <div style={{ position: 'relative', paddingLeft: '32px' }}>
      <div style={{ position: 'absolute', left: '12px', top: 0, bottom: 0, width: '2px', background: 'var(--border-primary)' }} />
      {events.map((e) => (
        <div key={e.id} style={{ position: 'relative', marginBottom: 'var(--space-lg)' }}>
          <div style={{ position: 'absolute', left: '-26px', top: '4px', width: '20px', height: '20px', borderRadius: '50%', background: 'var(--bg-secondary)', border: '2px solid var(--border-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>
            {TYPE_ICONS[e.type] ?? '📋'}
          </div>
          <div style={{ padding: 'var(--space-md) var(--space-lg)', borderRadius: 'var(--radius-lg)', background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-xs)' }}>
              <span style={{ fontWeight: 600, fontSize: 'var(--font-sm)' }}>{e.title}</span>
              <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>{Math.floor(e.timestamp / 60)}:{String(e.timestamp % 60).padStart(2, '0')}</span>
            </div>
            {e.content && <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)', margin: 0 }}>{e.content}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

function RecordingsTab({ recordings, meetingId }: { recordings: Array<{ id: string; title: string; fileName?: string; duration?: number; speakerCount?: number; language?: string; status: string; transcript?: string }>; meetingId: string }) {
  const [transcribingId, setTranscribingId] = useState<string | null>(null);

  const handleTranscribe = (recId: string) => {
    setTranscribingId(recId);
    authFetch(`/api/meetings/${meetingId}/recordings/${recId}/transcribe`, { method: 'POST', headers: { 'Content-Type': 'application/json' } })
      .catch(() => {})
      .finally(() => setTranscribingId(null));
  };

  if (recordings.length === 0) return <EmptyState icon="🎤" text="No recordings uploaded yet." />;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
      {recordings.map((r) => (
        <div key={r.id} style={{ padding: 'var(--space-lg) var(--space-xl)', borderRadius: 'var(--radius-lg)', background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-sm)' }}>
            <span style={{ fontWeight: 600, fontSize: 'var(--font-lg)' }}>🎤 {r.title}</span>
            <Badge color={r.status === 'COMPLETED' ? 'var(--accent-green)' : r.status === 'TRANSCRIBED' ? 'var(--accent-blue)' : 'var(--accent-yellow)'}>
              {r.status}
            </Badge>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-lg)', fontSize: 'var(--font-sm)', color: 'var(--text-muted)', marginBottom: 'var(--space-sm)' }}>
            {r.duration && <span>⏱ {Math.round(r.duration / 60)}:{String(Math.round(r.duration % 60)).padStart(2, '0')}</span>}
            {r.speakerCount && <span>👥 {r.speakerCount} speakers</span>}
            {r.language && <span>🌐 {r.language}</span>}
            {r.fileName && <span>📁 {r.fileName}</span>}
          </div>
          {/* Audio player placeholder */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', padding: 'var(--space-sm) var(--space-md)', borderRadius: 'var(--radius-md)', background: 'var(--bg-tertiary)' }}>
            <Button variant="ghost" size="sm">▶</Button>
            <div style={{ flex: 1, height: '4px', background: 'var(--border-primary)', borderRadius: '2px' }}>
              <div style={{ width: '30%', height: '100%', background: 'var(--accent-blue)', borderRadius: '2px' }} />
            </div>
            <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>{r.duration ? `${Math.round(r.duration / 60)}:${String(Math.round(r.duration % 60)).padStart(2, '0')}` : '0:00'}</span>
          </div>
          {r.status === 'UPLOADED' && (
            <Button variant="secondary" size="sm" onClick={() => handleTranscribe(r.id)} disabled={transcribingId === r.id} style={{ marginTop: 'var(--space-sm)' }}>
              {transcribingId === r.id ? 'Transcribing...' : '🎯 Transcribe'}
            </Button>
          )}
          {r.transcript && (
            <div style={{ marginTop: 'var(--space-md)', padding: 'var(--space-md)', borderRadius: 'var(--radius-md)', background: 'var(--bg-tertiary)', fontSize: 'var(--font-sm)', color: 'var(--text-muted)', maxHeight: '120px', overflow: 'auto' }}>
              {r.transcript.slice(0, 300)}...
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 'var(--space-xl)' }}>
      <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 600, marginBottom: 'var(--space-md)', color: 'var(--text-primary)' }}>{title}</h3>
      {children}
    </div>
  );
}
