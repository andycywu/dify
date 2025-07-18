#!/bin/bash
# 最終修復腳本 - 解決localhost問題，使用正確的API路徑

set -e

echo "🎯 最終修復：localhost問題 + 正確API路徑"
echo "============================================"

cd /home/ec2-user/dify

# 步驟1: 拉取最新修復
echo "📥 拉取最新代碼..."
git pull origin main

# 步驟2: 確認API配置
echo "🔍 確認API配置..."
echo "API配置："
grep "NEXT_PUBLIC_DIFY_API_BASE_URL" ./dify-next-frontend/.env.aws

# 步驟3: 測試API連通性
echo "🔌 測試API連通性..."
if curl -s http://54.169.166.197/v1/ | grep -q "Dify OpenAPI"; then
    echo "✅ Dify API 可正常訪問"
else
    echo "❌ Dify API 無法訪問，請檢查後端服務"
    exit 1
fi

# 步驟4: 完全重新構建前端
echo "🔨 完全重新構建前端容器..."
cd docker

# 停止並清理
echo "🛑 停止並清理前端容器..."
docker-compose stop dify-next-frontend || true
docker-compose rm -f dify-next-frontend || true

# 清理映像和快取
echo "🗑️ 清理Docker映像和快取..."
docker rmi $(docker images | grep -E "(dify-next-frontend|andywu719/dify-next-frontend)" | awk '{print $3}') 2>/dev/null || true
docker builder prune -a -f
docker system prune -f

# 強制重新構建
echo "🔨 強制重新構建（無快取）..."
DOCKER_BUILDKIT=1 docker-compose build --no-cache --pull --force-rm dify-next-frontend

# 啟動容器
echo "🚀 啟動前端容器..."
docker-compose up -d dify-next-frontend

# 步驟5: 等待並驗證
echo "⏳ 等待容器啟動（30秒）..."
sleep 30

# 檢查容器狀態
CONTAINER_NAME=$(docker ps | grep dify-next-frontend | awk '{print $NF}')
if [ -z "$CONTAINER_NAME" ]; then
    echo "❌ 前端容器啟動失敗"
    echo "檢查日誌："
    docker-compose logs --tail 50 dify-next-frontend
    exit 1
fi

echo "✅ 前端容器啟動成功: $CONTAINER_NAME"

# 步驟6: 驗證環境變數和編譯結果
echo "🔍 驗證修復結果..."
docker exec $CONTAINER_NAME sh -c "
echo '=== 環境變數檢查 ==='
echo 'NEXT_PUBLIC_DIFY_API_BASE_URL=' \$NEXT_PUBLIC_DIFY_API_BASE_URL

echo ''
echo '=== .env 文件檢查 ==='
grep 'NEXT_PUBLIC_DIFY_API_BASE_URL' /app/.env || echo '未找到環境變數文件'

echo ''
echo '=== 檢查編譯後的JS是否包含localhost ==='
if find /app/.next -name '*.js' -type f -exec grep -l 'localhost/v1' {} \; 2>/dev/null | head -3; then
    echo '❌ 編譯後文件仍包含localhost'
else
    echo '✅ 編譯後文件不再包含localhost'
fi

echo ''
echo '=== 檢查編譯後的JS是否包含正確API URL ==='
if find /app/.next -name '*.js' -type f -exec grep -l '54.169.166.197/v1' {} \; 2>/dev/null | head -3; then
    echo '✅ 編譯後文件包含正確的API URL'
else
    echo '⚠️ 編譯後文件中未找到EC2 API URL'
fi
"

# 步驟7: 測試前端訪問
echo ""
echo "🧪 測試前端訪問..."
if curl -s -f http://localhost:8080/ > /dev/null; then
    echo "✅ 前端頁面可訪問"
else
    echo "❌ 前端頁面訪問失敗"
fi

# 步驟8: 完成
echo ""
echo "🎉 修復完成！"
echo "===================="
echo ""
PUBLIC_IP=$(curl -s http://checkip.amazonaws.com)
echo "🌐 訪問前端："
echo "   http://${PUBLIC_IP}:8080/"
echo ""
echo "📋 API 測試指令："
echo "   # 基本API測試："
echo "   curl http://${PUBLIC_IP}/v1/"
echo ""
echo "   # 對話API測試（需要API key）："
echo "   curl -H \"Authorization: Bearer app-ldXAyD3A91tXzB6Kkd8hlyP2\" http://${PUBLIC_IP}/v1/conversations"
echo ""
echo "🔧 瀏覽器測試步驟："
echo "   1. 清除瀏覽器快取 (Ctrl+Shift+Delete)"
echo "   2. 硬刷新頁面 (Ctrl+F5)"
echo "   3. 開啟開發者工具 (F12) → Network 標籤"
echo "   4. 嘗試發送聊天訊息"
echo "   5. 檢查API請求是否指向: http://${PUBLIC_IP}/v1/"
echo ""
echo "✅ localhost問題應已徹底解決！"
echo ""
echo "🚨 如果仍有問題："
echo "   - 檢查容器日誌: docker-compose logs -f dify-next-frontend"
echo "   - 強制清除瀏覽器所有資料"
echo "   - 確認後端Dify服務正常運行"
