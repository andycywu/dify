// 測試環境變數載入
require('dotenv').config();

console.log('環境變數測試：');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('NEXT_PUBLIC_DIFY_API_KEY:', process.env.NEXT_PUBLIC_DIFY_API_KEY);
console.log('NEXT_PUBLIC_DIFY_API_BASE_URL:', process.env.NEXT_PUBLIC_DIFY_API_BASE_URL);

// 模擬 Next.js 環境變數載入
const { loadEnvConfig } = require('@next/env');
const projectDir = process.cwd();
loadEnvConfig(projectDir);

console.log('\n使用 Next.js loadEnvConfig 後：');
console.log('NEXT_PUBLIC_DIFY_API_KEY:', process.env.NEXT_PUBLIC_DIFY_API_KEY);
console.log('NEXT_PUBLIC_DIFY_API_BASE_URL:', process.env.NEXT_PUBLIC_DIFY_API_BASE_URL);
