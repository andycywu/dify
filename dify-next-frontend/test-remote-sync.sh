#!/bin/bash

# ============================================
# 遠端伺服器自動同步測試腳本
# ============================================
#
# 用於測試遠端伺服器上的 Wiki-Dify 自動同步功能
#
# 使用方式：
#   ./test-remote-sync.sh
#
# ============================================

SERVER="172.27.197.100"
FRONTEND_URL="http://$SERVER:3001"
API_URL="$FRONTEND_URL/api/admin"

echo "🧪 Testing Wiki-Dify Auto Sync on Remote Server: $SERVER"
echo "=========================================="

# 檢查網路連線
echo "🌐 Testing network connectivity..."
if ping -c 1 -W 2 "$SERVER" &> /dev/null; then
    echo "✅ Server is reachable"
else
    echo "❌ Server is not reachable"
    exit 1
fi

# 檢查前端服務
echo ""
echo "🌐 Testing frontend service..."
if curl -s --max-time 5 "$FRONTEND_URL" > /dev/null; then
    echo "✅ Frontend is running"
else
    echo "❌ Frontend is not running or not accessible"
fi

# 檢查 Admin API
echo ""
echo "🔗 Testing admin API..."
if curl -s --max-time 5 "$API_URL/setup-cron" > /dev/null; then
    echo "✅ Admin API is accessible"
else
    echo "❌ Admin API is not accessible"
fi

# 測試自動同步 API
echo ""
echo "🔄 Testing auto-sync API..."
echo "Sending POST request to $API_URL/auto-sync..."

start_time=$(date +%s)
response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" --max-time 30 -X POST "$API_URL/auto-sync" 2>/dev/null)
end_time=$(date +%s)

http_status=$(echo "$response" | grep "HTTP_STATUS:" | cut -d: -f2)
response_body=$(echo "$response" | sed '/HTTP_STATUS:/d')

duration=$((end_time - start_time))

echo "⏱️  Response time: ${duration}s"
echo "📊 HTTP Status: $http_status"

if [ "$http_status" = "200" ]; then
    echo "✅ Auto-sync API call successful"
    if command -v jq &> /dev/null && [ -n "$response_body" ]; then
        echo "📄 Response:"
        echo "$response_body" | jq '.' 2>/dev/null || echo "$response_body"
    else
        echo "📄 Response: $response_body"
    fi
else
    echo "❌ Auto-sync API call failed"
    echo "📄 Error response: $response_body"
fi

# 檢查同步狀態
echo ""
echo "📊 Checking sync status..."
status_response=$(curl -s --max-time 10 "$API_URL/sync-status" 2>/dev/null)

if [ $? -eq 0 ] && [ -n "$status_response" ]; then
    echo "✅ Sync status retrieved"
    if command -v jq &> /dev/null; then
        echo "$status_response" | jq '.' 2>/dev/null || echo "$status_response"
    else
        echo "$status_response"
    fi
else
    echo "❌ Failed to get sync status"
fi

echo ""
echo "🎯 Test completed!"
echo ""
echo "💡 Next steps:"
echo "• If API calls failed, check if frontend is running: npm run build && npm start"
echo "• Access Admin Panel: $FRONTEND_URL/admin"
echo "• Configure auto sync in Wiki Import tab"
echo "• Monitor with: ./cron-runner.sh logs"
