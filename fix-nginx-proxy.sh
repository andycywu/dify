#!/bin/bash

echo "🔧 修復 Nginx 反向代理配置"
echo "================================"

# 1. 備份當前配置
echo "📁 備份當前 Nginx 配置..."
cp nginx/conf.d/default.conf.template nginx/conf.d/default.conf.template.backup.$(date +%Y%m%d_%H%M%S)

# 2. 創建新的 Nginx 配置
echo "📝 創建新的 Nginx 配置..."
cat > nginx/conf.d/default.conf.template << 'NGINX_EOF'
# Updated Nginx configuration for dify-next-frontend

# Default server - serve dify-next-frontend as main application
server {
    listen ${NGINX_PORT};
    server_name localhost;

    # API endpoints for the backend
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

    # Plugin daemon
    location /e/ {
        proxy_pass http://plugin_daemon:5002;
        proxy_set_header Dify-Hook-Url $scheme://$host$request_uri;
        include proxy.conf;
    }

    # REST-to-SOAP proxy
    location /soap/ {
        proxy_pass http://rest-to-soap-proxy:5001/;
        include proxy.conf;
    }

    # Next.js static assets
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

    # Legacy web interface (accessible via /legacy)
    location /legacy {
        rewrite ^/legacy/(.*)$ /$1 break;
        proxy_pass http://web:3000;
        include proxy.conf;
    }

    # Default route - serve dify-next-frontend
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

# 3. 重新啟動 Nginx 容器
echo "🔄 重新啟動 Nginx 容器..."
docker-compose restart nginx

# 4. 等待 Nginx 重新啟動
echo "⏳ 等待 Nginx 重新啟動..."
sleep 10

# 5. 檢查 Nginx 狀態
echo "🔍 檢查 Nginx 狀態..."
docker-compose ps nginx

# 6. 檢查 Nginx 日誌
echo "📋 檢查 Nginx 日誌..."
docker-compose logs --tail=20 nginx

# 7. 測試連接
echo "🌐 測試連接..."
echo "測試根目錄 (應該顯示 dify-next-frontend):"
curl -I http://localhost/ 2>/dev/null | head -3

echo "測試 API 端點:"
curl -I http://localhost/api/health 2>/dev/null | head -3

echo "✅ Nginx 配置更新完成！"
echo ""
echo "🎯 現在您可以通過以下方式訪問："
echo "- 主應用 (dify-next-frontend): http://54.169.166.197"
echo "- API 端點: http://54.169.166.197/api/"
echo "- 原版 Dify Web (如需要): http://54.169.166.197/legacy"
echo ""
echo "如果仍有問題，請檢查："
echo "1. dify-next-frontend 容器是否正常運行"
echo "2. Nginx 錯誤日誌: docker-compose logs nginx"
