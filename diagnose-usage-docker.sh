#!/bin/bash

# 使用統計 API 診斷腳本 - Docker 版本
# 此腳本透過 Docker 容器直接查詢資料庫

echo "======================================"
echo "使用統計 API 診斷工具 (Docker 版)"
echo "======================================"
echo ""

# 設定顏色
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 檢查 Docker 是否運行
if ! docker ps > /dev/null 2>&1; then
    echo -e "${RED}✗ Docker 未運行或權限不足${NC}"
    exit 1
fi

echo "======================================"
echo "1. 檢查 Docker 容器狀態"
echo "======================================"

# 自動檢測 PostgreSQL 容器名稱
DB_CONTAINER=$(docker ps --format '{{.Names}}' | grep -E '(^db$|db-1$|docker-db-1$|postgres)' | head -1)

if [ -z "$DB_CONTAINER" ]; then
    echo -e "${RED}✗ PostgreSQL 容器未運行${NC}"
    echo "請先啟動容器: docker-compose up -d"
    echo ""
    echo "可用的容器:"
    docker ps --format '{{.Names}}'
    exit 1
else
    echo -e "${GREEN}✓ PostgreSQL 容器正在運行: $DB_CONTAINER${NC}"
fi

# 檢查 dify-next-frontend 容器
if docker ps --format '{{.Names}}' | grep -q 'dify-next-frontend'; then
    echo -e "${GREEN}✓ Frontend 容器正在運行${NC}"
else
    echo -e "${YELLOW}⚠ Frontend 容器未運行${NC}"
fi

echo ""
echo "======================================"
echo "2. 檢查資料庫連接"
echo "======================================"

# 測試 Dify 資料庫
echo "檢查 Dify 資料庫..."
if docker exec $DB_CONTAINER psql -U postgres -d dify -c "SELECT 1;" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Dify 資料庫連接成功${NC}"
else
    echo -e "${RED}✗ Dify 資料庫連接失敗${NC}"
    exit 1
fi

# 測試 Wiki.js 資料庫
echo "檢查 Wiki.js 資料庫..."
if docker exec $DB_CONTAINER psql -U postgres -d wiki -c "SELECT 1;" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Wiki.js 資料庫連接成功${NC}"
else
    echo -e "${RED}✗ Wiki.js 資料庫連接失敗${NC}"
    exit 1
fi

echo ""
echo "======================================"
echo "3. 檢查 Dify 資料表"
echo "======================================"

# 檢查 messages 表
echo "檢查 messages 表..."
MESSAGE_COUNT=$(docker exec $DB_CONTAINER psql -U postgres -d dify -t -c "SELECT COUNT(*) FROM messages;" 2>/dev/null | xargs)

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ messages 表存在${NC}"
    echo "  記錄數: $MESSAGE_COUNT"

    if [ "$MESSAGE_COUNT" -eq 0 ]; then
        echo -e "${YELLOW}  ⚠ 表是空的 - 請先使用聊天功能產生對話記錄${NC}"
    fi
else
    echo -e "${RED}✗ messages 表不存在或查詢失敗${NC}"
fi

# 檢查 end_users 表
echo "檢查 end_users 表..."
ENDUSER_COUNT=$(docker exec $DB_CONTAINER psql -U postgres -d dify -t -c "SELECT COUNT(*) FROM end_users;" 2>/dev/null | xargs)

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ end_users 表存在${NC}"
    echo "  記錄數: $ENDUSER_COUNT"

    if [ "$ENDUSER_COUNT" -eq 0 ]; then
        echo -e "${YELLOW}  ⚠ 表是空的${NC}"
    fi
else
    echo -e "${RED}✗ end_users 表不存在或查詢失敗${NC}"
fi

echo ""
echo "======================================"
echo "4. 檢查 Wiki.js 用戶"
echo "======================================"

WIKI_USER_COUNT=$(docker exec $DB_CONTAINER psql -U postgres -d wiki -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null | xargs)

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Wiki.js users 表存在${NC}"
    echo "  用戶數: $WIKI_USER_COUNT"
else
    echo -e "${RED}✗ Wiki.js users 表查詢失敗${NC}"
fi

echo ""
echo "======================================"
echo "5. 檢查用戶映射"
echo "======================================"

echo "查詢前 3 個 Wiki.js 用戶的 Dify 映射..."
docker exec $DB_CONTAINER psql -U postgres -d wiki -t -c "
    SELECT id, email, name FROM users LIMIT 3;
" | while read -r line; do
    if [ ! -z "$line" ]; then
        USER_ID=$(echo $line | awk '{print $1}')
        EMAIL=$(echo $line | awk '{print $3}')

        if [ ! -z "$EMAIL" ]; then
            MATCH_COUNT=$(docker exec $DB_CONTAINER psql -U postgres -d dify -t -c "
                SELECT COUNT(*) FROM end_users
                WHERE external_user_id LIKE '%$EMAIL%' OR session_id LIKE '%$EMAIL%';
            " 2>/dev/null | xargs)

            if [ "$MATCH_COUNT" -gt 0 ]; then
                echo -e "${GREEN}  ✓ $EMAIL: $MATCH_COUNT 條對應記錄${NC}"
            else
                echo -e "${YELLOW}  ⚠ $EMAIL: 無對應記錄${NC}"
            fi
        fi
    fi
done

echo ""
echo "======================================"
echo "6. 最近 7 天使用統計"
echo "======================================"

echo "查詢最近 7 天的對話記錄..."
docker exec $DB_CONTAINER psql -U postgres -d dify -c "
    SELECT
        DATE(created_at) as date,
        COUNT(*) as messages,
        COUNT(DISTINCT from_end_user_id) as users,
        SUM(COALESCE(message_tokens, 0) + COALESCE(answer_tokens, 0)) as tokens,
        ROUND(SUM(COALESCE(total_price, 0))::numeric, 4) as cost
    FROM messages
    WHERE created_at >= NOW() - INTERVAL '7 days'
    GROUP BY DATE(created_at)
    ORDER BY date DESC;
" 2>/dev/null

if [ $? -ne 0 ]; then
    echo -e "${YELLOW}⚠ 查詢失敗或無數據${NC}"
fi

echo ""
echo "======================================"
echo "7. 測試 API 端點"
echo "======================================"

# 獲取第一個用戶 ID
TEST_USER_ID=$(docker exec $DB_CONTAINER psql -U postgres -d wiki -t -c "SELECT id FROM users LIMIT 1;" 2>/dev/null | xargs)

if [ ! -z "$TEST_USER_ID" ]; then
    echo "測試用戶 ID: $TEST_USER_ID"
    echo "測試 API: http://localhost:3001/api/user-token-stats?userId=$TEST_USER_ID"
    echo ""

    # 測試 API
    HTTP_CODE=$(curl -s -o /tmp/api_test.json -w "%{http_code}" "http://localhost:3001/api/user-token-stats?userId=$TEST_USER_ID")

    if [ "$HTTP_CODE" = "200" ]; then
        echo -e "${GREEN}✓ API 返回成功 (HTTP $HTTP_CODE)${NC}"
        echo "響應預覽:"
        cat /tmp/api_test.json | jq -r '.dailyUsage[0:3] | .[]? | "\(.date): \(.messages) messages, \(.tokenUsage) tokens, $\(.billing)"' 2>/dev/null || cat /tmp/api_test.json | head -20
    else
        echo -e "${RED}✗ API 返回錯誤 (HTTP $HTTP_CODE)${NC}"
        echo "錯誤內容:"
        cat /tmp/api_test.json
    fi
else
    echo -e "${YELLOW}⚠ 找不到測試用戶${NC}"
fi

echo ""
echo "======================================"
echo "診斷完成"
echo "======================================"
echo ""
echo -e "${BLUE}📋 快速檢查清單:${NC}"
echo "  1. ✓ Docker 容器運行正常"
echo "  2. ✓ 資料庫連接正常"
echo "  3. ? 檢查上述輸出中的 ⚠ 警告"
echo "  4. ? 如有問題，請查看建議"
echo ""
echo -e "${BLUE}💡 常見問題修復:${NC}"
echo "  • 如果 messages 表為空 → 請先使用聊天功能"
echo "  • 如果用戶無映射 → 確認用戶已登入並使用過聊天"
echo "  • 如果 API 錯誤 → 查看容器日誌: docker logs dify-next-frontend"
echo ""
