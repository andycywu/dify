// Health check API for Docker container
// pages/api/health.js

import { PrismaClient } from '@prisma/client';

// 創建單例 Prisma Client，使用明確的 SQLite 配置
let prisma;

function createPrismaClient() {
  return new PrismaClient({
    datasources: {
      db: {
        url: "file:/app/dev.db"
      }
    },
    log: ['error', 'warn'],
    // 設置明確的 SQLite 配置
    __internal: {
      engine: {
        binaryPath: undefined // 讓 Prisma 自動選擇
      }
    }
  });
}

if (process.env.NODE_ENV === 'production') {
  prisma = createPrismaClient();
} else {
  // 開發環境中防止多次實例化
  if (!global.prisma) {
    global.prisma = createPrismaClient();
  }
  prisma = global.prisma;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 使用最簡單的連接測試
    console.log('Health check: Starting Prisma connection test...');
    
    // 先測試 Prisma Client 是否可以創建
    const testPrisma = createPrismaClient();
    console.log('Health check: Prisma Client created successfully');
    
    // 嘗試最簡單的連接
    await testPrisma.$connect();
    console.log('Health check: Connection established');
    
    // 執行簡單查詢
    const result = await testPrisma.$queryRaw`SELECT 1 as health_check`;
    console.log('Health check: Query executed successfully', result);
    
    // 清理連接
    await testPrisma.$disconnect();
    console.log('Health check: Connection closed');
    
    // 將 BigInt 轉換為 Number 以避免 JSON 序列化問題
    const sanitizedResult = JSON.parse(JSON.stringify(result, (key, value) =>
      typeof value === 'bigint' ? Number(value) : value
    ));
    
    res.status(200).json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      prisma: 'connected',
      service: 'dify-next-frontend',
      queryResult: sanitizedResult
    });
  } catch (error) {
    console.error('Health check failed:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      clientVersion: error.clientVersion
    });
    
    res.status(503).json({ 
      status: 'unhealthy', 
      timestamp: new Date().toISOString(),
      error: error.message,
      errorName: error.name,
      service: 'dify-next-frontend'
    });
  }
}
