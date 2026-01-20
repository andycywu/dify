#!/bin/bash

# ============================================
# Cron Runner 管理腳本
# ============================================
#
# 用於啟動、停止和管理 cron-runner.js 進程
#
# 使用方式：
#   ./cron-runner.sh start    # 啟動 cron runner
#   ./cron-runner.sh stop     # 停止 cron runner
#   ./cron-runner.sh restart  # 重啟 cron runner
#   ./cron-runner.sh status   # 檢查狀態
#   ./cron-runner.sh logs     # 查看日誌
#
# ============================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CRON_SCRIPT="$SCRIPT_DIR/cron-runner.js"
PID_FILE="$SCRIPT_DIR/cron-runner.pid"
LOG_DIR="$SCRIPT_DIR/logs"
LOG_FILE="$LOG_DIR/cron-runner.log"

# 確保日誌目錄存在
mkdir -p "$LOG_DIR"

# 檢查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    exit 1
fi

# 檢查 cron-runner.js
if [ ! -f "$CRON_SCRIPT" ]; then
    echo "❌ cron-runner.js not found at $CRON_SCRIPT"
    exit 1
fi

# 獲取進程 ID
get_pid() {
    if [ -f "$PID_FILE" ]; then
        cat "$PID_FILE" 2>/dev/null
    else
        pgrep -f "cron-runner.js" 2>/dev/null || echo ""
    fi
}

# 檢查進程是否運行
is_running() {
    local pid=$(get_pid)
    if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
        return 0
    else
        return 1
    fi
}

# 啟動進程
start() {
    if is_running; then
        echo "⚠️  Cron runner is already running (PID: $(get_pid))"
        return 1
    fi

    echo "🚀 Starting cron runner..."

    # 設置環境變數
    export API_BASE_URL="${API_BASE_URL:-http://172.27.197.100:3001}"
    export NODE_ENV="${NODE_ENV:-production}"

    # 創建測試配置文件（如果不存在）
    if [ ! -f ".wiki-sync-cron-config" ]; then
        echo "📝 Creating default config file..."
        cat > .wiki-sync-cron-config << EOF
{
  "enabled": true,
  "time": "02:00",
  "createdAt": "$(date -Iseconds)"
}
EOF
    fi

    # 啟動進程
    cd "$SCRIPT_DIR"
    nohup node cron-runner.js > /dev/null 2>&1 &
    local pid=$!

    # 保存 PID
    echo $pid > "$PID_FILE"

    # 等待進程啟動
    sleep 3

    if is_running; then
        echo "✅ Cron runner started successfully (PID: $pid)"
        return 0
    else
        echo "❌ Failed to start cron runner"
        rm -f "$PID_FILE"
        return 1
    fi
}

# 停止進程
stop() {
    local pid=$(get_pid)

    if [ -z "$pid" ]; then
        echo "ℹ️  Cron runner is not running"
        return 0
    fi

    echo "🛑 Stopping cron runner (PID: $pid)..."

    # 優雅停止
    kill "$pid" 2>/dev/null

    # 等待進程停止
    local count=0
    while is_running && [ $count -lt 10 ]; do
        sleep 1
        count=$((count + 1))
    done

    # 強制停止
    if is_running; then
        echo "⚠️  Force stopping cron runner..."
        kill -9 "$pid" 2>/dev/null
        sleep 1
    fi

    if is_running; then
        echo "❌ Failed to stop cron runner"
        return 1
    else
        rm -f "$PID_FILE"
        echo "✅ Cron runner stopped successfully"
        return 0
    fi
}

# 重啟進程
restart() {
    echo "🔄 Restarting cron runner..."
    stop
    sleep 2
    start
}

# 檢查狀態
status() {
    if is_running; then
        local pid=$(get_pid)
        echo "✅ Cron runner is running (PID: $pid)"

        # 顯示進程信息
        ps -p "$pid" -o pid,ppid,cmd 2>/dev/null || echo "Process details not available"

        # 顯示配置文件狀態
        if [ -f ".wiki-sync-cron-config" ]; then
            echo "📝 Config file exists"
            if command -v jq &> /dev/null; then
                jq '.enabled, .time' .wiki-sync-cron-config 2>/dev/null || cat .wiki-sync-cron-config
            else
                cat .wiki-sync-cron-config
            fi
        else
            echo "⚠️  Config file not found"
        fi
    else
        echo "❌ Cron runner is not running"
        rm -f "$PID_FILE"
    fi
}

# 查看日誌
logs() {
    if [ -f "$LOG_FILE" ]; then
        echo "📄 Cron runner logs (last 50 lines):"
        echo "=========================================="
        tail -50 "$LOG_FILE"
        echo "=========================================="
        echo "💡 Use 'tail -f $LOG_FILE' to follow logs"
    else
        echo "❌ Log file not found at $LOG_FILE"
    fi
}

# 主邏輯
case "${1:-status}" in
    start)
        start
        ;;
    stop)
        stop
        ;;
    restart)
        restart
        ;;
    status)
        status
        ;;
    logs)
        logs
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status|logs}"
        echo ""
        echo "Commands:"
        echo "  start   - Start cron runner"
        echo "  stop    - Stop cron runner"
        echo "  restart - Restart cron runner"
        echo "  status  - Show status"
        echo "  logs    - Show logs"
        exit 1
        ;;
esac
