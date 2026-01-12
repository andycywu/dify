# REST to SOAP Proxy - Docker Compose 部署指南

## 概述

REST to SOAP Proxy 服務已整合到主 Docker Compose 配置中，提供：
- ✅ **SOAP API 模式**（原有功能）：REST to SOAP 代理
- ✅ **HTTPS API 模式**（新功能）：使用 Puppeteer 自動下載 URTracker Excel 文件

## 配置說明

### 1. 環境變量配置

在 `docker/.env` 文件中添加以下配置（參考 `.env.example`）：

```bash
# ------------------------------
# REST to SOAP Proxy Configuration
# ------------------------------
# 服務端口（映射到容器內的 5001）
REST_TO_SOAP_PORT=5100

# SOAP API 認證（用於舊的 SOAP 模式）
URTRACKER_APP_ID=your_app_id
URTRACKER_API_PWD=your_api_password

# HTTPS 模式認證（用於新的 Puppeteer 下載模式）
# 請在伺服器上設定實際的帳號密碼
URTRACKER_USERNAME=
URTRACKER_PASSWORD=
```

### 2. 服務配置

服務定義在 `docker/docker-compose.yaml` 中：

```yaml
rest-to-soap-proxy:
  build:
    context: ../rest-to-soap-proxy
    dockerfile: Dockerfile
  container_name: rest-to-soap-proxy
  restart: always
  ports:
    - "${REST_TO_SOAP_PORT:-5100}:5001"
  environment:
    APP_ID: ${URTRACKER_APP_ID:-}
    API_PWD: ${URTRACKER_API_PWD:-}
    URTRACKER_USERNAME: ${URTRACKER_USERNAME}
    URTRACKER_PASSWORD: ${URTRACKER_PASSWORD}
  volumes:
    - ./volumes/rest-to-soap-proxy/logs:/app/logs
    - ./volumes/rest-to-soap-proxy/temp:/app/src/clients/temp_downloads
```

## 部署步驟

### 方法 1：使用 Docker Compose（推薦）

```bash
cd ~/dify/docker

# 1. 配置環境變量
cp .env.example .env
nano .env  # 編輯並填入 URTracker 認證信息

# 2. 構建並啟動服務
docker compose up -d rest-to-soap-proxy

# 3. 查看日誌
docker compose logs -f rest-to-soap-proxy

# 4. 檢查服務狀態
docker compose ps rest-to-soap-proxy
```

### 方法 2：重啟整個 Docker 堆棧

```bash
cd ~/dify/docker

# 停止所有服務
docker compose down

# 重新構建並啟動所有服務
docker compose up -d

# 查看 REST to SOAP Proxy 日誌
docker compose logs -f rest-to-soap-proxy
```

### 方法 3：僅更新 REST to SOAP Proxy

```bash
cd ~/dify/docker

# 停止並刪除舊容器
docker compose stop rest-to-soap-proxy
docker compose rm -f rest-to-soap-proxy

# 重新構建鏡像
docker compose build rest-to-soap-proxy

# 啟動新容器
docker compose up -d rest-to-soap-proxy
```

## API 使用

服務啟動後，可通過以下 URL 訪問（假設 `REST_TO_SOAP_PORT=5100`）：

### HTTPS API 模式（新功能 - 使用 Puppeteer）

```bash
# 查看 API 文檔
curl http://localhost:5100/

# 健康檢查
curl http://localhost:5100/health

# 下載 MNT 專案數據
curl -O http://localhost:5100/api/https/download-by-name/MNT

# 下載 TV 專案數據
curl -O http://localhost:5100/api/https/download-by-name/TV

# 下載 PD 專案數據
curl -O http://localhost:5100/api/https/download-by-name/PD

# 下載 AVA 專案數據（Project ID: 2337）
curl -O http://localhost:5100/api/https/download-by-name/AVA
```

### SOAP API 模式（原有功能）

```bash
# 調用 SOAP 方法
curl http://localhost:5100/GetProjectPRList

# 其他 SOAP 方法
curl http://localhost:5100/GetURTTaskList
curl http://localhost:5100/GetProjectMembers
# ... 等 18 個 SOAP 方法
```

## 專案 ID 配置

當前配置的專案：

| 專案代碼 | 專案 ID | 專案名稱 |
|---------|---------|----------|
| TV      | 2558    | TV-Data  |
| PD      | 2559    | PD-Data  |
| MNT     | 2561    | MNT-Data |
| AVA     | 2337    | AVA-Data |

如需修改或添加專案，編輯 `rest-to-soap-proxy/src/clients/https-client.js`：

```javascript
this.projects = {
  TV: { id: 2558, name: 'TV-Data' },
  PD: { id: 2559, name: 'PD-Data' },
  MNT: { id: 2561, name: 'MNT-Data' },
  AVA: { id: 2337, name: 'AVA-Data' }
};
```

## 故障排除

### 查看容器日誌

```bash
# 實時日誌
docker compose logs -f rest-to-soap-proxy

# 最近 100 行
docker compose logs --tail=100 rest-to-soap-proxy
```

### 進入容器檢查

```bash
docker compose exec rest-to-soap-proxy /bin/bash

# 檢查文件
ls -la /app
ls -la /app/src/clients/temp_downloads

# 檢查進程
ps aux | grep node
```

### 重新構建鏡像

```bash
cd ~/dify/docker

# 強制重新構建（不使用緩存）
docker compose build --no-cache rest-to-soap-proxy

# 啟動
docker compose up -d rest-to-soap-proxy
```

### 檢查健康狀態

```bash
# 使用 Docker
docker inspect rest-to-soap-proxy | grep -A 10 Health

# 使用 curl
curl http://localhost:5100/health
```

### 常見問題

**問題：Puppeteer 無法啟動瀏覽器**
```bash
# 檢查 Chromium 依賴
docker compose exec rest-to-soap-proxy dpkg -l | grep -E 'chromium|chrome'

# 查看詳細錯誤
docker compose logs rest-to-soap-proxy | grep -i "puppeteer\|chromium\|chrome"
```

**問題：下載超時**
```bash
# 檢查網絡連接
docker compose exec rest-to-soap-proxy curl -I https://fwtrack.tpv-tech.com

# 增加超時時間（在代碼中修改 timeout 參數）
```

**問題：權限錯誤**
```bash
# 修復臨時下載目錄權限
docker compose exec rest-to-soap-proxy chmod -R 777 /app/src/clients/temp_downloads
```

## 卷和持久化數據

服務使用以下卷：

```yaml
volumes:
  # 日誌目錄
  - ./volumes/rest-to-soap-proxy/logs:/app/logs
  
  # 臨時下載目錄（用於調試）
  - ./volumes/rest-to-soap-proxy/temp:/app/src/clients/temp_downloads
```

在主機上訪問：
```bash
# 查看日誌
ls -la ~/dify/docker/volumes/rest-to-soap-proxy/logs/

# 查看臨時文件
ls -la ~/dify/docker/volumes/rest-to-soap-proxy/temp/
```

## 與其他 Dify 服務集成

REST to SOAP Proxy 服務運行在獨立容器中，可以被其他 Dify 服務調用：

```javascript
// 在 Dify API 或 Worker 中調用
const response = await fetch('http://rest-to-soap-proxy:5001/api/https/download-by-name/MNT');
```

## 監控和維護

### 定期清理

```bash
# 清理舊的調試截圖和臨時文件
docker compose exec rest-to-soap-proxy find /app/src/clients -name "*.png" -mtime +7 -delete
docker compose exec rest-to-soap-proxy find /app/src/clients/temp_downloads -type f -mtime +1 -delete
```

### 性能監控

```bash
# 查看容器資源使用
docker stats rest-to-soap-proxy

# 查看容器進程
docker compose top rest-to-soap-proxy
```

## 更新流程

```bash
cd ~/dify

# 1. 從 GitHub 拉取最新代碼
git pull origin main

# 2. 停止服務
cd docker
docker compose stop rest-to-soap-proxy

# 3. 重新構建
docker compose build rest-to-soap-proxy

# 4. 啟動服務
docker compose up -d rest-to-soap-proxy

# 5. 驗證
curl http://localhost:5100/health
```

## 安全建議

1. **不要在 docker-compose.yaml 中硬編碼密碼**，使用 `.env` 文件
2. **限制端口訪問**：僅在內部網絡暴露服務
3. **定期更新依賴**：`npm audit fix`
4. **監控日誌**：設置日誌輪轉和告警

## 支持

如有問題，請查看：
- 容器日誌：`docker compose logs rest-to-soap-proxy`
- 服務狀態：`curl http://localhost:5100/health`
- API 文檔：`http://localhost:5100/`
