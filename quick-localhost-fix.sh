#!/bin/bash
# 快速修復 localhost 硬編碼問題

set -e

echo "🔧 快速修復 localhost 硬編碼問題..."

cd /home/ec2-user/dify

# 1. 拉取最新代碼
echo "📥 拉取最新修復..."
git pull origin main

# 2. 驗證修復是否已應用
echo "🔍 檢查修復狀態..."
if grep -q "|| 'http://localhost/v1'" dify-next-frontend/hooks/useChatSettings.ts; then
    echo "❌ 代碼中仍有硬編碼localhost，需要重新構建"
    NEEDS_REBUILD=true
else
    echo "✅ 硬編碼localhost已從代碼中移除"
    NEEDS_REBUILD=false
fi

# 3. 檢查容器中的構建產出
echo "🔍 檢查當前容器中的編譯結果..."
CONTAINER_NAME=$(docker ps | grep dify-next-frontend | awk '{print $NF}')
if [ -n "$CONTAINER_NAME" ]; then
    echo "檢查容器 $CONTAINER_NAME 中編譯後的代碼..."
    if docker exec $CONTAINER_NAME sh -c "find /app/.next -name '*.js' -type f -exec grep -l 'localhost/v1' {} \;" | head -1; then
        echo "❌ 編譯後的文件仍包含localhost/v1，需要重新構建"
        NEEDS_REBUILD=true
    else
        echo "✅ 編譯後的文件已修復"
    fi
else
    echo "⚠️ 前端容器未運行，需要重新構建"
    NEEDS_REBUILD=true
fi

# 4. 如果需要重新構建
if [ "$NEEDS_REBUILD" = true ]; then
    echo "🔨 執行完整重新構建..."
    
    cd docker
    
    # 停止並清理
    docker-compose stop dify-next-frontend
    docker-compose rm -f dify-next-frontend
    docker rmi $(docker images | grep dify-next-frontend | awk '{print $3}') 2>/dev/null || true
    
    # 重新構建
    echo "構建前端映像（包含localhost修復）..."
    docker-compose build --no-cache dify-next-frontend
    
    # 啟動
    echo "啟動前端容器..."
    docker-compose up -d dify-next-frontend
    
    # 等待啟動
    echo "等待容器啟動..."
    sleep 30
fi

# 5. 最終驗證
echo "🧪 最終驗證..."
CONTAINER_NAME=$(docker ps | grep dify-next-frontend | awk '{print $NF}')
if [ -n "$CONTAINER_NAME" ]; then
    echo "檢查環境變數："
    docker exec $CONTAINER_NAME sh -c "echo 'NEXT_PUBLIC_DIFY_API_BASE_URL=' \$NEXT_PUBLIC_DIFY_API_BASE_URL"
    
    echo "檢查編譯結果："
    if docker exec $CONTAINER_NAME sh -c "find /app/.next -name '*.js' -type f -exec grep -l 'localhost/v1' {} \;" | head -1; then
        echo "❌ 仍有問題，可能需要清除瀏覽器快取"
    else
        echo "✅ 修復成功！"
    fi
    
    echo "測試前端訪問："
    if curl -s -f http://localhost:8080/ > /dev/null; then
        echo "✅ 前端可訪問"
    else
        echo "❌ 前端訪問失敗"
    fi
else
    echo "❌ 前端容器未啟動"
    exit 1
fi

echo ""
echo "🎉 修復完成！"
echo "🌐 請訪問前端並測試: http://$(curl -s http://checkip.amazonaws.com):8080/"
echo "🔧 如果仍有localhost錯誤，請："
echo "   1. 清除瀏覽器快取 (Ctrl+Shift+Delete)"
echo "   2. 硬刷新頁面 (Ctrl+F5)"
echo "   3. 檢查Network標籤中的API請求URL"
