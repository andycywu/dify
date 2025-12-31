#!/bin/bash

# ============================================
# Wiki.js → Dify 自動同步 Cron Job (容器環境版本)
# ============================================
#
# 此腳本用於在容器環境中設定定時自動同步 Wiki.js 到 Dify
# 使用 API 調用而不是直接運行 Node.js
#
# 使用方式：
#   1. 給予執行權限：chmod +x setup-wiki-sync-cron.sh
#   2. 執行：./setup-wiki-sync-cron.sh
#
# ============================================

set -e

echo "🚀 Setting up Wiki.js → Dify Auto Sync Cron Job (Container Version)..."

# 確認專案目錄
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "📁 Project directory: $PROJECT_DIR"

# 確認 curl 安裝
if ! command -v curl &> /dev/null; then
    echo "❌ curl is not installed. Please install curl first."
    exit 1
fi

echo "✅ curl found"

# 從環境變數獲取 API URL
API_URL="${API_URL:-http://localhost:3001}"
echo "📡 API URL: $API_URL"

# 建立日誌目錄 (在專案目錄下)
LOG_DIR="$PROJECT_DIR/logs"
mkdir -p "$LOG_DIR"
echo "✅ Log directory created: $LOG_DIR"

# 建立 Cron Job 腳本 (使用 API 調用)
CRON_SCRIPT="$PROJECT_DIR/scripts/cron-sync-wiki.sh"
cat > "$CRON_SCRIPT" << EOF
#!/bin/bash

# Wiki.js → Dify 自動同步腳本 (API 版本)
echo "[$(date)] 開始執行自動同步..."

# 調用自動同步 API
curl -X POST "$API_URL/api/admin/auto-sync" \\
  -H "Content-Type: application/json" \\
  -w "HTTP Status: %{http_code}" \\
  --max-time 600 \\
  --silent \\
  --show-error \\
  >> "$LOG_DIR/sync.log" 2>&1

echo "[$(date)] 自動同步執行完成" >> "$LOG_DIR/sync.log"

# 保留最近 30 天的日誌
find "$LOG_DIR" -name "*.log" -mtime +30 -delete
EOF

chmod +x "$CRON_SCRIPT"
echo "✅ Cron script created: $CRON_SCRIPT"

# 注意：由於在容器中，我們不能直接設置系統 cron
# 提供設置說明
echo ""
echo "⚠️  注意：由於在 Docker 容器中，無法直接設置系統 cron job"
echo ""
echo "📋 要在宿主機上設置自動同步，請運行以下命令："
echo ""
echo "   # 1. 複製腳本到宿主機"
echo "   sudo cp $CRON_SCRIPT /usr/local/bin/dify-wiki-sync"
echo "   sudo chmod +x /usr/local/bin/dify-wiki-sync"
echo ""
echo "   # 2. 設置系統 cron (每天凌晨 2 點)"
echo "   sudo crontab -e"
echo "   # 添加以下行："
echo "   0 2 * * * /usr/local/bin/dify-wiki-sync"
echo ""
echo "   # 或者使用管理面板中的 '設置自動同步' 功能"
echo ""

# 測試腳本
echo "🧪 Testing cron script..."
if "$CRON_SCRIPT"; then
    echo "✅ Cron script test passed"
else
    echo "❌ Cron script test failed"
    exit 1
fi

echo ""
echo "🎉 Setup completed!"
echo ""
echo "📊 Configuration:"
echo "   • API URL: $API_URL"
echo "   • Log file: $LOG_DIR/sync.log"
echo "   • Cron script: $CRON_SCRIPT"
echo ""
echo "📝 Useful commands:"
echo "   • View logs: tail -f $LOG_DIR/sync.log"
echo "   • Test sync now: $CRON_SCRIPT"
echo "   • Manual API call: curl -X POST $API_URL/api/admin/auto-sync"
echo ""
