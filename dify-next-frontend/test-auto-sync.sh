#!/bin/bash

# 測試自動同步功能（遠端伺服器版本）
echo "🧪 Testing Wiki-Dify Auto Sync (Remote Server)..."
echo "📍 Server: 172.27.197.100"

# 檢查配置文件
if [ -f .wiki-sync-cron-config ]; then
    echo "✅ Config file exists"
    cat .wiki-sync-cron-config
else
    echo "❌ Config file not found"
fi

# 檢查 Node.js
if command -v node &> /dev/null; then
    echo "✅ Node.js is available"
    node --version

    # 檢查依賴
    if [ -f package.json ]; then
        if grep -q "node-cron" package.json; then
            echo "✅ node-cron dependency found in package.json"
        else
            echo "❌ node-cron dependency not found in package.json"
        fi
    fi

    # 檢查 cron-runner.js
    if [ -f cron-runner.js ]; then
        echo "✅ cron-runner.js exists"
    else
        echo "❌ cron-runner.js not found"
    fi
else
    echo "❌ Node.js not available"
fi

# 檢查網路連線
echo ""
echo "🌐 Testing network connectivity..."
if curl -s --max-time 5 http://172.27.197.100:3001/api/admin/auto-sync > /dev/null; then
    echo "✅ API endpoint is reachable"
else
    echo "❌ API endpoint is not reachable"
fi

# 檢查 cron runner 進程
echo ""
echo "🔍 Checking cron runner process..."
if pgrep -f "cron-runner.js" > /dev/null; then
    echo "✅ Cron runner process is running"
    ps aux | grep cron-runner.js | grep -v grep
else
    echo "❌ Cron runner process is not running"
fi

# 檢查日誌文件
echo ""
echo "📝 Checking log files..."
if [ -f logs/cron-runner.log ]; then
    echo "✅ Log file exists"
    echo "Last 10 lines of log:"
    tail -10 logs/cron-runner.log
else
    echo "❌ Log file not found"
fi

echo ""
echo "📋 Manual test commands for remote server:"
echo "1. Access Admin Panel: http://172.27.197.100:3001/admin"
echo "2. Go to Wiki Import tab"
echo "3. Click '設置自動同步' button"
echo "4. Check if config file is created"
echo "5. Click '測試自動同步' button"
echo "6. Check server logs: tail -f logs/cron-runner.log"

echo ""
echo "🔧 If issues persist on remote server:"
echo "- Ensure Node.js and npm are installed on server"
echo "- Run: npm install (if needed)"
echo "- Check server firewall allows port 3001"
echo "- Verify Docker containers are running"
echo "- Check server logs for errors"
echo "- Test API manually: curl http://172.27.197.100:3001/api/admin/auto-sync"

echo ""
echo "🚀 Deployment commands for remote server:"
echo "1. Upload code to server"
echo "2. Run: npm install"
echo "3. Run: npm run build"
echo "4. Run: npm start"
echo "5. Test the auto-sync feature via Admin Panel"
echo "- Verify API endpoints are accessible"
