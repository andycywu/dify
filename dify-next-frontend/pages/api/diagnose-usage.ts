import { NextApiRequest, NextApiResponse } from 'next';
import { Pool } from 'pg';

// PostgreSQL 連接設定
const difyPool = new Pool({
  host: process.env.POSTGRES_HOST || 'db',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: 'dify',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'difyai123456',
});

const wikiPool = new Pool({
  host: process.env.POSTGRES_HOST || 'db',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: 'wiki',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'difyai123456',
});

interface DiagnosticResult {
  timestamp: string;
  checks: {
    name: string;
    status: 'success' | 'warning' | 'error';
    message: string;
    details?: any;
  }[];
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<DiagnosticResult | { error: string }>
) {
  const results: DiagnosticResult = {
    timestamp: new Date().toISOString(),
    checks: []
  };

  try {
    // 1. 檢查 Dify 資料庫連接
    try {
      await difyPool.query('SELECT 1');
      results.checks.push({
        name: 'Dify Database Connection',
        status: 'success',
        message: 'Successfully connected to Dify database'
      });
    } catch (error) {
      results.checks.push({
        name: 'Dify Database Connection',
        status: 'error',
        message: 'Failed to connect to Dify database',
        details: String(error)
      });
    }

    // 2. 檢查 Wiki.js 資料庫連接
    try {
      await wikiPool.query('SELECT 1');
      results.checks.push({
        name: 'Wiki.js Database Connection',
        status: 'success',
        message: 'Successfully connected to Wiki.js database'
      });
    } catch (error) {
      results.checks.push({
        name: 'Wiki.js Database Connection',
        status: 'error',
        message: 'Failed to connect to Wiki.js database',
        details: String(error)
      });
    }

    // 3. 檢查 messages 表
    try {
      const messageCountResult = await difyPool.query('SELECT COUNT(*) as count FROM messages');
      const messageCount = parseInt(messageCountResult.rows[0].count);

      if (messageCount === 0) {
        results.checks.push({
          name: 'Messages Table',
          status: 'warning',
          message: 'Messages table is empty - no conversation records found',
          details: { count: messageCount }
        });
      } else {
        results.checks.push({
          name: 'Messages Table',
          status: 'success',
          message: `Found ${messageCount} message records`,
          details: { count: messageCount }
        });
      }
    } catch (error) {
      results.checks.push({
        name: 'Messages Table',
        status: 'error',
        message: 'Failed to query messages table',
        details: String(error)
      });
    }

    // 4. 檢查 end_users 表
    try {
      const endUserCountResult = await difyPool.query('SELECT COUNT(*) as count FROM end_users');
      const endUserCount = parseInt(endUserCountResult.rows[0].count);

      if (endUserCount === 0) {
        results.checks.push({
          name: 'End Users Table',
          status: 'warning',
          message: 'end_users table is empty',
          details: { count: endUserCount }
        });
      } else {
        results.checks.push({
          name: 'End Users Table',
          status: 'success',
          message: `Found ${endUserCount} end user records`,
          details: { count: endUserCount }
        });
      }
    } catch (error) {
      results.checks.push({
        name: 'End Users Table',
        status: 'error',
        message: 'Failed to query end_users table',
        details: String(error)
      });
    }

    // 5. 檢查 Wiki.js 用戶
    try {
      const wikiUserCountResult = await wikiPool.query('SELECT COUNT(*) as count FROM users');
      const wikiUserCount = parseInt(wikiUserCountResult.rows[0].count);

      results.checks.push({
        name: 'Wiki.js Users',
        status: 'success',
        message: `Found ${wikiUserCount} Wiki.js users`,
        details: { count: wikiUserCount }
      });
    } catch (error) {
      results.checks.push({
        name: 'Wiki.js Users',
        status: 'error',
        message: 'Failed to query Wiki.js users',
        details: String(error)
      });
    }

    // 6. 檢查用戶映射（前 5 個用戶）
    try {
      const wikiUsers = await wikiPool.query('SELECT id, email, name FROM users LIMIT 5');
      const mappingResults = [];

      for (const user of wikiUsers.rows) {
        const endUserMatch = await difyPool.query(
          `SELECT COUNT(*) as count FROM end_users
           WHERE external_user_id LIKE $1 OR session_id LIKE $2`,
          [`%${user.email}%`, `%${user.email}%`]
        );

        mappingResults.push({
          wikiUserId: user.id,
          email: user.email,
          name: user.name,
          difyMatches: parseInt(endUserMatch.rows[0].count)
        });
      }

      const unmappedCount = mappingResults.filter(r => r.difyMatches === 0).length;

      if (unmappedCount > 0) {
        results.checks.push({
          name: 'User Mapping',
          status: 'warning',
          message: `${unmappedCount} out of ${mappingResults.length} sampled users have no Dify end_user mapping`,
          details: mappingResults
        });
      } else {
        results.checks.push({
          name: 'User Mapping',
          status: 'success',
          message: 'All sampled users have Dify end_user mappings',
          details: mappingResults
        });
      }
    } catch (error) {
      results.checks.push({
        name: 'User Mapping',
        status: 'error',
        message: 'Failed to check user mapping',
        details: String(error)
      });
    }

    // 7. 檢查最近 7 天的使用統計
    try {
      const recentStats = await difyPool.query(`
        SELECT
          DATE(created_at) as date,
          COUNT(*) as message_count,
          COUNT(DISTINCT from_end_user_id) as unique_users,
          SUM(COALESCE(message_tokens, 0) + COALESCE(answer_tokens, 0)) as total_tokens,
          SUM(COALESCE(total_price, 0)) as total_cost
        FROM messages
        WHERE created_at >= NOW() - INTERVAL '7 days'
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `);

      if (recentStats.rows.length === 0) {
        results.checks.push({
          name: 'Recent Usage (7 days)',
          status: 'warning',
          message: 'No messages found in the last 7 days',
          details: []
        });
      } else {
        results.checks.push({
          name: 'Recent Usage (7 days)',
          status: 'success',
          message: `Found activity on ${recentStats.rows.length} days in the last 7 days`,
          details: recentStats.rows
        });
      }
    } catch (error) {
      results.checks.push({
        name: 'Recent Usage (7 days)',
        status: 'error',
        message: 'Failed to query recent usage statistics',
        details: String(error)
      });
    }

    // 8. 測試 messages 表結構
    try {
      const columnsResult = await difyPool.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'messages'
        AND column_name IN ('from_end_user_id', 'message_tokens', 'answer_tokens', 'total_price', 'created_at')
        ORDER BY column_name
      `);

      const requiredColumns = ['from_end_user_id', 'message_tokens', 'answer_tokens', 'total_price', 'created_at'];
      const existingColumns = columnsResult.rows.map(r => r.column_name);
      const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));

      if (missingColumns.length > 0) {
        results.checks.push({
          name: 'Messages Table Schema',
          status: 'error',
          message: `Missing required columns: ${missingColumns.join(', ')}`,
          details: { existing: existingColumns, missing: missingColumns }
        });
      } else {
        results.checks.push({
          name: 'Messages Table Schema',
          status: 'success',
          message: 'All required columns present in messages table',
          details: columnsResult.rows
        });
      }
    } catch (error) {
      results.checks.push({
        name: 'Messages Table Schema',
        status: 'error',
        message: 'Failed to check messages table schema',
        details: String(error)
      });
    }

    res.status(200).json(results);

  } catch (error) {
    console.error('Diagnostic error:', error);
    res.status(500).json({
      error: 'Failed to run diagnostics',
    });
  }
}
