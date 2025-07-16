#!/bin/bash

# EC2 Prisma Database Fix Script
# 這個腳本修復 dify-next-frontend 在 EC2 上的 Prisma 數據庫問題

set -e

echo "🔧 修復 EC2 上的 Prisma 數據庫問題..."

# 1. 創建數據庫目錄並設置權限
echo "📁 創建數據庫目錄..."
mkdir -p ./volumes/dify-next-frontend
sudo chown -R 1001:1001 ./volumes/dify-next-frontend
chmod 755 ./volumes/dify-next-frontend

# 2. 停止當前的容器
echo "🛑 停止當前容器..."
docker-compose stop dify-next-frontend || true

# 3. 刪除舊容器（如果存在）
echo "🗑️  清理舊容器..."
docker-compose rm -f dify-next-frontend || true

# 4. 重新構建並啟動容器
echo "🏗️  重新構建並啟動容器..."
docker-compose up -d --build dify-next-frontend

# 5. 等待容器啟動
echo "⏳ 等待容器啟動..."
sleep 10

# 6. 檢查容器狀態
echo "🔍 檢查容器狀態..."
docker-compose ps dify-next-frontend

# 7. 檢查日誌
echo "📋 查看最新日誌..."
docker-compose logs --tail=20 dify-next-frontend

# 8. 測試健康檢查
echo "🏥 測試健康檢查..."
sleep 30
curl -f http://localhost:3000/api/health || echo "❌ 健康檢查失敗，請查看日誌"

echo "✅ 修復腳本執行完成！"
echo "💡 如果仍有問題，請運行: docker-compose logs -f dify-next-frontend"
