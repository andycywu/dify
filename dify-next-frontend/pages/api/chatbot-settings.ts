import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../lib/prisma';
import { Pool } from 'pg';

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
    const sessionToken = req.cookies['wiki.sid'];
    
    console.log('[chatbot-settings] Checking admin status...');
    console.log('[chatbot-settings] Session token:', sessionToken ? 'exists' : 'missing');
    
    if (!sessionToken) {
      console.log('[chatbot-settings] No session token found');
      return false;
    }

    const sessionResult = await wikiPool.query(
      'SELECT sess FROM sessions WHERE sid = $1 AND expire > NOW()',
      [sessionToken]
    );

    console.log('[chatbot-settings] Session query result:', sessionResult.rows.length);

    if (sessionResult.rows.length === 0) {
      console.log('[chatbot-settings] Session not found or expired');
      return false;
    }

    const sessionData = sessionResult.rows[0].sess;
    const userId = sessionData?.passport?.user;

    console.log('[chatbot-settings] User ID from session:', userId);

    if (!userId) {
      console.log('[chatbot-settings] No user ID in session');
      return false;
    }

    // 檢查用戶是否在 administrators 組
    const groupResult = await wikiPool.query(
      `SELECT g.name FROM "userGroups" ug 
       JOIN groups g ON ug."groupId" = g.id 
       WHERE ug."userId" = $1 AND g.name = 'Administrators'`,
      [userId]
    );

    console.log('[chatbot-settings] Admin group check result:', groupResult.rows.length);
    console.log('[chatbot-settings] Is admin:', groupResult.rows.length > 0);

    return groupResult.rows.length > 0;
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
