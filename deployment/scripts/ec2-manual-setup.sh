#!/bin/bash

# 使用 AWS CLI 和 Session Manager 連線到 EC2 實例的腳本

INSTANCE_ID="i-0123456789abcdef0"  # 請替換為您的實際 Instance ID
REGION="ap-southeast-1"

echo "使用 AWS Session Manager 連線到 EC2 實例..."
echo "如果您有 AWS CLI 已配置，可以嘗試以下命令："
echo ""
echo "aws ssm start-session --target $INSTANCE_ID --region $REGION"
echo ""
echo "或者您可以："
echo "1. 登入 AWS Console"
echo "2. 到 EC2 服務"
echo "3. 選擇您的實例"
echo "4. 點擊 'Connect'"
echo "5. 選擇 'Session Manager'"
echo ""
echo "然後在 EC2 實例中執行以下命令："
echo ""
cat << 'REMOTE_COMMANDS'
# 在 EC2 實例中執行：

# 1. 安裝 Docker 和 Git（如果尚未安裝）
sudo yum update -y
sudo yum install -y docker git
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -a -G docker ec2-user

# 2. 安裝 Docker Compose
sudo curl -L "https://github.com/../docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
sudo ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose

# 3. 重新載入群組權限
newgrp docker

# 4. 克隆代碼
git clone https://github.com/andycywu/dify
cd dify/docker

# 5. 設置環境
cp .env.example .env

# 6. 獲取公共 IP 並配置
PUBLIC_IP=$(curl -s ifconfig.me)
sed -i "s|CONSOLE_API_URL=.*|CONSOLE_API_URL=http://$PUBLIC_IP:3001|g" .env
sed -i "s|CONSOLE_WEB_URL=.*|CONSOLE_WEB_URL=http://$PUBLIC_IP:3001|g" .env
sed -i "s|SERVICE_API_URL=.*|SERVICE_API_URL=http://$PUBLIC_IP:5001|g" .env
sed -i "s|APP_API_URL=.*|APP_API_URL=http://$PUBLIC_IP:5001|g" .env
sed -i "s|APP_WEB_URL=.*|APP_WEB_URL=http://$PUBLIC_IP:3001|g" .env

# 7. 生成新的密鑰
NEW_SECRET=$(openssl rand -hex 32)
sed -i "s|SECRET_KEY=.*|SECRET_KEY=sk-$NEW_SECRET|g" .env

# 8. 創建必要目錄
mkdir -p ../rest-to-soap-proxy
touch ../rest-to-soap-proxy/.env

# 9. 修改 docker-compose.yaml 添加端口映射
# 為 web 服務添加端口
sed -i '/ENABLE_WEBSITE_WATERCRAWL: ${ENABLE_WEBSITE_WATERCRAWL:-true}/a\    ports:\n      - "3001:3000"' docker-compose.yaml

# 為 api 服務添加端口
sed -i '/- \.\/volumes\/app\/storage:\/app\/api\/storage/i\    ports:\n      - "5001:5001"' docker-compose.yaml

# 10. 啟動服務
docker-compose down || true
docker-compose pull || true
docker-compose up -d api web db redis weaviate plugin_daemon

# 11. 檢查狀態
sleep 30
docker ps
echo "Web 介面: http://$PUBLIC_IP:3001"
echo "API: http://$PUBLIC_IP:5001"

REMOTE_COMMANDS
