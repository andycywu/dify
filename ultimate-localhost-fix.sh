#!/bin/bash
# 終極修復腳本 - 解決localhost和API路徑問題

set -e

echo "🎯 終極修復：localhost + API路徑問題"
echo "================================================"

cd /home/ec2-user/dify

# 步驟1: 拉取最新修復
echo "📥 拉取最新代碼修復..."
git pull origin main

# 步驟2: 確認API路徑配置
echo "🔍 檢查API路徑配置..."
echo "當前 .env.aws 中的API配置："
grep "NEXT_PUBLIC_DIFY_API_BASE_URL" ./dify-next-frontend/.env.aws

# 步驟3: 確保API路徑正確 
echo "🔧 確保API路徑包含 /api/v1..."
if grep -q "NEXT_PUBLIC_DIFY_API_BASE_URL=http://54.169.166.197/api/v1" ./dify-next-frontend/.env.aws; then
    echo "✅ API路徑正確：包含 /api/v1"
else
    echo "❌ API路徑不正確，正在修復..."
    sed -i 's|NEXT_PUBLIC_DIFY_API_BASE_URL=http://54.169.166.197/v1|NEXT_PUBLIC_DIFY_API_BASE_URL=http://54.169.166.197/api/v1|g' ./dify-next-frontend/.env.aws
    echo "✅ 已修復API路徑為：http://54.169.166.197/api/v1"
fi

# 步驟4: 檢查源代碼是否有localhost硬編碼
echo "🔍 檢查源代碼localhost硬編碼..."
if grep -r "localhost/v1\|localhost/api" ./dify-next-frontend/hooks/ ./dify-next-frontend/components/ 2>/dev/null; then
    echo "❌ 發現localhost硬編碼，需要清除"
    exit 1
else
    echo "✅ 源代碼無localhost硬編碼"
fi

# 步驟5: 完全重新構建
echo "🔨 完全重新構建前端容器..."
cd docker

# 停止並清理
echo "🛑 停止前端容器..."
docker-compose stop dify-next-frontend || true
docker-compose rm -f dify-next-frontend || true

# 清理映像
echo "🗑️ 清理前端映像..."
docker rmi $(docker images | grep dify-next-frontend | awk '{print $3}') 2>/dev/null || true
docker rmi $(docker images | grep "<none>" | awk '{print $3}') 2>/dev/null || true

# 清理構建快取
echo "🧹 清理Docker構建快取..."
docker builder prune -a -f
docker system prune -f

# 重新構建（無快取）
echo "🔨 重新構建前端映像..."
DOCKER_BUILDKIT=1 docker-compose build --no-cache --pull --force-rm dify-next-frontend

# 啟動容器
echo "🚀 啟動前端容器..."
docker-compose up -d dify-next-frontend

# 步驟6: 等待並驗證
echo "⏳ 等待容器完全啟動..."
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

# 步驟7: 驗證修復結果
echo "🔍 驗證修復結果..."
docker exec $CONTAINER_NAME sh -c "
echo '=== 環境變數檢查 ==='
echo 'NEXT_PUBLIC_DIFY_API_BASE_URL=' \$NEXT_PUBLIC_DIFY_API_BASE_URL

echo ''
echo '=== .env 文件檢查 ==='
cat /app/.env | grep NEXT_PUBLIC_DIFY_API_BASE_URL

echo ''
echo '=== 檢查編譯後的JS文件 ==='
if find /app/.next -name '*.js' -type f -exec grep -l 'localhost/v1\|localhost/api' {} \; 2>/dev/null | head -3; then
    echo '❌ 編譯後文件仍包含localhost'
    exit 1
else
    echo '✅ 編譯後文件無localhost引用'
fi

echo ''
echo '=== 檢查API路徑 ==='
if find /app/.next -name '*.js' -type f -exec grep -l '54.169.166.197/api/v1' {} \; 2>/dev/null | head -3; then
    echo '✅ 編譯後文件包含正確的API路徑'
else
    echo '⚠️ 未在編譯文件中找到正確API路徑，檢查配置'
fi
"

# 步驟8: 測試訪問
echo ""
echo "🧪 測試前端訪問..."
sleep 5

if curl -s -f http://localhost:8080/ > /dev/null; then
    echo "✅ 前端頁面可訪問"
else
    echo "❌ 前端頁面訪問失敗"
fi

# 步驟9: 最終檢查API連通性
echo "🔌 測試API連通性..."
if curl -s -f http://54.169.166.197/api/v1/ping > /dev/null 2>&1; then
    echo "✅ Dify API可連通"
elif curl -s -f http://54.169.166.197/api/ping > /dev/null 2>&1; then
    echo "✅ API服務可連通"
else
    echo "⚠️ API連通性測試失敗，請檢查後端服務"
fi

# 步驟10: 完成
echo ""
echo "🎉 終極修復完成！"
echo "================================"
echo ""
PUBLIC_IP=$(curl -s http://checkip.amazonaws.com)
echo "🌐 請訪問前端並測試："
echo "   http://${PUBLIC_IP}:8080/"
echo ""
echo "🔧 測試步驟："
echo "   1. 打開瀏覽器開發者工具 (F12)"
echo "   2. 清除瀏覽器快取 (Ctrl+Shift+Delete)"
echo "   3. 硬刷新頁面 (Ctrl+F5)"
echo "   4. 進入 Network 標籤"
echo "   5. 嘗試發送聊天訊息"
echo "   6. 檢查API請求應指向: http://${PUBLIC_IP}/api/v1/"
echo ""
echo "✅ localhost + API路徑問題已全部修復！"
echo ""
echo "🚨 如果仍有問題，請檢查："
echo "   1. Dify後端是否正常運行在80端口"
echo "   2. nginx代理配置是否正確"
echo "   3. 容器日誌: docker-compose logs -f dify-next-frontend"
