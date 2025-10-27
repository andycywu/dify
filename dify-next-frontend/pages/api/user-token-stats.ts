import type { NextApiRequest, NextApiResponse } from 'next';
import { difyDB, ensureDifyDBConnection } from '../../lib/dify-db';

// UUID 驗證函數
function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId, email } = req.query;

  if (!userId && !email) {
    return res.status(400).json({ error: 'Missing userId or email' });
  }

  let difyUserId = userId as string;

  try {
    await ensureDifyDBConnection();
    console.log('Connected to Dify DB');

    // 如果提供了 email，先查找對應的 Dify UUID
    if (email && !userId) {
      console.log('Looking up Dify user by email:', email);
      const userLookup = await difyDB.query('SELECT id FROM accounts WHERE email = $1', [email]);
      if (userLookup.rows.length === 0) {
        return res.status(404).json({
          error: 'User not found in Dify database',
          detail: `No Dify account found for email: ${email}`
        });
      }
      difyUserId = userLookup.rows[0].id;
      console.log('Found Dify user ID:', difyUserId);
    }

    // 如果提供了 userId，驗證格式（但不驗證 email 查詢的結果）
    if (userId && (typeof userId !== 'string' || !isValidUUID(userId))) {
      return res.status(400).json({
        error: 'Invalid userId format',
        detail: 'userId must be a valid UUID format (e.g., 6ffa67d4-246d-4ffa-84d2-c0c783c90625) or use email parameter instead',
        example: 'Use: /api/user-token-stats?email=user@example.com or ?userId=6ffa67d4-246d-4ffa-84d2-c0c783c90625'
      });
    }

    console.log('API called with resolved Dify userId:', difyUserId);

    // 執行查詢前先測試連接
    const testQuery = await difyDB.query('SELECT COUNT(*) as count FROM messages WHERE from_account_id = $1', [difyUserId]);
    console.log('Test query result - messages for user:', testQuery.rows[0].count);

    // 應用 ID
    const appId = '1a0425c8-4175-4ef5-b071-886f1a8c3e89';

    // 查詢所有用戶的 Dify 使用統計（因為 Wiki.js 用戶 ID 與 Dify 用戶 ID 需要映射）
    const query = `
    SELECT
      DATE(created_at) as date,
      SUM(COALESCE(message_tokens, 0) + COALESCE(answer_tokens, 0)) as total_tokens,
      SUM(COALESCE(total_price, 0)) as total_cost,
      COUNT(*) as message_count
    FROM messages
    WHERE (from_end_user_id::text = $1 OR from_account_id::text = $1)
      AND (message_tokens > 0 OR answer_tokens > 0)
    GROUP BY DATE(created_at)
    ORDER BY date DESC
    LIMIT 30
  `;

    console.log('Executing query with difyUserId:', difyUserId);
    const result = await difyDB.query(query, [difyUserId]);
    console.log('Query result rows:', result.rows.length);
    console.log('First few rows:', result.rows.slice(0, 2));

    // 格式化為原有的 API 格式
    const dailyUsage = result.rows.map((row: any) => ({
      date: row.date.toISOString().slice(0, 10),
      tokenUsage: parseInt(row.total_tokens) || 0,
      billing: parseFloat(row.total_cost) || 0,
      messages: parseInt(row.message_count) || 0,
      source: 'dify-native'
    }));

    console.log('Formatted dailyUsage:', dailyUsage.length, 'entries');

    return res.status(200).json({
      dailyUsage,
      source: 'dify-native',
      note: 'Data now comes from Dify native statistics'
    });

  } catch (error) {
    console.error('Error fetching Dify usage stats:', error);
    return res.status(500).json({
      error: 'Failed to fetch user usage',
      detail: String(error)
    });
  }
}
