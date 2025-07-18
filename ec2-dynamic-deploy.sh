#!/bin/bash
# 動態部署腳本 - 自動檢測並設置主機 IP

set -e

echo "🌐 動態檢測主機配置..."

# 檢測當前主機 IP
if [ -z "$HOST_IP" ]; then
    # 嘗試從多個來源獲取公網 IP
    HOST_IP=$(curl -s http://checkip.amazonaws.com 2>/dev/null || \
             curl -s https://ipinfo.io/ip 2>/dev/null || \
             curl -s https://api.ipify.org 2>/dev/null || \
             echo "localhost")
    echo "🔍 自動檢測到主機 IP: $HOST_IP"
else
    echo "🔧 使用環境變數中的 HOST_IP: $HOST_IP"
fi

# 設置端口配置
API_PORT=${API_PORT:-80}
FRONTEND_PORT=${FRONTEND_PORT:-8080}

echo "📋 部署配置："
echo "   主機 IP: $HOST_IP"
echo "   API 端口: $API_PORT"
echo "   前端端口: $FRONTEND_PORT"
echo ""

# 匯出環境變數
export HOST_IP
export API_PORT
export FRONTEND_PORT

# 停止現有容器
echo "📦 停止現有容器..."
cd /home/ec2-user/dify/docker
docker-compose down

# 拉取最新代碼
echo "📥 拉取最新代碼..."
cd /home/ec2-user/dify
git pull origin main

# 重新構建前端映像（傳遞動態 IP）
echo "🔨 重新構建前端映像（HOST_IP: $HOST_IP）..."
cd docker
docker-compose build --no-cache --build-arg HOST_IP=$HOST_IP dify-next-frontend

# 啟動服務
echo "🚀 啟動服務..."
docker-compose up -d

# 等待服務啟動
echo "⏳ 等待服務啟動..."
sleep 20

# 檢查服務狀態
echo "🔍 檢查服務狀態..."
docker-compose ps

# 檢查環境變數
echo "🔍 驗證環境變數設置..."
docker exec $(docker ps | grep dify-next-frontend | awk '{print $NF}') sh -c "
echo '=== 容器內環境變數 ==='
echo 'NEXT_PUBLIC_DIFY_API_BASE_URL=' \$NEXT_PUBLIC_DIFY_API_BASE_URL
echo 'NEXT_PUBLIC_API_URL=' \$NEXT_PUBLIC_API_URL
echo ''
echo '=== .env 文件內容 ==='
grep 'NEXT_PUBLIC.*API' /app/.env | head -3
"

# 測試服務
echo "🧪 測試服務連接..."
echo "Dify 原版: http://$HOST_IP/"
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" http://localhost/ || echo "連接失敗"

echo "Next.js 前端: http://$HOST_IP:$FRONTEND_PORT/"
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" http://localhost:$FRONTEND_PORT/ || echo "連接失敗"

echo ""
echo "✅ 動態部署完成！"
echo "🌐 訪問地址："
echo "   Dify 原版: http://$HOST_IP/"
echo "   Next.js 前端: http://$HOST_IP:$FRONTEND_PORT/"
echo ""
echo "💡 下次部署時，可以使用自定義 IP："
echo "   HOST_IP=your.custom.ip ./ec2-dynamic-deploy.sh"
