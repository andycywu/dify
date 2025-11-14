import { NextApiRequest, NextApiResponse } from 'next';
import { Pool } from 'pg';

// PostgreSQL 連接設定 - 連接到 Dify 原生資料庫
const difyPool = new Pool({
  host: process.env.POSTGRES_HOST || 'db',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: 'dify',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'difyai123456',
});

interface AppStatsResponse {
  totalMessages: number;
  totalTokens: number;
  totalCost: number;
  uniqueUsers: number;
  avgMessagesPerUser: number;
  avgTokensPerMessage: number;
  avgCostPerMessage: number;
  totalConversations: number;
  avgMessagesPerConversation: number;
  activeUsersLast7Days: number;
  activeUsersLast30Days: number;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AppStatsResponse | { error: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('App stats API called');

    // 如果數據庫連接失敗，返回零統計數據而不是錯誤
    let dbConnected = false;
    try {
      await difyPool.query('SELECT 1');
      console.log('Database connection successful');
      dbConnected = true;
    } catch (dbError) {
      console.error('Database connection failed:', dbError);
      console.log('Returning zero stats due to database connection failure');
      return res.status(200).json({
        totalMessages: 0,
        totalTokens: 0,
        totalCost: 0,
        uniqueUsers: 0,
        avgMessagesPerUser: 0,
        avgTokensPerMessage: 0,
        avgCostPerMessage: 0,
        totalConversations: 0,
        avgMessagesPerConversation: 0,
        activeUsersLast7Days: 0,
        activeUsersLast30Days: 0
      });
    }

    // 首先檢查 messages 表是否存在
    const tableCheckQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'messages'
      );
    `;

    const tableExists = await difyPool.query(tableCheckQuery);
    console.log('Messages table exists:', tableExists.rows[0].exists);

    if (!tableExists.rows[0].exists) {
      console.log('Messages table does not exist, returning zero stats');
      return res.status(200).json({
        totalMessages: 0,
        totalTokens: 0,
        totalCost: 0,
        uniqueUsers: 0,
        avgMessagesPerUser: 0,
        avgTokensPerMessage: 0,
        avgCostPerMessage: 0,
        totalConversations: 0,
        avgMessagesPerConversation: 0,
        activeUsersLast7Days: 0,
        activeUsersLast30Days: 0
      });
    }

    // 查詢應用級統計數據 - 最近 365 天（一年）
    const query = `
      WITH stats_365d AS (
        SELECT
          COUNT(*) as total_messages,
          COALESCE(SUM(message_tokens + answer_tokens), 0) as total_tokens,
          COALESCE(SUM(total_price), 0) as total_cost,
          COUNT(DISTINCT from_end_user_id) as unique_users,
          COUNT(DISTINCT conversation_id) as total_conversations
        FROM messages
        WHERE created_at >= NOW() - INTERVAL '365 days'
      ),
      stats_7d AS (
        SELECT COUNT(DISTINCT from_end_user_id) as active_users_7d
        FROM messages
        WHERE created_at >= NOW() - INTERVAL '7 days'
      ),
      stats_30d AS (
        SELECT COUNT(DISTINCT from_end_user_id) as active_users_30d
        FROM messages
        WHERE created_at >= NOW() - INTERVAL '30 days'
      )
      SELECT
        s365.total_messages,
        s365.total_tokens,
        s365.total_cost,
        s365.unique_users,
        s365.total_conversations,
        s7.active_users_7d,
        s30.active_users_30d,
        CASE
          WHEN s365.unique_users > 0
          THEN ROUND(s365.total_messages::numeric / s365.unique_users::numeric, 2)
          ELSE 0
        END as avg_messages_per_user,
        CASE
          WHEN s365.total_messages > 0
          THEN ROUND(s365.total_tokens::numeric / s365.total_messages::numeric, 2)
          ELSE 0
        END as avg_tokens_per_message,
        CASE
          WHEN s365.total_messages > 0
          THEN ROUND(s365.total_cost::numeric / s365.total_messages::numeric, 7)
          ELSE 0
        END as avg_cost_per_message,
        CASE
          WHEN s365.total_conversations > 0
          THEN ROUND(s365.total_messages::numeric / s365.total_conversations::numeric, 2)
          ELSE 0
        END as avg_messages_per_conversation
      FROM stats_365d s365
      CROSS JOIN stats_7d s7
      CROSS JOIN stats_30d s30
    `;

    console.log('Executing query:', query);
    const result = await difyPool.query(query);

    if (!result.rows || result.rows.length === 0) {
      return res.status(200).json({
        totalMessages: 0,
        totalTokens: 0,
        totalCost: 0,
        uniqueUsers: 0,
        avgMessagesPerUser: 0,
        avgTokensPerMessage: 0,
        avgCostPerMessage: 0,
        totalConversations: 0,
        avgMessagesPerConversation: 0,
        activeUsersLast7Days: 0,
        activeUsersLast30Days: 0
      });
    }

    const stats = result.rows[0];

    const response: AppStatsResponse = {
      totalMessages: parseInt(stats.total_messages) || 0,
      totalTokens: parseInt(stats.total_tokens) || 0,
      totalCost: parseFloat(stats.total_cost) || 0,
      uniqueUsers: parseInt(stats.unique_users) || 0,
      avgMessagesPerUser: parseFloat(stats.avg_messages_per_user) || 0,
      avgTokensPerMessage: parseFloat(stats.avg_tokens_per_message) || 0,
      avgCostPerMessage: parseFloat(stats.avg_cost_per_message) || 0,
      totalConversations: parseInt(stats.total_conversations) || 0,
      avgMessagesPerConversation: parseFloat(stats.avg_messages_per_conversation) || 0,
      activeUsersLast7Days: parseInt(stats.active_users_7d) || 0,
      activeUsersLast30Days: parseInt(stats.active_users_30d) || 0
    };    console.log('App stats fetched successfully:', response);

    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching app stats:', error);
    res.status(500).json({
      error: 'Internal server error while fetching app statistics'
    });
  }
}
