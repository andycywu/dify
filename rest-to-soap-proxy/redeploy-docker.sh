#!/bin/bash

echo "🚀 開始重新部署 REST to SOAP Proxy Docker 容器..."

# 停止並刪除舊容器
echo "🛑 停止舊容器..."
docker stop docker-rest-to-soap-proxy-1 || true
docker rm docker-rest-to-soap-proxy-1 || true

# 刪除舊鏡像（可選）
echo "🗑️  刪除舊鏡像..."
docker rmi docker-rest-to-soap-proxy || true

# 構建新鏡像
echo "🔨 構建新 Docker 鏡像..."
docker build -t docker-rest-to-soap-proxy .

# 啟動新容器
echo "▶️  啟動新容器..."
docker run -d \
  --name docker-rest-to-soap-proxy-1 \
  -p 5100:5001 \
  --restart unless-stopped \
  -e URTRACKER_USERNAME="${URTRACKER_USERNAME:-andycy.wu}" \
  -e URTRACKER_PASSWORD="${URTRACKER_PASSWORD:-XrnkE\$F4S.kAuyV1}" \
  docker-rest-to-soap-proxy

# 檢查容器狀態
echo "✅ 檢查容器狀態..."
docker ps | grep docker-rest-to-soap-proxy-1

# 查看日誌
echo "📋 容器日誌："
sleep 3
docker logs docker-rest-to-soap-proxy-1

echo ""
echo "🎉 部署完成！"
echo "📍 服務地址: http://localhost:5100"
echo "📄 測試下載: curl -O http://localhost:5100/api/https/download-by-name/MNT"
