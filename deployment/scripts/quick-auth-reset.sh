#!/bin/bash
# 一鍵修復 Dify 401 認證問題

echo "🚀 一鍵修復 Dify 401 認證問題..."
echo "=================================="

echo "⚠️  警告: 這將重置所有用戶數據！"
read -p "確定要繼續嗎？ (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ 取消操作"
    exit 1
fi

echo "🔄 停止所有服務..."
docker compose down

echo "🗑️ 清除數據庫卷（重置所有數據）..."
docker volume ls | grep dify | awk '{print $2}' | xargs -r docker volume rm

echo "🚀 重新啟動服務..."
docker compose up -d

echo "⏳ 等待服務啟動（60秒）..."
sleep 60

echo "🔍 檢查服務狀態..."
docker compose ps

echo ""
echo "✅ 重置完成！"
echo ""
echo "🌐 現在請："
echo "1. 等待 2-3 分鐘讓所有服務完全啟動"
echo "2. 清除瀏覽器緩存和 Cookie"
echo "3. 訪問: http://54.169.166.197"
echo "4. 第一次訪問時會要求設置管理員帳號"
echo ""
echo "📝 建議的管理員設置:"
echo "   Name: Admin"
echo "   Email: admin@dify.ai"
echo "   Password: dify12345"
echo ""
echo "⚠️  注意: 所有之前的數據（應用、知識庫等）都已被清除"
