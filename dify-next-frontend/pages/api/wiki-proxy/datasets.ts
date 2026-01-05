import { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
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
      const info = DEPARTMENT_INFO[setting.department] || {
        name: `${setting.department} 知識庫`,
        description: `${setting.department} 部門相關文檔`,
      };

      datasets[setting.department] = {
        id: setting.department,
        name: info.name,
        description: info.description,
        apiKey: setting.apiKey,
      };
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
  res.setHeader('Access-Control-Allow-Origin', 'http://172.27.197.100:3002');
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

    type AuthSource = 'nextauth' | 'wiki-jwt' | 'session' | 'none';

    let authSource: AuthSource = 'none';
    let tokenUserId: number | null = null;
    let tokenGroups: string[] | undefined;

    let nextAuthUserId: number | null = null;
    let nextAuthGroups: string[] | undefined;

    // 嘗試解析 NextAuth JWT（支援 Authorization header）
    try {
      const nextAuthToken = await getToken({
        req,
        secret: process.env.NEXTAUTH_SECRET,
      });

      if (nextAuthToken) {
        const rawId = nextAuthToken.id as string | undefined;
        if (rawId) {
          const parsedId = parseInt(rawId, 10);
          if (!Number.isNaN(parsedId)) {
            nextAuthUserId = parsedId;
            console.log('[datasets] NextAuth token detected, user ID:', nextAuthUserId);
          } else {
            console.warn('[datasets] NextAuth token id is not numeric:', rawId);
          }
        }
        const groups = nextAuthToken.groups as string[] | undefined;
        if (Array.isArray(groups)) {
          nextAuthGroups = groups;
        }
      }
    } catch (tokenError) {
      console.warn('[datasets] Failed to parse NextAuth token:', tokenError);
    }

    // Wiki.js JWT（同域名發放的 jwt cookie）
    let wikiJwtUserId: number | null = null;
    const authHeader = req.headers['authorization'];
    let bearerToken: string | undefined;
    if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      bearerToken = authHeader.slice(7).trim();
    }

    if (bearerToken) {
      try {
        const parts = bearerToken.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
          const rawUserId = payload?.id ?? payload?.userId;
          if (rawUserId !== undefined && rawUserId !== null) {
            const parsedId = parseInt(String(rawUserId), 10);
            if (!Number.isNaN(parsedId)) {
              wikiJwtUserId = parsedId;
              console.log('[datasets] Wiki JWT detected, user ID:', wikiJwtUserId);
            }
          }
          
          // 從 JWT 中提取群組 ID 並映射到群組名稱
          const jwtGroupIds = payload?.groups;
          if (Array.isArray(jwtGroupIds) && jwtGroupIds.length > 0) {
            console.log('[datasets] JWT contains group IDs:', jwtGroupIds);
            
            // 從資料庫查詢群組名稱
            try {
              const groupNamesQuery = `
                SELECT id, name FROM groups WHERE id = ANY($1)
              `;
              const groupNamesResult = await wikiPool.query(groupNamesQuery, [jwtGroupIds]);
              const jwtGroupNames = groupNamesResult.rows.map(row => row.name);
              
              if (jwtGroupNames.length > 0) {
                tokenGroups = jwtGroupNames;
                console.log('[datasets] Mapped JWT group IDs to names:', tokenGroups);
              }
            } catch (groupQueryError) {
              console.error('[datasets] Failed to query group names from JWT IDs:', groupQueryError);
            }
          }
        }
      } catch (jwtError) {
        console.warn('[datasets] Failed to decode Wiki JWT:', jwtError);
      }
    }

    if (wikiJwtUserId !== null) {
      tokenUserId = wikiJwtUserId;
      authSource = 'wiki-jwt';
      // 保留從 JWT 查詢的群組名稱
    } else if (nextAuthUserId !== null) {
      tokenUserId = nextAuthUserId;
      tokenGroups = nextAuthGroups;
      authSource = 'nextauth';
    }

    // 從 cookie 或自訂 header 中獲取用戶 session（向後相容）
    const sessionToken = req.cookies['wiki.sid'] || (req.headers['x-wiki-session'] as string | undefined);
    console.log('[datasets] Cookies:', Object.keys(req.cookies));
    console.log('[datasets] X-Wiki-Session header:', req.headers['x-wiki-session'] ? 'exists' : 'missing');
    console.log('[datasets] Session token source:', req.cookies['wiki.sid'] ? 'cookie' : req.headers['x-wiki-session'] ? 'header' : 'none');
    if (sessionToken) {
      console.log('[datasets] Session token (first 10 chars):', sessionToken.substring(0, 10) + '...');
    }

    let resolvedUserId: number | null = tokenUserId;

    if (!resolvedUserId && sessionToken) {
      const sessionQuery = `
        SELECT sess FROM sessions WHERE sid = $1 AND expire > NOW()
      `;

      const sessionResult = await wikiPool.query(sessionQuery, [sessionToken]);

      if (sessionResult.rows.length === 0) {
        console.warn('[datasets] Session token expired or not found, fallback to Guests');
      } else {
        const sessionData = sessionResult.rows[0].sess;
        const userId = sessionData?.passport?.user;
        if (userId) {
          resolvedUserId = typeof userId === 'number' ? userId : parseInt(String(userId), 10);
          authSource = 'session';
          console.log('[datasets] Authenticated via Wiki.js session, user ID:', resolvedUserId);
        }
      }
    }

    if (!resolvedUserId) {
      return res.status(401).json({
        error: 'Unauthorized',
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

    let userGroups: string[] = [];
    try {
      const groupsResult = await wikiPool.query(userGroupsQuery, [resolvedUserId]);
      userGroups = groupsResult.rows.map(row => row.name);
    } catch (groupError) {
      console.error('[datasets] Failed to fetch groups from database:', groupError);
    }

    if (userGroups.length === 0 && tokenGroups) {
      userGroups = [...tokenGroups];
      console.log('[datasets] Using groups from NextAuth token as fallback:', userGroups);
    }

    const datasetKeyByLowercase = new Map(
      Object.keys(DEPARTMENT_INFO).map(key => [key.toLowerCase(), key])
    );

    // 以不區分大小寫的方式去重並轉換為系統識別的群組名稱
    const normalizedGroups: string[] = [];
    const seenGroupKeys = new Set<string>();
    for (const group of userGroups) {
      const canonical = datasetKeyByLowercase.get(group.toLowerCase()) || group;
      const key = canonical.toLowerCase();
      if (seenGroupKeys.has(key)) {
        continue;
      }
      seenGroupKeys.add(key);
      normalizedGroups.push(canonical);
    }
    userGroups = normalizedGroups;

    const hasGuestAccess = seenGroupKeys.has('guests');
    if (!hasGuestAccess) {
      seenGroupKeys.add('guests');
      userGroups.push('Guests');
    }

    const isAdministrator = seenGroupKeys.has('administrators');
    if (isAdministrator) {
      // Admin gets access to ALL available datasets from DB + Hardcoded
      for (const deptKey of Object.keys(DEPARTMENT_DATASETS)) {
        const lower = deptKey.toLowerCase();
        if (!seenGroupKeys.has(lower)) {
          seenGroupKeys.add(lower);
          userGroups.push(deptKey);
        }
      }
    }

    console.log('[datasets] 認證來源:', authSource, '用戶 ID:', resolvedUserId, '所屬組別:', userGroups);

    const availableDatasets = [] as Array<{ id: string; name: string; description: string; available: boolean }>;
    const seenDatasets = new Set<string>();

    for (const group of userGroups) {
      const canonicalKey = datasetKeyByLowercase.get(group.toLowerCase());
      if (!canonicalKey) {
        continue;
      }
      if (seenDatasets.has(canonicalKey)) {
        continue;
      }

      const dataset = DEPARTMENT_DATASETS[canonicalKey];
      if (!dataset) {
        continue;
      }

      seenDatasets.add(canonicalKey);
      availableDatasets.push({
        id: dataset.id,
        name: dataset.name,
        description: dataset.description,
        available: !!dataset.apiKey,
      });
    }

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
