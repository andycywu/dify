#!/bin/bash

# 使用統計 API 診斷腳本
# 用於檢查 usage statistics 頁面的 API 連接和資料狀況

echo "======================================"
echo "使用統計 API 診斷工具"
echo "======================================"
echo ""

# 設定顏色
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 從 .env.docker 讀取配置
if [ -f "dify-next-frontend/.env.docker" ]; then
    source dify-next-frontend/.env.docker
    echo -e "${GREEN}✓ 已載入 .env.docker 配置${NC}"
else
    echo -e "${RED}✗ 找不到 .env.docker 檔案${NC}"
    exit 1
fi

# 設定資料庫連接參數
DB_HOST=${POSTGRES_HOST:-db}
DB_PORT=${POSTGRES_PORT:-5432}
DB_USER=${POSTGRES_USER:-postgres}
DB_PASS=${POSTGRES_PASSWORD:-difyai123456}

echo ""
echo "======================================"
echo "1. 檢查資料庫連接"
echo "======================================"

# 檢查 Dify 資料庫
echo "檢查 Dify 資料庫連接 ($DB_HOST:$DB_PORT)..."
if PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d dify -c "SELECT 1;" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Dify 資料庫連接成功${NC}"
else
    echo -e "${RED}✗ Dify 資料庫連接失敗${NC}"
    echo "請檢查資料庫服務是否運行中"
    exit 1
fi

# 檢查 Wiki.js 資料庫
echo "檢查 Wiki.js 資料庫連接..."
if PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d wiki -c "SELECT 1;" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Wiki.js 資料庫連接成功${NC}"
else
    echo -e "${RED}✗ Wiki.js 資料庫連接失敗${NC}"
    exit 1
fi

echo ""
echo "======================================"
echo "2. 檢查 Dify 資料表結構"
echo "======================================"

# 檢查 messages 表
echo "檢查 messages 表是否存在..."
if PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d dify -c "\dt messages" | grep -q "messages"; then
    echo -e "${GREEN}✓ messages 表存在${NC}"

    # 檢查重要欄位
    echo "檢查 messages 表欄位..."
    PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d dify -t -c "
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'messages'
        AND column_name IN ('from_end_user_id', 'message_tokens', 'answer_tokens', 'total_price', 'created_at')
        ORDER BY column_name;
    "

    # 檢查資料數量
    MESSAGE_COUNT=$(PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d dify -t -c "SELECT COUNT(*) FROM messages;")
    echo "messages 表記錄數: $MESSAGE_COUNT"

    if [ "$MESSAGE_COUNT" -eq 0 ]; then
        echo -e "${YELLOW}⚠ messages 表是空的，沒有任何對話記錄${NC}"
    fi
else
    echo -e "${RED}✗ messages 表不存在${NC}"
    exit 1
fi

# 檢查 end_users 表
echo ""
echo "檢查 end_users 表是否存在..."
if PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d dify -c "\dt end_users" | grep -q "end_users"; then
    echo -e "${GREEN}✓ end_users 表存在${NC}"

    END_USER_COUNT=$(PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d dify -t -c "SELECT COUNT(*) FROM end_users;")
    echo "end_users 表記錄數: $END_USER_COUNT"

    if [ "$END_USER_COUNT" -eq 0 ]; then
        echo -e "${YELLOW}⚠ end_users 表是空的${NC}"
    fi
else
    echo -e "${RED}✗ end_users 表不存在${NC}"
fi

echo ""
echo "======================================"
echo "3. 檢查 Wiki.js 用戶與 Dify 的映射"
echo "======================================"

# 獲取一些 Wiki.js 用戶
echo "從 Wiki.js 獲取前 5 個用戶..."
PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d wiki -c "
    SELECT id, email, name
    FROM users
    LIMIT 5;
"

# 檢查這些用戶在 Dify 中的對應記錄
echo ""
echo "檢查這些用戶在 Dify end_users 中的映射..."
WIKI_EMAILS=$(PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d wiki -t -c "SELECT email FROM users LIMIT 5;")

for EMAIL in $WIKI_EMAILS; do
    EMAIL=$(echo $EMAIL | xargs) # trim whitespace
    echo "檢查 email: $EMAIL"

    DIFY_MATCH=$(PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d dify -t -c "
        SELECT COUNT(*)
        FROM end_users
        WHERE external_user_id LIKE '%$EMAIL%' OR session_id LIKE '%$EMAIL%';
    ")

    if [ "$DIFY_MATCH" -gt 0 ]; then
        echo -e "${GREEN}  ✓ 找到 $DIFY_MATCH 條對應記錄${NC}"
    else
        echo -e "${YELLOW}  ⚠ 未找到對應記錄${NC}"
    fi
done

echo ""
echo "======================================"
echo "4. 測試 API 端點"
echo "======================================"

# 獲取測試用戶 ID
TEST_USER_ID=$(PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d wiki -t -c "SELECT id FROM users LIMIT 1;" | xargs)

if [ -z "$TEST_USER_ID" ]; then
    echo -e "${RED}✗ 找不到測試用戶${NC}"
else
    echo "使用測試用戶 ID: $TEST_USER_ID"

    # 測試 user-token-stats API
    echo ""
    echo "測試 /api/user-token-stats API..."
    API_URL="http://localhost:3001/api/user-token-stats?userId=$TEST_USER_ID"
    echo "請求 URL: $API_URL"

    curl -s -o /tmp/api_response.json -w "%{http_code}" "$API_URL" > /tmp/http_code.txt
    HTTP_CODE=$(cat /tmp/http_code.txt)

    if [ "$HTTP_CODE" = "200" ]; then
        echo -e "${GREEN}✓ API 返回成功 (HTTP $HTTP_CODE)${NC}"
        echo "API 響應內容:"
        cat /tmp/api_response.json | jq '.' 2>/dev/null || cat /tmp/api_response.json
    else
        echo -e "${RED}✗ API 返回錯誤 (HTTP $HTTP_CODE)${NC}"
        echo "錯誤內容:"
        cat /tmp/api_response.json
    fi
fi

echo ""
echo "======================================"
echo "5. 最近 7 天的使用記錄統計"
echo "======================================"

echo "查詢最近 7 天的 messages 統計..."
PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d dify -c "
    SELECT
        DATE(created_at) as date,
        COUNT(*) as message_count,
        COUNT(DISTINCT from_end_user_id) as unique_users,
        SUM(COALESCE(message_tokens, 0) + COALESCE(answer_tokens, 0)) as total_tokens,
        SUM(COALESCE(total_price, 0)) as total_cost
    FROM messages
    WHERE created_at >= NOW() - INTERVAL '7 days'
    GROUP BY DATE(created_at)
    ORDER BY date DESC;
"

echo ""
echo "======================================"
echo "診斷完成"
echo "======================================"
echo ""
echo "建議後續行動："
echo "1. 檢查上述輸出中的任何 ✗ 或 ⚠ 標記"
echo "2. 確認 Wiki.js 用戶的 email 與 Dify end_users 的映射關係"
echo "3. 如果 messages 表為空，請先使用聊天功能產生一些對話記錄"
echo "4. 如果 API 返回錯誤，請檢查 dify-next-frontend 的日誌"
echo ""
