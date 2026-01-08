/**
 * User Statistics API
 * 從 Wiki.js PostgreSQL 資料庫獲取真實的用戶統計數據
 *
 * GET /api/admin/user-stats
 *
 * 數據來源：Wiki.js PostgreSQL Database
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { Pool } from 'pg';

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  administrators: number;
  lastUpdated: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<UserStats | { error: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let pool: Pool | null = null;

  try {
    // 連接到 Wiki.js 資料庫
    pool = new Pool({
      host: process.env.POSTGRES_HOST || 'db',
      port: parseInt(process.env.POSTGRES_PORT || '5432'),
      database: 'wiki',
      user: process.env.POSTGRES_USER || 'postgres',
      password: process.env.POSTGRES_PASSWORD || 'difyai123456',
      connectionTimeoutMillis: 5000,
    });

    // 計算 30 天前的時間戳
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    // 查詢 1: 總用戶數（排除系統帳號 guest 和 isSystem = true）
    const totalUsersQuery = `
      SELECT COUNT(*) as count
      FROM users
      WHERE "providerKey" != 'local' OR email != 'guest'
    `;
    const totalUsersResult = await pool.query(totalUsersQuery);
    const totalUsers = parseInt(totalUsersResult.rows[0]?.count || '0');

    // 查詢 2: 活躍用戶（最近30天有登入）
    const activeUsersQuery = `
      SELECT COUNT(*) as count
      FROM users
      WHERE ("providerKey" != 'local' OR email != 'guest')
        AND "lastLoginAt" >= $1
    `;
    const activeUsersResult = await pool.query(activeUsersQuery, [thirtyDaysAgo]);
    const activeUsers = parseInt(activeUsersResult.rows[0]?.count || '0');

    // 查詢 3: 管理員數量（從 userGroups 和 groups 關聯查詢）
    const adminQuery = `
      SELECT COUNT(DISTINCT ug."userId") as count
      FROM "userGroups" ug
      INNER JOIN groups g ON ug."groupId" = g.id
      WHERE g.name = 'Administrators' OR g.id = 1
    `;
    const adminResult = await pool.query(adminQuery);
    const administrators = parseInt(adminResult.rows[0]?.count || '0');

    const stats: UserStats = {
      totalUsers,
      activeUsers,
      administrators,
      lastUpdated: new Date().toISOString()
    };

    return res.status(200).json(stats);
  } catch (error: any) {
    console.error('Failed to fetch user statistics:', error);
    return res.status(500).json({
      error: error.message || 'Failed to fetch user statistics from Wiki.js database'
    });
  } finally {
    // 關閉資料庫連線
    if (pool) {
      await pool.end();
    }
  }
}
