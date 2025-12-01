import { NextApiRequest, NextApiResponse } from 'next';
import { Pool } from 'pg';
import { prisma } from '../../../lib/prisma';

interface DatasetInfo {
  id: string;
  name: string;
  description: string;
  apiKey: string | undefined;
}

// PostgreSQL 連接設定 - 連接到 Wiki.js 資料庫
const wikiPool = new Pool({
  host: process.env.POSTGRES_HOST || 'db',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: 'wiki',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'difyai123456',
});

// 部門資訊配置
const DEPARTMENT_INFO: Record<string, { name: string; description: string }> = {
  'administrators': {
    name: '管理員知識庫',
    description: '系統管理相關知識和文檔',
  },
  'Guests': {
    name: '訪客知識庫',
    description: '公開資訊和常見問題',
  },
  'EE': {
    name: '電機工程部門知識庫',
    description: '電機工程相關技術文檔和規範',
  },
  'ME_LCM': {
    name: '機械工程部門知識庫',
    description: '機械工程和生命週期管理相關文檔',
  },
  'PWR': {
    name: '電源部門知識庫',
    description: '電源系統和電力相關技術文檔',
  },
  'SW': {
    name: '軟體部門知識庫',
    description: '軟體開發、架構和技術文檔',
  },
  'PJM': {
    name: '專案管理部門知識庫',
    description: '專案管理和協調相關文檔',
  },
  'DQE': {
    name: '品質工程部門知識庫',
    description: '品質保證和工程相關文檔',
  },
  'Certi': {
    name: '認證部門知識庫',
    description: '產品認證和合規相關文檔',
  },
};

// 從資料庫獲取所有部門 API 密鑰
async function getDepartmentDatasets(): Promise<Record<string, DatasetInfo>> {
  try {
    const settings = await prisma.chatbotSetting.findMany();
    const datasets: Record<string, DatasetInfo> = {};

    // 從資料庫構建資料集
    for (const setting of settings) {
      const info = DEPARTMENT_INFO[setting.department];
      if (info) {
        datasets[setting.department] = {
          id: setting.department,
          name: info.name,
          description: info.description,
          apiKey: setting.apiKey,
        };
      }
    }

    // 降級：從環境變數補充缺失的配置
    for (const [dept, info] of Object.entries(DEPARTMENT_INFO)) {
      if (!datasets[dept]) {
        const envKeys: Record<string, string | undefined> = {
          'administrators': process.env.DIFY_ADMINISTRATORS_API_KEY,
          'Guests': process.env.DIFY_GUESTS_API_KEY,
          'EE': process.env.DIFY_EE_API_KEY,
          'ME_LCM': process.env.DIFY_ME_LCM_API_KEY,
          'PWR': process.env.DIFY_PWR_API_KEY,
          'SW': process.env.DIFY_SW_API_KEY,
          'PJM': process.env.DIFY_PJM_API_KEY,
          'DQE': process.env.DIFY_DQE_API_KEY,
          'Certi': process.env.DIFY_CERTI_API_KEY,
        };
        datasets[dept] = {
          id: dept,
          name: info.name,
          description: info.description,
          apiKey: envKeys[dept],
        };
      }
    }

    return datasets;
  } catch (error) {
    console.error('Error fetching department datasets:', error);
    // 完全降級到環境變數
    const datasets: Record<string, DatasetInfo> = {};
    for (const [dept, info] of Object.entries(DEPARTMENT_INFO)) {
      const envKeys: Record<string, string | undefined> = {
        'administrators': process.env.DIFY_ADMINISTRATORS_API_KEY,
        'Guests': process.env.DIFY_GUESTS_API_KEY,
        'EE': process.env.DIFY_EE_API_KEY,
        'ME_LCM': process.env.DIFY_ME_LCM_API_KEY,
        'PWR': process.env.DIFY_PWR_API_KEY,
        'SW': process.env.DIFY_SW_API_KEY,
        'PJM': process.env.DIFY_PJM_API_KEY,
        'DQE': process.env.DIFY_DQE_API_KEY,
        'Certi': process.env.DIFY_CERTI_API_KEY,
      };
      datasets[dept] = {
        id: dept,
        name: info.name,
        description: info.description,
        apiKey: envKeys[dept],
      };
    }
    return datasets;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // CORS headers for Wiki.js integration
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3002');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Wiki-Session');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 從資料庫獲取部門資料集
    const DEPARTMENT_DATASETS = await getDepartmentDatasets();

    // 從 cookie 或自訂 header 中獲取用戶 session
    const sessionToken = req.cookies['wiki.sid'] || req.headers['x-wiki-session'] as string;
    console.log('[datasets] Cookies:', Object.keys(req.cookies));
    console.log('[datasets] X-Wiki-Session header:', req.headers['x-wiki-session'] ? 'exists' : 'missing');
    console.log('[datasets] Session token source:', req.cookies['wiki.sid'] ? 'cookie' : req.headers['x-wiki-session'] ? 'header' : 'none');
    if (sessionToken) {
      console.log('[datasets] Session token (first 10 chars):', sessionToken.substring(0, 10) + '...');
    }

    if (!sessionToken) {
      return res.status(401).json({
        error: 'Unauthorized',
        datasets: [DEPARTMENT_DATASETS['Guests']],
        user_groups: ['Guests']
      });
    }

    // 從 Wiki.js session 獲取用戶信息
    const sessionQuery = `
      SELECT sess FROM sessions WHERE sid = $1 AND expire > NOW()
    `;

    const sessionResult = await wikiPool.query(sessionQuery, [sessionToken]);

    if (sessionResult.rows.length === 0) {
      return res.status(401).json({
        error: 'Session expired',
        datasets: [DEPARTMENT_DATASETS['Guests']],
        user_groups: ['Guests']
      });
    }

    const sessionData = sessionResult.rows[0].sess;
    const userId = sessionData?.passport?.user;

    if (!userId) {
      return res.status(401).json({
        error: 'User not found in session',
        datasets: [DEPARTMENT_DATASETS['Guests']],
        user_groups: ['Guests']
      });
    }

    // 獲取用戶的組別
    const userGroupsQuery = `
      SELECT g.name
      FROM users u
      JOIN "userGroups" ug ON u.id = ug."userId"
      JOIN groups g ON ug."groupId" = g.id
      WHERE u.id = $1
    `;

    const groupsResult = await wikiPool.query(userGroupsQuery, [userId]);

    // 用戶所屬的組別
    let userGroups: string[] = groupsResult.rows.map(row => row.name);
    console.log('[datasets] 用戶 ID:', userId, '所屬組別:', userGroups);

    // 確保至少有 Guests 權限
    if (!userGroups.includes('Guests')) {
      userGroups.push('Guests');
    }

    // 根據用戶組別過濾可用的數據集
    const availableDatasets = userGroups
      .filter((group): group is string => DEPARTMENT_DATASETS[group] !== undefined)
      .map(group => {
        const dataset = DEPARTMENT_DATASETS[group];
        return {
          id: dataset.id,
          name: dataset.name,
          description: dataset.description,
          available: !!dataset.apiKey
        };
      });

    console.log('[datasets] 可用知識庫數量:', availableDatasets.length);
    console.log('[datasets] 知識庫列表:', availableDatasets.map(d => d.id).join(', '));

    res.status(200).json({
      datasets: availableDatasets,
      user_groups: userGroups
    });

  } catch (error) {
    console.error('Error fetching user datasets:', error);

    // 降級：返回 Guests 基本資訊
    const guestsDataset = {
      id: 'Guests',
      name: '訪客知識庫',
      description: '公開資訊和常見問題',
      available: false
    };

    res.status(500).json({
      error: 'Internal server error',
      datasets: [guestsDataset],
      user_groups: ['Guests']
    });
  }
}
