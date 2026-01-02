import { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import { Pool } from 'pg';
import fetch from 'node-fetch';
import { prisma } from '../../../lib/prisma';

interface DifyChatResponse {
  answer: string;
  conversation_id: string;
  message_id: string;
  metadata?: Record<string, unknown>;
}

const wikiPool = new Pool({
  host: process.env.POSTGRES_HOST || 'db',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: 'wiki',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'difyai123456',
});

// 從資料庫獲取部門 API 密鑰
async function getDepartmentApiKey(department: string): Promise<string | null> {
  try {
    const setting = await prisma.chatbotSetting.findUnique({
      where: { department },
    });
    return setting?.apiKey || null;
  } catch (error) {
    console.error('Error fetching department API key:', error);
    // 降級到環境變數
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
    return envKeys[department] || null;
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

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, group_id, conversation_id, dify_token } = req.body;

    if (!message || !group_id) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // 使用傳入的 dify_token，或從資料庫獲取對應的 API Key
    let apiKey = dify_token;
    if (!apiKey) {
      apiKey = await getDepartmentApiKey(group_id as string);
    }

    if (!apiKey) {
      return res.status(400).json({
        error: `Invalid group_id or API key not configured: ${group_id}`
      });
    }

    // 從 NextAuth token 或 Wiki.js session 推斷用戶身份
    let userId = 'anonymous';

    try {
      const nextAuthToken = await getToken({
        req,
        secret: process.env.NEXTAUTH_SECRET,
      });

      if (nextAuthToken?.id) {
        userId = String(nextAuthToken.id);
        console.log('[chat] Authenticated via NextAuth token, user ID:', userId);
      }
    } catch (tokenError) {
      console.warn('[chat] Failed to parse NextAuth token:', tokenError);
    }

    const authHeader = req.headers['authorization'];
    let bearerToken: string | undefined;
    if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      bearerToken = authHeader.slice(7).trim();
    }

    if (userId === 'anonymous' && bearerToken) {
      try {
        const parts = bearerToken.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
          const rawUserId = payload?.id ?? payload?.userId;
          if (rawUserId !== undefined && rawUserId !== null) {
            userId = String(rawUserId);
            console.log('[chat] Authenticated via Wiki JWT, user ID:', userId);
          }
        }
      } catch (jwtError) {
        console.warn('[chat] Failed to decode Wiki JWT:', jwtError);
      }
    }

    if (userId === 'anonymous') {
      const sessionToken = req.cookies['wiki.sid'] || (req.headers['x-wiki-session'] as string | undefined);
      if (sessionToken) {
        try {
          const sessionResult = await wikiPool.query(
            'SELECT sess FROM sessions WHERE sid = $1 AND expire > NOW()',
            [sessionToken]
          );

          if (sessionResult.rows.length > 0) {
            const sessionData = sessionResult.rows[0].sess;
            const wikiUserId = sessionData?.passport?.user;
            if (wikiUserId) {
              userId = wikiUserId.toString();
              console.log('[chat] Authenticated via Wiki.js session, user ID:', userId);
            }
          }
        } catch (error) {
          console.error('Failed to fetch user from session:', error);
        }
      }
    }

    // 發送請求到 Dify API
    const difyApiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://api:5001';
    const response = await fetch(`${difyApiUrl}/v1/chat-messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: {},
        query: message,
        response_mode: 'blocking',
        conversation_id: typeof conversation_id === 'string' ? conversation_id : undefined,
        user: userId,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({
        error: 'Dify API error',
        details: errorText
      });
    }

    const data = await response.json() as DifyChatResponse;

    res.status(200).json({
      success: true,
      answer: data.answer,
      conversation_id: data.conversation_id,
      message_id: data.message_id,
      metadata: data.metadata || {},
    });

  } catch (error) {
    console.error('Error in chat proxy:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
