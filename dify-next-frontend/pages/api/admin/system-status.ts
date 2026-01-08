/**
 * System Status API
 * 檢查各服務的健康狀態
 *
 * GET /api/admin/system-status
 *
 * 檢查項目：
 * 1. Dify API - 檢查 API 是否可通
 * 2. REST-to-SOAP Proxy - 檢查 health endpoint
 * 3. Wiki.js - 檢查網站可訪問性
 * 4. PostgreSQL - 檢查資料庫連線
 * 5. Redis - 檢查 Redis 連線
 */

import type { NextApiRequest, NextApiResponse } from 'next';

interface ServiceStatus {
  name: string;
  status: 'running' | 'stopped' | 'error';
  message?: string;
  responseTime?: number;
}

interface SystemStatusResponse {
  services: ServiceStatus[];
  timestamp: string;
  overallStatus: 'healthy' | 'degraded' | 'down';
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SystemStatusResponse | { error: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const services: ServiceStatus[] = [];

    // 1. 檢查 Dify API
    const difyStatus = await checkDifyApi();
    services.push(difyStatus);

    // 2. 檢查 REST-to-SOAP Proxy
    const restToSoapStatus = await checkRestToSoapProxy();
    services.push(restToSoapStatus);

    // 3. 檢查 Wiki.js
    const wikiStatus = await checkWikiJs();
    services.push(wikiStatus);

    // 4. 檢查 PostgreSQL
    const postgresStatus = await checkPostgreSQL();
    services.push(postgresStatus);

    // 5. 檢查 Redis (如果配置了)
    const redisStatus = await checkRedis();
    services.push(redisStatus);

    // 計算整體狀態
    const runningCount = services.filter(s => s.status === 'running').length;
    const totalCount = services.length;

    let overallStatus: 'healthy' | 'degraded' | 'down';
    if (runningCount === totalCount) {
      overallStatus = 'healthy';
    } else if (runningCount > 0) {
      overallStatus = 'degraded';
    } else {
      overallStatus = 'down';
    }

    return res.status(200).json({
      services,
      timestamp: new Date().toISOString(),
      overallStatus
    });
  } catch (error) {
    console.error('System status check error:', error);
    return res.status(500).json({ error: 'Failed to check system status' });
  }
}

/**
 * 檢查 Dify API 狀態
 */
async function checkDifyApi(): Promise<ServiceStatus> {
  const startTime = Date.now();
  const difyApiUrl = process.env.NEXT_PUBLIC_DIFY_API_BASE_URL || 'http://172.27.197.100/v1';

  try {
    // 嘗試訪問 Dify API 的 health endpoint 或任何輕量級 endpoint
    const response = await fetch(`${difyApiUrl}/`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(5000) // 5秒超時
    });

    const responseTime = Date.now() - startTime;

    // Dify API 通常會返回 404 或其他狀態，只要不是網路錯誤就算連通
    if (response.status === 404 || response.status === 200 || response.status === 401) {
      return {
        name: 'Dify API',
        status: 'running',
        message: `API accessible (HTTP ${response.status})`,
        responseTime
      };
    } else {
      return {
        name: 'Dify API',
        status: 'error',
        message: `Unexpected status: ${response.status}`,
        responseTime
      };
    }
  } catch (error: any) {
    return {
      name: 'Dify API',
      status: 'stopped',
      message: error.message || 'Connection failed',
      responseTime: Date.now() - startTime
    };
  }
}

/**
 * 檢查 REST-to-SOAP Proxy 狀態
 */
async function checkRestToSoapProxy(): Promise<ServiceStatus> {
  const startTime = Date.now();
  const proxyUrl = process.env.REST_TO_SOAP_PROXY_URL || 'http://rest-to-soap-proxy:5001';

  try {
    // 檢查 health endpoint
    const response = await fetch(`${proxyUrl}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000)
    });

    const responseTime = Date.now() - startTime;

    if (response.ok) {
      const data = await response.json();
      return {
        name: 'REST-to-SOAP Proxy',
        status: 'running',
        message: data.status || 'Healthy',
        responseTime
      };
    } else {
      return {
        name: 'REST-to-SOAP Proxy',
        status: 'error',
        message: `HTTP ${response.status}`,
        responseTime
      };
    }
  } catch (error: any) {
    return {
      name: 'REST-to-SOAP Proxy',
      status: 'stopped',
      message: error.message || 'Connection failed',
      responseTime: Date.now() - startTime
    };
  }
}

/**
 * 檢查 Wiki.js 狀態
 */
async function checkWikiJs(): Promise<ServiceStatus> {
  const startTime = Date.now();
  const wikiUrl = process.env.WIKI_GRAPHQL_URL?.replace('/graphql', '') || 'http://172.27.197.100:3002';

  try {
    // 嘗試訪問 Wiki.js 首頁
    const response = await fetch(wikiUrl, {
      method: 'GET',
      signal: AbortSignal.timeout(5000)
    });

    const responseTime = Date.now() - startTime;

    if (response.ok) {
      return {
        name: 'Wiki.js',
        status: 'running',
        message: 'Website accessible',
        responseTime
      };
    } else {
      return {
        name: 'Wiki.js',
        status: 'error',
        message: `HTTP ${response.status}`,
        responseTime
      };
    }
  } catch (error: any) {
    return {
      name: 'Wiki.js',
      status: 'stopped',
      message: error.message || 'Connection failed',
      responseTime: Date.now() - startTime
    };
  }
}

/**
 * 檢查 PostgreSQL 狀態
 */
async function checkPostgreSQL(): Promise<ServiceStatus> {
  const startTime = Date.now();

  try {
    // 使用動態 import 來避免在沒有 pg 的環境中報錯
    const { Pool } = await import('pg');

    const databaseUrl = process.env.DATABASE_URL || process.env.DIFY_DATABASE_URL;

    if (!databaseUrl) {
      return {
        name: 'PostgreSQL',
        status: 'error',
        message: 'Database URL not configured'
      };
    }

    const pool = new Pool({
      connectionString: databaseUrl,
      connectionTimeoutMillis: 5000,
    });

    await pool.query('SELECT 1');
    await pool.end();

    const responseTime = Date.now() - startTime;

    return {
      name: 'PostgreSQL',
      status: 'running',
      message: 'Database connected',
      responseTime
    };
  } catch (error: any) {
    return {
      name: 'PostgreSQL',
      status: 'stopped',
      message: error.message || 'Connection failed',
      responseTime: Date.now() - startTime
    };
  }
}

/**
 * 檢查 Redis 狀態
 */
async function checkRedis(): Promise<ServiceStatus> {
  const startTime = Date.now();

  try {
    const redisHost = process.env.REDIS_HOST || 'redis';
    const redisPort = process.env.REDIS_PORT || '6379';
    const redisPassword = process.env.REDIS_PASSWORD || 'difyai123456';

    // 嘗試連接 Redis
    const redis = await import('ioredis');
    const client = new redis.default({
      host: redisHost,
      port: parseInt(redisPort),
      password: redisPassword,
      connectTimeout: 3000,
      retryStrategy: () => null, // 不重試
    });

    // 執行 PING 命令
    await client.ping();
    await client.quit();

    const responseTime = Date.now() - startTime;

    return {
      name: 'Redis',
      status: 'running',
      message: 'Connected',
      responseTime
    };
  } catch (error: any) {
    return {
      name: 'Redis',
      status: 'stopped',
      message: error.message || 'Connection failed',
      responseTime: Date.now() - startTime
    };
  }
}
