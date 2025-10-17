#!/bin/bash
# Wiki.js 認證整合 - 測試腳本
# 驗證整合是否成功

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Wiki.js 認證整合 - 測試腳本                          ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

PASS_COUNT=0
FAIL_COUNT=0

# 測試函數
test_pass() {
    PASS_COUNT=$((PASS_COUNT + 1))
    echo -e "${GREEN}✓ PASS${NC}: $1"
}

test_fail() {
    FAIL_COUNT=$((FAIL_COUNT + 1))
    echo -e "${RED}✗ FAIL${NC}: $1"
}

# 測試 1: PostgreSQL 連接
echo -e "${YELLOW}[測試 1] PostgreSQL 數據庫連接${NC}"
if docker exec -i docker-db-1 psql -U postgres -d wiki -c "SELECT version();" > /dev/null 2>&1; then
    test_pass "PostgreSQL 連接成功"
else
    test_fail "PostgreSQL 連接失敗"
fi

# 測試 2: Wiki.js users 表
echo -e "${YELLOW}[測試 2] Wiki.js users 表存在${NC}"
if docker exec -i docker-db-1 psql -U postgres -d wiki -c "SELECT COUNT(*) FROM users;" > /dev/null 2>&1; then
    USER_COUNT=$(docker exec -i docker-db-1 psql -U postgres -d wiki -t -c "SELECT COUNT(*) FROM users WHERE \"isSystem\" = false;" | xargs)
    test_pass "users 表存在 (非系統用戶數: ${USER_COUNT})"
else
    test_fail "users 表不存在或無法訪問"
fi

# 測試 3: dify 專屬表
echo -e "${YELLOW}[測試 3] dify-next-frontend 專屬表${NC}"
if docker exec -i docker-db-1 psql -U postgres -d wiki -c "SELECT COUNT(*) FROM dify_user_usage;" > /dev/null 2>&1; then
    test_pass "dify_user_usage 表存在"
else
    test_fail "dify_user_usage 表不存在"
fi

if docker exec -i docker-db-1 psql -U postgres -d wiki -c "SELECT COUNT(*) FROM dify_general;" > /dev/null 2>&1; then
    test_pass "dify_general 表存在"
else
    test_fail "dify_general 表不存在"
fi

# 測試 4: Wiki.js 容器運行
echo -e "${YELLOW}[測試 4] Wiki.js 容器狀態${NC}"
if docker ps | grep -q "dify-wiki.*Up"; then
    test_pass "Wiki.js 容器運行中"
else
    test_fail "Wiki.js 容器未運行"
fi

# 測試 5: dify-next-frontend 容器運行
echo -e "${YELLOW}[測試 5] dify-next-frontend 容器狀態${NC}"
if docker ps | grep -q "dify-next-frontend.*Up"; then
    test_pass "dify-next-frontend 容器運行中"
else
    test_fail "dify-next-frontend 容器未運行"
fi

# 測試 6: Wiki.js HTTP 響應
echo -e "${YELLOW}[測試 6] Wiki.js HTTP 服務${NC}"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null || echo "000")
if [ "$HTTP_CODE" -eq 200 ] || [ "$HTTP_CODE" -eq 302 ]; then
    test_pass "Wiki.js HTTP 服務正常 (HTTP ${HTTP_CODE})"
else
    test_fail "Wiki.js HTTP 服務異常 (HTTP ${HTTP_CODE})"
fi

# 測試 7: dify-next-frontend HTTP 響應
echo -e "${YELLOW}[測試 7] dify-next-frontend HTTP 服務${NC}"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001 2>/dev/null || echo "000")
if [ "$HTTP_CODE" -eq 200 ] || [ "$HTTP_CODE" -eq 302 ]; then
    test_pass "dify-next-frontend HTTP 服務正常 (HTTP ${HTTP_CODE})"
else
    test_fail "dify-next-frontend HTTP 服務異常 (HTTP ${HTTP_CODE})"
fi

# 測試 8: Prisma schema 文件
echo -e "${YELLOW}[測試 8] Prisma 配置文件${NC}"
if [ -f "/Users/andycyw/dify/dify-next-frontend/prisma/schema.prisma" ]; then
    if grep -q "postgresql" /Users/andycyw/dify/dify-next-frontend/prisma/schema.prisma; then
        test_pass "Prisma schema 使用 PostgreSQL"
    else
        test_fail "Prisma schema 未使用 PostgreSQL"
    fi
else
    test_fail "Prisma schema 文件不存在"
fi

# 測試 9: 環境變數配置
echo -e "${YELLOW}[測試 9] 環境變數配置${NC}"
if [ -f "/Users/andycyw/dify/dify-next-frontend/.env" ]; then
    if grep -q "postgresql.*wiki" /Users/andycyw/dify/dify-next-frontend/.env; then
        test_pass ".env 配置正確 (DATABASE_URL 指向 wiki)"
    else
        test_fail ".env DATABASE_URL 未指向 wiki 數據庫"
    fi
else
    test_fail ".env 文件不存在"
fi

# 測試 10: Wiki.js 認證模組
echo -e "${YELLOW}[測試 10] Wiki.js 認證整合模組${NC}"
if [ -f "/Users/andycyw/dify/wiki/config/auth-integration.js" ]; then
    test_pass "認證整合模組文件存在"
else
    test_fail "認證整合模組文件不存在"
fi

# 測試 11: NextAuth 適配器
echo -e "${YELLOW}[測試 11] NextAuth Wiki.js 適配器${NC}"
if [ -f "/Users/andycyw/dify/dify-next-frontend/lib/wiki-auth-adapter.ts" ]; then
    test_pass "Wiki.js 適配器文件存在"
else
    test_fail "Wiki.js 適配器文件不存在"
fi

# 測試 12: 用戶組表
echo -e "${YELLOW}[測試 12] 用戶組關聯表${NC}"
if docker exec -i docker-db-1 psql -U postgres -d wiki -c "SELECT COUNT(*) FROM \"userGroups\";" > /dev/null 2>&1; then
    GROUP_COUNT=$(docker exec -i docker-db-1 psql -U postgres -d wiki -t -c "SELECT COUNT(*) FROM \"userGroups\";" | xargs)
    test_pass "userGroups 表存在 (關聯數: ${GROUP_COUNT})"
else
    test_fail "userGroups 表不存在"
fi

# 總結
echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║              測試結果總結                               ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "通過測試: ${GREEN}${PASS_COUNT}${NC}"
echo -e "失敗測試: ${RED}${FAIL_COUNT}${NC}"
echo -e "總測試數: $((PASS_COUNT + FAIL_COUNT))"
echo ""

if [ $FAIL_COUNT -eq 0 ]; then
    echo -e "${GREEN}✓ 所有測試通過! 整合成功!${NC}"
    echo ""
    echo -e "${YELLOW}接下來可以:${NC}"
    echo "1. 訪問 http://localhost:3000 (Wiki.js)"
    echo "2. 訪問 http://localhost:3001 (dify-next-frontend)"
    echo "3. 使用 Wiki.js 帳號登入兩個系統"
    exit 0
else
    echo -e "${RED}✗ 有 ${FAIL_COUNT} 個測試失敗,請檢查配置${NC}"
    echo ""
    echo -e "${YELLOW}故障排除建議:${NC}"
    echo "1. 檢查 Docker 容器狀態: docker-compose ps"
    echo "2. 查看容器日誌:"
    echo "   - Wiki.js: docker logs dify-wiki --tail 50"
    echo "   - Frontend: docker logs dify-next-frontend --tail 50"
    echo "   - Database: docker logs docker-db-1 --tail 50"
    echo "3. 重新運行部署腳本: ./scripts/deploy-wiki-auth-integration.sh"
    exit 1
fi
