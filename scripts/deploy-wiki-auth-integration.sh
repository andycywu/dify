#!/bin/bash
# Wiki.js 認證整合 - 快速部署腳本
# 一鍵完成所有配置和部署

set -e

# 顏色定義
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 項目路徑
DIFY_ROOT="/Users/andycyw/dify"
FRONTEND_ROOT="${DIFY_ROOT}/dify-next-frontend"
WIKI_ROOT="${DIFY_ROOT}/wiki"
DOCKER_ROOT="${DIFY_ROOT}/docker"

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Wiki.js 認證整合 - 自動部署腳本                      ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# 步驟 1: 檢查先決條件
echo -e "${YELLOW}[1/8] 檢查先決條件...${NC}"

# 檢查 Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}✗ Docker 未安裝${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Docker 已安裝${NC}"

# 檢查 Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js 未安裝${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js 已安裝${NC}"

# 檢查 npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}✗ npm 未安裝${NC}"
    exit 1
fi
echo -e "${GREEN}✓ npm 已安裝${NC}"

# 步驟 2: 檢查容器運行狀態
echo ""
echo -e "${YELLOW}[2/8] 檢查容器狀態...${NC}"

cd "${DOCKER_ROOT}"

if ! docker-compose ps | grep -q "docker-db-1.*Up"; then
    echo -e "${RED}✗ PostgreSQL 容器未運行,正在啟動...${NC}"
    docker-compose up -d db
    sleep 5
fi
echo -e "${GREEN}✓ PostgreSQL 容器運行中${NC}"

if ! docker-compose ps | grep -q "wiki.*Up"; then
    echo -e "${YELLOW}⚠ Wiki.js 容器未運行,正在啟動...${NC}"
    docker-compose up -d wiki
    sleep 10
fi
echo -e "${GREEN}✓ Wiki.js 容器運行中${NC}"

# 步驟 3: 測試數據庫連接
echo ""
echo -e "${YELLOW}[3/8] 測試數據庫連接...${NC}"

if docker exec -i docker-db-1 psql -U postgres -d wiki -c "SELECT COUNT(*) FROM users;" > /dev/null 2>&1; then
    USER_COUNT=$(docker exec -i docker-db-1 psql -U postgres -d wiki -t -c "SELECT COUNT(*) FROM users WHERE \"isSystem\" = false;" | xargs)
    echo -e "${GREEN}✓ 數據庫連接成功 (現有用戶數: ${USER_COUNT})${NC}"
else
    echo -e "${RED}✗ 數據庫連接失敗${NC}"
    exit 1
fi

# 步驟 4: 創建 dify 專屬表
echo ""
echo -e "${YELLOW}[4/8] 創建 dify-next-frontend 專屬表...${NC}"

docker exec -i docker-db-1 psql -U postgres -d wiki <<EOF > /dev/null 2>&1
-- 創建 dify_user_usage 表
CREATE TABLE IF NOT EXISTS dify_user_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" INTEGER NOT NULL,
    date TIMESTAMP NOT NULL,
    "tokenUsage" INTEGER DEFAULT 0,
    billing DOUBLE PRECISION DEFAULT 0,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW(),
    UNIQUE("userId", date),
    FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_dify_user_usage_userId ON dify_user_usage("userId");
CREATE INDEX IF NOT EXISTS idx_dify_user_usage_date ON dify_user_usage(date);

-- 創建 General 表
CREATE TABLE IF NOT EXISTS dify_general (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(255) UNIQUE NOT NULL,
    value TEXT,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);
EOF

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ 專屬表創建成功${NC}"
else
    echo -e "${YELLOW}⚠ 表可能已存在,跳過創建${NC}"
fi

# 步驟 5: 配置 Wiki.js 認證模組
echo ""
echo -e "${YELLOW}[5/8] 配置 Wiki.js 認證模組...${NC}"

# 確保目錄存在
mkdir -p "${WIKI_ROOT}/config"

# 檢查模組文件
if [ -f "${WIKI_ROOT}/config/auth-integration.js" ]; then
    echo -e "${GREEN}✓ 認證模組已存在${NC}"
else
    echo -e "${RED}✗ 認證模組文件不存在: ${WIKI_ROOT}/config/auth-integration.js${NC}"
    echo -e "${YELLOW}請確保已創建該文件${NC}"
    exit 1
fi

# 步驟 6: 更新 dify-next-frontend 配置
echo ""
echo -e "${YELLOW}[6/8] 更新 dify-next-frontend 配置...${NC}"

cd "${FRONTEND_ROOT}"

# 備份原 Prisma schema
if [ -f "prisma/schema.prisma" ]; then
    BACKUP_FILE="prisma/schema.prisma.backup.$(date +%Y%m%d_%H%M%S)"
    cp prisma/schema.prisma "$BACKUP_FILE"
    echo -e "${GREEN}✓ 原 schema 已備份至: ${BACKUP_FILE}${NC}"
fi

# 使用 PostgreSQL schema
if [ -f "prisma/schema-postgresql.prisma" ]; then
    cp prisma/schema-postgresql.prisma prisma/schema.prisma
    echo -e "${GREEN}✓ Prisma schema 已更新為 PostgreSQL 版本${NC}"
else
    echo -e "${RED}✗ PostgreSQL schema 文件不存在${NC}"
    exit 1
fi

# 複製環境變數配置
if [ -f ".env.wiki-integration" ]; then
    if [ ! -f ".env" ] || [ "$1" == "--force" ]; then
        cp .env.wiki-integration .env
        echo -e "${GREEN}✓ 環境變數配置已更新${NC}"
    else
        echo -e "${YELLOW}⚠ .env 已存在,跳過覆蓋 (使用 --force 強制覆蓋)${NC}"
    fi
else
    echo -e "${RED}✗ .env.wiki-integration 文件不存在${NC}"
    exit 1
fi

# 步驟 7: 安裝依賴並生成 Prisma Client
echo ""
echo -e "${YELLOW}[7/8] 安裝依賴並生成 Prisma Client...${NC}"

# 確保必要的依賴已安裝
npm install --save bcryptjs @prisma/client
npm install --save-dev @types/bcryptjs

# 生成 Prisma Client
npx prisma generate
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Prisma Client 生成成功${NC}"
else
    echo -e "${RED}✗ Prisma Client 生成失敗${NC}"
    exit 1
fi

# 步驟 8: 重啟服務
echo ""
echo -e "${YELLOW}[8/8] 重啟服務...${NC}"

cd "${DOCKER_ROOT}"

# 使用 wiki-auth 配置
docker-compose -f docker-compose.yaml -f docker-compose.wiki-auth.yml up -d wiki dify-next-frontend

echo ""
echo -e "${GREEN}等待服務啟動...${NC}"
sleep 5

# 檢查服務狀態
WIKI_STATUS=$(docker-compose ps wiki | grep -q "Up" && echo "✓" || echo "✗")
FRONTEND_STATUS=$(docker-compose ps dify-next-frontend | grep -q "Up" && echo "✓" || echo "✗")

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║              部署完成!                                  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}服務狀態:${NC}"
echo -e "  Wiki.js:            ${WIKI_STATUS}"
echo -e "  dify-next-frontend: ${FRONTEND_STATUS}"
echo ""
echo -e "${GREEN}訪問地址:${NC}"
echo -e "  Wiki.js:            http://localhost:3000"
echo -e "  dify-next-frontend: http://localhost:3001"
echo ""
echo -e "${GREEN}Wiki.js 現有用戶:${NC}"
docker exec -i docker-db-1 psql -U postgres -d wiki -t -c 'SELECT id, email, name FROM users WHERE "isSystem" = false;' 2>/dev/null || echo "  (查詢失敗)"
echo ""
echo -e "${YELLOW}下一步:${NC}"
echo "1. 訪問 Wiki.js (http://localhost:3000) 確認用戶"
echo "2. 使用 Wiki.js 帳號登入 dify-next-frontend"
echo "3. 驗證用戶組權限映射正確"
echo ""
echo -e "${BLUE}查看日誌:${NC}"
echo "  Wiki.js:            docker logs dify-wiki -f"
echo "  dify-next-frontend: docker logs dify-next-frontend -f"
echo ""
echo -e "${GREEN}完成!${NC}"
