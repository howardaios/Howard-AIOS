'use client';

import { useState, useEffect, useCallback } from 'react';
import { PageHeader, Card, StatCard, Button, Loading, EmptyState, Badge } from '../../components/ui';

export default function PipelinesPage() {
  const [status, setStatus] = useState<Record<string, unknown> | null>(null);
  const [tasks, setTasks] = useState<Array<{ id: string; pipelineId: string; status: string; createdAt: string }>>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(() => {
    Promise.all([
      fetch('/api/pipelines/status').then((r) => r.json()),
      fetch('/api/pipelines/queue').then((r) => r.json()),
    ])
      .then(([s, t]) => {
        if (s.success) setStatus(s.data);
        if (t.success) setTasks(t.data.tasks ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleExecute = () => {
    fetch('/api/pipelines/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pipelineId: 'demo-pipeline', input: { message: 'Hello from UI', timestamp: Date.now() } }),
    }).then(() => fetchData());
  };

  if (loading) return <Loading />;

  const s = status as Record<string, unknown> | null;
  const queue = s?.queue as Record<string, number> | undefined;

  return (
    <div>
      <PageHeader
        title="Pipeline Engine"
        action={
          <Button onClick={handleExecute}>
            Execute Demo Pipeline
          </Button>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)' }}>
        <StatCard icon="📊" label="Queue Size" value={String(queue?.size ?? 0)} />
        <StatCard icon="📋" label="Total Tasks" value={String(tasks.length)} />
        <StatCard icon="⚙️" label="Pipelines" value={String((s?.registeredPipelines as string[] | undefined)?.length ?? 0)} />
      </div>

      <Card title="Task History">
        {tasks.length === 0 ? (
          <EmptyState icon="⚙️" text="No tasks yet. Click 'Execute' to run a pipeline." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {tasks.slice(-20).reverse().map((t) => (
              <div key={t.id} style={{ padding: 'var(--space-md) var(--space-lg)', borderRadius: 'var(--radius-md)', background: 'var(--bg-tertiary)', border: '1px solid var(--border-primary)', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 'var(--font-sm)' }}>{t.pipelineId}</span>
                <Badge color={t.status === 'completed' ? 'var(--accent-green)' : t.status === 'failed' ? 'var(--accent-red)' : 'var(--accent-yellow)'}>
                  {t.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
