#!/bin/bash
# 修復前端服務衝突和環境變數問題

echo "🔧 修復前端服務衝突問題..."

echo "📊 當前運行的前端服務："
docker-compose ps | grep -E "(web|dify-next-frontend)"

echo ""
echo "🛑 問題分析："
echo "   你有兩個前端服務在運行："
echo "   1. web (langgenius/dify-web:1.4.0)"
echo "   2. dify-next-frontend (andywu719/dify-next-frontend:latest)"
echo "   這可能導致 RSC 請求衝突"

echo ""
echo "🔄 停止衝突的前端服務..."

# 停止 dify-next-frontend 服務
docker-compose stop dify-next-frontend

echo "🗑️ 移除 dify-next-frontend 容器..."
docker-compose rm -f dify-next-frontend

echo ""
echo "🔄 重新啟動主要前端服務..."

# 重新啟動 web 服務
docker-compose stop web nginx
docker-compose rm -f web nginx

# 重新啟動服務
docker-compose up -d nginx web

echo "⏳ 等待服務啟動（30秒）..."
sleep 30

echo "🔍 檢查服務狀態..."
docker-compose ps

echo ""
echo "🧪 測試連線..."
curl -f http://54.169.166.197 && echo "✅ 主頁可訪問" || echo "❌ 主頁不可訪問"

echo ""
echo "✅ 修復完成！"
echo ""
echo "📝 修復內容："
echo "   - 停止了衝突的 dify-next-frontend 服務"
echo "   - 重新啟動了主要的 web 服務"
echo "   - 重新啟動了 nginx 反向代理"
echo ""
echo "🌐 現在訪問: http://54.169.166.197"
echo ""
echo "⚠️  請完全清除瀏覽器緩存並重新訪問"
