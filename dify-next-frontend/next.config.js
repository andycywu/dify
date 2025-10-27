const { i18n } = require('./next-i18next.config');

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
  i18n,
  webpack: (config) => {
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });

    return config;
  },
};

module.exports = nextConfig;
