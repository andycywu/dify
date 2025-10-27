const express = require('express');
const { Client } = require('pg');

const app = express();
const port = 3000;

// Dify 資料庫連接
const difyClient = new Client({
  connectionString: process.env.DIFY_DATABASE_URL || 'postgresql://postgres:difyai123456@db:5432/dify'
});

// 連接到資料庫
async function connectToDify() {
  try {
    await difyClient.connect();
    console.log('✅ Connected to Dify database');
  } catch (error) {
    console.error('❌ Failed to connect to Dify database:', error);
  }
}

// 路由處理
app.get('/api/user-token-stats', async (req, res) => {
  const { userId } = req.query;
  
  console.log('API called with userId:', userId);
  
  if (!userId) {
    return res.status(400).json({ error: 'Missing userId' });
  }
  
  try {
    // 檢查連接
    await difyClient.query('SELECT 1');
    console.log('Database connection verified');
    
    // 執行查詢
    const query = `
      SELECT 
        DATE(created_at) as date,
        SUM(COALESCE(message_tokens, 0) + COALESCE(answer_tokens, 0)) as total_tokens,
        SUM(COALESCE(total_price, 0)) as total_cost,
        COUNT(*) as message_count
      FROM messages 
      WHERE from_account_id = $1
        AND (message_tokens > 0 OR answer_tokens > 0)
      GROUP BY DATE(created_at)
      ORDER BY date DESC
      LIMIT 30
    `;
    
    console.log('Executing query with userId:', userId);
    const result = await difyClient.query(query, [userId]);
    console.log('Query result rows:', result.rows.length);
    
    // 格式化為原有的 API 格式
    const dailyUsage = result.rows.map((row) => ({
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
});

// 健康檢查
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 啟動伺服器
async function startServer() {
  await connectToDify();
  
  app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 Dify API server running on port ${port}`);
  });
}

startServer();