import { NextApiRequest, NextApiResponse } from 'next';
import { Pool } from 'pg';
import fetch from 'node-fetch';

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

const DEPARTMENT_API_KEYS: Record<string, string | undefined> = {
  'administrators': process.env.DIFY_ADMINISTRATORS_API_KEY,
  'Guests': process.env.DIFY_GUESTS_API_KEY,
  'EE': process.env.DIFY_EE_API_KEY,
  'ME_LCM': process.env.DIFY_ME_LCM_API_KEY,
  'PWR': process.env.DIFY_PWR_API_KEY,
  'SW': process.env.DIFY_SW_API_KEY,
  'PJM': process.env.DIFY_PJM_API_KEY,
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, group_id, conversation_id } = req.body;

    if (!message || !group_id) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // 獲取對應的 API Key
    const apiKey = DEPARTMENT_API_KEYS[group_id as string];

    if (!apiKey) {
      return res.status(400).json({
        error: `Invalid group_id: ${group_id}`,
        available_groups: Object.keys(DEPARTMENT_API_KEYS)
      });
    }

    // 從 cookie 獲取用戶信息（用於識別）
    const sessionToken = req.cookies['wiki.sid'];
    let userId = 'anonymous';

    if (sessionToken) {
      try {
        const sessionResult = await wikiPool.query(
          'SELECT sess FROM sessions WHERE sid = $1 AND expire > NOW()',
          [sessionToken]
        );

        if (sessionResult.rows.length > 0) {
          const sessionData = sessionResult.rows[0].sess;
          userId = sessionData?.passport?.user?.toString() || 'anonymous';
        }
      } catch (error) {
        console.error('Failed to fetch user from session:', error);
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
        conversation_id: conversation_id || undefined,
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
