#!/bin/bash

# Dify EC2 部署腳本 - 在 EC2 實例上執行

set -e

# 顏色設置
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${GREEN}=== Dify EC2 部署腳本 ===${NC}"
echo ""

# 檢查是否為 root 用戶
if [ "$EUID" -eq 0 ]; then
    echo -e "${RED}請不要使用 root 用戶執行此腳本${NC}"
    echo "請使用 ec2-user 或其他普通用戶"
    exit 1
fi

# 檢查 Docker 是否安裝
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}Docker 未安裝，正在安裝...${NC}"
    sudo yum update -y
    sudo yum install -y docker
    sudo systemctl start docker
    sudo systemctl enable docker
    sudo usermod -a -G docker $USER
    echo -e "${GREEN}✓ Docker 安裝完成${NC}"
    echo -e "${YELLOW}請登出並重新登入，或執行: newgrp docker${NC}"
    exit 0
fi

# 檢查 Docker 權限
echo -e "${YELLOW}檢查 Docker 權限...${NC}"
if ! docker ps &> /dev/null; then
    echo -e "${YELLOW}修復 Docker 權限...${NC}"
    sudo usermod -a -G docker $USER
    echo -e "${YELLOW}嘗試重新載入群組權限...${NC}"
    if ! newgrp docker <<EOF
docker ps
EOF
    then
        echo -e "${RED}Docker 權限問題！請執行以下命令：${NC}"
        echo "sudo usermod -a -G docker \$USER"
        echo "然後登出重新登入或執行: newgrp docker"
        exit 1
    fi
fi

echo -e "${GREEN}✓ Docker 權限正常${NC}"

# 檢查 Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo -e "${YELLOW}安裝 Docker Compose...${NC}"
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    sudo ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose
    echo -e "${GREEN}✓ Docker Compose 安裝完成${NC}"
fi

echo -e "${GREEN}✓ Docker Compose 已就緒${NC}"

# 克隆或更新代碼
REPO_URL=""
PROJECT_DIR="dify"

echo -e "${YELLOW}請輸入您的 Git repository URL:${NC}"
read -p "Repository URL: " REPO_URL

if [ -d "$PROJECT_DIR" ]; then
    echo -e "${YELLOW}更新現有代碼...${NC}"
    cd "$PROJECT_DIR"
    git pull origin main
else
    echo -e "${YELLOW}克隆代碼...${NC}"
    git clone "$REPO_URL" "$PROJECT_DIR"
    cd "$PROJECT_DIR"
fi

# 進入 docker 目錄
cd docker

# 停止現有服務（如果有）
echo -e "${YELLOW}停止現有服務...${NC}"
docker-compose down || true

# 拉取最新 images
echo -e "${YELLOW}拉取最新 images...${NC}"
docker-compose pull

# 清理舊的 images（可選）
read -p "是否清理舊的 Docker images? (y/n): " cleanup_choice
if [[ $cleanup_choice =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}清理舊 images...${NC}"
    docker system prune -f
fi

# 啟動服務
echo -e "${YELLOW}啟動服務...${NC}"
docker-compose up -d

# 等待服務啟動
echo -e "${YELLOW}等待服務啟動...${NC}"
sleep 30

# 檢查服務狀態
echo -e "${YELLOW}檢查服務狀態...${NC}"
docker-compose ps

# 檢查關鍵服務健康狀態
echo -e "${YELLOW}檢查服務健康狀態...${NC}"
for service in api web db redis; do
    if docker-compose ps | grep -q "$service.*Up"; then
        echo -e "${GREEN}✓ $service 服務運行正常${NC}"
    else
        echo -e "${RED}✗ $service 服務可能有問題${NC}"
    fi
done

echo ""
echo -e "${GREEN}=== 部署完成！ ===${NC}"
echo ""
echo -e "${YELLOW}訪問地址:${NC}"
echo "HTTP: http://$(curl -s ifconfig.me)"
echo "或: http://$(hostname -I | cut -d' ' -f1)"
echo ""
echo -e "${YELLOW}常用命令:${NC}"
echo "查看日誌: docker-compose logs -f"
echo "重啟服務: docker-compose restart"
echo "停止服務: docker-compose down"
echo "更新部署: git pull && docker-compose pull && docker-compose up -d"
