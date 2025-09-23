#!/bin/bash

echo "🔧 實施路徑前綴分離解決方案"
echo "================================"
echo "方案：為 dify-next-frontend 創建專用的 API 路徑前綴"
echo ""

# 1. 備份當前配置
echo "📁 備份當前配置..."
cp nginx/conf.d/default.conf.template nginx/conf.d/default.conf.template.backup.$(date +%Y%m%d_%H%M%S)

# 2. 更新 Nginx 配置 - 路徑前綴分離
echo "📝 更新 Nginx 配置 - 實施路徑前綴分離..."
cat > nginx/conf.d/default.conf.template << 'NGINX_EOF'
# 路徑前綴分離方案 - 解決 API 路徑衝突問題

server {
    listen ${NGINX_PORT};
    server_name localhost;

    # ===== 原版 Dify API 路徑 (保持不變) =====
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

    location /health {
        proxy_pass http://api:5001;
        include proxy.conf;
    }

    # ===== dify-next-frontend 專用 API 路徑 =====
    location /next-api {
        rewrite ^/next-api/(.*)$ /api/$1 break;
        proxy_pass http://dify-next-frontend:3000;
        include proxy.conf;
    }

    location /next-auth {
        rewrite ^/next-auth/(.*)$ /api/auth/$1 break;
        proxy_pass http://dify-next-frontend:3000;
        include proxy.conf;
    }

    location /next-health {
        rewrite ^/next-health$ /api/health break;
        proxy_pass http://dify-next-frontend:3000;
        include proxy.conf;
    }

    # ===== 其他服務路徑 =====
    location /e/ {
        proxy_pass http://plugin_daemon:5002;
        proxy_set_header Dify-Hook-Url $scheme://$host$request_uri;
        include proxy.conf;
    }

    location /soap/ {
        proxy_pass http://rest-to-soap-proxy:5001/;
        include proxy.conf;
    }

    # ===== Next.js 靜態資源 =====
    location /_next {
        proxy_pass http://dify-next-frontend:3000;
        include proxy.conf;
    }

    location /static {
        proxy_pass http://dify-next-frontend:3000;
        include proxy.conf;
    }

    location /images {
        proxy_pass http://dify-next-frontend:3000;
        include proxy.conf;
    }

    location /favicon.ico {
        proxy_pass http://dify-next-frontend:3000;
        include proxy.conf;
    }

    # ===== 原版 Dify Web 界面 =====
    location /dify {
        rewrite ^/dify/(.*)$ /$1 break;
        proxy_pass http://web:3000;
        include proxy.conf;
    }

    location /dify/ {
        proxy_pass http://web:3000/;
        include proxy.conf;
    }

    # ===== 默認路由 - dify-next-frontend =====
    location / {
        proxy_pass http://dify-next-frontend:3000;
        include proxy.conf;
    }

    # placeholder for acme challenge location
    ${ACME_CHALLENGE_LOCATION}

    # placeholder for https config defined in https.conf.template
    ${HTTPS_CONFIG}
}
NGINX_EOF

# 3. 更新 dify-next-frontend 環境變量
echo "📝 更新 dify-next-frontend 環境變量..."
cat > docker-compose.override.yml << 'OVERRIDE_EOF'
# Docker Compose 覆蓋文件 - 路徑前綴分離方案
# 確保 Prisma 在開發中正常工作

services:
  dify-next-frontend:
    build:
      context: ./dify-next-frontend
      dockerfile: Dockerfile
      args:
        NODE_ENV: production
    environment:
      # 生產環境變數
      - NODE_ENV=production
      - PORT=3000
      - DATABASE_URL=file:/app/data/dev.db
      # 使用專用的 API 路徑前綴
      - NEXT_PUBLIC_API_URL=http://54.169.166.197/next-api
      - NEXT_PUBLIC_AUTH_URL=http://54.169.166.197/next-auth
      - API_URL=http://54.169.166.197/next-api
      - NEXTAUTH_URL=http://54.169.166.197
      # Dify API 後端（如果需要）
      - NEXT_PUBLIC_DIFY_API_BASE_URL=http://54.169.166.197/v1
    volumes:
      # 掛載數據庫持久化目錄
      - ./volumes/dify-next-frontend:/app/data
      # 確保 Prisma schema 文件可用
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

# 4. 重新啟動服務
echo "🔄 重新啟動服務..."
docker-compose down dify-next-frontend nginx
sleep 5
docker-compose up -d dify-next-frontend nginx

# 5. 等待服務啟動
echo "⏳ 等待服務啟動..."
sleep 60

# 6. 測試所有路徑
echo "🌐 測試路徑分離效果..."
echo ""

echo "=== 主應用測試 ==="
echo "1. dify-next-frontend 主頁:"
curl -I http://localhost/ 2>/dev/null | head -3
echo ""

echo "2. dify-next-frontend API:"
curl -I http://localhost/next-health 2>/dev/null | head -3
echo ""

echo "=== 原版 Dify 測試 ==="
echo "3. 原版 Dify API:"
curl -I http://localhost/health 2>/dev/null | head -3
echo ""

echo "4. 原版 Dify Web:"
curl -I http://localhost/dify/ 2>/dev/null | head -3
echo ""

echo "=== 靜態資源測試 ==="
echo "5. Next.js 靜態資源:"
curl -I http://localhost/_next/static/ 2>/dev/null | head -3
echo ""

# 7. 檢查容器狀態
echo "🔍 檢查容器狀態..."
docker-compose ps | grep -E "(dify-next-frontend|nginx|api)"
echo ""

# 8. 顯示訪問指南
echo "✅ 路徑前綴分離方案部署完成！"
echo ""
echo "🎯 訪問指南："
echo "================================"
echo "📱 主應用 (dify-next-frontend):"
echo "   - 主頁: http://54.169.166.197"
echo "   - API: http://54.169.166.197/next-api/*"
echo "   - 認證: http://54.169.166.197/next-auth/*"
echo ""
echo "🔧 原版 Dify:"
echo "   - Web界面: http://54.169.166.197/dify/"
echo "   - API: http://54.169.166.197/api/*"
echo "   - Console API: http://54.169.166.197/console/api/*"
echo ""
echo "🔌 其他服務:"
echo "   - REST-to-SOAP: http://54.169.166.197/soap/*"
echo "   - Plugin Daemon: http://54.169.166.197/e/*"
echo ""
echo "📋 如需檢查日誌:"
echo "   - docker-compose logs dify-next-frontend"
echo "   - docker-compose logs nginx"
echo "   - docker-compose logs api"
EOF
