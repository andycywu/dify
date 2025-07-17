#!/bin/bash
# EC2 重新部署腳本 - 修復Prisma問題
# 在EC2上執行此腳本來應用最新的修復

set -e

echo "🔄 開始重新部署過程..."

# 1. 停止當前運行的容器
echo "📦 停止現有容器..."
cd /home/ec2-user/dify/docker
docker-compose down

# 2. 拉取最新代碼
echo "📥 拉取最新代碼..."
cd /home/ec2-user/dify
git pull origin main

# 3. 重新構建前端映像（確保包含最新的Prisma文件）
echo "🔨 重新構建前端映像..."
cd docker
docker-compose build --no-cache dify-next-frontend

# 4. 拉取其他映像的更新
echo "📦 拉取其他映像更新..."
docker-compose pull

# 5. 啟動服務
echo "🚀 啟動服務..."
docker-compose up -d

# 6. 重新載入nginx配置
echo "🔄 重新載入nginx配置..."
docker-compose exec nginx nginx -s reload

# 6. 檢查服務狀態
echo "🔍 檢查服務狀態..."
sleep 10
docker-compose ps

# 7. 檢查前端日誌
echo "📋 檢查前端容器日誌（前20行）..."
docker-compose logs --tail 20 dify-next-frontend

echo "✅ 重新部署完成！"
echo "📌 如果仍有問題，請檢查詳細日誌："
echo "   docker-compose logs -f dify-next-frontend"
