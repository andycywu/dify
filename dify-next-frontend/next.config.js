const { i18n } = require('./next-i18next.config');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    // 確保這些環境變數在客戶端可用
    API_URL: process.env.API_URL,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:5000/api',
    NEXT_PUBLIC_DIFY_API_BASE_URL: process.env.NEXT_PUBLIC_DIFY_API_BASE_URL || 'http://localhost/v1',
    NEXT_PUBLIC_AUTH_URL: process.env.NEXT_PUBLIC_AUTH_URL,
    NEXT_PUBLIC_DIFY_API_KEY: process.env.NEXT_PUBLIC_DIFY_API_KEY,
    NEXT_PUBLIC_USAGE_URL: process.env.NEXT_PUBLIC_USAGE_URL,
  },
  // 確保在構建時讀取環境變數
  publicRuntimeConfig: {
    NEXT_PUBLIC_DIFY_API_BASE_URL: process.env.NEXT_PUBLIC_DIFY_API_BASE_URL,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
  i18n,
  webpack: (config) => {
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });
    
    return config;
  },
}

module.exports = nextConfig;
