#!/bin/bash
# 修復 Dify API 連接問題腳本 - EC2 版本

echo "🔧 正在修復 EC2 環境中的 Dify API 連接問題..."

# 進入 docker 目錄
cd /Users/andycyw/dify/docker

echo "📦 重啟 Docker 服務以應用新的環境變量..."

# 停止現有服務
docker compose down

echo "⏳ 等待服務完全停止..."
sleep 5

# 重新啟動服務
docker compose up -d

echo "🚀 等待服務啟動..."
sleep 30

# 檢查服務狀態
echo "📋 檢查服務狀態:"
docker compose ps

echo ""
echo "✅ 修復完成！"
echo ""
echo "🌐 現在您可以訪問:"
echo "   - Dify 控制台: http://54.169.166.197"
echo "   - Next.js 前端: http://54.169.166.197:3000"
echo "   - API 服務: http://54.169.166.197/api"
echo ""
echo "📝 如果仍有問題，請檢查:"
echo "   1. 確保 EC2 安全組允許端口 80 的入站流量"
echo "   2. 檢查 nginx 日誌: docker compose logs nginx"
echo "   3. 檢查 API 日誌: docker compose logs api"
echo "   4. 確認 EC2 實例的公共 IP 是 54.169.166.197"
