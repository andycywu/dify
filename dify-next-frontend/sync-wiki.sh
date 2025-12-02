#!/bin/bash

# Trigger Wiki to Dify Sync
# Usage: ./sync-wiki.sh [DIFY_ADMIN_API_KEY]

API_URL="http://localhost:3001/api/admin/sync-wiki"

echo "🚀 Triggering Wiki to Dify Sync..."
curl -X POST "$API_URL" \
  -H "Content-Type: application/json"

echo -e "\n✅ Request sent. Check docker logs for progress:"
echo "docker logs -f docker-dify-next-frontend-1"
