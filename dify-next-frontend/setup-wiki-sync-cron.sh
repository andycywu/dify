#!/bin/bash

# ============================================
# Wiki.js → Dify 自動同步 Cron Job
# ============================================
#
# 此腳本用於設定定時自動同步 Wiki.js 到 Dify
#
# 使用方式：
#   1. 給予執行權限：chmod +x setup-wiki-sync-cron.sh
#   2. 執行：./setup-wiki-sync-cron.sh
#
# ============================================

set -e

echo "🚀 Setting up Wiki.js → Dify Auto Sync Cron Job..."

# 確認專案目錄
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "📁 Project directory: $PROJECT_DIR"

# 確認 Node.js 安裝
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo "✅ Node.js found: $(node --version)"

# 確認 npm 腳本存在
if ! grep -q "sync-wiki" "$PROJECT_DIR/package.json"; then
    echo "❌ sync-wiki script not found in package.json"
    exit 1
fi

echo "✅ sync-wiki script found"

# 建立日誌目錄
LOG_DIR="/var/log/dify-wiki-sync"
sudo mkdir -p "$LOG_DIR"
sudo chown -R $USER:$USER "$LOG_DIR"
echo "✅ Log directory created: $LOG_DIR"

# 建立 Cron Job 腳本
CRON_SCRIPT="$PROJECT_DIR/scripts/cron-sync-wiki.sh"
cat > "$CRON_SCRIPT" << 'EOF'
#!/bin/bash

# 載入環境變數
set -a
source .env.local || source .env.docker || true
set +a

# 執行同步
cd "$(dirname "$0")/.."
npm run sync-wiki >> /var/log/dify-wiki-sync/sync.log 2>&1

# 保留最近 30 天的日誌
find /var/log/dify-wiki-sync -name "*.log" -mtime +30 -delete
EOF

chmod +x "$CRON_SCRIPT"
echo "✅ Cron script created: $CRON_SCRIPT"

# 建立 Cron Job
CRON_ENTRY="0 2 * * * $CRON_SCRIPT"
CRON_COMMENT="# Wiki.js → Dify Auto Sync (Daily at 2 AM)"

# 檢查是否已存在
if crontab -l 2>/dev/null | grep -q "$CRON_SCRIPT"; then
    echo "⚠️  Cron job already exists"
else
    # 加入 Cron Job
    (crontab -l 2>/dev/null; echo "$CRON_COMMENT"; echo "$CRON_ENTRY") | crontab -
    echo "✅ Cron job added successfully!"
fi

# 顯示當前 Cron Jobs
echo ""
echo "📋 Current cron jobs:"
crontab -l

echo ""
echo "🎉 Setup completed!"
echo ""
echo "📊 Configuration:"
echo "   • Sync time: Every day at 2:00 AM"
echo "   • Log file: /var/log/dify-wiki-sync/sync.log"
echo "   • Cron script: $CRON_SCRIPT"
echo ""
echo "📝 Useful commands:"
echo "   • View logs: tail -f /var/log/dify-wiki-sync/sync.log"
echo "   • Test sync now: npm run sync-wiki"
echo "   • Edit cron time: crontab -e"
echo "   • Remove cron job: crontab -e (then delete the line)"
echo ""
