#!/bin/bash

# 將部署腳本傳送到 EC2 並執行

EC2_HOST="ec2-54-169-166-197.ap-southeast-1.compute.amazonaws.com"
KEY_FILE="/Users/andycyw/dify/tpv-dify-key.pem"
SCRIPT_FILE="/Users/andycyw/dify/deploy-ec2-local.sh"

echo "正在將部署腳本傳送到 EC2 實例..."

# 方法 1：嘗試使用 SCP 傳送檔案
if scp -i "$KEY_FILE" "$SCRIPT_FILE" ec2-user@$EC2_HOST:~/deploy-ec2.sh 2>/dev/null; then
    echo "✓ 檔案傳送成功，正在執行部署..."
    ssh -i "$KEY_FILE" ec2-user@$EC2_HOST "chmod +x ~/deploy-ec2.sh && ~/deploy-ec2.sh"
else
    echo "⚠ SCP 傳送失敗，嘗試替代方法..."
    
    # 方法 2：將腳本內容通過 SSH 直接傳送
    echo "正在通過 SSH 直接傳送腳本內容..."
    
    # 建立一個暫時的腳本來處理傳送
    cat << 'TRANSFER_SCRIPT' > /tmp/transfer_deploy.sh
#!/bin/bash
# 這個腳本將在本地執行，通過 SSH 傳送部署腳本到 EC2

DEPLOY_SCRIPT=$(cat << 'DEPLOY_EOF'
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

echo -e "${YELLOW}正在安裝必要的軟體...${NC}"

# 檢查 Docker 是否安裝
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}Docker 未安裝，正在安裝...${NC}"
    sudo yum update -y
    sudo yum install -y docker git
    sudo systemctl start docker
    sudo systemctl enable docker
    sudo usermod -a -G docker $USER
    echo -e "${GREEN}✓ Docker 安裝完成${NC}"
    echo -e "${YELLOW}重新啟動群組權限...${NC}"
    exec newgrp docker
fi

# 檢查 Git 是否安裝
if ! command -v git &> /dev/null; then
    echo -e "${YELLOW}安裝 Git...${NC}"
    sudo yum install -y git
fi

# 檢查 Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo -e "${YELLOW}安裝 Docker Compose...${NC}"
    sudo curl -L "https://github.com/../docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    sudo ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose
    echo -e "${GREEN}✓ Docker Compose 安裝完成${NC}"
fi

# 克隆或更新代碼
REPO_URL="https://github.com/andycywu/dify"
PROJECT_DIR="dify"

echo -e "${YELLOW}處理代碼目錄...${NC}"

# 清理舊目錄
if [ -d "$PROJECT_DIR" ]; then
    echo -e "${YELLOW}清理現有目錄...${NC}"
    cd "$PROJECT_DIR/docker" 2>/dev/null && docker-compose down || true
    cd - > /dev/null
    rm -rf "$PROJECT_DIR"
fi

echo -e "${YELLOW}克隆代碼...${NC}"
git clone "$REPO_URL" "$PROJECT_DIR"
cd "$PROJECT_DIR/docker"

# 設置環境檔案
if [ -f ".env.example" ]; then
    cp .env.example .env
fi

# 獲取公共 IP
PUBLIC_IP=$(curl -s ifconfig.me)
echo "公共 IP: $PUBLIC_IP"

# 配置環境變數
sed -i "s|CONSOLE_API_URL=.*|CONSOLE_API_URL=http://$PUBLIC_IP:3001|g" .env
sed -i "s|CONSOLE_WEB_URL=.*|CONSOLE_WEB_URL=http://$PUBLIC_IP:3001|g" .env
sed -i "s|SERVICE_API_URL=.*|SERVICE_API_URL=http://$PUBLIC_IP:5001|g" .env
sed -i "s|APP_API_URL=.*|APP_API_URL=http://$PUBLIC_IP:5001|g" .env
sed -i "s|APP_WEB_URL=.*|APP_WEB_URL=http://$PUBLIC_IP:3001|g" .env

# 生成密鑰
NEW_SECRET=$(openssl rand -hex 32)
sed -i "s|SECRET_KEY=.*|SECRET_KEY=sk-$NEW_SECRET|g" .env

# 創建必要目錄
mkdir -p ../rest-to-soap-proxy
touch ../rest-to-soap-proxy/.env

# 修改 docker-compose 添加端口
echo -e "${YELLOW}配置端口...${NC}"

# 在 web 服務中添加端口
if ! grep -A 10 "web:" docker-compose.yaml | grep -q "ports:"; then
    # 找到 web 服務並添加端口
    awk '
    /^  web:/ { in_web = 1 }
    in_web && /^  [a-zA-Z]/ && !/^  web:/ { 
        print "    ports:"
        print "      - \"3001:3000\""
        in_web = 0
    }
    { print }
    ' docker-compose.yaml > docker-compose.yaml.tmp && mv docker-compose.yaml.tmp docker-compose.yaml
fi

# 在 api 服務中添加端口
if ! grep -A 15 "api:" docker-compose.yaml | grep -q "ports:"; then
    awk '
    /^  api:/ { in_api = 1 }
    in_api && /^    volumes:/ {
        print "    ports:"
        print "      - \"5001:5001\""
        print $0
        in_api = 0
        next
    }
    { print }
    ' docker-compose.yaml > docker-compose.yaml.tmp && mv docker-compose.yaml.tmp docker-compose.yaml
fi

echo -e "${YELLOW}啟動服務...${NC}"
docker-compose down || true
docker-compose pull || true
docker-compose up -d api web db redis weaviate plugin_daemon

sleep 30

echo -e "${GREEN}=== 部署完成！ ===${NC}"
echo "Web 介面: http://$PUBLIC_IP:3001"
echo "API: http://$PUBLIC_IP:5001"

DEPLOY_EOF
)

# 將腳本傳送到 EC2
echo "$DEPLOY_SCRIPT" | ssh -i "$1" ec2-user@$2 "cat > deploy-script.sh && chmod +x deploy-script.sh && ./deploy-script.sh"
TRANSFER_SCRIPT

    chmod +x /tmp/transfer_deploy.sh
    /tmp/transfer_deploy.sh "$KEY_FILE" "$EC2_HOST"
    rm /tmp/transfer_deploy.sh
fi
