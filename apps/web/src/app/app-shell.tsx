'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ErrorBoundary } from './error-boundary';
import { useAuth } from '../contexts/auth-context';

const NAV_ITEMS = [
  { href: '/ceo', label: 'CEO Office', icon: '🏛️' },
  { href: '/ceo/inbox', label: 'CEO Inbox', icon: '📬' },
  { href: '/ceo/brief', label: 'Daily Brief', icon: '📰' },
  { href: '/ceo/intelligence', label: 'Intelligence', icon: '🧭' },
  { href: '/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/meetings', label: '会议', icon: '📅' },
  { href: '/inbox', label: '收件箱', icon: '📥' },
  { href: '/upload', label: '上传中心', icon: '📤' },
  { href: '/search', label: '搜索', icon: '🔍' },
  { href: '/pipelines', label: 'Pipeline', icon: '⚙️' },
  { href: '/knowledge', label: '知识图谱', icon: '🧠' },
  { href: '/llm', label: 'AI 对话', icon: '🤖' },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout, isAuthenticated } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Hide shell for login page
  if (pathname === '/login') {
    return <ErrorBoundary>{children}</ErrorBoundary>;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated && !user) {
    return (
      <ErrorBoundary>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: 'var(--space-lg)' }}>Howard AIOS</div>
            <Link href="/login" style={{ color: 'var(--accent-blue)' }}>Go to Login →</Link>
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
  };

  const isActive = (href: string) => pathname?.startsWith(href);

  return (
    <ErrorBoundary>
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99 }}
          />
        )}

        {/* Sidebar */}
        <aside
          style={{
            width: 'var(--sidebar-width)',
            borderRight: '1px solid var(--border-primary)',
            padding: 'var(--space-lg)',
            display: 'flex',
            flexDirection: 'column',
            position: 'fixed',
            top: 0,
            left: sidebarOpen ? 0 : undefined,
            bottom: 0,
            background: 'var(--bg-primary)',
            zIndex: 100,
            overflowY: 'auto',
            transition: 'transform 0.2s',
          }}
          className="sidebar"
        >
          <Link href="/ceo" style={{ textDecoration: 'none', color: 'inherit' }}>
            <h2 style={{ fontSize: 'var(--font-lg)', fontWeight: 700, marginBottom: 'var(--space-xl)' }}>
              Howard AIOS
            </h2>
          </Link>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {NAV_ITEMS.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                    textDecoration: 'none',
                    fontSize: 'var(--font-base)',
                    background: active ? 'var(--bg-hover)' : 'transparent',
                    fontWeight: active ? 600 : 400,
                    transition: 'background 0.15s',
                  }}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div style={{ marginTop: 'auto', paddingTop: 'var(--space-lg)', borderTop: '1px solid var(--border-primary)' }}>
            <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-disabled)' }}>v0.6.0 · Beta</p>
          </div>
        </aside>

        {/* Main area */}
        <div style={{ flex: 1, marginLeft: 'var(--sidebar-width)', display: 'flex', flexDirection: 'column', minHeight: '100vh' }} className="main-area">
          {/* Header */}
          <header style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 'var(--space-md) var(--space-xl)',
            borderBottom: '1px solid var(--border-primary)',
            background: 'var(--bg-primary)',
            position: 'sticky',
            top: 0,
            zIndex: 50,
          }}>
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="mobile-menu-btn"
              style={{
                display: 'none',
                background: 'none',
                border: 'none',
                color: 'var(--text-primary)',
                fontSize: 'var(--font-xl)',
                cursor: 'pointer',
                padding: 'var(--space-sm)',
              }}
            >
              ☰
            </button>

            <div />

            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                style={{
                  background: 'none',
                  border: '1px solid var(--border-primary)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-secondary)',
                  padding: '6px 10px',
                  cursor: 'pointer',
                  fontSize: 'var(--font-sm)',
                }}
              >
                {theme === 'dark' ? '🌙' : '☀️'}
              </button>

              {/* User info */}
              {user && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: 'var(--accent-blue)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    fontSize: 'var(--font-sm)', color: '#fff', fontWeight: 600,
                  }}>
                    {user.name?.charAt(0)?.toUpperCase() ?? 'U'}
                  </div>
                  <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)' }}>
                    {user.name}
                  </span>
                </div>
              )}

              {/* Logout */}
              <button
                onClick={logout}
                style={{
                  background: 'none',
                  border: '1px solid var(--border-primary)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-muted)',
                  padding: '6px 12px',
                  cursor: 'pointer',
                  fontSize: 'var(--font-sm)',
                }}
              >
                退出
              </button>
            </div>
          </header>

          {/* Content */}
          <main style={{ flex: 1, padding: 'var(--space-xl)' }}>
            {children}
          </main>
        </div>

        {/* Responsive styles */}
        <style>{`
          @media (max-width: 768px) {
            .sidebar { transform: translateX(${sidebarOpen ? '0' : '-100%'}); left: 0 !important; }
            .main-area { margin-left: 0 !important; }
            .mobile-menu-btn { display: block !important; }
          }
        `}</style>
      </div>
    </ErrorBoundary>
  );
}
