import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';
import prisma from '../../lib/prisma';

interface DepartmentApiKey {
  department: string;
  apiKey: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // 驗證用戶權限
  const session = await getServerSession(req, res, authOptions);
  
  if (!session || session.user?.role !== 'admin') {
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
