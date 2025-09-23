#!/bin/bash
# Dify API 連接診斷腳本 - EC2 版本

echo "🔍 EC2 環境 Dify API 連接問題診斷開始..."
echo "================================"

# 檢查 Docker 服務狀態
echo "📦 檢查 Docker 服務狀態:"
docker compose ps

echo ""
echo "🌐 檢查網絡連接:"

# 測試各個端點
echo "- 測試 nginx (54.169.166.197:80):"
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" http://54.169.166.197/ || echo "❌ 連接失敗"

echo "- 測試 API 通過 nginx (54.169.166.197/api):"
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" http://54.169.166.197/api/ || echo "❌ 連接失敗"

echo "- 測試控制台 API (54.169.166.197/console/api):"
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" http://54.169.166.197/console/api/ || echo "❌ 連接失敗"

echo ""
echo "📋 檢查環境變數配置:"
echo "CONSOLE_API_URL: $(grep "^CONSOLE_API_URL=" /Users/andycyw/dify/../docker/.env)"
echo "SERVICE_API_URL: $(grep "^SERVICE_API_URL=" /Users/andycyw/dify/../docker/.env)"
echo "APP_API_URL: $(grep "^APP_API_URL=" /Users/andycyw/dify/../docker/.env)"

echo ""
echo "🔍 檢查容器內部連接:"
echo "- API 容器內部狀態:"
docker compose exec api curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" http://localhost:5001/health || echo "❌ API 內部連接失敗"

echo ""
echo "📝 檢查最近的錯誤日誌:"
echo "=== Nginx 錯誤日誌 (最後 10 行) ==="
docker compose logs --tail=10 nginx | grep -i error || echo "無錯誤日誌"

echo ""
echo "=== API 錯誤日誌 (最後 10 行) ==="
docker compose logs --tail=10 api | grep -i error || echo "無錯誤日誌"

echo ""
echo "🛡️ 檢查 EC2 安全組設定:"
echo "請確認以下端口已在 EC2 安全組中開放:"
echo "- 端口 80 (HTTP): 0.0.0.0/0"
echo "- 端口 3000 (Next.js): 0.0.0.0/0"
echo "- 端口 8080 (Next.js): 0.0.0.0/0"

echo ""
echo "🎯 建議的修復步驟:"
echo "1. 如果上述測試失敗，請執行: ./fix-api-connection.sh"
echo "2. 檢查 EC2 安全組是否允許 HTTP 流量"
echo "3. 確認 EC2 實例的公共 IP 是否為 54.169.166.197"
echo "4. 清除瀏覽器緩存並重新載入頁面"

echo ""
echo "================================"
echo "🔍 診斷完成"
