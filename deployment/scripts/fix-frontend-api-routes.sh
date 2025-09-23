#!/bin/bash
# 修復前端 API 路由問題

echo "🔄 重新啟動 API 和前端服務..."

# 停止相關服務
docker-compose stop api worker web dify-next-frontend

# 清除容器
docker-compose rm -f api worker web dify-next-frontend

echo "⏳ 等待 5 秒..."
sleep 5

# 重新啟動服務
docker-compose up -d api worker web dify-next-frontend

echo "⏳ 等待服務啟動（30秒）..."
sleep 30

echo "🔍 檢查服務狀態..."
docker-compose ps

echo ""
echo "✅ 服務重啟完成！"
echo ""
echo "🌐 現在訪問: http://54.169.166.197"
echo ""
echo "📝 修復的問題:"
echo "   - 修正了 CONSOLE_API_URL 路徑 (/console/api)"
echo "   - 修正了 SERVICE_API_URL 路徑 (/v1)"
echo "   - 修正了 APP_API_URL 路徑 (/v1)"
echo ""
echo "⚠️  如果還有問題，請清除瀏覽器緩存"
