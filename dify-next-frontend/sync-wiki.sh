#!/bin/bash

# Trigger Wiki to Dify Sync
# Usage: ./sync-wiki.sh [DIFY_ADMIN_API_KEY]

# 載入 .env.docker
if [ -f .env.docker ]; then
  export $(grep -v '^#' .env.docker | xargs)
else
  echo "❌ 找不到 .env.docker，請確認檔案存在"
  exit 1
fi

if [ -z "$API_BASE_URL" ]; then
  echo "❌ 未定義 API_BASE_URL，請確認 .env.docker 中的設定"
  exit 1
fi

API_URL="$API_BASE_URL/admin/sync-wiki"

echo "🚀 Triggering Wiki to Dify Sync..."
curl -X POST "$API_URL" \
  -H "Content-Type: application/json"

echo -e "\n✅ Request sent. Check docker logs for progress:"
echo "docker logs -f docker-dify-next-frontend-1"
