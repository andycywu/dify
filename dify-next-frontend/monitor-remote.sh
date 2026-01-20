#!/bin/bash

# ============================================
# Wiki-Dify Auto Sync 遠端監控腳本
# ============================================
#
# 此腳本用於監控遠端伺服器上的自動同步狀態
#
# 使用方式：
#   ./monitor-remote.sh
#
# ============================================

SERVER="172.27.197.100"
FRONTEND_URL="http://$SERVER:3001"
API_URL="$FRONTEND_URL/api/admin"

echo "📊 Monitoring Wiki-Dify Auto Sync on Remote Server: $SERVER"
echo "🌐 Frontend URL: $FRONTEND_URL"
echo "🔗 API URL: $API_URL"
echo ""

# 檢查前端是否可訪問
echo "🌐 Checking frontend accessibility..."
if curl -s --max-time 5 "$FRONTEND_URL" > /dev/null; then
    echo "✅ Frontend is accessible"
else
    echo "❌ Frontend is not accessible"
fi

# 檢查 Admin API 是否可訪問
echo ""
echo "🔗 Checking admin API accessibility..."
if curl -s --max-time 5 "$API_URL/setup-cron" > /dev/null; then
    echo "✅ Admin API is accessible"
else
    echo "❌ Admin API is not accessible"
fi

# 檢查 cron 配置狀態
echo ""
echo "⚙️  Checking cron configuration..."
response=$(curl -s --max-time 10 "$API_URL/setup-cron")
if [ $? -eq 0 ] && [ ! -z "$response" ]; then
    echo "✅ Cron API response received"
    echo "$response" | jq '.' 2>/dev/null || echo "$response"
else
    echo "❌ Failed to get cron status"
fi

# 檢查自動同步狀態
echo ""
echo "🔄 Checking auto-sync status..."
response=$(curl -s --max-time 10 -X GET "$API_URL/auto-sync")
if [ $? -eq 0 ] && [ ! -z "$response" ]; then
    echo "✅ Auto-sync API response received"
    echo "$response" | jq '.' 2>/dev/null || echo "$response"
else
    echo "❌ Failed to get auto-sync status"
fi

# 檢查同步狀態
echo ""
echo "📊 Checking sync status..."
response=$(curl -s --max-time 10 "$API_URL/sync-status")
if [ $? -eq 0 ] && [ ! -z "$response" ]; then
    echo "✅ Sync status API response received"
    echo "$response" | jq '.' 2>/dev/null || echo "$response"
else
    echo "❌ Failed to get sync status"
fi

# 檢查同步日誌
echo ""
echo "📝 Checking sync logs..."
response=$(curl -s --max-time 10 "$API_URL/sync-log")
if [ $? -eq 0 ] && [ ! -z "$response" ]; then
    echo "✅ Sync log API response received"
    echo "$response" | jq '.' 2>/dev/null || echo "$response"
else
    echo "❌ Failed to get sync logs"
fi

echo ""
echo "🎯 Quick Actions:"
echo "• Test auto sync: curl -X POST $API_URL/auto-sync"
echo "• View admin panel: $FRONTEND_URL/admin"
echo "• Check server logs: ssh to server and check logs/cron-runner.log"
