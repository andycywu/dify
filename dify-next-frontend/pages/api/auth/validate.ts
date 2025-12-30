import { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import { Pool } from 'pg';

const wikiPool = new Pool({
  host: process.env.POSTGRES_HOST || 'db',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: 'wiki',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'difyai123456',
});

// 驗證用戶是否為管理員
async function isUserAdmin(req: NextApiRequest): Promise<boolean> {
  try {
    console.log('[auth-validate] Checking admin status...');

    // 使用 NextAuth JWT token
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET
    });

    console.log('[auth-validate] NextAuth token:', token ? 'exists' : 'missing');

    if (!token || !token.email) {
      console.log('[auth-validate] No token or email found');
      return false;
    }

    console.log('[auth-validate] User email:', token.email);
    console.log('[auth-validate] User role from token:', token.role);

    // 如果 token 中已經有 role，直接檢查
    if (token.role === 'Administrator') {
      console.log('[auth-validate] User is Administrator (from token)');
      return true;
    }

    // 否則從資料庫查詢用戶組別
    const userResult = await wikiPool.query(
      'SELECT id FROM users WHERE email = $1',
      [token.email]
    );

    if (userResult.rows.length === 0) {
      console.log('[auth-validate] User not found in Wiki.js');
      return false;
    }

    const userId = userResult.rows[0].id;
    console.log('[auth-validate] User ID:', userId);

    // 檢查用戶是否在 Administrators 組
    const groupResult = await wikiPool.query(
      `SELECT g.name FROM "userGroups" ug
       JOIN groups g ON ug."groupId" = g.id
       WHERE ug."userId" = $1 AND g.name = 'Administrators'`,
      [userId]
    );

    console.log('[auth-validate] Admin group check result:', groupResult.rows.length);
    const isAdmin = groupResult.rows.length > 0;
    console.log('[auth-validate] Is Administrator:', isAdmin);

    return isAdmin;
  } catch (error) {
    console.error('[auth-validate] Error checking admin status:', error);
    return false;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const isAdmin = await isUserAdmin(req);

    if (!isAdmin) {
      return res.status(403).json({
        error: 'Forbidden',
        role: null,
        authenticated: false
      });
    }

    // 返回用戶資訊
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET
    });

    return res.status(200).json({
      authenticated: true,
      role: 'Administrator',
      email: token?.email,
      name: token?.name
    });

  } catch (error) {
    console.error('[auth-validate] Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
