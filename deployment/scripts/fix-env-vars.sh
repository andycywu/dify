#!/bin/bash
# 專門修復 Next.js 環境變數嵌入問題

set -e

echo "🔧 修復 Next.js 環境變數嵌入問題..."

cd /home/ec2-user/dify

# 步驟1: 停止前端容器
echo "📦 停止前端容器..."
cd ../docker
docker-compose stop dify-next-frontend

# 步驟2: 刪除舊的前端映像和容器
echo "🗑️ 刪除舊的前端映像..."
docker-compose rm -f dify-next-frontend
docker rmi $(docker images | grep dify-next-frontend | awk '{print $3}') 2>/dev/null || true

# 步驟3: 清理Docker快取
echo "🧹 清理Docker構建快取..."
docker builder prune -f

# 步驟4: 確認環境變數文件存在
echo "🔍 檢查環境變數文件..."
if [ ! -f ./dify-next-frontend/.env.aws ]; then
    echo "❌ .env.aws 文件不存在！"
    exit 1
fi

echo "📋 .env.aws 中的關鍵變數："
grep "NEXT_PUBLIC_DIFY_API_BASE_URL" ./dify-next-frontend/.env.aws

# 步驟5: 強制重新構建（不使用快取）
echo "🔨 強制重新構建前端映像（無快取）..."
docker-compose build --no-cache --force-rm dify-next-frontend

# 步驟6: 啟動前端容器
echo "🚀 啟動前端容器..."
docker-compose up -d dify-next-frontend

# 步驟7: 等待容器啟動
echo "⏳ 等待容器啟動..."
sleep 15

# 步驟8: 檢查構建結果
echo "🔍 檢查構建結果..."
CONTAINER_NAME=$(docker ps | grep dify-next-frontend | awk '{print $NF}')

if [ -z "$CONTAINER_NAME" ]; then
    echo "❌ 前端容器沒有啟動成功"
    echo "檢查構建日誌："
    docker-compose logs dify-next-frontend
    exit 1
fi

echo "✅ 容器啟動成功: $CONTAINER_NAME"

# 步驟9: 驗證環境變數
echo "🔍 驗證容器內環境變數..."
docker exec $CONTAINER_NAME sh -c "
echo '=== 運行時環境變數 ==='
echo 'NEXT_PUBLIC_DIFY_API_BASE_URL=' \$NEXT_PUBLIC_DIFY_API_BASE_URL
echo 'NEXT_PUBLIC_DIFY_API_KEY=' \$NEXT_PUBLIC_DIFY_API_KEY

echo ''
echo '=== .env 文件內容 ==='
grep 'NEXT_PUBLIC_DIFY_API_BASE_URL' /app/.env

echo ''
echo '=== 檢查 Next.js 構建產出中的環境變數 ==='
if [ -f /app/.next/server/middleware.js ]; then
    grep -o 'http://[^\"]*' /app/.next/server/middleware.js | head -5 || echo '沒有找到硬編碼的URL'
fi
"

# 步驟10: 測試API連接
echo ""
echo "🧪 測試前端連接..."
sleep 5

# 測試前端頁面加載
curl -s -f http://localhost:8080/ > /dev/null && echo "✅ 前端頁面加載正常" || echo "❌ 前端頁面加載失敗"

# 步驟11: 檢查瀏覽器開發者工具
echo ""
echo "🌐 請在瀏覽器中打開以下URL並檢查："
PUBLIC_IP=$(curl -s http://checkip.amazonaws.com)
echo "   http://${PUBLIC_IP}:8080/"
echo ""
echo "📋 在瀏覽器開發者工具中檢查："
echo "   1. Network 標籤中的API請求是否指向正確的URL"
echo "   2. Console 中是否還有 localhost 錯誤"
echo "   3. 如果仍有問題，檢查 Sources -> static/chunks 中的代碼"
echo ""
echo "🔧 如果問題仍然存在："
echo "   1. 檢查 Next.js 代碼中是否有硬編碼的 localhost"
echo "   2. 確認 process.env.NEXT_PUBLIC_DIFY_API_BASE_URL 在客戶端代碼中正確使用"
echo "   3. 檢查是否有快取問題（Ctrl+F5 強制刷新）"

echo ""
echo "✅ 環境變數修復完成！"
