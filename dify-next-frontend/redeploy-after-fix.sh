#!/bin/bash
# 重新部署前處理系統 (修正 TypeScript 錯誤後)

echo "🔄 重新部署前處理系統..."
echo ""

# 切換到專案目錄
cd ~/dify/dify-next-frontend

echo "📥 [1/4] 從 Windows 同步最新程式碼..."
# 注意: 你需要先從 Windows 推送變更到 Ubuntu
# 方法 1: 使用 git (如果有設定)
# git pull origin main

# 方法 2: 使用 rsync (從 Windows PowerShell 執行)
# rsync -avz --exclude 'node_modules' --exclude '.next' \
#   /c/Users/andycy.wu/dify/dify-next-frontend/ \
#   obmid@inblrlxAI001:~/dify/dify-next-frontend/

echo "   提示: 請確保已從 Windows 同步以下檔案:"
echo "   - lib/preprocess/types.ts (已修正 pdfInfo 型別)"
echo "   - next.config.js (已移除 api.bodyParser 設定)"
echo ""

echo "⏸️  請按 Enter 確認已同步檔案,或 Ctrl+C 取消..."
read

echo "🐳 [2/4] 切換到 docker 目錄..."
cd ~/dify/docker

echo "🔨 [3/4] 重新建置 Docker 映像檔..."
docker compose build --no-cache dify-next-frontend

echo "▶️  [4/4] 啟動容器..."
docker compose up -d dify-next-frontend

echo ""
echo "✅ 部署完成!"
echo ""
echo "📊 容器狀態:"
docker compose ps dify-next-frontend

echo ""
echo "📝 查看即時日誌:"
echo "   docker compose logs -f dify-next-frontend"
