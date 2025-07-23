#!/bin/bash
# 修復 Dify 原始前端（80端口）的 RSC 路由問題

echo "🔧 修復 Dify 原始前端的 RSC 路由問題..."

echo "📊 當前端口配置："
echo "   - Dify 原始前端: 80 端口 (nginx -> web:3000)"
echo "   - dify-next-frontend: 8080 端口"

echo ""
echo "🐛 RSC 錯誤分析："
echo "   錯誤的 URL:"
echo "   - http://54.169.166.197/apps?_rsc=tg7gv"
echo "   - http://54.169.166.197/datasets?_rsc=1pj4l"
echo ""
echo "   這些是 Next.js RSC 請求，需要正確路由到後端 API"

echo ""
echo "🔄 重新啟動 Dify 原始前端相關服務..."

# 只重啟影響 80 端口的服務
docker-compose stop nginx web api worker

echo "⏳ 等待服務停止..."
sleep 5

# 清除容器
docker-compose rm -f nginx web api worker

echo "🚀 重新啟動服務..."
docker-compose up -d api worker web nginx

echo "⏳ 等待服務啟動（45秒）..."
sleep 45

echo "🔍 檢查服務狀態..."
docker-compose ps

echo ""
echo "🧪 測試 API 路由..."

# 測試主要的 API 端點
echo "測試 Console API setup:"
curl -s -o /dev/null -w "%{http_code}" http://54.169.166.197/console/api/setup && echo " ✅ Console API 可訪問" || echo " ❌ Console API 不可訪問"

echo "測試主頁:"
curl -s -o /dev/null -w "%{http_code}" http://54.169.166.197 && echo " ✅ 主頁可訪問" || echo " ❌ 主頁不可訪問"

echo ""
echo "📝 如果 RSC 錯誤持續，可能需要："
echo "   1. 檢查 web 服務的環境變數"
echo "   2. 確認 nginx 路由配置"
echo "   3. 檢查前端應用的 API 基礎 URL 配置"
echo ""
echo "🌐 訪問 Dify 原始前端: http://54.169.166.197 (80端口)"
echo "🌐 訪問 dify-next-frontend: http://54.169.166.197:8080"
echo ""
echo "⚠️  請完全清除瀏覽器緩存並重新訪問 80 端口"

echo ""
echo "🔍 查看 web 服務日誌:"
echo "   docker-compose logs web"
echo "🔍 查看 nginx 日誌:"
echo "   docker-compose logs nginx"
