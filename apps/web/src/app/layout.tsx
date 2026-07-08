import type { Metadata } from 'next';
import { AuthProvider } from '../contexts/auth-context';
import { AppShell } from './app-shell';
import './globals.css';

export const metadata: Metadata = {
  title: 'Howard AIOS',
  description: 'Founder Operating System — Information Center',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body>
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}
