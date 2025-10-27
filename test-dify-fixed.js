const { Client } = require('pg');

async function testAPI() {
  const client = new Client({
    connectionString: process.env.DIFY_DATABASE_URL || 'postgresql://postgres:difyai123456@db:5432/dify'
  });

  try {
    console.log('✅ Attempting connection to Dify database');
    await client.connect();
    console.log('✅ Connected to Dify database');
    
    const userId = '6ffa67d4-246d-4ffa-84d2-c0c783c90625';
    
    // 先測試簡單查詢
    const simpleQuery = 'SELECT COUNT(*) as count FROM messages WHERE from_account_id = $1';
    const simpleResult = await client.query(simpleQuery, [userId]);
    console.log('Simple query result:', simpleResult.rows[0].count, 'messages for user');
    
    // 再測試複雜查詢
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
      LIMIT 5
    `;
    
    console.log('🔍 Executing main query...');
    const result = await client.query(query, [userId]);
    console.log('📊 Results:', result.rows.length, 'rows');
    
    result.rows.forEach((row, i) => {
      console.log(`  ${i+1}. ${row.date.toISOString().slice(0, 10)} - Tokens: ${row.total_tokens}, Cost: ${row.total_cost}, Messages: ${row.message_count}`);
    });
    
    // 模擬 API 回應格式
    const dailyUsage = result.rows.map((row) => ({
      date: row.date.toISOString().slice(0, 10),
      tokenUsage: parseInt(row.total_tokens) || 0,
      billing: parseFloat(row.total_cost) || 0,
      messages: parseInt(row.message_count) || 0,
      source: 'dify-native'
    }));
    
    console.log('\n📋 API Response Format:');
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

testAPI();