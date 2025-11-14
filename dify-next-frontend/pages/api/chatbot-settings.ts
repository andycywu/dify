import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../lib/prisma';
import { Pool } from 'pg';
import { getToken } from 'next-auth/jwt';

interface DepartmentApiKey {
  department: string;
  apiKey: string;
}

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
    console.log('[chatbot-settings] Checking admin status...');
    
    // 使用 NextAuth JWT token
    const token = await getToken({ 
      req, 
      secret: process.env.NEXTAUTH_SECRET 
    });
    
    console.log('[chatbot-settings] NextAuth token:', token ? 'exists' : 'missing');
    
    if (!token || !token.email) {
      console.log('[chatbot-settings] No token or email found');
      return false;
    }
    
    console.log('[chatbot-settings] User email:', token.email);
    console.log('[chatbot-settings] User role from token:', token.role);
    
    // 如果 token 中已經有 role，直接檢查
    if (token.role === 'admin') {
      console.log('[chatbot-settings] User is admin (from token)');
      return true;
    }
    
    // 否則從資料庫查詢用戶組別
    const userResult = await wikiPool.query(
      'SELECT id FROM users WHERE email = $1',
      [token.email]
    );
    
    if (userResult.rows.length === 0) {
      console.log('[chatbot-settings] User not found in Wiki.js');
      return false;
    }
    
    const userId = userResult.rows[0].id;
    console.log('[chatbot-settings] User ID:', userId);

    // 檢查用戶是否在 Administrators 組
    const groupResult = await wikiPool.query(
      `SELECT g.name FROM "userGroups" ug 
       JOIN groups g ON ug."groupId" = g.id 
       WHERE ug."userId" = $1 AND g.name = 'Administrators'`,
      [userId]
    );

    console.log('[chatbot-settings] Admin group check result:', groupResult.rows.length);
    const isAdmin = groupResult.rows.length > 0;
    console.log('[chatbot-settings] Is admin:', isAdmin);

    return isAdmin;
  } catch (error) {
    console.error('[chatbot-settings] Error checking admin status:', error);
    return false;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // 驗證用戶權限
  const isAdmin = await isUserAdmin(req);
  
  if (!isAdmin) {
    return res.status(403).json({ error: 'Unauthorized: Admin access required' });
  }

  if (req.method === 'GET') {
    try {
      // 獲取所有部門 API 密鑰
      const settings = await prisma.chatbotSetting.findMany({
        orderBy: { department: 'asc' },
      });

      // 遮蔽部分密鑰顯示
      const maskedSettings = settings.map(setting => ({
        ...setting,
        apiKey: maskApiKey(setting.apiKey),
      }));

      return res.status(200).json({ settings: maskedSettings });
    } catch (error) {
      console.error('Error fetching chatbot settings:', error);
      return res.status(500).json({ error: 'Failed to fetch settings' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { department, apiKey } = req.body as DepartmentApiKey;

      if (!department || !apiKey) {
        return res.status(400).json({ error: 'Department and API key are required' });
      }

      // 更新或創建 API 密鑰
      const setting = await prisma.chatbotSetting.upsert({
        where: { department },
        update: { 
          apiKey,
          updatedAt: new Date(),
        },
        create: {
          department,
          apiKey,
        },
      });

      return res.status(200).json({ 
        message: 'API key saved successfully',
        setting: {
          ...setting,
          apiKey: maskApiKey(setting.apiKey),
        },
      });
    } catch (error) {
      console.error('Error saving chatbot setting:', error);
      return res.status(500).json({ error: 'Failed to save setting' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { department } = req.query;

      if (!department || typeof department !== 'string') {
        return res.status(400).json({ error: 'Department is required' });
      }

      await prisma.chatbotSetting.delete({
        where: { department },
      });

      return res.status(200).json({ message: 'API key deleted successfully' });
    } catch (error) {
      console.error('Error deleting chatbot setting:', error);
      return res.status(500).json({ error: 'Failed to delete setting' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

// 遮蔽 API 密鑰，只顯示前後各 4 個字元
function maskApiKey(apiKey: string): string {
  if (!apiKey || apiKey.length <= 12) {
    return '****';
  }
  const start = apiKey.slice(0, 8);
  const end = apiKey.slice(-4);
  return `${start}...${end}`;
}
