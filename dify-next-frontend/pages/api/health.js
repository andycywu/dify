// Health check API for Docker container
// pages/api/health.js

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 簡單檢查 Prisma 是否可用
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    // 嘗試連接數據庫
    await prisma.$connect();
    await prisma.$disconnect();
    
    res.status(200).json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      prisma: 'connected',
      service: 'dify-next-frontend'
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({ 
      status: 'unhealthy', 
      timestamp: new Date().toISOString(),
      error: error.message,
      service: 'dify-next-frontend'
    });
  }
}
