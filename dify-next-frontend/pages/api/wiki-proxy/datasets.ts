import { NextApiRequest, NextApiResponse } from 'next';
import { Pool } from 'pg';

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

// 部門到 Dify API Key 的映射
const DEPARTMENT_DATASETS: Record<string, DatasetInfo> = {
  'administrators': {
    id: 'administrators',
    name: '管理員知識庫',
    description: '系統管理相關知識和文檔',
    apiKey: process.env.DIFY_ADMINISTRATORS_API_KEY,
  },
  'Guests': {
    id: 'Guests',
    name: '訪客知識庫',
    description: '公開資訊和常見問題',
    apiKey: process.env.DIFY_GUESTS_API_KEY,
  },
  'EE': {
    id: 'EE',
    name: '電機工程部門知識庫',
    description: '電機工程相關技術文檔和規範',
    apiKey: process.env.DIFY_EE_API_KEY,
  },
  'ME_LCM': {
    id: 'ME_LCM',
    name: '機械工程部門知識庫',
    description: '機械工程和生命週期管理相關文檔',
    apiKey: process.env.DIFY_ME_LCM_API_KEY,
  },
  'PWR': {
    id: 'PWR',
    name: '電源部門知識庫',
    description: '電源系統和電力相關技術文檔',
    apiKey: process.env.DIFY_PWR_API_KEY,
  },
  'SW': {
    id: 'SW',
    name: '軟體部門知識庫',
    description: '軟體開發、架構和技術文檔',
    apiKey: process.env.DIFY_SW_API_KEY,
  },
  'PJM': {
    id: 'PJM',
    name: '專案管理部門知識庫',
    description: '專案管理和協調相關文檔',
    apiKey: process.env.DIFY_PJM_API_KEY,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 從 cookie 中獲取用戶 session
    const sessionToken = req.cookies['wiki.sid'];

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
      JOIN user_groups ug ON u.id = ug.user_id
      JOIN groups g ON ug.group_id = g.id
      WHERE u.id = $1
    `;

    const groupsResult = await wikiPool.query(userGroupsQuery, [userId]);

    // 用戶所屬的組別
    let userGroups: string[] = groupsResult.rows.map(row => row.name);

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

    res.status(200).json({
      datasets: availableDatasets,
      user_groups: userGroups
    });

  } catch (error) {
    console.error('Error fetching user datasets:', error);
    res.status(500).json({
      error: 'Internal server error',
      datasets: [DEPARTMENT_DATASETS['Guests']],
      user_groups: ['Guests']
    });
  }
}
