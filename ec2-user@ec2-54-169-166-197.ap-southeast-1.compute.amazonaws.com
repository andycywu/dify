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
REPO_URL="https://github.com/andycywu/dify"
PROJECT_DIR="dify"

echo -e "${YELLOW}處理代碼目錄...${NC}"

# 檢查是否存在舊的 dify 目錄
if [ -d "$PROJECT_DIR" ]; then
    echo -e "${YELLOW}發現現有的 dify 目錄${NC}"
    read -p "是否要刪除舊目錄並重新克隆? (y/n): " delete_choice
    
    if [[ $delete_choice =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}停止現有服務...${NC}"
        cd "$PROJECT_DIR/docker"
        docker-compose down || true
        cd ../..
        
        echo -e "${YELLOW}刪除舊的 dify 目錄...${NC}"
        rm -rf "$PROJECT_DIR"
        echo -e "${GREEN}✓ 舊目錄已刪除${NC}"
        
        echo -e "${YELLOW}重新克隆代碼...${NC}"
        git clone "$REPO_URL" "$PROJECT_DIR"
        cd "$PROJECT_DIR"
        echo -e "${GREEN}✓ 代碼克隆完成${NC}"
    else
        echo -e "${YELLOW}更新現有代碼...${NC}"
        cd "$PROJECT_DIR"
        git pull origin main
        echo -e "${GREEN}✓ 代碼更新完成${NC}"
    fi
else
    echo -e "${YELLOW}克隆代碼...${NC}"
    git clone "$REPO_URL" "$PROJECT_DIR"
    cd "$PROJECT_DIR"
    echo -e "${GREEN}✓ 代碼克隆完成${NC}"
fi

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
echo -e "${YELLOW}獲取 EC2 公共 IP...${NC}"
PUBLIC_IP=$(curl -s ifconfig.me)
PRIVATE_IP=$(hostname -I | cut -d' ' -f1)

echo "檢測到的 IP 地址："
echo "公共 IP: $PUBLIC_IP"
echo "私有 IP: $PRIVATE_IP"

# 詢問用戶是否要配置域名或使用 IP
echo ""
echo -e "${YELLOW}請選擇訪問方式：${NC}"
echo "1) 使用公共 IP 訪問 (http://$PUBLIC_IP)"
echo "2) 使用自定義域名"
echo "3) 跳過配置（使用現有設定）"
read -p "請選擇 (1-3): " access_choice

case $access_choice in
    1)
        echo -e "${YELLOW}配置使用公共 IP...${NC}"
        # 更新 .env 檔案中的相關設定
        sed -i.bak "s|CONSOLE_API_URL=.*|CONSOLE_API_URL=http://$PUBLIC_IP|g" .env
        sed -i.bak "s|CONSOLE_WEB_URL=.*|CONSOLE_WEB_URL=http://$PUBLIC_IP|g" .env
        sed -i.bak "s|SERVICE_API_URL=.*|SERVICE_API_URL=http://$PUBLIC_IP/api|g" .env
        sed -i.bak "s|APP_API_URL=.*|APP_API_URL=http://$PUBLIC_IP/api|g" .env
        sed -i.bak "s|APP_WEB_URL=.*|APP_WEB_URL=http://$PUBLIC_IP|g" .env
        sed -i.bak "s|FILES_URL=.*|FILES_URL=http://$PUBLIC_IP|g" .env
        sed -i.bak "s|NGINX_SERVER_NAME=.*|NGINX_SERVER_NAME=_|g" .env
        ;;
    2)
        read -p "請輸入您的域名 (例如: yourdomain.com): " DOMAIN_NAME
        if [ -n "$DOMAIN_NAME" ]; then
            echo -e "${YELLOW}配置使用域名: $DOMAIN_NAME${NC}"
            sed -i.bak "s|CONSOLE_API_URL=.*|CONSOLE_API_URL=https://$DOMAIN_NAME|g" .env
            sed -i.bak "s|CONSOLE_WEB_URL=.*|CONSOLE_WEB_URL=https://$DOMAIN_NAME|g" .env
            sed -i.bak "s|SERVICE_API_URL=.*|SERVICE_API_URL=https://$DOMAIN_NAME/api|g" .env
            sed -i.bak "s|APP_API_URL=.*|APP_API_URL=https://$DOMAIN_NAME/api|g" .env
            sed -i.bak "s|APP_WEB_URL=.*|APP_WEB_URL=https://$DOMAIN_NAME|g" .env
            sed -i.bak "s|FILES_URL=.*|FILES_URL=https://$DOMAIN_NAME|g" .env
            sed -i.bak "s|NGINX_SERVER_NAME=.*|NGINX_SERVER_NAME=$DOMAIN_NAME|g" .env
            sed -i.bak "s|NGINX_HTTPS_ENABLED=.*|NGINX_HTTPS_ENABLED=true|g" .env
            
            # 詢問是否設置 SSL
            read -p "是否要設置 Let's Encrypt SSL 證書? (y/n): " ssl_choice
            if [[ $ssl_choice =~ ^[Yy]$ ]]; then
                read -p "請輸入您的 email 地址: " EMAIL
                sed -i.bak "s|CERTBOT_EMAIL=.*|CERTBOT_EMAIL=$EMAIL|g" .env
                sed -i.bak "s|CERTBOT_DOMAIN=.*|CERTBOT_DOMAIN=$DOMAIN_NAME|g" .env
                sed -i.bak "s|NGINX_ENABLE_CERTBOT_CHALLENGE=.*|NGINX_ENABLE_CERTBOT_CHALLENGE=true|g" .env
                echo -e "${GREEN}✓ SSL 設定已配置${NC}"
            fi
        else
            echo -e "${RED}域名不能為空，使用預設設定${NC}"
        fi
        ;;
    3)
        echo -e "${YELLOW}跳過網路配置，使用現有設定${NC}"
        ;;
esac

# 生成安全密鑰
echo -e "${YELLOW}檢查安全密鑰...${NC}"
if grep -q "SECRET_KEY=sk-9f73s3ljTXVcMT3Blb3ljTqtsKiGHXVcMT3BlbkFJLK7U" .env; then
    echo -e "${YELLOW}生成新的安全密鑰...${NC}"
    NEW_SECRET=$(openssl rand -hex 32)
    sed -i.bak "s|SECRET_KEY=.*|SECRET_KEY=sk-$NEW_SECRET|g" .env
    echo -e "${GREEN}✓ 安全密鑰已更新${NC}"
fi

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
if [ -n "$DOMAIN_NAME" ]; then
    if [[ $ssl_choice =~ ^[Yy]$ ]]; then
        echo "HTTPS: https://$DOMAIN_NAME"
    else
        echo "HTTP: http://$DOMAIN_NAME"
    fi
else
    echo "HTTP: http://$PUBLIC_IP"
    echo "或: http://$PRIVATE_IP"
fi
echo ""
echo -e "${YELLOW}常用命令:${NC}"
echo "查看日誌: docker-compose logs -f"
echo "重啟服務: docker-compose restart"
echo "停止服務: docker-compose down"
echo "更新部署: git pull && docker-compose pull && docker-compose up -d"
echo ""
echo -e "${YELLOW}重要提醒:${NC}"
echo "• 確保 EC2 安全組開放了必要的端口（80, 443）"
echo "• 如果使用域名，請確保 DNS 已正確指向此 EC2 實例"
echo "• 首次訪問時，請等待所有服務完全啟動（可能需要 2-3 分鐘）"
echo "• 預設管理員密碼請查看 .env 檔案中的 INIT_PASSWORD 設定"
