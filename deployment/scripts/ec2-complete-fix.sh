#!/bin/bash
# EC2 完整修復指南 - 解決Prisma和API連接問題

set -e

echo "🚀 開始完整修復流程..."

# 步驟1: 停止所有容器
echo "📦 停止現有容器..."
cd /home/ec2-user/dify/docker
docker-compose down

# 步驟2: 拉取最新代碼
echo "📥 拉取最新代碼..."
cd /home/ec2-user/dify
git pull origin main

# 步驟3: 清理舊的映像和容器（可選但推薦）
echo "🧹 清理舊的Docker映像..."
docker system prune -f
docker rmi andywu719/dify-next-frontend:latest 2>/dev/null || true

# 步驟4: 重新構建前端映像
echo "🔨 重新構建前端映像（使用正確的環境變數）..."
cd ../docker
docker-compose build --no-cache dify-next-frontend

# 步驟5: 拉取其他映像更新
echo "📦 拉取其他映像更新..."
docker-compose pull

# 步驟6: 啟動所有服務
echo "🚀 啟動所有服務..."
docker-compose up -d

# 步驟7: 等待服務啟動
echo "⏳ 等待服務啟動（30秒）..."
sleep 30

# 步驟8: 檢查服務狀態
echo "🔍 檢查服務狀態..."
docker-compose ps

# 步驟9: 檢查前端容器日誌
echo "📋 檢查前端容器日誌（最後20行）..."
docker-compose logs --tail 20 dify-next-frontend

# 步驟10: 運行環境變數檢查
echo "🔍 檢查環境變數設置..."
if [ -f ../debug-env-vars.sh ]; then
    cd ..
    ./debug-env-vars.sh
else
    echo "環境變數檢查腳本不存在，手動檢查..."
    docker exec docker-dify-next-frontend-1 sh -c "echo 'NEXT_PUBLIC_DIFY_API_BASE_URL=' \$NEXT_PUBLIC_DIFY_API_BASE_URL"
fi

# 步驟11: 測試端點連接
echo "🧪 測試服務連接..."
echo "測試Dify原版 (80端口):"
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" http://localhost/ || echo "Dify原版連接失敗"

echo "測試Next.js前端 (8080端口):"
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" http://localhost:8080/ || echo "Next.js前端連接失敗"

echo "測試API端點 (通過nginx):"
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" http://localhost/v1/ || echo "API端點連接失敗"

# 步驟12: 顯示訪問信息
echo "✅ 修復完成！"
echo ""
echo "🌐 服務訪問地址："
PUBLIC_IP=$(curl -s http://checkip.amazonaws.com)
echo "   Dify原版: http://${PUBLIC_IP}/"
echo "   Next.js前端: http://${PUBLIC_IP}:8080/"
echo ""
echo "📋 如果還有問題，請檢查："
echo "   1. docker-compose logs -f dify-next-frontend"
echo "   2. docker-compose logs -f nginx"
echo "   3. docker-compose logs -f api"
echo ""
echo "🔧 故障排除："
echo "   - 如果前端顯示環境變數錯誤，檢查 .env.aws 文件"
echo "   - 如果API連接失敗，檢查nginx配置"
echo "   - 如果Prisma錯誤，容器會自動重啟並修復"
