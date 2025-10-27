import type { NextApiRequest, NextApiResponse } from 'next';
import { difyDB, ensureDifyDBConnection } from '../../lib/dify-db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId, startDate, endDate, source } = req.query;

  try {
    await ensureDifyDBConnection();

    // 如果指定了 userId，需要先找到對應的 Dify 用戶 ID
    let userFilter = '';
    const params: any[] = [];
    let paramIndex = 1;

    // 應用 ID 過濾
    const appId = '1a0425c8-4175-4ef5-b071-886f1a8c3e89'; // 您的應用 ID
    params.push(appId);
    userFilter += ` AND app_id = $${paramIndex++}`;

    // 用戶過濾 (如果提供)
    if (userId && typeof userId === 'string') {
      // 這裡您可能需要根據 Wiki.js 用戶 ID 找到對應的 Dify 用戶
      // 暫時跳過用戶過濾，返回所有用戶的統計
    }

    // 時間範圍過濾
    if (startDate && typeof startDate === 'string') {
      params.push(startDate);
      userFilter += ` AND created_at >= $${paramIndex++}`;
    }
    
    if (endDate && typeof endDate === 'string') {
      params.push(endDate + ' 23:59:59');
      userFilter += ` AND created_at <= $${paramIndex++}`;
    }

    // 來源過濾
    if (source && typeof source === 'string' && source !== 'all') {
      params.push(source);
      userFilter += ` AND from_source = $${paramIndex++}`;
    }

    const query = `
      SELECT 
        COALESCE(from_end_user_id::text, from_account_id::text, 'unknown') as user_id,
        from_source,
        created_at::date as date,
        COUNT(*) as messages,
        SUM(message_tokens + answer_tokens) as total_tokens,
        SUM(total_price) as total_cost,
        AVG(provider_response_latency) as avg_latency
      FROM messages 
      WHERE (message_tokens > 0 OR answer_tokens > 0)
        ${userFilter}
      GROUP BY user_id, from_source, date
      ORDER BY date DESC, total_tokens DESC
    `;

    const result = await difyDB.query(query, params);

    // 格式化數據
    const dailyUsage = result.rows.map((row: any) => ({
      userId: row.user_id,
      source: row.from_source,
      date: row.date.toISOString().slice(0, 10),
      messages: parseInt(row.messages),
      tokenUsage: parseInt(row.total_tokens) || 0,
      cost: parseFloat(row.total_cost) || 0,
      avgLatency: parseFloat(row.avg_latency) || 0
    }));

    // 如果請求特定用戶，則只返回該用戶的數據
    let filteredUsage = dailyUsage;
    if (userId && typeof userId === 'string') {
      // 由於 Wiki.js 用戶 ID 與 Dify 用戶 ID 的對應關係複雜，
      // 這裡先返回所有數據，您可以在前端進行過濾或建立映射表
      filteredUsage = dailyUsage; // 暫時返回所有數據
    }

    return res.status(200).json({ 
      dailyUsage: filteredUsage,
      totalUsers: new Set(dailyUsage.map(d => d.userId)).size,
      totalMessages: dailyUsage.reduce((sum, d) => sum + d.messages, 0),
      totalTokens: dailyUsage.reduce((sum, d) => sum + d.tokenUsage, 0),
      totalCost: dailyUsage.reduce((sum, d) => sum + d.cost, 0)
    });

  } catch (error) {
    console.error('Error fetching Dify usage stats:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch Dify usage stats', 
      detail: String(error) 
    });
  }
}