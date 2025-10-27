const { Client } = require('pg');

async function testDifyAPI() {
  const client = new Client({
    connectionString: 'postgresql://postgres:difyai123456@localhost:5432/dify'  // 直接連接本地端口
  });

  try {
    console.log('🔗 Attempting to connect to Dify database...');
    await client.connect();
    console.log('✅ Connected to Dify database');
    
    const userId = '6ffa67d4-246d-4ffa-84d2-c0c783c90625';
    
    // 執行與 API 相同的查詢
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
      LIMIT 10
    `;
    
    console.log('🔍 Executing query for userId:', userId);
    const result = await client.query(query, [userId]);
    console.log('📊 Query returned', result.rows.length, 'rows');
    
    // 格式化為 API 格式
    const dailyUsage = result.rows.map((row) => ({
      date: row.date.toISOString().slice(0, 10),
      tokenUsage: parseInt(row.total_tokens) || 0,
      billing: parseFloat(row.total_cost) || 0,
      messages: parseInt(row.message_count) || 0,
      source: 'dify-native'
    }));
    
    console.log('📋 Formatted API response:');
    console.log(JSON.stringify({ 
      dailyUsage,
      source: 'dify-native',
      note: 'Data now comes from Dify native statistics'
    }, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

testDifyAPI();