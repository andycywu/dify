#!/bin/bash
# EC2 專用：簡單 RSC 修復方案

echo "🔧 EC2 RSC 簡單修復方案..."
echo "========================="

# 確保在正確的目錄
cd /home/ec2-user/docker

echo "📝 問題分析："
echo "   RSC 路由返回 200 OK，但瀏覽器顯示錯誤"
echo "   可能原因：緩存問題、環境變數問題、或前端應用狀態問題"

echo ""
echo "🔄 方案 1: 完全重新啟動 web 服務..."

# 停止 web 和 nginx 服務
docker-compose stop web nginx

# 移除容器（這會清除容器內的緩存）
docker-compose rm -f web nginx

echo "⏳ 等待 10 秒..."
sleep 10

# 重新啟動
docker-compose up -d nginx web

echo "⏳ 等待服務完全啟動（45秒）..."
sleep 45

echo "🔍 檢查服務狀態..."
docker-compose ps | grep -E "(web|nginx)"

echo ""
echo "🧪 驗證修復..."
echo "測試主頁:"
curl -s -o /dev/null -w "狀態碼: %{http_code}\n" http://54.169.166.197

echo "測試 /apps:"
curl -s -o /dev/null -w "狀態碼: %{http_code}\n" http://54.169.166.197/apps

echo ""
echo "✅ 修復完成！"
echo ""
echo "🌐 請執行以下步驟："
echo "   1. 完全關閉瀏覽器"
echo "   2. 清除所有瀏覽器數據（緩存、Cookie、本地存儲）"
echo "   3. 重新開啟瀏覽器（建議使用無痕模式）"
echo "   4. 訪問: http://54.169.166.197"
echo ""
echo "⚠️  如果問題持續，運行深度診斷："
echo "   chmod +x deep-rsc-diagnosis.sh"
echo "   ./deep-rsc-diagnosis.sh"
echo ""
echo "🔍 或者檢查瀏覽器開發者工具："
echo "   1. 按 F12 開啟開發者工具"
echo "   2. 切換到 Network 標籤"
echo "   3. 重新整理頁面"
echo "   4. 查看失敗的請求詳情"
