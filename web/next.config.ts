import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@daily-logs/utils', '@daily-logs/db', '@daily-logs/domains'],
};

export default nextConfig;
