#!/bin/bash
# EC2 專用：修復 401 UNAUTHORIZED 錯誤

echo "🔧 修復 401 UNAUTHORIZED 錯誤..."
echo "================================"

echo "📝 問題分析："
echo "   401 錯誤通常表示："
echo "   1. 環境變數配置錯誤（API URL 為空）"
echo "   2. 認證 token 過期或無效"
echo "   3. 用戶會話過期"

echo ""
echo "🔄 應用修復..."

# 確保在正確的目錄
cd /home/ec2-user/docker

echo "1. 重新啟動相關服務以應用新的環境變數..."
docker-compose stop api worker web nginx

echo "⏳ 等待服務停止..."
sleep 10

# 重新啟動服務
docker-compose up -d api worker web nginx

echo "⏳ 等待服務啟動（60秒）..."
sleep 60

echo "🔍 檢查服務狀態..."
docker-compose ps | grep -E "(api|worker|web|nginx)"

echo ""
echo "🧪 測試 API 端點..."

# 測試 console API setup
echo "測試 Console API setup:"
curl -s -o /dev/null -w "狀態碼: %{http_code}\n" http://54.169.166.197/console/api/setup

# 測試主頁
echo "測試主頁:"
curl -s -o /dev/null -w "狀態碼: %{http_code}\n" http://54.169.166.197

echo ""
echo "🔍 檢查環境變數是否正確應用..."
docker-compose exec web env | grep -E "(CONSOLE_API_URL|APP_API_URL)" || echo "無法獲取環境變數"

echo ""
echo "✅ 修復完成！"
echo ""
echo "🌐 現在請執行以下步驟："
echo "   1. 完全關閉瀏覽器"
echo "   2. 清除所有瀏覽器數據："
echo "      - 緩存 (Cache)"
echo "      - Cookie"
echo "      - 本地存儲 (Local Storage)"
echo "      - 會話存儲 (Session Storage)"
echo "   3. 重新開啟瀏覽器"
echo "   4. 訪問: http://54.169.166.197"
echo ""
echo "💡 如果還是看到 401 錯誤："
echo "   1. 嘗試無痕模式"
echo "   2. 檢查是否需要重新設置管理員帳號"
echo "   3. 可能需要重置用戶數據庫"
echo ""
echo "🔍 查看詳細日誌："
echo "   docker-compose logs api"
echo "   docker-compose logs web"
