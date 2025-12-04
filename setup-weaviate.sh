#!/bin/bash

# =============================================================================
# Weaviate 部署腳本
# 在 Ubuntu 伺服器上部署獨立的 Weaviate 向量資料庫
# =============================================================================

set -e

echo "🚀 開始部署 Weaviate 向量資料庫..."
echo "================================================"
echo ""

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 1. 檢查 Docker
echo "1️⃣  檢查 Docker 環境..."
if ! command -v docker &> /dev/null; then
    echo -e "${RED}✗${NC} Docker 未安裝"
    echo "請先安裝 Docker: https://docs.docker.com/engine/install/ubuntu/"
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}✗${NC} Docker Compose 未安裝"
    echo "請先安裝 Docker Compose"
    exit 1
fi

echo -e "${GREEN}✓${NC} Docker 環境正常"
echo ""

# 2. 停止現有的 Weaviate 容器
echo "2️⃣  清理現有 Weaviate 容器..."
docker stop dify-weaviate 2>/dev/null || true
docker rm dify-weaviate 2>/dev/null || true
echo -e "${GREEN}✓${NC} 清理完成"
echo ""

# 3. 創建數據目錄
echo "3️⃣  創建數據目錄..."
mkdir -p volumes/weaviate
chmod -R 755 volumes/weaviate
echo -e "${GREEN}✓${NC} 數據目錄已創建: ./volumes/weaviate"
echo ""

# 4. 啟動 Weaviate
echo "4️⃣  啟動 Weaviate 服務..."
if command -v docker-compose &> /dev/null; then
    docker-compose -f weaviate-standalone-docker-compose.yaml up -d
else
    docker compose -f weaviate-standalone-docker-compose.yaml up -d
fi
echo ""

# 5. 等待服務啟動
echo "5️⃣  等待 Weaviate 啟動..."
echo "   這可能需要 30-60 秒..."
RETRY=0
MAX_RETRY=20
while [ $RETRY -lt $MAX_RETRY ]; do
    if curl -s -f http://localhost:8080/v1/.well-known/ready > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} Weaviate 已成功啟動！"
        break
    else
        RETRY=$((RETRY+1))
        echo -n "."
        sleep 3
    fi
done
echo ""

if [ $RETRY -eq $MAX_RETRY ]; then
    echo -e "${RED}✗${NC} Weaviate 啟動超時"
    echo "請查看日誌: docker logs dify-weaviate"
    exit 1
fi
echo ""

# 6. 驗證服務
echo "6️⃣  驗證 Weaviate 服務..."
echo ""
echo -e "${BLUE}Weaviate 版本信息:${NC}"
curl -s http://localhost:8080/v1/meta | jq '.' 2>/dev/null || curl -s http://localhost:8080/v1/meta
echo ""
echo ""

# 7. 顯示連接信息
echo "================================================"
echo -e "${GREEN}✅ Weaviate 部署成功！${NC}"
echo "================================================"
echo ""
echo -e "${BLUE}📋 連接信息:${NC}"
echo "  Endpoint: http://localhost:8080"
echo "  內部網路: http://weaviate:8080"
echo "  API Key: WVF5YThaHlkYwhGUSmCRgsX3tD5ngdN8pkih"
echo ""
echo -e "${BLUE}🔧 管理命令:${NC}"
echo "  查看日誌: docker logs dify-weaviate -f"
echo "  重啟服務: docker restart dify-weaviate"
echo "  停止服務: docker stop dify-weaviate"
echo "  啟動服務: docker start dify-weaviate"
echo ""
echo -e "${BLUE}🧪 測試連接:${NC}"
echo "  curl http://localhost:8080/v1/.well-known/ready"
echo "  curl http://localhost:8080/v1/meta"
echo ""
echo -e "${BLUE}📁 數據位置:${NC}"
echo "  ./volumes/weaviate"
echo ""
echo -e "${BLUE}⚙️  下一步:${NC}"
echo "  1. 確保 docker/.env 中 VECTOR_STORE=weaviate"
echo "  2. 確保 WEAVIATE_ENDPOINT=http://weaviate:8080"
echo "  3. 確保 API 和 Worker 容器在同一 Docker 網路 (dify-network)"
echo "  4. 重啟 Dify API 和 Worker 服務"
echo ""
