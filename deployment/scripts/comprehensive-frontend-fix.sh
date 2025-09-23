#!/bin/bash
# 全面修復前端 API 路由和 RSC 請求問題

echo "🔧 全面修復前端路由問題..."

# 檢查當前服務狀態
echo "📊 當前服務狀態："
docker-compose ps

echo ""
echo "🔄 重新啟動所有相關服務..."

# 停止服務
docker-compose stop

echo "⏳ 等待所有服務停止..."
sleep 10

# 重新啟動服務
docker-compose up -d

echo "⏳ 等待服務啟動（60秒）..."
sleep 60

echo "🔍 檢查服務狀態..."
docker-compose ps

echo ""
echo "🧪 測試 API 端點..."

# 測試基本連線
echo "測試基本連線:"
curl -f http://54.169.166.197 && echo "✅ 主頁可訪問" || echo "❌ 主頁不可訪問"

# 測試 API 端點
echo "測試 Console API:"
curl -f http://54.169.166.197/console/api/setup && echo "✅ Console API 可訪問" || echo "❌ Console API 不可訪問"

echo "測試 Service API:"
curl -f http://54.169.166.197/v1/health-check && echo "✅ Service API 可訪問" || echo "❌ Service API 不可訪問"

echo ""
echo "📝 問題分析："
echo "   RSC 錯誤通常是因為："
echo "   1. Next.js 前端服務沒有正確啟動"
echo "   2. 環境變數配置不正確"
echo "   3. 瀏覽器緩存問題"
echo ""
echo "🌐 訪問: http://54.169.166.197"
echo ""
echo "⚠️  請執行以下步驟："
echo "   1. 完全清除瀏覽器緩存和 Cookie"
echo "   2. 使用無痕模式訪問"
echo "   3. 如果還有問題，檢查瀏覽器開發者工具的 Network 標籤"
echo ""
echo "🔍 如果問題持續，請檢查以下日誌："
echo "   docker-compose logs web"
echo "   docker-compose logs dify-next-frontend"
echo "   docker-compose logs api"
