'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../contexts/auth-context';
import { authFetch } from '../../lib/auth-fetch';
import {
  PageHeader,
  StatCard,
  Card,
  Badge,
  Loading,
  ErrorState,
  EmptyState,
  StatusDot,
} from '../../components/ui';

interface DashboardData {
  stats: {
    meetings: { total: number; today: number; scheduled: number };
    inbox: { total: number; unread: number; urgent: number };
    documents: { total: number };
  };
  recent: {
    meetings: Array<{ id: string; title: string; status: string; startedAt: string }>;
    inbox: Array<{
      id: string;
      title: string | null;
      sourceType: string;
      status: string;
      priority: string;
      createdAt: string;
    }>;
    documents: Array<{
      id: string;
      title: string;
      type: string;
      status: string;
      createdAt: string;
    }>;
  };
}

interface AIStatus {
  providers: Record<string, boolean>;
}
interface PipelineStatus {
  executor: Record<string, number>;
  queue: { size: number; totalTasks: number };
  registeredPipelines: string[];
}
interface KnowledgeStats {
  person: number;
  company: number;
  task: number;
  decision: number;
  risk: number;
  keyword: number;
  timeline: number;
  concept: number;
  fact: number;
}
interface MemoryStats {
  total: number;
  active: number;
  merged: number;
  archived: number;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [aiStatus, setAiStatus] = useState<AIStatus | null>(null);
  const [pipelineStatus, setPipelineStatus] = useState<PipelineStatus | null>(null);
  const [knowledgeStats, setKnowledgeStats] = useState<KnowledgeStats | null>(null);
  const [memoryStats, setMemoryStats] = useState<MemoryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      authFetch('/api/dashboard').then((r: Response) => r.json()),
      authFetch('/api/llm/status').then((r: Response) => r.json()).catch(() => null),
      authFetch('/api/pipelines/status').then((r: Response) => r.json()).catch(() => null),
      authFetch('/api/knowledge/stats').then((r: Response) => r.json()).catch(() => null),
      authFetch('/api/memories/stats').then((r: Response) => r.json()).catch(() => null),
    ])
      .then(([dash, ai, pipe, know, mem]) => {
        if (dash?.success) setData(dash.data);
        if (ai?.success) setAiStatus(ai.data);
        if (pipe?.success) setPipelineStatus(pipe.data);
        if (know?.success) setKnowledgeStats(know.data);
        if (mem?.success) setMemoryStats(mem.data);
      })
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={fetchData} />;

  const stats = data?.stats;
  const recent = data?.recent;

  // Normalize AI status: API may return flat {openai: false, ...} or nested {providers: {...}}
  const aiProviders: Record<string, boolean> | null = aiStatus
    ? 'providers' in aiStatus
      ? (aiStatus as AIStatus).providers
      : (aiStatus as unknown as Record<string, boolean>)
    : null;

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle={user ? `${user.name} · ${user.role}` : 'Overview of your workspace'}
      />

      {/* Core Stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: 'var(--space-md)',
          marginBottom: 'var(--space-xl)',
        }}
      >
        <StatCard
          icon="📅"
          label="会议"
          value={stats?.meetings.total ?? 0}
          color="var(--accent-blue)"
        />
        <StatCard
          icon="📆"
          label="今日"
          value={stats?.meetings.today ?? 0}
          color="var(--accent-green)"
        />
        <StatCard
          icon="📥"
          label="收件箱"
          value={stats?.inbox.total ?? 0}
          color="var(--accent-yellow)"
        />
        <StatCard
          icon="🔴"
          label="紧急"
          value={stats?.inbox.urgent ?? 0}
          color="var(--accent-red)"
        />
        <StatCard
          icon="📄"
          label="文档"
          value={stats?.documents.total ?? 0}
          color="var(--accent-purple)"
        />
      </div>

      {/* AI & Pipeline Status */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 'var(--space-lg)',
          marginBottom: 'var(--space-xl)',
        }}
      >
        <Card title="🤖 AI Provider Status">
          {aiProviders ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-sm)' }}>
              {Object.entries(aiProviders).map(([name, ok]) => (
                <Badge key={name} color={ok ? 'var(--accent-green)' : 'var(--accent-red)'}>
                  <StatusDot ok={ok} />
                  {name}: {ok ? 'Available' : 'Unavailable'}
                </Badge>
              ))}
            </div>
          ) : (
            <EmptyState icon="🤖" text="Unavailable" />
          )}
        </Card>

        <Card title="⚙️ Pipeline Status">
          {pipelineStatus ? (
            <div style={{ fontSize: 'var(--font-base)', color: 'var(--text-secondary)' }}>
              <p>
                Queue: {pipelineStatus.queue.size} pending / {pipelineStatus.queue.totalTasks} total
              </p>
              <p style={{ marginTop: 'var(--space-xs)' }}>
                Pipelines: {pipelineStatus.registeredPipelines.join(', ') || 'none'}
              </p>
            </div>
          ) : (
            <EmptyState icon="⚙️" text="Idle" />
          )}
        </Card>

        <Card title="🧠 Knowledge Graph">
          {knowledgeStats ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {Object.entries(knowledgeStats)
                .filter(([_, v]) => v > 0)
                .map(([type, count]) => (
                  <Badge key={type}>
                    {type}: {count}
                  </Badge>
                ))}
              {Object.values(knowledgeStats).every((v) => v === 0) && <EmptyState text="Empty" />}
            </div>
          ) : (
            <EmptyState icon="🧠" text="Empty" />
          )}
        </Card>

        <Card title="💾 Memory Status">
          {memoryStats ? (
            <div style={{ fontSize: 'var(--font-base)', color: 'var(--text-secondary)' }}>
              <p>
                Total: {memoryStats.total} | Active: {memoryStats.active} | Merged:{' '}
                {memoryStats.merged} | Archived: {memoryStats.archived}
              </p>
            </div>
          ) : (
            <EmptyState icon="💾" text="Empty" />
          )}
        </Card>
      </div>

      {/* Recent Items */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
          gap: 'var(--space-lg)',
        }}
      >
        <Card title="📅 最近会议">
          {!recent?.meetings?.length ? (
            <EmptyState text="暂无会议" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
              {recent.meetings.map((m) => (
                <Link
                  key={m.id}
                  href={`/meetings/${m.id}`}
                  style={{
                    display: 'block',
                    padding: 'var(--space-sm) var(--space-md)',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-tertiary)',
                    textDecoration: 'none',
                    color: 'var(--text-primary)',
                    fontSize: 'var(--font-sm)',
                  }}
                >
                  {m.title} <Badge>{m.status}</Badge>
                </Link>
              ))}
            </div>
          )}
        </Card>
        <Card title="📥 最新收件">
          {!recent?.inbox?.length ? (
            <EmptyState text="暂无" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
              {recent.inbox.map((i) => (
                <div
                  key={i.id}
                  style={{
                    padding: 'var(--space-sm) var(--space-md)',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-tertiary)',
                    fontSize: 'var(--font-sm)',
                  }}
                >
                  {i.title || '无标题'} <Badge>{i.sourceType}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
        <Card title="📄 最近上传">
          {!recent?.documents?.length ? (
            <EmptyState text="暂无" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
              {recent.documents.map((d) => (
                <div
                  key={d.id}
                  style={{
                    padding: 'var(--space-sm) var(--space-md)',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-tertiary)',
                    fontSize: 'var(--font-sm)',
                  }}
                >
                  {d.title} <Badge>{d.type}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
