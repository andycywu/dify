#!/bin/bash
# EC2 環境下 Dify RSC 路由問題診斷腳本

echo "🔍 EC2 環境下 Dify RSC 路由問題診斷..."
echo "=================================="

echo "📊 當前服務狀態："
docker-compose ps

echo ""
echo "🧪 測試問題路由："

# 測試失敗的 RSC 路由
echo "測試 /apps 路由:"
curl -v http://54.169.166.197/apps 2>&1 | head -20

echo ""
echo "測試 /datasets 路由:"
curl -v http://54.169.166.197/datasets 2>&1 | head -20

echo ""
echo "🔍 檢查 nginx 路由配置..."
docker-compose exec nginx cat /etc/nginx/conf.d/default.conf

echo ""
echo "🔍 檢查 web 服務環境變數..."
docker-compose exec web env | grep -E "(CONSOLE_API_URL|APP_API_URL|SERVICE_API_URL)"

echo ""
echo "📋 web 服務日誌 (最後 20 行):"
docker-compose logs --tail=20 web

echo ""
echo "📋 nginx 服務日誌 (最後 20 行):"
docker-compose logs --tail=20 nginx

echo ""
echo "📋 api 服務日誌 (最後 20 行):"
docker-compose logs --tail=20 api

echo ""
echo "🔍 分析結果："
echo "   如果看到 404 錯誤，可能是："
echo "   1. nginx 路由配置問題"
echo "   2. web 服務沒有正確處理這些路由"
echo "   3. 環境變數配置不正確"
echo ""
echo "   如果看到 5xx 錯誤，可能是："
echo "   1. 後端 API 服務問題"
echo "   2. 服務間通信問題"
echo ""
echo "📝 下一步："
echo "   根據上面的診斷結果，確定是否需要："
echo "   1. 修改 nginx 配置"
echo "   2. 修改環境變數"
echo "   3. 重新構建前端 image"
