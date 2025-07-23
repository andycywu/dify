#!/bin/bash
# EC2 專用：修復 Dify RSC 路由問題（無需重建 image）

echo "🔧 EC2 環境：修復 Dify RSC 路由問題..."
echo "====================================="

echo "📝 分析問題："
echo "   RSC 錯誤路由:"
echo "   - /apps?_rsc=xxx"
echo "   - /datasets?_rsc=xxx"
echo "   - /tools?_rsc=xxx"
echo "   - /explore/apps?_rsc=xxx"

echo ""
echo "🔍 這些是 Next.js RSC (React Server Components) 請求"
echo "   需要確保它們被正確路由到前端服務"

echo ""
echo "🔧 應用修復方案 1: 重新啟動服務並清除緩存..."

# 停止服務
docker-compose stop nginx web

# 清除 nginx 和 web 容器
docker-compose rm -f nginx web

echo "⏳ 等待 5 秒..."
sleep 5

# 重新啟動服務
docker-compose up -d nginx web

echo "⏳ 等待服務啟動（30秒）..."
sleep 30

echo "🔍 檢查服務狀態..."
docker-compose ps | grep -E "(nginx|web)"

echo ""
echo "🧪 測試修復結果..."

# 測試主頁
echo "測試主頁:"
curl -s -o /dev/null -w "HTTP狀態碼: %{http_code}\n" http://54.169.166.197

# 測試 console API
echo "測試 Console API:"
curl -s -o /dev/null -w "HTTP狀態碼: %{http_code}\n" http://54.169.166.197/console/api/setup

echo ""
echo "📋 檢查 nginx 配置..."
echo "當前 nginx 路由配置："
docker-compose exec nginx cat /etc/nginx/conf.d/default.conf | grep -A 3 -B 1 "location"

echo ""
echo "✅ 修復完成！"
echo ""
echo "🌐 請重新訪問: http://54.169.166.197"
echo ""
echo "⚠️  重要步驟："
echo "   1. 完全清除瀏覽器緩存和 Cookie"
echo "   2. 使用無痕模式重新訪問"
echo "   3. 檢查瀏覽器開發者工具的 Network 標籤"
echo ""
echo "🔍 如果問題持續，運行診斷腳本："
echo "   ./diagnose-rsc-routes.sh"
echo ""
echo "📝 如果需要修改代碼："
echo "   1. 在本地修改代碼"
echo "   2. 重新構建 image"
echo "   3. 推送到 Docker Hub"
echo "   4. 在 EC2 上拉取新 image"
