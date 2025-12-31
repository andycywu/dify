#!/bin/bash

# ============================================
# Wiki.js → Dify 自動同步調用腳本
# ============================================
#
# 此腳本用於從外部調用 Dify 應用的自動同步 API
# 可以在宿主機的 cron 中使用
#
# 使用方式：
#   1. 修改下面的 API_URL 為您的 Dify 前端 URL
#   2. 給予執行權限：chmod +x auto-sync-call.sh
#   3. 在宿主機上設置 cron：crontab -e
#      添加行：0 2 * * * /path/to/auto-sync-call.sh
#
# ============================================

# 配置 - 請根據您的環境修改
API_URL="http://172.27.197.100:3001"

# 記錄開始時間
echo "[$(date)] 開始執行自動同步..."

# 調用自動同步 API
curl -X POST "${API_URL}/api/admin/auto-sync" \
  -H "Content-Type: application/json" \
  -w "\nHTTP Status: %{http_code}\n" \
  --max-time 300 \
  --silent \
  --show-error

# 記錄結束時間
echo "[$(date)] 自動同步執行完成"
