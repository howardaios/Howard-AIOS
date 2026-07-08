'use client';

import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          <h1 style={{ fontSize: 'var(--font-2xl)', color: 'var(--accent-red)' }}>Something went wrong</h1>
          <p style={{ color: 'var(--text-muted)' }}>{this.state.error?.message}</p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              padding: 'var(--space-sm) var(--space-xl)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-primary)',
              background: 'var(--bg-tertiary)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
            }}
          >
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
