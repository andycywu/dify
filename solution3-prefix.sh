#!/bin/bash

echo "🔧 最小改動方案 - 保持原版 Dify 不變"
echo "================================"
echo "方案：dify-next-frontend 使用獨立路徑 /app/"
echo ""

# 1. 備份當前配置
echo "📁 備份當前配置..."
cp nginx/conf.d/default.conf.template nginx/conf.d/default.conf.template.backup.$(date +%Y%m%d_%H%M%S)

# 2. 最小改動 Nginx 配置
echo "📝 更新 Nginx 配置 - 最小改動方案..."
cat > nginx/conf.d/default.conf.template << 'NGINX_EOF'
# 最小改動方案 - 保持原版 Dify 完全不變

server {
    listen ${NGINX_PORT};
    server_name localhost;

    # ===== 原版 Dify 路徑 (完全不變) =====
    location /console/api {
        proxy_pass http://api:5001;
        include proxy.conf;
    }

    location /api {
        proxy_pass http://api:5001;
        include proxy.conf;
    }

    location /v1 {
        proxy_pass http://api:5001;
        include proxy.conf;
    }

    location /files {
        proxy_pass http://api:5001;
        include proxy.conf;
    }

    location /explore {
        proxy_pass http://web:3000;
        include proxy.conf;
    }

    location /e/ {
        proxy_pass http://plugin_daemon:5002;
        proxy_set_header Dify-Hook-Url $scheme://$host$request_uri;
        include proxy.conf;
    }

    # ===== dify-next-frontend 獨立路徑 =====
    location /app/ {
        proxy_pass http://dify-next-frontend:3000/;
        include proxy.conf;
    }

    location /app/_next {
        proxy_pass http://dify-next-frontend:3000/_next;
        include proxy.conf;
    }

    location /app/api {
        proxy_pass http://dify-next-frontend:3000/api;
        include proxy.conf;
    }

    location /app/static {
        proxy_pass http://dify-next-frontend:3000/static;
        include proxy.conf;
    }

    location /app/images {
        proxy_pass http://dify-next-frontend:3000/images;
        include proxy.conf;
    }

    # ===== 原版 Dify 為默認路徑 (保持不變) =====
    location / {
        proxy_pass http://web:3000;
        include proxy.conf;
    }

    # placeholder for acme challenge location
    ${ACME_CHALLENGE_LOCATION}

    # placeholder for https config defined in https.conf.template
    ${HTTPS_CONFIG}
}
NGINX_EOF

# 3. 最小改動 dify-next-frontend 配置
echo "📝 更新 dify-next-frontend 環境變量..."
cat > docker-compose.override.yml << 'OVERRIDE_EOF'
services:
  dify-next-frontend:
    build:
      context: ./dify-next-frontend
      dockerfile: Dockerfile
      args:
        NODE_ENV: production
    environment:
      - NODE_ENV=production
      - PORT=3000
      - DATABASE_URL=file:/app/data/dev.db
      # 使用 /app 路徑前綴
      - NEXT_PUBLIC_API_URL=http://54.169.166.197/app/api
      - NEXT_PUBLIC_AUTH_URL=http://54.169.166.197/app/api/auth
      - API_URL=http://54.169.166.197/app/api
      - NEXTAUTH_URL=http://54.169.166.197/app
      - NEXT_PUBLIC_BASE_PATH=/app
    volumes:
      - ./volumes/dify-next-frontend:/app/data
      - ./dify-next-frontend/prisma:/app/prisma
    user: "1001:1001"
    command: >
      sh -c "
        mkdir -p /app/data &&
        echo 'Checking Prisma schema...' &&
        ls -la /app/prisma/ &&
        if [ ! -f /app/data/dev.db ]; then
          echo 'Initializing database...';
          npx prisma db push --schema=/app/prisma/schema.prisma --accept-data-loss;
        fi &&
        echo 'Generating Prisma client...' &&
        npx prisma generate --schema=/app/prisma/schema.prisma &&
        echo 'Starting application...' &&
        npm run start
      "
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 120s
    restart: unless-stopped
OVERRIDE_EOF

# 4. 重新啟動相關服務
echo "🔄 重新啟動服務..."
docker-compose restart nginx dify-next-frontend

# 5. 等待服務啟動
echo "⏳ 等待服務啟動..."
sleep 60

# 6. 測試訪問
echo "🌐 測試訪問..."
echo ""

echo "=== 原版 Dify (完全不變) ==="
echo "1. Dify 主頁 (默認):"
curl -I http://localhost/ 2>/dev/null | head -3
echo ""

echo "2. Dify API:"
curl -I http://localhost/api/health 2>/dev/null | head -3
echo ""

echo "=== dify-next-frontend (新路徑) ==="
echo "3. Next.js App:"
curl -I http://localhost/app/ 2>/dev/null | head -3
echo ""

echo "4. Next.js API:"
curl -I http://localhost/app/api/health 2>/dev/null | head -3
echo ""

# 7. 檢查容器狀態
echo "🔍 檢查容器狀態..."
docker-compose ps | grep -E "(dify-next-frontend|nginx|api|web)"
echo ""

echo "✅ 最小改動方案部署完成！"
echo ""
echo "🎯 訪問指南："
echo "================================"
echo "🔧 原版 Dify (保持不變):"
echo "   - 主頁: http://54.169.166.197/"
echo "   - API: http://54.169.166.197/api/*"
echo "   - Console: http://54.169.166.197/console/api/*"
echo ""
echo "📱 dify-next-frontend (新路徑):"
echo "   - 應用: http://54.169.166.197/app/"
echo "   - API: http://54.169.166.197/app/api/*"
echo ""
echo "💡 優點："
echo "   ✅ 原版 Dify 完全不變"
echo "   ✅ 最小配置改動"
echo "   ✅ 路徑清晰分離"
echo "   ✅ 兩個系統獨立運行"
EOF
