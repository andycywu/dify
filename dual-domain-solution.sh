#!/bin/bash

echo "🌐 實施雙域名方案 - 最佳解決方案"
echo "================================"
echo "方案：使用兩個不同的域名/端口來完全分離服務"
echo ""

# 1. 進入正確目錄
cd /home/ec2-user/dify/docker

# 2. 備份當前配置
echo "📁 備份當前配置..."
cp nginx/conf.d/default.conf.template nginx/conf.d/default.conf.template.backup.$(date +%Y%m%d_%H%M%S)

# 3. 創建雙域名 Nginx 配置
echo "📝 創建雙域名 Nginx 配置..."
cat > nginx/conf.d/default.conf.template << 'NGINX_EOF'
# 雙域名方案 - 完全分離的最佳解決方案

# 原版 Dify - 使用默認端口 80
server {
    listen 80;
    server_name localhost 54.169.166.197;

    # 原版 Dify API 路徑
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

    # 默認路由 - 原版 Dify Web
    location / {
        proxy_pass http://web:3000;
        include proxy.conf;
    }

    # placeholder for acme challenge location
    ${ACME_CHALLENGE_LOCATION}

    # placeholder for https config defined in https.conf.template
    ${HTTPS_CONFIG}
}

# dify-next-frontend - 使用端口 8080
server {
    listen 8080;
    server_name localhost 54.169.166.197;

    # Next.js 靜態資源
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

    # Next.js API 路徑
    location /api {
        proxy_pass http://dify-next-frontend:3000/api;
        include proxy.conf;
    }

    # 默認路由 - dify-next-frontend
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

# 4. 更新 dify-next-frontend 配置
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
      # 使用端口 8080 的配置
      - NEXT_PUBLIC_API_URL=http://54.169.166.197:8080/api
      - NEXT_PUBLIC_AUTH_URL=http://54.169.166.197:8080/api/auth
      - API_URL=http://54.169.166.197:8080/api
      - NEXTAUTH_URL=http://54.169.166.197:8080
      # Dify 後端 API (如果需要調用原版 Dify)
      - NEXT_PUBLIC_DIFY_API_BASE_URL=http://54.169.166.197/v1
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

  nginx:
    ports:
      - "80:80"
      - "8080:8080"
      - "443:443"
OVERRIDE_EOF

# 5. 重新啟動服務
echo "🔄 重新啟動服務..."
docker-compose down nginx dify-next-frontend
sleep 5
docker-compose up -d nginx dify-next-frontend

# 6. 等待服務啟動
echo "⏳ 等待服務啟動..."
sleep 60

# 7. 測試兩個域名
echo "🌐 測試雙域名配置..."
echo ""

echo "=== 原版 Dify (端口 80) ==="
echo "1. Dify 主頁:"
curl -I http://localhost:80/ 2>/dev/null | head -3
echo ""

echo "2. Dify API:"
curl -I http://localhost:80/api/health 2>/dev/null | head -3
echo ""

echo "=== dify-next-frontend (端口 8080) ==="
echo "3. Next.js 主頁:"
curl -I http://localhost:8080/ 2>/dev/null | head -3
echo ""

echo "4. Next.js API:"
curl -I http://localhost:8080/api/health 2>/dev/null | head -3
echo ""

# 8. 檢查容器狀態
echo "🔍 檢查容器狀態..."
docker-compose ps | grep -E "(dify-next-frontend|nginx|api|web)"
echo ""

# 9. 檢查端口監聽
echo "🔍 檢查端口監聽..."
netstat -ln | grep -E ":(80|8080)" | head -5
echo ""

echo "✅ 雙域名方案部署完成！"
echo ""
echo "🎯 訪問指南："
echo "================================"
echo "🔧 原版 Dify:"
echo "   - URL: http://54.169.166.197"
echo "   - 端口: 80 (默認)"
echo "   - API: http://54.169.166.197/api/*"
echo "   - Console: http://54.169.166.197/console/api/*"
echo ""
echo "📱 dify-next-frontend:"
echo "   - URL: http://54.169.166.197:8080"
echo "   - 端口: 8080"
echo "   - API: http://54.169.166.197:8080/api/*"
echo ""
echo "💡 優點："
echo "   ✅ 完全獨立的域名/端口"
echo "   ✅ 零路徑衝突"
echo "   ✅ 配置簡單清晰"
echo "   ✅ 易於維護和擴展"
echo "   ✅ 兩個系統完全獨立"
echo ""
echo "📋 如需檢查日誌:"
echo "   - docker-compose logs dify-next-frontend"
echo "   - docker-compose logs nginx"
echo "   - docker-compose logs api"
echo "   - docker-compose logs web"
EOF
