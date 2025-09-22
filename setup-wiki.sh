#!/bin/bash

# Dify + Wiki.js 整合部署腳本
# 作者: Dify 團隊
# 版本: 1.0.0

set -e

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 圖標定義
ROCKET="🚀"
FOLDER="📁"
CHECK="✅"
WARNING="⚠️"
INFO="💡"
ROBOT="🤖"
BOOK="📚"
GEAR="⚙️"
SPARKLES="✨"

echo -e "${CYAN}${ROCKET} Dify + Wiki.js 整合部署腳本${NC}"
echo -e "${PURPLE}================================================${NC}"
echo ""

# 檢查 Docker 和 Docker Compose
echo -e "${BLUE}${GEAR} 檢查系統環境...${NC}"

if ! command -v docker &> /dev/null; then
    echo -e "${RED}${WARNING} Docker 未安裝，請先安裝 Docker${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}${WARNING} Docker Compose 未安裝，請先安裝 Docker Compose${NC}"
    exit 1
fi

echo -e "${GREEN}${CHECK} Docker 環境檢查完成${NC}"

# 創建必要目錄
echo -e "${BLUE}${FOLDER} 創建目錄結構...${NC}"

mkdir -p wiki/{config,themes/dify-integration/{components,layouts,assets},data}
mkdir -p docker/volumes/{wiki-content,wiki-config}

# 設置權限
chmod -R 755 wiki/
chmod -R 755 docker/volumes/

echo -e "${GREEN}${CHECK} 目錄結構創建完成${NC}"

# 檢查環境變量
echo -e "${BLUE}${INFO} 檢查環境配置...${NC}"

# 創建 .env 文件（如果不存在）
if [ ! -f "docker/.env" ]; then
    echo -e "${YELLOW}${WARNING} 未找到 .env 文件，創建默認配置...${NC}"
    
    cat > docker/.env << EOF
# Dify 基本配置
SECRET_KEY=sk-9f73s3ljTXVcMT3Blb3ljTqtsKiGHXVcMT3BlbkFJLK7U
INIT_PASSWORD=password123
CONSOLE_API_URL=http://localhost/console-api  
CONSOLE_WEB_URL=http://localhost
SERVICE_API_URL=http://localhost/api
APP_API_URL=http://localhost/api
APP_WEB_URL=http://localhost

# 數據庫配置
DB_USERNAME=postgres
DB_PASSWORD=difyai123456
DB_HOST=db
DB_PORT=5432
DB_DATABASE=dify

# Redis 配置
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=difyai123456

# Wiki.js 配置
WIKI_PORT=3002
WIKI_DB_NAME=wiki
WIKI_ADMIN_EMAIL=admin@example.com
WIKI_HOST=http://localhost:3002

# Dify API Key (請設置您的實際 API Key)
DIFY_API_KEY=

# Nginx 端口配置
EXPOSE_NGINX_PORT=80
EXPOSE_NGINX_SSL_PORT=443
EOF

    echo -e "${GREEN}${CHECK} 已創建默認 .env 文件${NC}"
fi

# 檢查 DIFY_API_KEY
if [ -z "$DIFY_API_KEY" ] && ! grep -q "DIFY_API_KEY=." docker/.env; then
    echo -e "${YELLOW}${WARNING} 警告: DIFY_API_KEY 未設置${NC}"
    echo -e "${INFO} 請在 docker/.env 文件中設置您的 Dify API Key${NC}"
    echo -e "${INFO} 或運行: export DIFY_API_KEY=your_api_key_here${NC}"
fi

# 複製 Wiki.js 配置文件
echo -e "${BLUE}${GEAR} 設置 Wiki.js 配置...${NC}"

# 創建 Wiki.js 初始化腳本
cat > wiki/config/init-wiki.sql << 'EOF'
-- Wiki.js 數據庫初始化腳本
CREATE DATABASE IF NOT EXISTS wiki;
GRANT ALL PRIVILEGES ON DATABASE wiki TO postgres;
EOF

echo -e "${GREEN}${CHECK} Wiki.js 配置完成${NC}"

# 構建和啟動服務
echo -e "${BLUE}${ROCKET} 啟動服務...${NC}"

cd docker

# 停止現有服務（如果存在）
echo -e "${YELLOW}${INFO} 停止現有服務...${NC}"
docker-compose down || true

# 拉取最新鏡像
echo -e "${BLUE}${INFO} 拉取 Docker 鏡像...${NC}"
docker-compose pull

# 啟動服務
echo -e "${BLUE}${ROCKET} 啟動所有服務...${NC}"
docker-compose up -d

# 等待服務啟動
echo -e "${BLUE}${INFO} 等待服務啟動...${NC}"
sleep 15

# 檢查服務狀態
echo -e "${BLUE}${INFO} 檢查服務狀態...${NC}"
docker-compose ps

# 等待數據庫就緒
echo -e "${BLUE}${INFO} 等待數據庫初始化...${NC}"
sleep 10

# 執行數據庫遷移（如果需要）
echo -e "${BLUE}${GEAR} 執行數據庫遷移...${NC}"
docker-compose exec -T api flask db upgrade || echo -e "${YELLOW}${WARNING} 數據庫遷移可能已完成或不需要${NC}"

cd ..

# 驗證部署
echo -e "${BLUE}${CHECK} 驗證部署...${NC}"

# 檢查端口
check_service() {
    local service=$1
    local port=$2
    local url=$3
    
    if curl -s --connect-timeout 5 "$url" > /dev/null; then
        echo -e "${GREEN}${CHECK} $service 運行正常 (端口 $port)${NC}"
        return 0
    else
        echo -e "${YELLOW}${WARNING} $service 可能還在啟動中 (端口 $port)${NC}"
        return 1
    fi
}

echo -e "${INFO} 檢查服務可用性...${NC}"
sleep 5

# 檢查各個服務
check_service "Dify API" "5001" "http://localhost:5001/health" || true
check_service "Dify Web (原始)" "80" "http://localhost/" || true
check_service "Wiki.js" "3002" "http://localhost:3002" || true

# 顯示部署結果
echo ""
echo -e "${PURPLE}================================================${NC}"
echo -e "${GREEN}${SPARKLES} 部署完成！${NC}"
echo -e "${PURPLE}================================================${NC}"
echo ""
echo -e "${CYAN}${INFO} 訪問地址:${NC}"
echo -e "${BLUE}┌────────────────────────────────────────────┐${NC}"
echo -e "${BLUE}│${NC} ${GEAR} Dify 原始前端:    http://localhost/      ${BLUE}│${NC}"
echo -e "${BLUE}│${NC} ${ROCKET} Dify API:        http://localhost:5001  ${BLUE}│${NC}"  
echo -e "${BLUE}│${NC} ${BOOK} Wiki.js 文檔:    http://localhost:3002  ${BLUE}│${NC}"
echo -e "${BLUE}└────────────────────────────────────────────┘${NC}"
echo ""
echo -e "${CYAN}${ROBOT} 功能特性:${NC}"
echo "• Wiki.js 已集成 Dify AI 聊天機器人"
echo "• 支持多模態文件上傳和處理"
echo "• 三個前端界面可獨立使用"
echo "• 共享 Dify API 後端服務"
echo "• 統一的用戶認證和權限管理"
echo ""
echo -e "${CYAN}${INFO} 初次設置:${NC}"
echo -e "${YELLOW}1. 訪問 http://localhost:3002 設置 Wiki.js 管理員帳戶${NC}"
echo -e "${YELLOW}2. 數據庫配置:${NC}"
echo "   - 類型: PostgreSQL"
echo "   - 主機: db"
echo "   - 端口: 5432"
echo "   - 數據庫: wiki"
echo "   - 用戶名: postgres"
echo "   - 密碼: difyai123456"
echo ""
echo -e "${YELLOW}3. 設置 Dify API Key (重要):${NC}"
echo "   - 編輯 docker/.env 文件"
echo "   - 設置 DIFY_API_KEY=your_actual_api_key"
echo "   - 重啟服務: cd docker && docker-compose restart wiki"
echo ""
echo -e "${CYAN}${INFO} 常用命令:${NC}"
echo "• 查看日誌: cd docker && docker-compose logs -f"
echo "• 重啟服務: cd docker && docker-compose restart"
echo "• 停止服務: cd docker && docker-compose down"
echo "• 更新服務: cd docker && docker-compose pull && docker-compose up -d"
echo ""
echo -e "${GREEN}${CHECK} 部署腳本執行完成！${NC}"

# 檢查 dify-next-frontend 是否存在
if [ -d "dify-next-frontend" ]; then
    echo ""
    echo -e "${CYAN}${INFO} 檢測到 dify-next-frontend 目錄${NC}"
    echo -e "${YELLOW}如需啟動 Next.js 前端，請執行:${NC}"
    echo "cd dify-next-frontend && npm run dev"
    echo -e "${INFO} Next.js 前端將運行在: http://localhost:3001${NC}"
fi

echo ""
echo -e "${PURPLE}感謝使用 Dify + Wiki.js 整合方案！${NC}"
