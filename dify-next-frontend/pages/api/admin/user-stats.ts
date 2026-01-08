/**
 * User Statistics API
 * 從 Wiki.js 獲取真實的用戶統計數據
 *
 * GET /api/admin/user-stats
 *
 * 數據來源：Wiki.js GraphQL API
 */

import type { NextApiRequest, NextApiResponse } from 'next';

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  administrators: number;
  lastUpdated: string;
}

interface WikiJsGraphQLResponse {
  data?: {
    users?: {
      list?: Array<{
        id: number;
        name: string;
        email: string;
        isActive: boolean;
        isSystem: boolean;
        isVerified: boolean;
        createdAt: string;
        lastLoginAt: string;
      }>;
    };
    groups?: {
      list?: Array<{
        id: number;
        name: string;
        isSystem: boolean;
        userCount: number;
      }>;
    };
  };
  errors?: Array<{
    message: string;
    locations?: Array<{ line: number; column: number }>;
    path?: string[];
  }>;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<UserStats | { error: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const wikiGraphqlUrl = process.env.WIKI_GRAPHQL_URL || 'http://172.27.197.100:3002/graphql';
    const wikiApiKey = process.env.WIKI_API_KEY || '';

    // GraphQL Query 獲取用戶列表和群組資訊
    const query = `
      query {
        users {
          list {
            id
            name
            email
            isActive
            isSystem
            isVerified
            createdAt
            lastLoginAt
          }
        }
        groups {
          list {
            id
            name
            isSystem
            userCount
          }
        }
      }
    `;

    const response = await fetch(wikiGraphqlUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': wikiApiKey ? `Bearer ${wikiApiKey}` : '',
      },
      body: JSON.stringify({ query }),
      signal: AbortSignal.timeout(10000) // 10秒超時
    });

    if (!response.ok) {
      throw new Error(`Wiki.js GraphQL API returned ${response.status}: ${response.statusText}`);
    }

    const data: WikiJsGraphQLResponse = await response.json();

    if (data.errors && data.errors.length > 0) {
      console.error('Wiki.js GraphQL errors:', data.errors);
      throw new Error(`GraphQL errors: ${data.errors.map(e => e.message).join(', ')}`);
    }

    // 處理用戶數據
    const users = data.data?.users?.list || [];
    const groups = data.data?.groups?.list || [];

    // 過濾掉系統用戶
    const realUsers = users.filter(user => !user.isSystem);

    // 計算活躍用戶（最近30天有登入）
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const activeUsers = realUsers.filter(user => {
      if (!user.lastLoginAt) return false;
      const lastLogin = new Date(user.lastLoginAt);
      return lastLogin >= thirtyDaysAgo;
    });

    // 查找管理員群組
    const adminGroup = groups.find(group =>
      group.name.toLowerCase() === 'administrators' ||
      group.name.toLowerCase() === 'admins' ||
      group.id === 1 // Wiki.js 預設管理員群組 ID 為 1
    );

    const stats: UserStats = {
      totalUsers: realUsers.length,
      activeUsers: activeUsers.length,
      administrators: adminGroup?.userCount || 0,
      lastUpdated: new Date().toISOString()
    };

    return res.status(200).json(stats);
  } catch (error: any) {
    console.error('Failed to fetch user statistics:', error);
    return res.status(500).json({
      error: error.message || 'Failed to fetch user statistics from Wiki.js'
    });
  }
}
