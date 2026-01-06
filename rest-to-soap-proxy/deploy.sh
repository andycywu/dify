#!/bin/bash

# Urtracker Proxy Docker 快速部署腳本
# 適用於遠端伺服器 172.27.197.100

set -e  # 遇到錯誤立即退出

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 配置變數
IMAGE_NAME="urtracker-proxy"
CONTAINER_NAME="urtracker-proxy"
PORT=5001
HOST_PORT=5001  # 可修改為其他端口，如 8080

echo "=========================================="
echo "🚀 Urtracker Proxy Docker 部署腳本"
echo "=========================================="
echo "服務器: 172.27.197.100"
echo "容器端口: $PORT"
echo "主機端口: $HOST_PORT"
echo "=========================================="

# 1. 檢查 Docker 是否安裝
echo -e "\n${YELLOW}[1/8]${NC} 檢查 Docker 環境..."
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker 未安裝！${NC}"
    echo "請先安裝 Docker: https://docs.docker.com/engine/install/"
    exit 1
fi
echo -e "${GREEN}✓ Docker 已安裝${NC}"
docker --version

# 2. 檢查 .env 文件
echo -e "\n${YELLOW}[2/8]${NC} 檢查環境配置..."
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env 文件不存在，從 .env.example 複製...${NC}"
    if [ -f .env.example ]; then
        cp .env.example .env
        echo -e "${GREEN}✓ 已創建 .env 文件${NC}"
        echo -e "${YELLOW}請編輯 .env 文件填入正確的認證信息${NC}"
    else
        echo -e "${RED}❌ .env.example 不存在！${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✓ .env 文件已存在${NC}"
fi

# 3. 停止並刪除舊容器
echo -e "\n${YELLOW}[3/8]${NC} 清理舊容器..."
if docker ps -a | grep -q $CONTAINER_NAME; then
    echo "停止舊容器..."
    docker stop $CONTAINER_NAME 2>/dev/null || true
    echo "刪除舊容器..."
    docker rm $CONTAINER_NAME 2>/dev/null || true
    echo -e "${GREEN}✓ 舊容器已清理${NC}"
else
    echo -e "${GREEN}✓ 無需清理${NC}"
fi

# 4. 構建 Docker 鏡像
echo -e "\n${YELLOW}[4/8]${NC} 構建 Docker 鏡像..."
docker build -t $IMAGE_NAME:latest .

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ 鏡像構建失敗！${NC}"
    exit 1
fi
echo -e "${GREEN}✓ 鏡像構建成功${NC}"

# 5. 運行容器
echo -e "\n${YELLOW}[5/8]${NC} 啟動容器..."
docker run -d \
  --name $CONTAINER_NAME \
  -p $HOST_PORT:$PORT \
  --env-file .env \
  --restart unless-stopped \
  $IMAGE_NAME:latest

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ 容器啟動失敗！${NC}"
    exit 1
fi
echo -e "${GREEN}✓ 容器啟動成功${NC}"

# 6. 等待服務啟動
echo -e "\n${YELLOW}[6/8]${NC} 等待服務啟動..."
sleep 5

# 7. 檢查容器狀態
echo -e "\n${YELLOW}[7/8]${NC} 檢查容器狀態..."
if docker ps | grep -q $CONTAINER_NAME; then
    echo -e "${GREEN}✓ 容器正在運行${NC}"
    docker ps | grep $CONTAINER_NAME
else
    echo -e "${RED}❌ 容器未運行！${NC}"
    echo "查看日誌："
    docker logs $CONTAINER_NAME
    exit 1
fi

# 8. 測試服務
echo -e "\n${YELLOW}[8/8]${NC} 測試服務..."
echo "測試本地訪問..."
if curl -s http://localhost:$HOST_PORT/health > /dev/null; then
    echo -e "${GREEN}✓ 本地訪問成功${NC}"
    curl -s http://localhost:$HOST_PORT/health | head -n 5
else
    echo -e "${RED}❌ 本地訪問失敗${NC}"
fi

# 檢查端口監聽
echo -e "\n檢查端口監聽狀態..."
if command -v netstat &> /dev/null; then
    netstat -tlnp | grep $HOST_PORT || echo "端口 $HOST_PORT 可能未正確監聽"
elif command -v ss &> /dev/null; then
    ss -tlnp | grep $HOST_PORT || echo "端口 $HOST_PORT 可能未正確監聽"
fi

# 檢查防火牆
echo -e "\n檢查防火牆配置..."
if command -v ufw &> /dev/null; then
    if sudo ufw status | grep -q "Status: active"; then
        echo -e "${YELLOW}⚠️  UFW 防火牆已啟用${NC}"
        if sudo ufw status | grep -q "$HOST_PORT"; then
            echo -e "${GREEN}✓ 端口 $HOST_PORT 已開放${NC}"
        else
            echo -e "${YELLOW}⚠️  端口 $HOST_PORT 未開放${NC}"
            echo "執行以下命令開放端口："
            echo "  sudo ufw allow $HOST_PORT/tcp"
            echo "  sudo ufw reload"
        fi
    fi
elif command -v firewall-cmd &> /dev/null; then
    if sudo firewall-cmd --state 2>/dev/null | grep -q "running"; then
        echo -e "${YELLOW}⚠️  firewalld 防火牆已啟用${NC}"
        if sudo firewall-cmd --list-ports | grep -q "$HOST_PORT"; then
            echo -e "${GREEN}✓ 端口 $HOST_PORT 已開放${NC}"
        else
            echo -e "${YELLOW}⚠️  端口 $HOST_PORT 未開放${NC}"
            echo "執行以下命令開放端口："
            echo "  sudo firewall-cmd --permanent --add-port=$HOST_PORT/tcp"
            echo "  sudo firewall-cmd --reload"
        fi
    fi
fi

# 完成
echo -e "\n=========================================="
echo -e "${GREEN}✅ 部署完成！${NC}"
echo "=========================================="
echo "容器名稱: $CONTAINER_NAME"
echo "端口映射: $HOST_PORT -> $PORT"
echo ""
echo "📍 訪問地址:"
echo "  - 本地: http://localhost:$HOST_PORT"
echo "  - 外部: http://172.27.197.100:$HOST_PORT"
echo ""
echo "🔍 常用命令:"
echo "  查看日誌: docker logs -f $CONTAINER_NAME"
echo "  停止服務: docker stop $CONTAINER_NAME"
echo "  啟動服務: docker start $CONTAINER_NAME"
echo "  重啟服務: docker restart $CONTAINER_NAME"
echo "  進入容器: docker exec -it $CONTAINER_NAME /bin/bash"
echo ""
echo "🧪 測試命令:"
echo "  健康檢查: curl http://172.27.197.100:$HOST_PORT/health"
echo "  查看首頁: curl http://172.27.197.100:$HOST_PORT/"
echo "  登入測試: curl -X POST http://172.27.197.100:$HOST_PORT/api/https/login \\"
echo "            -H 'Content-Type: application/json' \\"
echo "            -d '{\"username\":\"USER\",\"password\":\"PASS\"}'"
echo "=========================================="

# 顯示最新日誌
echo -e "\n${YELLOW}📋 最新日誌:${NC}"
docker logs --tail 20 $CONTAINER_NAME
