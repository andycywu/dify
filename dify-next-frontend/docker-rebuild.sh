#!/bin/bash
# Docker 快速部署腳本 - 前處理系統
# 位置: ~/dify/dify-next-frontend/docker-rebuild.sh
# 用途: 一鍵重建並部署 dify-next-frontend 容器

set -e  # 遇到錯誤立即停止

echo "🚀 開始部署前處理系統..."
echo ""

# 1. 切換到 docker 目錄
echo "📂 [1/5] 切換到 Docker 目錄..."
cd ~/dify/docker || exit 1

# 2. 停止現有容器
echo "🛑 [2/5] 停止現有容器..."
docker-compose stop dify-next-frontend

# 3. 重新建置映像檔 (不使用快取)
echo "🔨 [3/5] 重新建置映像檔 (這可能需要 5-10 分鐘)..."
docker-compose build --no-cache dify-next-frontend

# 4. 啟動容器
echo "▶️  [4/5] 啟動容器..."
docker-compose up -d dify-next-frontend

# 5. 等待容器啟動
echo "⏳ [5/5] 等待容器啟動..."
sleep 5

# 檢查容器狀態
echo ""
echo "✅ 部署完成!"
echo ""
echo "📊 容器狀態:"
docker-compose ps dify-next-frontend

echo ""
echo "📝 即時日誌 (按 Ctrl+C 退出):"
docker-compose logs -f dify-next-frontend
