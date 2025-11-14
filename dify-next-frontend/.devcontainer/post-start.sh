#!/bin/bash

echo "🏃 Running post-start commands..."

# Ensure proper permissions
sudo chown -R node:node /app/node_modules 2>/dev/null || true

# Check if Dify API is accessible (optional) with retries
echo "🔍 Checking Dify API connectivity..."
API_URL="http://localhost:5001/health"
timeout=60
interval=2
elapsed=0
until curl -sf "$API_URL" >/dev/null 2>&1; do
    if [ "$elapsed" -ge "$timeout" ]; then
        echo "⚠️  Dify API not reachable after ${timeout}s."
        echo "   You can start it with: docker-compose up api"
        break
    fi
    echo "   Waiting for Dify API... ($elapsed/$timeout)"
    sleep "$interval"
    elapsed=$((elapsed + interval))
done
if curl -sf "$API_URL" >/dev/null 2>&1; then
    echo "✅ Dify API is accessible"
fi

echo "🎉 Environment ready for development!"