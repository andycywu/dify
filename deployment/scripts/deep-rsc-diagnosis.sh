#!/bin/bash
# EC2 專用：深度診斷 RSC 請求問題

echo "🔍 深度診斷 RSC 請求問題..."
echo "=========================="

# 確保在正確的目錄
cd /home/ec2-user/docker

echo "📊 當前服務狀態："
docker-compose ps

echo ""
echo "🧪 測試具體的 RSC 請求..."

# 測試帶 RSC 參數的請求
echo "測試 /apps 帶 RSC 參數:"
curl -H "RSC: 1" -H "Next-Router-State-Tree: %5B%22%22%2C%7B%22children%22%3A%5B%22apps%22%2C%7B%22children%22%3A%5B%22__PAGE__%22%2C%7B%7D%5D%7D%5D%7D%2Cnull%2Cnull%2Ctrue%5D" \
     "http://54.169.166.197/apps?_rsc=tg7gv" -v 2>&1 | head -30

echo ""
echo "測試 /datasets 帶 RSC 參數:"
curl -H "RSC: 1" -H "Next-Router-State-Tree: %5B%22%22%2C%7B%22children%22%3A%5B%22datasets%22%2C%7B%22children%22%3A%5B%22__PAGE__%22%2C%7B%7D%5D%7D%5D%7D%2Cnull%2Cnull%2Ctrue%5D" \
     "http://54.169.166.197/datasets?_rsc=1pj4l" -v 2>&1 | head -30

echo ""
echo "🔍 檢查 web 服務日誌中的錯誤..."
docker-compose logs web 2>/dev/null | tail -50 | grep -i error || echo "沒有找到錯誤日誌"

echo ""
echo "🔍 檢查 nginx 日誌中的錯誤..."
docker-compose logs nginx 2>/dev/null | tail -50 | grep -i error || echo "沒有找到錯誤日誌"

echo ""
echo "🔍 檢查最近的訪問日誌..."
docker-compose logs nginx 2>/dev/null | tail -20

echo ""
echo "🔍 檢查 web 服務的環境變數..."
docker-compose exec web env 2>/dev/null | grep -E "(API_URL|CONSOLE)" || echo "無法獲取環境變數"

echo ""
echo "🧪 測試後端 API 連接..."
echo "測試 console/api 從內部:"
docker-compose exec web curl -s "http://api:5001/console/api/setup" 2>/dev/null | head -3 || echo "API 連接失敗"

echo ""
echo "📝 分析結果："
echo "   RSC 請求分析："
echo "   1. 如果看到 200 但內容為空 → 前端應用沒有正確處理 RSC"
echo "   2. 如果看到 500 錯誤 → 後端 API 問題"
echo "   3. 如果看到 timeout → 網路或服務問題"
echo ""
echo "💡 可能的解決方案："
echo "   1. 清除瀏覽器緩存"
echo "   2. 檢查前端環境變數配置"
echo "   3. 重新啟動 web 服務"
echo "   4. 如果問題持續，可能需要重新構建前端 image"
