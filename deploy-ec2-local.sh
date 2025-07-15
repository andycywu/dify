#!/bin/bash

# Dify EC2 部署腳本 - 直接在 EC2 實例上執行（無需 SSH）

set -e

# 顏色設置
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${GREEN}=== Dify EC2 部署腳本（本地執行版本）===${NC}"
echo ""

# 檢查是否為 root 用戶
if [ "$EUID" -eq 0 ]; then
    echo -e "${RED}請不要使用 root 用戶執行此腳本${NC}"
    echo "請使用 ec2-user 或其他普通用戶"
    exit 1
fi

# 檢查是否在 EC2 實例上
if ! curl -s --max-time 2 http://169.254.169.254/latest/meta-data/instance-id > /dev/null 2>&1; then
    echo -e "${RED}此腳本應該在 EC2 實例上執行${NC}"
    echo "請先連線到您的 EC2 實例，然後執行此腳本"
    exit 1
fi

# 檢查 Docker 是否安裝
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}Docker 未安裝，正在安裝...${NC}"
    sudo yum update -y
    sudo yum install -y docker git
    sudo systemctl start docker
    sudo systemctl enable docker
    sudo usermod -a -G docker $USER
    echo -e "${GREEN}✓ Docker 安裝完成${NC}"
    echo -e "${YELLOW}請登出並重新登入，或執行: newgrp docker${NC}"
    echo -e "${YELLOW}然後重新執行此腳本${NC}"
    exit 0
fi

# 檢查 Git 是否安裝
if ! command -v git &> /dev/null; then
    echo -e "${YELLOW}安裝 Git...${NC}"
    sudo yum install -y git
fi

# 檢查 Docker 權限
echo -e "${YELLOW}檢查 Docker 權限...${NC}"
if ! docker ps &> /dev/null; then
    echo -e "${YELLOW}修復 Docker 權限...${NC}"
    sudo usermod -a -G docker $USER
    echo -e "${YELLOW}嘗試重新載入群組權限...${NC}"
    if ! newgrp docker <<DOCKEREOF
docker ps
exit
DOCKEREOF
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
REPO_URL="https://github.com/andycywu/dify"
PROJECT_DIR="dify"

echo -e "${YELLOW}處理代碼目錄...${NC}"

# 檢查是否存在舊的 dify 目錄
if [ -d "$PROJECT_DIR" ]; then
    echo -e "${YELLOW}發現現有的 dify 目錄，正在停止現有服務並清理...${NC}"
    cd "$PROJECT_DIR/docker" 2>/dev/null && docker-compose down || true
    cd - > /dev/null
    rm -rf "$PROJECT_DIR"
    echo -e "${GREEN}✓ 舊目錄已清理${NC}"
fi

echo -e "${YELLOW}克隆代碼...${NC}"
git clone "$REPO_URL" "$PROJECT_DIR"
cd "$PROJECT_DIR"
echo -e "${GREEN}✓ 代碼克隆完成${NC}"

# 進入 docker 目錄
cd docker

# 檢查並設置 .env 檔案
echo -e "${YELLOW}配置環境變數...${NC}"
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        echo -e "${YELLOW}創建 .env 檔案從 .env.example...${NC}"
        cp .env.example .env
        echo -e "${GREEN}✓ .env 檔案已創建${NC}"
    else
        echo -e "${RED}錯誤：找不到 .env.example 檔案${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✓ .env 檔案已存在${NC}"
fi

# 獲取 EC2 公共 IP
echo -e "${YELLOW}獲取 EC2 IP 地址...${NC}"
PUBLIC_IP=$(curl -s ifconfig.me || curl -s http://169.254.169.254/latest/meta-data/public-ipv4)
PRIVATE_IP=$(hostname -I | cut -d' ' -f1)

echo "檢測到的 IP 地址："
echo "公共 IP: $PUBLIC_IP"
echo "私有 IP: $PRIVATE_IP"

# 自動配置使用公共 IP
echo -e "${YELLOW}自動配置使用公共 IP...${NC}"
sed -i.bak "s|CONSOLE_API_URL=.*|CONSOLE_API_URL=http://$PUBLIC_IP:3001|g" .env
sed -i.bak "s|CONSOLE_WEB_URL=.*|CONSOLE_WEB_URL=http://$PUBLIC_IP:3001|g" .env
sed -i.bak "s|SERVICE_API_URL=.*|SERVICE_API_URL=http://$PUBLIC_IP:5001|g" .env
sed -i.bak "s|APP_API_URL=.*|APP_API_URL=http://$PUBLIC_IP:5001|g" .env
sed -i.bak "s|APP_WEB_URL=.*|APP_WEB_URL=http://$PUBLIC_IP:3001|g" .env
sed -i.bak "s|FILES_URL=.*|FILES_URL=http://$PUBLIC_IP:3001|g" .env

# 生成安全密鑰
echo -e "${YELLOW}檢查安全密鑰...${NC}"
if grep -q "SECRET_KEY=sk-9f73s3ljTXVcMT3Blb3ljTqtsKiGHXVcMT3BlbkFJLK7U" .env || ! grep -q "SECRET_KEY=" .env; then
    echo -e "${YELLOW}生成新的安全密鑰...${NC}"
    NEW_SECRET=$(openssl rand -hex 32)
    if grep -q "SECRET_KEY=" .env; then
        sed -i.bak "s|SECRET_KEY=.*|SECRET_KEY=sk-$NEW_SECRET|g" .env
    else
        echo "SECRET_KEY=sk-$NEW_SECRET" >> .env
    fi
    echo -e "${GREEN}✓ 安全密鑰已更新${NC}"
fi

# 創建必要的目錄和檔案
echo -e "${YELLOW}創建必要的配置...${NC}"
mkdir -p ../rest-to-soap-proxy
touch ../rest-to-soap-proxy/.env

# 修改 docker-compose.yaml 以暴露端口
echo -e "${YELLOW}配置服務端口...${NC}"

# 為 web 服務添加端口
if ! grep -A 5 -B 5 "web:" docker-compose.yaml | grep -q "ports:"; then
    # 找到 web 服務的環境變數結束位置，添加端口配置
    sed -i '/ENABLE_WEBSITE_WATERCRAWL: ${ENABLE_WEBSITE_WATERCRAWL:-true}/a\    ports:\n      - "3001:3000"' docker-compose.yaml
fi

# 為 api 服務添加端口
if ! grep -A 10 -B 5 "api:" docker-compose.yaml | grep -q "ports:"; then
    # 在 volumes 前添加端口配置
    sed -i '/- \.\/volumes\/app\/storage:\/app\/api\/storage/i\    ports:\n      - "5001:5001"' docker-compose.yaml
fi

# 停止現有服務（如果有）
echo -e "${YELLOW}停止現有服務...${NC}"
docker-compose down || true

# 拉取最新 images
echo -e "${YELLOW}拉取最新 images...${NC}"
docker-compose pull || true

# 啟動核心服務
echo -e "${YELLOW}啟動核心服務...${NC}"
docker-compose up -d api web db redis weaviate plugin_daemon

# 等待服務啟動
echo -e "${YELLOW}等待服務啟動...${NC}"
sleep 30

# 檢查服務狀態
echo -e "${YELLOW}檢查服務狀態...${NC}"
docker ps

# 檢查服務健康狀態
echo -e "${YELLOW}檢查服務健康狀態...${NC}"
for port in 5001 3001; do
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:$port | grep -E "^(200|307|302)"; then
        echo -e "${GREEN}✓ 端口 $port 服務運行正常${NC}"
    else
        echo -e "${YELLOW}⚠ 端口 $port 服務可能還在啟動中${NC}"
    fi
done

echo ""
echo -e "${GREEN}=== 部署完成！ ===${NC}"
echo ""
echo -e "${YELLOW}訪問地址:${NC}"
echo "• Web 介面: http://$PUBLIC_IP:3001"
echo "• API 端點: http://$PUBLIC_IP:5001"
echo "• 插件服務: http://$PUBLIC_IP:5003"
echo ""
echo -e "${YELLOW}常用命令:${NC}"
echo "• 查看日誌: cd $PROJECT_DIR/docker && docker-compose logs -f"
echo "• 重啟服務: cd $PROJECT_DIR/docker && docker-compose restart"
echo "• 停止服務: cd $PROJECT_DIR/docker && docker-compose down"
echo ""
echo -e "${YELLOW}重要提醒:${NC}"
echo "• 確保 EC2 安全組開放了端口：3001 (Web), 5001 (API), 5003 (Plugin)"
echo "• 首次訪問時，請等待所有服務完全啟動（可能需要 2-3 分鐘）"
echo "• 如果無法訪問，請檢查 EC2 安全組設定"
