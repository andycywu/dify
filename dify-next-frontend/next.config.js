const normalizeBasePath = (input = '') => {
  if (!input) return '';
  const prefixed = input.startsWith('/') ? input : `/${input}`;
  if (prefixed === '/') {
    return '';
  }
  return prefixed.endsWith('/') ? prefixed.replace(/\/+$/, '') : prefixed;
};

const basePath = normalizeBasePath(process.env.NEXT_PUBLIC_BASE_PATH);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  basePath: basePath || undefined,
  assetPrefix: basePath || undefined,
  env: {
    API_URL: process.env.API_URL,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || (basePath ? `${basePath}/api` : '/api'),
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  // Add CORS headers for Wiki.js integration
  async headers() {
    return [
      {
        source: '/api/wiki-proxy/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: 'http://localhost:3002' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },
  // Temporarily disable i18n to avoid SSR issues
  // i18n,
  webpack: (config) => {
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });

    return config;
  },
};

module.exports = nextConfig;
