#!/bin/bash

# ============================================
# Wiki-Dify Auto Sync 遠端伺服器部署腳本
# ============================================
#
# 此腳本用於在遠端伺服器 172.27.197.100 上部署自動同步功能
#
# 使用方式：
#   1. 將代碼上傳到伺服器
#   2. 給予執行權限：chmod +x deploy-remote.sh
#   3. 執行：./deploy-remote.sh
#
# ============================================

set -e

echo "🚀 Deploying Wiki-Dify Auto Sync to Remote Server..."
echo "📍 Target Server: 172.27.197.100"

# 檢查是否在正確的目錄
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# 檢查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo "✅ NPM version: $(npm --version)"

# 安裝依賴
echo ""
echo "📦 Installing dependencies..."
npm install

# 檢查必要的依賴
if ! grep -q "node-cron" package.json; then
    echo "❌ node-cron dependency not found in package.json"
    exit 1
fi

echo "✅ Dependencies installed successfully"

# 檢查 cron-runner.js
if [ ! -f "cron-runner.js" ]; then
    echo "❌ cron-runner.js not found"
    exit 1
fi

echo "✅ cron-runner.js found"

# 創建日誌目錄
echo ""
echo "📝 Creating log directory..."
mkdir -p logs
echo "✅ Log directory created"

# 測試 API 連線
echo ""
echo "🌐 Testing API connectivity..."
if curl -s --max-time 10 http://172.27.197.100:3001 > /dev/null; then
    echo "✅ Frontend is reachable"
else
    echo "⚠️  Warning: Frontend may not be running or accessible"
fi

# 測試自動同步 API
if curl -s --max-time 10 http://172.27.197.100:3001/api/admin/auto-sync > /dev/null; then
    echo "✅ Auto-sync API is accessible"
else
    echo "⚠️  Warning: Auto-sync API may not be accessible"
fi

# 檢查現有的 cron runner 進程
echo ""
echo "🔍 Checking existing cron runner processes..."
if pgrep -f "cron-runner.js" > /dev/null; then
    echo "⚠️  Existing cron runner process found. Stopping it..."
    pkill -f "cron-runner.js"
    sleep 2
    echo "✅ Existing process stopped"
else
    echo "✅ No existing cron runner process"
fi

echo ""
echo "🎉 Deployment completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Start the frontend: npm run build && npm start"
echo "2. Access Admin Panel: http://172.27.197.100:3001/admin"
echo "3. Go to Wiki Import tab and configure auto sync"
echo "4. Monitor logs: tail -f logs/cron-runner.log"
echo ""
echo "🔧 Useful commands:"
echo "• Check process: pgrep -f 'cron-runner.js'"
echo "• View logs: tail -f logs/cron-runner.log"
echo "• Stop cron runner: pkill -f 'cron-runner.js'"
echo "• Test API: curl -X POST http://172.27.197.100:3001/api/admin/auto-sync"
