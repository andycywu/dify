#!/bin/bash

# 快速修復部署腳本 - 解決端口和版本問題

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "=========================================="
echo "🔧 快速修復 Urtracker Proxy 部署"
echo "=========================================="

# 配置
CONTAINER_NAME="urtracker-proxy"
OLD_CONTAINER_NAME="rest-to-soap-proxy"
IMAGE_NAME="urtracker-proxy"
PORT=5001  # 統一使用 5001

# 1. 停止所有相關容器
echo -e "\n${YELLOW}[1/6]${NC} 停止舊容器..."
docker ps -a --format "{{.Names}}" | grep -E "soap|urtracker" | while read container; do
    echo "停止容器: $container"
    docker stop $container 2>/dev/null || true
    docker rm $container 2>/dev/null || true
done
echo -e "${GREEN}✓ 舊容器已清理${NC}"

# 2. 確認項目目錄
echo -e "\n${YELLOW}[2/6]${NC} 檢查項目目錄..."
if [ ! -d ~/dify/rest-to-soap-proxy ]; then
    echo -e "${RED}❌ 項目目錄不存在: ~/dify/rest-to-soap-proxy${NC}"
    exit 1
fi
cd ~/dify/rest-to-soap-proxy
echo -e "${GREEN}✓ 項目目錄: $(pwd)${NC}"

# 3. 檢查文件
echo -e "\n${YELLOW}[3/6]${NC} 檢查關鍵文件..."
if [ ! -f src/clients/https-client.js ]; then
    echo -e "${RED}❌ 缺少新版本文件！${NC}"
    echo "請先從本地同步最新代碼："
    echo "  scp -r c:/Users/andycy.wu/dify/rest-to-soap-proxy/* obmid@172.27.197.100:~/dify/rest-to-soap-proxy/"
    exit 1
fi

if [ ! -f index.js ]; then
    echo -e "${RED}❌ index.js 不存在！${NC}"
    if [ -f index-new.js ]; then
        echo "將 index-new.js 重命名為 index.js..."
        mv index-new.js index.js
    else
        echo "請檢查文件結構"
        exit 1
    fi
fi
echo -e "${GREEN}✓ 文件完整${NC}"

# 4. 更新 .env 文件
echo -e "\n${YELLOW}[4/6]${NC} 配置環境變數..."
if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        cp .env.example .env
        echo -e "${GREEN}✓ 創建 .env 文件${NC}"
    fi
fi

# 確保 PORT 設置為 5001
if [ -f .env ]; then
    if grep -q "^PORT=" .env; then
        sed -i 's/^PORT=.*/PORT=5001/' .env
    else
        echo "PORT=5001" >> .env
    fi
    echo -e "${GREEN}✓ PORT 設置為 5001${NC}"
fi

# 5. 構建鏡像
echo -e "\n${YELLOW}[5/6]${NC} 構建 Docker 鏡像..."
docker build -t $IMAGE_NAME:latest .
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ 鏡像構建失敗${NC}"
    exit 1
fi
echo -e "${GREEN}✓ 鏡像構建成功${NC}"

# 6. 啟動容器
echo -e "\n${YELLOW}[6/6]${NC} 啟動新容器..."
docker run -d \
  --name $CONTAINER_NAME \
  -p $PORT:5001 \
  --env-file .env \
  --restart unless-stopped \
  $IMAGE_NAME:latest

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ 容器啟動失敗${NC}"
    exit 1
fi
echo -e "${GREEN}✓ 容器啟動成功${NC}"

# 等待服務啟動
echo -e "\n等待服務啟動..."
sleep 5

# 測試服務
echo -e "\n=========================================="
echo -e "${GREEN}✅ 修復完成！${NC}"
echo "=========================================="
echo "容器名稱: $CONTAINER_NAME"
echo "端口: $PORT"
echo ""
echo "🧪 測試服務..."

# 測試健康檢查
echo -e "\n1. 健康檢查:"
if curl -s http://localhost:$PORT/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ 健康檢查通過${NC}"
    curl -s http://localhost:$PORT/health
else
    echo -e "${RED}✗ 健康檢查失敗${NC}"
    echo "查看日誌:"
    docker logs --tail 20 $CONTAINER_NAME
fi

# 測試 HTTPS API
echo -e "\n2. 測試 HTTPS API 路由:"
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$PORT/api/https/status)
if [ "$response" = "200" ]; then
    echo -e "${GREEN}✓ HTTPS API 路由正常${NC}"
    curl -s http://localhost:$PORT/api/https/status
else
    echo -e "${RED}✗ HTTPS API 路由異常 (HTTP $response)${NC}"
fi

# 測試 SOAP API
echo -e "\n3. 測試 SOAP API 路由:"
response=$(curl -s -X POST http://localhost:$PORT/GetIssueInfo \
  -H "Content-Type: application/json" \
  -d '{"issueID":1}' \
  -o /dev/null -w "%{http_code}")
if [ "$response" = "200" ] || [ "$response" = "500" ]; then
    echo -e "${GREEN}✓ SOAP API 路由正常${NC}"
else
    echo -e "${YELLOW}⚠️  SOAP API 可能需要配置認證${NC}"
fi

# 顯示容器狀態
echo -e "\n4. 容器狀態:"
docker ps | grep $CONTAINER_NAME

echo -e "\n=========================================="
echo "📍 訪問地址:"
echo "  - 本地: http://localhost:$PORT"
echo "  - 外部: http://172.27.197.100:$PORT"
echo ""
echo "📖 API 文檔:"
echo "  http://172.27.197.100:$PORT/"
echo ""
echo "🔍 查看日誌:"
echo "  docker logs -f $CONTAINER_NAME"
echo ""
echo "🧪 測試登入:"
echo "  curl -X POST http://172.27.197.100:$PORT/api/https/login \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -d '{\"username\":\"YOUR_USER\",\"password\":\"YOUR_PASS\"}'"
echo "=========================================="
