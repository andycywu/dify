import type { NextApiRequest, NextApiResponse } from 'next';
import { Pool } from 'pg';

// PostgreSQL 連接設定 - 連接到 Dify 原生資料庫
const difyPool = new Pool({
  host: process.env.POSTGRES_HOST || 'db',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: 'dify',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'difyai123456',
});

// Wiki.js 資料庫連接（用於用戶映射）
const wikiPool = new Pool({
  host: process.env.POSTGRES_HOST || 'db',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: 'wiki',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'difyai123456',
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: 'Missing userId' });
  }

  try {
    const wikiUserId = parseInt(userId as string);

    if (isNaN(wikiUserId)) {
      return res.status(400).json({ error: 'Invalid userId format' });
    }

    console.log('查詢 Wiki.js 用戶 ID:', wikiUserId, '在 Dify 中的真實對話記錄');

    // 第一步：從 Wiki.js 獲取用戶的 email（用於顯示）
    const wikiUserQuery = 'SELECT email FROM users WHERE id = $1';
    const wikiUserResult = await wikiPool.query(wikiUserQuery, [wikiUserId]);

    if (wikiUserResult.rows.length === 0) {
      return res.status(404).json({ error: 'Wiki user not found' });
    }

    const userEmail = wikiUserResult.rows[0].email;
    console.log('Wiki.js 用戶 email:', userEmail);

    // 第二步：在 Dify 中查找對應的 end_users 記錄
    // 使用 session_id 映射：Wiki userId -> Dify session_id
    // 主要映射邏輯：session_id = Wiki userId（對於數字 session_id）
    const possibleSessionIds = [
      wikiUserId.toString(),  // 直接使用 userId
      `user_${wikiUserId}`,   // user_ 前綴
    ];

    // 特殊映射規則：如果需要 userId-1 的映射，可以加上
    // possibleSessionIds.push((wikiUserId - 1).toString());

    const endUserQuery = `
      SELECT id, external_user_id, session_id
      FROM end_users
      WHERE session_id = ANY($1)
    `;
    const endUserResult = await difyPool.query(endUserQuery, [possibleSessionIds]);

    console.log('在 Dify 中找到的 end_users:', endUserResult.rows.length, '條記錄');
    console.log('查詢的 session_ids:', possibleSessionIds);

    if (endUserResult.rows.length === 0) {
      // 如果沒有找到對應的 end_users，返回空數據
      const emptyUsage = [];
      for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        emptyUsage.push({
          date: date.toISOString().slice(0, 10),
          tokenUsage: 0,
          billing: 0,
          messages: 0,
          source: 'dify-db'
        });
      }

      return res.status(200).json({
        dailyUsage: emptyUsage,
        source: 'dify-db',
        note: 'No Dify end_users found for this Wiki user',
        userId: wikiUserId,
        userEmail: userEmail,
        possibleSessionIds: possibleSessionIds,
        queryMethod: 'dify-session-id-mapping'
      });
    }

    // 第三步：查詢這些 end_users 的對話記錄
    const endUserIds = endUserResult.rows.map(row => row.id);
    console.log('查詢的 end_user IDs:', endUserIds);

    // 查詢過去30天的消息記錄
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const messagesQuery = `
      SELECT
        DATE(m.created_at) as date,
        COUNT(*) as message_count,
        SUM(
          COALESCE(m.answer_tokens, 0) +
          COALESCE(m.message_tokens, 0)
        ) as total_tokens,
        SUM(
          COALESCE(m.total_price, 0)
        ) as total_cost
      FROM messages m
      WHERE m.from_end_user_id = ANY($1)
        AND m.created_at >= $2
        AND m.created_at IS NOT NULL
      GROUP BY DATE(m.created_at)
      ORDER BY date DESC
    `;

    console.log('執行 Dify 消息查詢:', messagesQuery);
    console.log('查詢參數:', [endUserIds, thirtyDaysAgo.toISOString()]);

    const messagesResult = await difyPool.query(messagesQuery, [endUserIds, thirtyDaysAgo]);

    console.log('Dify 查詢結果行數:', messagesResult.rows.length);
    console.log('前幾行數據:', messagesResult.rows.slice(0, 2));

    // 格式化數據
    const dailyUsage = messagesResult.rows.map((row: any) => ({
      date: row.date.toISOString().slice(0, 10),
      tokenUsage: parseInt(row.total_tokens) || 0,
      billing: parseFloat(row.total_cost) || 0,
      messages: parseInt(row.message_count) || 0,
      source: 'dify-db'
    }));

    // 補齊過去30天的資料（沒有使用記錄的日期設為0）
    const completeUsage = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().slice(0, 10);

      const existingData = dailyUsage.find(item => item.date === dateStr);
      completeUsage.push({
        date: dateStr,
        tokenUsage: existingData?.tokenUsage || 0,
        billing: existingData?.billing || 0,
        messages: existingData?.messages || 0,
        source: 'dify-db'
      });
    }

    console.log('格式化後的 dailyUsage:', completeUsage.length, '條記錄');

    return res.status(200).json({
      dailyUsage: completeUsage,
      source: 'dify-db',
      note: 'Data queried from Dify messages table using session_id mapping',
      userId: wikiUserId,
      userEmail: userEmail,
      endUserIds: endUserIds,
      sessionIds: endUserResult.rows.map(row => row.session_id),
      queryMethod: 'dify-session-id-mapping'
    });

  } catch (error) {
    console.error('查詢 Dify 使用量統計時發生錯誤:', error);
    return res.status(500).json({
      error: 'Failed to fetch user usage from Dify database',
      detail: String(error)
    });
  }
}
