'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface UserInfo {
  id: string;
  email: string;
  name: string;
  role: string;
  organizationId: string;
}

interface AuthState {
  user: UserInfo | null;
  token: string | null;
  refreshToken: string | null;
  loading: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  loginDemo: () => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, token: null, refreshToken: null, loading: true });

  // Load token from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const refreshToken = localStorage.getItem('auth_refresh_token');
    const user = localStorage.getItem('auth_user');
    if (token && user) {
      try {
        setState({ user: JSON.parse(user), token, refreshToken, loading: false });
      } catch {
        localStorage.clear();
        setState({ user: null, token: null, refreshToken: null, loading: false });
      }
    } else {
      setState((s) => ({ ...s, loading: false }));
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Login failed');

    const { accessToken, refreshToken: rt, user } = json.data;
    localStorage.setItem('auth_token', accessToken);
    localStorage.setItem('auth_refresh_token', rt);
    localStorage.setItem('auth_user', JSON.stringify(user));
    setState({ user, token: accessToken, refreshToken: rt, loading: false });
  }, []);

  const loginDemo = useCallback(async () => {
    const res = await fetch('/api/auth/demo-user', { method: 'POST' });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Demo login failed');

    const { accessToken, refreshToken: rt, user } = json.data;
    localStorage.setItem('auth_token', accessToken);
    localStorage.setItem('auth_refresh_token', rt);
    localStorage.setItem('auth_user', JSON.stringify(user));
    setState({ user, token: accessToken, refreshToken: rt, loading: false });
  }, []);

  const logout = useCallback(() => {
    const token = state.token;
    if (token) {
      fetch('/api/auth/logout', { method: 'POST', headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
    }
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_refresh_token');
    localStorage.removeItem('auth_user');
    setState({ user: null, token: null, refreshToken: null, loading: false });
  }, [state.token]);

  return (
    <AuthContext.Provider value={{ ...state, login, loginDemo, logout, isAuthenticated: !!state.token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
