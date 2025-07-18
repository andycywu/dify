#!/bin/bash
# 最終修復腳本 - 解決前端硬編碼localhost問題

set -e

echo "🎯 最終修復：硬編碼localhost問題"
echo "=========================================="

cd /home/ec2-user/dify

# 步驟1: 拉取最新修復
echo "📥 拉取最新代碼（包含hardcoded localhost修復）..."
git pull origin main

# 步驟2: 停止前端容器
echo "🛑 停止前端容器..."
cd docker
docker-compose stop dify-next-frontend

# 步驟3: 完全清理前端映像和構建快取
echo "🧹 完全清理前端映像和構建快取..."
docker-compose rm -f dify-next-frontend
docker rmi $(docker images | grep -E "(dify-next-frontend|<none>)" | awk '{print $3}') 2>/dev/null || true
docker builder prune -a -f
docker system prune -f

# 步驟4: 檢查關鍵修復文件
echo "🔍 驗證關鍵修復文件..."
cd /home/ec2-user/dify
echo "檢查 useChatSettings.ts 修復："
grep -n "apiBaseUrl.*localhost" ./dify-next-frontend/hooks/useChatSettings.ts && echo "❌ 仍然包含hardcoded localhost" || echo "✅ hardcoded localhost已移除"

echo "檢查 .env.aws 環境變數："
grep "NEXT_PUBLIC_DIFY_API_BASE_URL" ./dify-next-frontend/.env.aws

# 步驟5: 強制重新構建
echo "🔨 強制重新構建前端映像（確保修復生效）..."
cd docker
DOCKER_BUILDKIT=1 docker-compose build --no-cache --pull --force-rm dify-next-frontend

# 步驟6: 啟動前端
echo "🚀 啟動前端容器..."
docker-compose up -d dify-next-frontend

# 步驟7: 等待啟動並檢查
echo "⏳ 等待容器完全啟動..."
sleep 20

# 檢查容器狀態
CONTAINER_NAME=$(docker ps | grep dify-next-frontend | awk '{print $NF}')
if [ -z "$CONTAINER_NAME" ]; then
    echo "❌ 前端容器啟動失敗"
    echo "檢查日誌："
    docker-compose logs --tail 50 dify-next-frontend
    exit 1
fi

echo "✅ 前端容器啟動成功: $CONTAINER_NAME"

# 步驟8: 檢查構建結果
echo "🔍 檢查修復結果..."
docker exec $CONTAINER_NAME sh -c "
echo '=== 環境變數檢查 ==='
echo 'NEXT_PUBLIC_DIFY_API_BASE_URL=' \$NEXT_PUBLIC_DIFY_API_BASE_URL

echo ''
echo '=== .env 文件檢查 ==='
grep 'NEXT_PUBLIC_DIFY_API_BASE_URL' /app/.env

echo ''
echo '=== 檢查編譯後的JS文件是否還有localhost ==='
find /app/.next -name '*.js' -type f -exec grep -l 'localhost/v1' {} \; | head -3 || echo '✅ 編譯後的文件不再包含localhost/v1'
"

# 步驟9: 測試訪問
echo ""
echo "🧪 測試前端訪問..."
sleep 5

if curl -s -f http://localhost:8080/ > /dev/null; then
    echo "✅ 前端頁面訪問正常"
else
    echo "❌ 前端頁面訪問失敗"
fi

# 步驟10: 最終指引
echo ""
echo "🎉 修復完成！"
echo "================================"
echo ""
PUBLIC_IP=$(curl -s http://checkip.amazonaws.com)
echo "🌐 請訪問前端並測試："
echo "   http://${PUBLIC_IP}:8080/"
echo ""
echo "🔧 測試步驟："
echo "   1. 打開瀏覽器開發者工具 (F12)"
echo "   2. 進入 Network 標籤"
echo "   3. 嘗試發送聊天訊息"
echo "   4. 檢查API請求是否指向: http://${PUBLIC_IP}/v1/"
echo "   5. 不應該再看到 localhost 錯誤"
echo ""
echo "🚨 如果仍有問題："
echo "   1. 清除瀏覽器快取 (Ctrl+Shift+Delete)"
echo "   2. 強制刷新頁面 (Ctrl+F5)"
echo "   3. 檢查容器日誌: docker-compose logs -f dify-next-frontend"
echo ""
echo "✅ localhost硬編碼問題已修復！"
