'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/auth-context';
import { Button, Input } from '../../components/ui';

export default function LoginPage() {
  const router = useRouter();
  const { login, loginDemo } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      router.push('/ceo');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async () => {
    setError(null);
    setLoading(true);
    try {
      await loginDemo();
      router.push('/ceo');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <div style={{ width: '100%', maxWidth: '400px', padding: 'var(--space-xl)' }}>
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-2xl)' }}>
          <h1 style={{ fontSize: 'var(--font-3xl)', fontWeight: 800, marginBottom: 'var(--space-sm)' }}>Howard AIOS</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-base)' }}>Founder Operating System</p>
        </div>

        <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-primary)', padding: 'var(--space-xl)' }}>
          <h2 style={{ fontSize: 'var(--font-lg)', fontWeight: 600, marginBottom: 'var(--space-xl)', textAlign: 'center' }}>登录</h2>

          {error && (
            <div style={{ background: '#ef444422', border: '1px solid #ef444444', borderRadius: 'var(--radius-md)', padding: 'var(--space-md)', marginBottom: 'var(--space-lg)', color: 'var(--accent-red)', fontSize: 'var(--font-sm)' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
            <div>
              <label style={{ display: 'block', fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-xs)' }}>邮箱</label>
              <Input value={email} onChange={setEmail} placeholder="your@email.com" type="email" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-xs)' }}>密码</label>
              <Input value={password} onChange={setPassword} placeholder="••••••••" type="password" />
            </div>
            <Button type="submit" loading={loading} style={{ width: '100%', justifyContent: 'center' }}>
              登录
            </Button>
          </form>

          <div style={{ marginTop: 'var(--space-lg)', textAlign: 'center' }}>
            <div style={{ position: 'relative', marginBottom: 'var(--space-lg)' }}>
              <div style={{ borderTop: '1px solid var(--border-primary)', position: 'absolute', top: '50%', left: 0, right: 0 }} />
              <span style={{ background: 'var(--bg-secondary)', padding: '0 12px', position: 'relative', color: 'var(--text-muted)', fontSize: 'var(--font-xs)' }}>or</span>
            </div>
            <Button variant="secondary" onClick={handleDemo} loading={loading} style={{ width: '100%', justifyContent: 'center' }}>
              🚀 Demo 模式
            </Button>
          </div>
        </div>

        <p style={{ textAlign: 'center', color: 'var(--text-disabled)', fontSize: 'var(--font-xs)', marginTop: 'var(--space-xl)' }}>
          Howard AIOS v0.6.0 · Beta
        </p>
      </div>
    </div>
  );
}
