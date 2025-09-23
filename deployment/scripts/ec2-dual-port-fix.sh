#!/bin/bash
# 恢復雙端口部署配置腳本
# Dify: 80端口, Next.js: 8080端口

set -e

echo "🔄 恢復雙端口部署配置..."

# 1. 停止當前運行的容器
echo "📦 停止現有容器..."
cd /home/ec2-user/dify/docker
docker-compose down

# 2. 拉取最新代碼
echo "📥 拉取最新代碼..."
cd /home/ec2-user/dify
git pull origin main

# 3. 重新構建並啟動服務
echo "🔨 重新構建前端映像..."
cd ../docker
docker-compose build --no-cache dify-next-frontend

echo "🚀 啟動服務..."
docker-compose up -d

# 4. 等待服務啟動
echo "⏳ 等待服務啟動..."
sleep 15

# 5. 檢查服務狀態
echo "🔍 檢查服務狀態..."
docker-compose ps

# 6. 檢查端口映射
echo "📋 檢查端口映射..."
echo "Dify原版應該在: http://$(curl -s http://checkip.amazonaws.com):80/"
echo "Next.js前端應該在: http://$(curl -s http://checkip.amazonaws.com):8080/"

# 7. 測試服務
echo "🧪 測試服務連接..."
echo "測試Dify原版 (80端口):"
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" http://localhost:80/ || echo "Dify服務可能未就緒"

echo "測試Next.js前端 (8080端口):"
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" http://localhost:8080/ || echo "Next.js服務可能未就緒"

echo "✅ 雙端口部署配置完成！"
echo ""
echo "🌐 訪問地址："
echo "   Dify原版: http://$(curl -s http://checkip.amazonaws.com):80/"
echo "   Next.js前端: http://$(curl -s http://checkip.amazonaws.com):8080/"
