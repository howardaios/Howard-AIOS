export default function InboxLoading() {
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
      <span style={{ fontSize: '32px' }}>📭</span>
      <p style={{ color: '#888', fontSize: '14px' }}>加载收件箱...</p>
    </div>
  );
}
