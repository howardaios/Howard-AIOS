'use client';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div style={{ textAlign: 'center', padding: '64px' }}>
      <h2 style={{ fontSize: '20px', color: '#f87171', marginBottom: '12px' }}>出错了</h2>
      <p style={{ color: '#888', marginBottom: '16px' }}>{error.message || '未知错误'}</p>
      <button
        onClick={reset}
        style={{ padding: '8px 24px', borderRadius: '8px', border: '1px solid #333', background: '#1a1a1a', color: '#ededed', cursor: 'pointer' }}
      >
        重试
      </button>
    </div>
  );
}
