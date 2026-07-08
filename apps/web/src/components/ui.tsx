'use client';

import { useState, useCallback } from 'react';

/* ─── Button ───────────────────────────────────────────────────────────────── */

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

export function Button({
  children, variant = 'primary', size = 'md', loading, disabled, onClick, type, style: extraStyle,
}: {
  children: React.ReactNode; variant?: ButtonVariant; size?: ButtonSize;
  loading?: boolean; disabled?: boolean; onClick?: () => void;
  type?: 'button' | 'submit'; style?: React.CSSProperties;
}) {
  const colors: Record<ButtonVariant, { bg: string; text: string; border: string; hoverBg: string }> = {
    primary: { bg: 'var(--accent-blue)', text: '#fff', border: 'transparent', hoverBg: '#2563eb' },
    secondary: { bg: 'var(--bg-tertiary)', text: 'var(--text-primary)', border: 'var(--border-primary)', hoverBg: 'var(--bg-hover)' },
    ghost: { bg: 'transparent', text: 'var(--text-secondary)', border: 'transparent', hoverBg: 'var(--bg-hover)' },
    danger: { bg: 'var(--accent-red)', text: '#fff', border: 'transparent', hoverBg: '#dc2626' },
  };
  const sizes: Record<ButtonSize, React.CSSProperties> = {
    sm: { padding: '4px 10px', fontSize: 'var(--font-sm)' },
    md: { padding: '8px 16px', fontSize: 'var(--font-base)' },
    lg: { padding: '12px 24px', fontSize: 'var(--font-lg)' },
  };
  const c = colors[variant];
  return (
    <button
      type={type ?? 'button'}
      disabled={disabled || loading}
      onClick={onClick}
      style={{
        ...sizes[size],
        background: c.bg,
        color: c.text,
        border: `1px solid ${c.border}`,
        borderRadius: 'var(--radius-md)',
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        fontWeight: 500,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        transition: 'background 0.15s',
        ...extraStyle,
      }}
    >
      {loading && <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.6s linear infinite', display: 'inline-block' }} />}
      {children}
    </button>
  );
}

/* ─── Card ─────────────────────────────────────────────────────────────────── */

export function Card({ title, children, action }: { title?: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-primary)', padding: 'var(--space-lg)' }}>
      {(title || action) && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-md)' }}>
          {title && <h3 style={{ fontSize: 'var(--font-base)', fontWeight: 600 }}>{title}</h3>}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

/* ─── StatCard ─────────────────────────────────────────────────────────────── */

export function StatCard({ icon, label, value, color = 'var(--accent-blue)' }: { icon: string; label: string; value: number | string; color?: string }) {
  return (
    <div style={{ padding: 'var(--space-lg)', borderRadius: 'var(--radius-lg)', background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}>
      <div style={{ fontSize: 'var(--font-xl)' }}>{icon}</div>
      <div style={{ fontSize: 'var(--font-2xl)', fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)' }}>{label}</div>
    </div>
  );
}

/* ─── Badge ────────────────────────────────────────────────────────────────── */

export function Badge({ children, color = 'var(--accent-blue)' }: { children: React.ReactNode; color?: string }) {
  return (
    <span style={{ fontSize: 'var(--font-xs)', padding: '2px 8px', borderRadius: 'var(--radius-full)', background: `${color}22`, color, border: `1px solid ${color}44`, whiteSpace: 'nowrap' }}>
      {children}
    </span>
  );
}

/* ─── Input ────────────────────────────────────────────────────────────────── */

export function Input({ value, onChange, placeholder, type = 'text', style: extraStyle }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string; style?: React.CSSProperties;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: '100%',
        padding: '8px 12px',
        fontSize: 'var(--font-base)',
        background: 'var(--bg-tertiary)',
        color: 'var(--text-primary)',
        border: '1px solid var(--border-primary)',
        borderRadius: 'var(--radius-md)',
        outline: 'none',
        transition: 'border-color 0.15s',
        ...extraStyle,
      }}
      onFocus={(e) => { e.target.style.borderColor = 'var(--border-focus)'; }}
      onBlur={(e) => { e.target.style.borderColor = 'var(--border-primary)'; }}
    />
  );
}

/* ─── Skeleton ─────────────────────────────────────────────────────────────── */

export function Skeleton({ width = '100%', height = 20 }: { width?: string | number; height?: number }) {
  return <div className="skeleton" style={{ width, height }} />;
}

/* ─── EmptyState ───────────────────────────────────────────────────────────── */

export function EmptyState({ icon = '📭', text = '暂无数据' }: { icon?: string; text?: string }) {
  return (
    <div style={{ textAlign: 'center', padding: 'var(--space-2xl)', color: 'var(--text-muted)' }}>
      <div style={{ fontSize: '32px', marginBottom: 'var(--space-sm)' }}>{icon}</div>
      <p style={{ fontSize: 'var(--font-sm)' }}>{text}</p>
    </div>
  );
}

/* ─── ErrorState ───────────────────────────────────────────────────────────── */

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div style={{ textAlign: 'center', padding: 'var(--space-3xl)', color: 'var(--accent-red)' }}>
      <div style={{ fontSize: '32px', marginBottom: 'var(--space-sm)' }}>⚠️</div>
      <p style={{ fontSize: 'var(--font-base)', marginBottom: 'var(--space-lg)' }}>{message}</p>
      {onRetry && <Button variant="secondary" onClick={onRetry}>重试</Button>}
    </div>
  );
}

/* ─── Loading ──────────────────────────────────────────────────────────────── */

export function Loading({ text = '加载中...' }: { text?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 'var(--space-lg)' }}>
      <div className="spinner" />
      <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-sm)' }}>{text}</p>
    </div>
  );
}

/* ─── PageHeader ───────────────────────────────────────────────────────────── */

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'var(--space-xl)' }}>
      <div>
        <h1 style={{ fontSize: 'var(--font-2xl)', fontWeight: 700 }}>{title}</h1>
        {subtitle && <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)', marginTop: 'var(--space-xs)' }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

/* ─── Tabs ─────────────────────────────────────────────────────────────────── */

export function Tabs({ tabs, active, onChange }: { tabs: string[]; active: string; onChange: (tab: string) => void }) {
  return (
    <div style={{ display: 'flex', gap: '2px', borderBottom: '1px solid var(--border-primary)', marginBottom: 'var(--space-lg)' }}>
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          style={{
            padding: '8px 16px',
            fontSize: 'var(--font-sm)',
            fontWeight: active === tab ? 600 : 400,
            color: active === tab ? 'var(--text-primary)' : 'var(--text-muted)',
            background: 'none',
            border: 'none',
            borderBottom: active === tab ? '2px solid var(--accent-blue)' : '2px solid transparent',
            cursor: 'pointer',
            transition: 'color 0.15s',
          }}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}

/* ─── Toast (simple) ──────────────────────────────────────────────────────── */

let toastTimeout: ReturnType<typeof setTimeout> | null = null;

export function useToast() {
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => setToast(null), 3000);
  }, []);

  const ToastComponent = toast ? (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
      padding: '12px 20px', borderRadius: 'var(--radius-md)',
      background: toast.type === 'success' ? 'var(--accent-green)' : toast.type === 'error' ? 'var(--accent-red)' : 'var(--accent-blue)',
      color: '#fff', fontSize: 'var(--font-sm)', fontWeight: 500,
      boxShadow: 'var(--shadow-lg)', animation: 'slideUp 0.3s ease-out',
    }}>
      {toast.message}
    </div>
  ) : null;

  return { showToast, ToastComponent };
}

/* ─── StatusDot ────────────────────────────────────────────────────────────── */

export function StatusDot({ ok }: { ok: boolean }) {
  return (
    <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: ok ? 'var(--accent-green)' : 'var(--accent-red)', marginRight: 6 }} />
  );
}
