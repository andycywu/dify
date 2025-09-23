#!/bin/bash
# 檢查Next.js前端環境變數腳本

echo "🔍 檢查Next.js前端環境變數..."

# 進入容器檢查環境變數
echo "📋 檢查容器內的環境變數:"
docker exec docker-dify-next-frontend-1 sh -c "
echo '環境變數檢查：'
echo 'NODE_ENV=' \$NODE_ENV
echo 'NEXT_PUBLIC_DIFY_API_BASE_URL=' \$NEXT_PUBLIC_DIFY_API_BASE_URL
echo 'NEXT_PUBLIC_DIFY_API_KEY=' \$NEXT_PUBLIC_DIFY_API_KEY
echo ''
echo '檢查 .env 文件：'
if [ -f /app/.env ]; then
  echo '.env 文件存在'
  grep -E '^NEXT_PUBLIC_' /app/.env || echo '沒有找到 NEXT_PUBLIC_ 變數'
else
  echo '.env 文件不存在'
fi
echo ''
echo '檢查建構時的環境變數檔案：'
ls -la /app/.env* 2>/dev/null || echo '沒有找到環境變數檔案'
"

echo ""
echo "🌐 測試前端API連接："
echo "正在測試 http://localhost:8080/ ..."
curl -s -I http://localhost:8080/ | head -n 1 || echo "無法連接到前端"

echo ""
echo "🔌 測試後端API連接："
echo "正在測試 http://localhost/v1/ ..."
curl -s -I http://localhost/v1/ | head -n 1 || echo "無法連接到後端API"

echo ""
echo "✅ 檢查完成！"
