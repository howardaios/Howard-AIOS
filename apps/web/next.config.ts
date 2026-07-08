import type { NextConfig } from 'next';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@howard-aios/types', '@howard-aios/utils'],
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${API_URL}/api/:path*` }];
  },
};

export default nextConfig;
