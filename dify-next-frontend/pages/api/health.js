// Health check API for Docker container
// pages/api/health.js

import { prisma } from '../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 使用單例 Prisma Client，進行簡單的查詢測試
    await prisma.$queryRaw`SELECT 1 as health_check`;
    
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
