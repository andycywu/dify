#!/bin/bash

# AWS 環境配置腳本 - 專門用於配置 Dify 在 AWS 上的環境變數

set -e

# 顏色設置
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${GREEN}=== Dify AWS 環境配置腳本 ===${NC}"
echo ""

# 檢查是否在 docker 目錄中
if [ ! -f "docker-compose.yaml" ] || [ ! -f ".env.example" ]; then
    echo -e "${RED}錯誤：請在 docker 目錄中執行此腳本${NC}"
    echo "請執行: cd /path/to/dify/docker"
    exit 1
fi

# 備份現有的 .env 檔案
if [ -f ".env" ]; then
    echo -e "${YELLOW}備份現有 .env 檔案...${NC}"
    cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
    echo -e "${GREEN}✓ 已備份到 .env.backup.$(date +%Y%m%d_%H%M%S)${NC}"
fi

# 複製 .env.example 到 .env
echo -e "${YELLOW}創建 .env 檔案...${NC}"
cp .env.example .env
echo -e "${GREEN}✓ .env 檔案已創建${NC}"

# 獲取 AWS EC2 資訊
echo -e "${YELLOW}獲取 AWS EC2 資訊...${NC}"
PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || curl -s ifconfig.me)
PRIVATE_IP=$(curl -s http://169.254.169.254/latest/meta-data/local-ipv4 2>/dev/null || hostname -I | cut -d' ' -f1)
INSTANCE_ID=$(curl -s http://169.254.169.254/latest/meta-data/instance-id 2>/dev/null || echo "unknown")
REGION=$(curl -s http://169.254.169.254/latest/meta-data/placement/region 2>/dev/null || echo "unknown")

echo "AWS EC2 資訊："
echo "實例 ID: $INSTANCE_ID"
echo "區域: $REGION"
echo "公共 IP: $PUBLIC_IP"
echo "私有 IP: $PRIVATE_IP"
echo ""

# 詢問部署類型
echo -e "${YELLOW}請選擇部署類型：${NC}"
echo "1) 開發/測試環境（使用 IP 地址，HTTP）"
echo "2) 生產環境（使用域名，HTTPS）"
echo "3) 自定義配置"
read -p "請選擇 (1-3): " deploy_type

case $deploy_type in
    1)
        echo -e "${YELLOW}配置開發/測試環境...${NC}"
        configure_development_env
        ;;
    2)
        echo -e "${YELLOW}配置生產環境...${NC}"
        configure_production_env
        ;;
    3)
        echo -e "${YELLOW}開始自定義配置...${NC}"
        configure_custom_env
        ;;
    *)
        echo -e "${RED}無效選擇${NC}"
        exit 1
        ;;
esac

# 配置開發環境函數
configure_development_env() {
    echo -e "${YELLOW}設定開發環境配置...${NC}"
    
    # 基本 URL 設定
    sed -i.bak "s|CONSOLE_API_URL=.*|CONSOLE_API_URL=http://$PUBLIC_IP|g" .env
    sed -i.bak "s|CONSOLE_WEB_URL=.*|CONSOLE_WEB_URL=http://$PUBLIC_IP|g" .env
    sed -i.bak "s|SERVICE_API_URL=.*|SERVICE_API_URL=http://$PUBLIC_IP/api|g" .env
    sed -i.bak "s|APP_API_URL=.*|APP_API_URL=http://$PUBLIC_IP/api|g" .env
    sed -i.bak "s|APP_WEB_URL=.*|APP_WEB_URL=http://$PUBLIC_IP|g" .env
    sed -i.bak "s|FILES_URL=.*|FILES_URL=http://$PUBLIC_IP|g" .env
    
    # Nginx 設定
    sed -i.bak "s|NGINX_SERVER_NAME=.*|NGINX_SERVER_NAME=_|g" .env
    sed -i.bak "s|NGINX_HTTPS_ENABLED=.*|NGINX_HTTPS_ENABLED=false|g" .env
    sed -i.bak "s|EXPOSE_NGINX_PORT=.*|EXPOSE_NGINX_PORT=80|g" .env
    
    # 開發環境設定
    sed -i.bak "s|DEPLOY_ENV=.*|DEPLOY_ENV=DEVELOPMENT|g" .env
    sed -i.bak "s|DEBUG=.*|DEBUG=false|g" .env
    
    echo -e "${GREEN}✓ 開發環境配置完成${NC}"
}

# 配置生產環境函數
configure_production_env() {
    read -p "請輸入您的域名 (例如: dify.yourdomain.com): " DOMAIN_NAME
    if [ -z "$DOMAIN_NAME" ]; then
        echo -e "${RED}域名不能為空${NC}"
        exit 1
    fi
    
    read -p "請輸入您的 email 地址（用於 SSL 證書）: " EMAIL
    if [ -z "$EMAIL" ]; then
        echo -e "${RED}Email 不能為空${NC}"
        exit 1
    fi
    
    echo -e "${YELLOW}設定生產環境配置...${NC}"
    
    # 基本 URL 設定（HTTPS）
    sed -i.bak "s|CONSOLE_API_URL=.*|CONSOLE_API_URL=https://$DOMAIN_NAME|g" .env
    sed -i.bak "s|CONSOLE_WEB_URL=.*|CONSOLE_WEB_URL=https://$DOMAIN_NAME|g" .env
    sed -i.bak "s|SERVICE_API_URL=.*|SERVICE_API_URL=https://$DOMAIN_NAME/api|g" .env
    sed -i.bak "s|APP_API_URL=.*|APP_API_URL=https://$DOMAIN_NAME/api|g" .env
    sed -i.bak "s|APP_WEB_URL=.*|APP_WEB_URL=https://$DOMAIN_NAME|g" .env
    sed -i.bak "s|FILES_URL=.*|FILES_URL=https://$DOMAIN_NAME|g" .env
    
    # Nginx 和 SSL 設定
    sed -i.bak "s|NGINX_SERVER_NAME=.*|NGINX_SERVER_NAME=$DOMAIN_NAME|g" .env
    sed -i.bak "s|NGINX_HTTPS_ENABLED=.*|NGINX_HTTPS_ENABLED=true|g" .env
    sed -i.bak "s|EXPOSE_NGINX_PORT=.*|EXPOSE_NGINX_PORT=80|g" .env
    sed -i.bak "s|EXPOSE_NGINX_SSL_PORT=.*|EXPOSE_NGINX_SSL_PORT=443|g" .env
    
    # SSL 證書設定
    sed -i.bak "s|CERTBOT_EMAIL=.*|CERTBOT_EMAIL=$EMAIL|g" .env
    sed -i.bak "s|CERTBOT_DOMAIN=.*|CERTBOT_DOMAIN=$DOMAIN_NAME|g" .env
    sed -i.bak "s|NGINX_ENABLE_CERTBOT_CHALLENGE=.*|NGINX_ENABLE_CERTBOT_CHALLENGE=true|g" .env
    
    # 生產環境設定
    sed -i.bak "s|DEPLOY_ENV=.*|DEPLOY_ENV=PRODUCTION|g" .env
    sed -i.bak "s|DEBUG=.*|DEBUG=false|g" .env
    
    echo -e "${GREEN}✓ 生產環境配置完成${NC}"
    echo -e "${YELLOW}請確保：${NC}"
    echo "1. DNS 已將 $DOMAIN_NAME 指向 $PUBLIC_IP"
    echo "2. EC2 安全組已開放 80 和 443 端口"
}

# 配置自定義環境函數
configure_custom_env() {
    echo -e "${YELLOW}自定義配置模式${NC}"
    
    read -p "使用域名還是 IP？(domain/ip): " address_type
    
    if [ "$address_type" = "domain" ]; then
        read -p "請輸入域名: " DOMAIN_NAME
        read -p "使用 HTTPS？(y/n): " use_https
        
        if [ "$use_https" = "y" ]; then
            PROTOCOL="https"
            sed -i.bak "s|NGINX_HTTPS_ENABLED=.*|NGINX_HTTPS_ENABLED=true|g" .env
            read -p "請輸入 email（用於 SSL）: " EMAIL
            sed -i.bak "s|CERTBOT_EMAIL=.*|CERTBOT_EMAIL=$EMAIL|g" .env
            sed -i.bak "s|CERTBOT_DOMAIN=.*|CERTBOT_DOMAIN=$DOMAIN_NAME|g" .env
        else
            PROTOCOL="http"
            sed -i.bak "s|NGINX_HTTPS_ENABLED=.*|NGINX_HTTPS_ENABLED=false|g" .env
        fi
        
        sed -i.bak "s|NGINX_SERVER_NAME=.*|NGINX_SERVER_NAME=$DOMAIN_NAME|g" .env
        BASE_URL="$PROTOCOL://$DOMAIN_NAME"
    else
        echo "使用 IP: $PUBLIC_IP"
        BASE_URL="http://$PUBLIC_IP"
        sed -i.bak "s|NGINX_SERVER_NAME=.*|NGINX_SERVER_NAME=_|g" .env
        sed -i.bak "s|NGINX_HTTPS_ENABLED=.*|NGINX_HTTPS_ENABLED=false|g" .env
    fi
    
    # 設定 URL
    sed -i.bak "s|CONSOLE_API_URL=.*|CONSOLE_API_URL=$BASE_URL|g" .env
    sed -i.bak "s|CONSOLE_WEB_URL=.*|CONSOLE_WEB_URL=$BASE_URL|g" .env
    sed -i.bak "s|SERVICE_API_URL=.*|SERVICE_API_URL=$BASE_URL/api|g" .env
    sed -i.bak "s|APP_API_URL=.*|APP_API_URL=$BASE_URL/api|g" .env
    sed -i.bak "s|APP_WEB_URL=.*|APP_WEB_URL=$BASE_URL|g" .env
    sed -i.bak "s|FILES_URL=.*|FILES_URL=$BASE_URL|g" .env
    
    echo -e "${GREEN}✓ 自定義配置完成${NC}"
}

# 生成安全密鑰
echo -e "${YELLOW}生成安全密鑰...${NC}"
if command -v openssl &> /dev/null; then
    NEW_SECRET=$(openssl rand -hex 32)
    sed -i.bak "s|SECRET_KEY=.*|SECRET_KEY=sk-$NEW_SECRET|g" .env
    echo -e "${GREEN}✓ 安全密鑰已生成${NC}"
else
    echo -e "${YELLOW}⚠ openssl 未安裝，請手動更新 SECRET_KEY${NC}"
fi

# 設定資料庫密碼
echo -e "${YELLOW}設定資料庫密碼...${NC}"
if command -v openssl &> /dev/null; then
    DB_PASSWORD=$(openssl rand -base64 16)
    sed -i.bak "s|DB_PASSWORD=.*|DB_PASSWORD=$DB_PASSWORD|g" .env
    echo -e "${GREEN}✓ 資料庫密碼已設定${NC}"
fi

# 清理備份檔案
rm -f .env.bak

echo ""
echo -e "${GREEN}=== 環境配置完成！ ===${NC}"
echo ""
echo -e "${YELLOW}配置摘要：${NC}"
echo "部署類型: $deploy_type"
if [ -n "$DOMAIN_NAME" ]; then
    echo "域名: $DOMAIN_NAME"
fi
echo "公共 IP: $PUBLIC_IP"
echo "私有 IP: $PRIVATE_IP"
echo ""
echo -e "${YELLOW}下一步：${NC}"
echo "1. 檢查 .env 檔案的設定"
echo "2. 執行 docker-compose up -d 啟動服務"
echo "3. 如果使用域名，確保 DNS 設定正確"
echo "4. 如果使用 HTTPS，確保防火牆開放 443 端口"
