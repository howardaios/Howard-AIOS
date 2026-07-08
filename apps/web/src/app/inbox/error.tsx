'use client';

export default function InboxError({ error }: { error: Error & { digest?: string } }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      <span style={{ fontSize: '32px' }}>⚠️</span>
      <h2 style={{ fontSize: '18px', color: '#f87171' }}>收件箱加载失败</h2>
      <p style={{ color: '#888', fontSize: '14px' }}>{error.message}</p>
    </div>
  );
}
