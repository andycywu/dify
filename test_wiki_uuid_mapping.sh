#!/bin/bash
# 測試 Wiki.js 使用者 UUID 映射是否正常工作

echo "🧪 測試 Wiki.js 使用者 UUID 映射功能"

# 測試數據
APP_ID="1a0425c8-4175-4ef5-b071-886f1a8c3e89"  # 從資料庫中獲取的實際 app_id
API_URL="http://localhost/api/chat-messages"
API_KEY="app-6QPW2DLZXi8thozmF9JacogH"  # 實際的 API key

echo "📋 測試參數:"
echo "  App ID: $APP_ID"
echo "  API URL: $API_URL"
echo ""

# 測試 1: Wiki.js 使用者 ID = 2
echo "🚀 測試 1: Wiki.js 使用者 ID = 2"
response1=$(curl -s -X POST "$API_URL" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "inputs": {},
    "query": "Hello from Wiki user 2",
    "response_mode": "blocking",
    "conversation_id": "",
    "user": "2"
  }')

echo "回應: $response1"
echo ""

# 測試 2: Wiki.js 使用者 ID = 3  
echo "🚀 測試 2: Wiki.js 使用者 ID = 3"
response2=$(curl -s -X POST "$API_URL" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "inputs": {},
    "query": "Hello from Wiki user 3", 
    "response_mode": "blocking",
    "conversation_id": "",
    "user": "3"
  }')

echo "回應: $response2"
echo ""

# 測試 3: 重複測試 Wiki.js 使用者 ID = 2 (應該得到相同的 UUID)
echo "🚀 測試 3: 重複測試 Wiki.js 使用者 ID = 2"
response3=$(curl -s -X POST "$API_URL" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "inputs": {},
    "query": "Hello again from Wiki user 2",
    "response_mode": "blocking", 
    "conversation_id": "",
    "user": "2"
  }')

echo "回應: $response3"
echo ""

# 檢查資料庫中的新記錄
echo "📊 檢查資料庫中的新記錄:"
docker exec docker-db-1 psql -U postgres -d dify -c "
SELECT 
    id,
    session_id,
    created_at
FROM end_users 
WHERE session_id LIKE '%wiki_user_mapping%' OR session_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
ORDER BY created_at DESC 
LIMIT 5;
"

echo ""
echo "📋 最新的對話記錄:"
docker exec docker-db-1 psql -U postgres -d dify -c "
SELECT 
    c.name,
    c.from_source,
    e.session_id,
    c.created_at
FROM conversations c
JOIN end_users e ON c.from_end_user_id = e.id
WHERE c.from_source = 'api'
ORDER BY c.created_at DESC 
LIMIT 3;
"