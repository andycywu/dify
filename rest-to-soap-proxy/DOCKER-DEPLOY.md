# 🐳 Docker 部署指南 - 遠端伺服器 172.27.197.100

## 📋 部署步驟

### 1️⃣ 構建 Docker 鏡像

在項目目錄下執行：
```bash
cd /path/to/rest-to-soap-proxy
docker build -t urtracker-proxy:v2.0 .
```

### 2️⃣ 運行 Docker 容器

**方式 A: 基本運行（映射端口到 5001）**
```bash
docker run -d \
  --name urtracker-proxy \
  -p 5001:5001 \
  -e APP_ID=your_app_id \
  -e API_PWD=your_api_pwd \
  --restart unless-stopped \
  urtracker-proxy:v2.0
```

**方式 B: 自定義端口（例如映射到 8080）**
```bash
docker run -d \
  --name urtracker-proxy \
  -p 8080:5001 \
  -e APP_ID=your_app_id \
  -e API_PWD=your_api_pwd \
  --restart unless-stopped \
  urtracker-proxy:v2.0
```

**方式 C: 使用環境變數文件**
```bash
docker run -d \
  --name urtracker-proxy \
  -p 5001:5001 \
  --env-file .env \
  --restart unless-stopped \
  urtracker-proxy:v2.0
```

### 3️⃣ 檢查容器狀態

```bash
# 查看容器是否運行
docker ps | grep urtracker-proxy

# 查看容器日誌
docker logs urtracker-proxy

# 查看實時日誌
docker logs -f urtracker-proxy
```

### 4️⃣ 測試服務

**在伺服器本地測試：**
```bash
curl http://localhost:5001/health
```

**從外部訪問：**
```bash
curl http://172.27.197.100:5001/health
```

## 🔥 防火牆配置

### Ubuntu/Debian 系統

```bash
# 檢查防火牆狀態
sudo ufw status

# 開放 5001 端口
sudo ufw allow 5001/tcp

# 重新載入防火牆
sudo ufw reload

# 驗證規則
sudo ufw status numbered
```

### CentOS/RHEL 系統

```bash
# 檢查 firewalld 狀態
sudo firewall-cmd --state

# 開放 5001 端口
sudo firewall-cmd --permanent --add-port=5001/tcp

# 重新載入防火牆
sudo firewall-cmd --reload

# 驗證規則
sudo firewall-cmd --list-ports
```

### 檢查端口是否監聽

```bash
# 方式 1: 使用 netstat
netstat -tlnp | grep 5001

# 方式 2: 使用 ss
ss -tlnp | grep 5001

# 方式 3: 使用 lsof
lsof -i :5001
```

## 📦 Docker Compose 配置（推薦）

創建 `docker-compose.yml`：

```yaml
version: '3.8'

services:
  urtracker-proxy:
    build: .
    container_name: urtracker-proxy
    ports:
      - "5001:5001"
    environment:
      - APP_ID=${APP_ID}
      - API_PWD=${API_PWD}
      - PORT=5001
      - NODE_ENV=production
    restart: unless-stopped
    volumes:
      # 可選：掛載日誌目錄
      - ./logs:/app/logs
    networks:
      - urtracker-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5001/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

networks:
  urtracker-network:
    driver: bridge
```

**使用 Docker Compose 啟動：**
```bash
# 啟動服務
docker-compose up -d

# 查看日誌
docker-compose logs -f

# 停止服務
docker-compose down

# 重啟服務
docker-compose restart
```

## 🔧 完整部署腳本

創建 `deploy.sh`：

```bash
#!/bin/bash

echo "=========================================="
echo "Urtracker Proxy Docker 部署腳本"
echo "=========================================="

# 設置變數
IMAGE_NAME="urtracker-proxy"
CONTAINER_NAME="urtracker-proxy"
PORT=5001

# 停止並刪除舊容器
echo "1. 清理舊容器..."
docker stop $CONTAINER_NAME 2>/dev/null || true
docker rm $CONTAINER_NAME 2>/dev/null || true

# 構建新鏡像
echo "2. 構建 Docker 鏡像..."
docker build -t $IMAGE_NAME:latest .

if [ $? -ne 0 ]; then
    echo "❌ 鏡像構建失敗！"
    exit 1
fi

# 運行容器
echo "3. 啟動容器..."
docker run -d \
  --name $CONTAINER_NAME \
  -p $PORT:5001 \
  --env-file .env \
  --restart unless-stopped \
  $IMAGE_NAME:latest

if [ $? -ne 0 ]; then
    echo "❌ 容器啟動失敗！"
    exit 1
fi

# 等待服務啟動
echo "4. 等待服務啟動..."
sleep 5

# 檢查容器狀態
echo "5. 檢查容器狀態..."
docker ps | grep $CONTAINER_NAME

# 測試服務
echo "6. 測試服務..."
curl -s http://localhost:$PORT/health

# 顯示日誌
echo ""
echo "=========================================="
echo "部署完成！"
echo "=========================================="
echo "容器名稱: $CONTAINER_NAME"
echo "端口映射: $PORT -> 5001"
echo "服務地址: http://172.27.197.100:$PORT"
echo ""
echo "查看日誌: docker logs -f $CONTAINER_NAME"
echo "停止服務: docker stop $CONTAINER_NAME"
echo "=========================================="
```

**給腳本添加執行權限並運行：**
```bash
chmod +x deploy.sh
./deploy.sh
```

## 🌐 Nginx 反向代理配置（可選）

如果你想通過 Nginx 代理訪問，創建 `/etc/nginx/sites-available/urtracker-proxy`：

```nginx
server {
    listen 80;
    server_name 172.27.197.100;  # 或你的域名

    location /urtracker/ {
        proxy_pass http://localhost:5001/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # 超時設置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

**啟用配置：**
```bash
sudo ln -s /etc/nginx/sites-available/urtracker-proxy /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

**訪問方式：**
- 直接訪問: `http://172.27.197.100:5001`
- 通過 Nginx: `http://172.27.197.100/urtracker/`

## 📊 監控和維護

### 查看資源使用情況
```bash
docker stats urtracker-proxy
```

### 查看容器詳細信息
```bash
docker inspect urtracker-proxy
```

### 進入容器內部
```bash
docker exec -it urtracker-proxy /bin/bash
```

### 更新服務
```bash
# 拉取最新代碼
git pull

# 重新構建並部署
./deploy.sh
```

### 備份和恢復
```bash
# 導出鏡像
docker save urtracker-proxy:latest > urtracker-proxy.tar

# 導入鏡像
docker load < urtracker-proxy.tar
```

## 🔒 安全建議

1. **不要在 .env 文件中存儲敏感信息**
   - 使用 Docker secrets 或環境變數

2. **限制訪問來源**
   ```bash
   # 只允許特定 IP 訪問
   sudo ufw allow from 192.168.1.0/24 to any port 5001
   ```

3. **使用 HTTPS**
   - 配置 SSL 證書
   - 使用 Let's Encrypt

4. **定期更新**
   - 更新 Docker 鏡像
   - 更新依賴包

## ⚠️ 故障排除

### 容器無法啟動
```bash
# 查看詳細日誌
docker logs urtracker-proxy

# 檢查端口是否被佔用
sudo netstat -tlnp | grep 5001
```

### 外部無法訪問
```bash
# 檢查防火牆
sudo ufw status

# 檢查 Docker 網絡
docker network inspect bridge

# 檢查端口映射
docker port urtracker-proxy
```

### 服務響應慢
```bash
# 增加容器資源
docker update --memory 2g --cpus 2 urtracker-proxy
```

## 📞 快速測試命令

**從伺服器本地測試：**
```bash
# 健康檢查
curl http://localhost:5001/health

# 查看首頁
curl http://localhost:5001/
```

**從外部客戶端測試：**
```bash
# 健康檢查
curl http://172.27.197.100:5001/health

# 測試連接
curl http://172.27.197.100:5001/api/https/test-connection

# HTTPS 模式登入
curl -X POST http://172.27.197.100:5001/api/https/login \
  -H "Content-Type: application/json" \
  -d '{"username":"your_user","password":"your_pass"}'
```

## 🎯 生產環境建議

1. **使用 Docker Compose** - 更易於管理
2. **配置健康檢查** - 自動重啟失敗的容器
3. **設置資源限制** - 防止資源耗盡
4. **啟用日誌輪轉** - 防止日誌文件過大
5. **使用反向代理** - Nginx 或 Traefik
6. **配置 SSL/TLS** - 確保通信安全
7. **監控和告警** - Prometheus + Grafana

## 📝 檢查清單

- [ ] Docker 鏡像已構建
- [ ] 容器已啟動
- [ ] 端口 5001 已映射
- [ ] 防火牆已開放 5001 端口
- [ ] 本地可以訪問 http://localhost:5001
- [ ] 外部可以訪問 http://172.27.197.100:5001
- [ ] 環境變數已配置
- [ ] 健康檢查通過
- [ ] 日誌正常輸出
- [ ] API 測試成功
