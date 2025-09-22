#!/bin/bash

# Wiki.js + Dify 整合檢查腳本
# 用於檢查配置和服務狀態

set -e

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 圖標定義
CHECK="✅"
WARNING="⚠️"
ERROR="❌"
INFO="💡"

echo -e "${BLUE}🔍 Wiki.js + Dify 整合檢查腳本${NC}"
echo "=================================="
echo ""

# 檢查必要文件
echo -e "${BLUE}${INFO} 檢查配置文件...${NC}"

if [ ! -f "docker/docker-compose.yaml" ]; then
    echo -e "${RED}${ERROR} docker-compose.yaml 文件不存在${NC}"
    exit 1
fi

if [ ! -f "docker/.env" ]; then
    if [ -f "docker/.env.example" ]; then
        echo -e "${YELLOW}${WARNING} .env 文件不存在，從 .env.example 創建...${NC}"
        cp docker/.env.example docker/.env
        echo -e "${GREEN}${CHECK} 已創建 .env 文件${NC}"
    else
        echo -e "${RED}${ERROR} .env 和 .env.example 文件都不存在${NC}"
        exit 1
    fi
fi

# 檢查 Wiki.js 目錄結構
echo -e "${BLUE}${INFO} 檢查 Wiki.js 目錄結構...${NC}"

required_dirs=("wiki" "wiki/config" "wiki/themes" "wiki/themes/dify-integration" "wiki/themes/dify-integration/components")

for dir in "${required_dirs[@]}"; do
    if [ ! -d "$dir" ]; then
        echo -e "${YELLOW}${WARNING} 創建目錄: $dir${NC}"
        mkdir -p "$dir"
    fi
done

echo -e "${GREEN}${CHECK} 目錄結構檢查完成${NC}"

# 檢查必要文件
echo -e "${BLUE}${INFO} 檢查必要文件...${NC}"

required_files=(
    "wiki/config/dify-integration.js"
    "wiki/themes/dify-integration/definition.yml"
    "wiki/themes/dify-integration/components/DifyChatbot.vue"
)

missing_files=()
for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        missing_files+=("$file")
    fi
done

if [ ${#missing_files[@]} -gt 0 ]; then
    echo -e "${YELLOW}${WARNING} 缺少以下文件:${NC}"
    for file in "${missing_files[@]}"; do
        echo "  - $file"
    done
    echo -e "${INFO} 請運行 setup-wiki.sh 腳本重新生成這些文件${NC}"
else
    echo -e "${GREEN}${CHECK} 所有必要文件都存在${NC}"
fi

# 檢查環境變量
echo -e "${BLUE}${INFO} 檢查關鍵環境變量...${NC}"

cd docker

# 檢查 DIFY_API_KEY
if grep -q "DIFY_API_KEY=$" .env || ! grep -q "DIFY_API_KEY=" .env; then
    echo -e "${YELLOW}${WARNING} DIFY_API_KEY 未設置或為空${NC}"
    echo -e "${INFO} AI 聊天機器人功能將無法使用${NC}"
    echo -e "${INFO} 請在 .env 文件中設置: DIFY_API_KEY=your_api_key${NC}"
else
    echo -e "${GREEN}${CHECK} DIFY_API_KEY 已設置${NC}"
fi

# 檢查基本配置
required_vars=("DB_PASSWORD" "REDIS_PASSWORD" "SECRET_KEY")
for var in "${required_vars[@]}"; do
    if grep -q "^${var}=" .env; then
        echo -e "${GREEN}${CHECK} $var 已配置${NC}"
    else
        echo -e "${RED}${ERROR} $var 未配置${NC}"
    fi
done

cd ..

# 檢查 Docker 服務狀態
echo -e "${BLUE}${INFO} 檢查 Docker 服務狀態...${NC}"

cd docker

if docker-compose ps | grep -q "Up"; then
    echo -e "${GREEN}${CHECK} Docker 服務正在運行${NC}"
    
    # 檢查各個服務
    services=("db" "redis" "api" "web" "wiki")
    for service in "${services[@]}"; do
        if docker-compose ps $service | grep -q "Up"; then
            echo -e "${GREEN}${CHECK} $service 服務運行正常${NC}"
        else
            echo -e "${YELLOW}${WARNING} $service 服務未運行${NC}"
        fi
    done
else
    echo -e "${YELLOW}${WARNING} Docker 服務未啟動${NC}"
    echo -e "${INFO} 運行 docker-compose up -d 啟動服務${NC}"
fi

cd ..

# 檢查網絡連接
echo -e "${BLUE}${INFO} 檢查服務連接...${NC}"

check_url() {
    local name=$1
    local url=$2
    local timeout=${3:-5}
    
    if curl -s --connect-timeout $timeout "$url" > /dev/null 2>&1; then
        echo -e "${GREEN}${CHECK} $name 可訪問 ($url)${NC}"
        return 0
    else
        echo -e "${YELLOW}${WARNING} $name 無法訪問 ($url)${NC}"
        return 1
    fi
}

# 檢查各個服務端點
check_url "Dify API" "http://localhost:5001/health" 3 || true
check_url "Dify Web" "http://localhost/" 3 || true
check_url "Wiki.js" "http://localhost:3002" 3 || true

# 生成診斷報告
echo ""
echo -e "${BLUE}📊 診斷摘要${NC}"
echo "=================================="

# 檢查磁盤空間
available_space=$(df -h . | awk 'NR==2 {print $4}')
echo -e "${INFO} 可用磁盤空間: $available_space${NC}"

# 檢查 Docker 資源
if command -v docker &> /dev/null; then
    docker_version=$(docker --version | cut -d' ' -f3 | cut -d',' -f1)
    echo -e "${INFO} Docker 版本: $docker_version${NC}"
    
    if docker info &> /dev/null; then
        containers_running=$(docker ps -q | wc -l)
        echo -e "${INFO} 運行中的容器數量: $containers_running${NC}"
    fi
fi

# 檢查內存使用
if command -v free &> /dev/null; then
    memory_usage=$(free -h | awk 'NR==2{printf "已使用: %s / 總計: %s (%.2f%%)\n", $3,$2,$3*100/$2 }')
    echo -e "${INFO} 內存使用: $memory_usage${NC}"
fi

# 提供建議
echo ""
echo -e "${BLUE}💡 建議操作${NC}"
echo "=================================="

if [ ${#missing_files[@]} -gt 0 ]; then
    echo -e "${YELLOW}1. 運行 ./setup-wiki.sh 重新生成缺失的文件${NC}"
fi

if grep -q "DIFY_API_KEY=$" docker/.env 2>/dev/null || ! grep -q "DIFY_API_KEY=" docker/.env 2>/dev/null; then
    echo -e "${YELLOW}2. 設置 Dify API Key:${NC}"
    echo "   - 登入 Dify 控制台"
    echo "   - 前往 API 管理頁面"
    echo "   - 創建新的 API Key"
    echo "   - 在 docker/.env 中設置 DIFY_API_KEY=your_key"
fi

if ! docker-compose ps | grep -q "Up" 2>/dev/null; then
    echo -e "${YELLOW}3. 啟動服務:${NC}"
    echo "   cd docker && docker-compose up -d"
fi

echo ""
echo -e "${GREEN}🎉 檢查完成！${NC}"
echo ""
echo -e "${INFO} 如有問題，請查看詳細日誌:${NC}"
echo "   cd docker && docker-compose logs -f"
