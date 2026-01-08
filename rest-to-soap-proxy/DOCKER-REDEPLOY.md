# Docker 重新部署指南

## 快速部署

### 方法 1：使用部署腳本（推薦）

```bash
cd ~/dify/rest-to-soap-proxy
chmod +x redeploy-docker.sh
./redeploy-docker.sh
```

### 方法 2：手動部署

```bash
cd ~/dify/rest-to-soap-proxy

# 1. 停止並刪除舊容器
docker stop docker-rest-to-soap-proxy-1
docker rm docker-rest-to-soap-proxy-1

# 2. 構建新鏡像
docker build -t docker-rest-to-soap-proxy .

# 3. 啟動新容器
docker run -d \
  --name docker-rest-to-soap-proxy-1 \
  -p 5100:5001 \
  --restart unless-stopped \
  -e URTRACKER_USERNAME="andycy.wu" \
  -e URTRACKER_PASSWORD='XrnkE$F4S.kAuyV1' \
  docker-rest-to-soap-proxy

# 4. 查看日誌
docker logs -f docker-rest-to-soap-proxy-1
```

## 測試部署

```bash
# 測試下載 MNT 專案
curl -O http://localhost:5100/api/https/download-by-name/MNT

# 測試下載 TV 專案
curl -O http://localhost:5100/api/https/download-by-name/TV

# 測試下載 PD 專案
curl -O http://localhost:5100/api/https/download-by-name/PD

# 測試下載 AVA 專案（已修正 ID 為 2337）
curl -O http://localhost:5100/api/https/download-by-name/AVA
```

## 檢查容器狀態

```bash
# 查看運行中的容器
docker ps | grep rest-to-soap

# 查看容器日誌
docker logs docker-rest-to-soap-proxy-1

# 進入容器檢查
docker exec -it docker-rest-to-soap-proxy-1 /bin/bash
```

## 更新步驟（從 GitHub 同步）

```bash
cd ~/dify
git pull origin main
cd rest-to-soap-proxy
./redeploy-docker.sh
```

## 重要更新說明

### 新增功能
- ✅ 使用 Puppeteer 自動化瀏覽器操作
- ✅ 支持自動登入和文件下載
- ✅ 使用 CDP 配置下載行為
- ✅ 自動清理臨時文件

### Dockerfile 更新
- 安裝 Chromium 和 Puppeteer 所需的系統依賴
- 創建臨時下載目錄
- 配置正確的權限

### 專案 ID 更正
- AVA: 2337（已修正）
- TV: 2558
- PD: 2559
- MNT: 2561

## 故障排除

### 如果下載失敗
1. 檢查容器日誌：`docker logs docker-rest-to-soap-proxy-1`
2. 檢查是否有錯誤截圖：`docker exec docker-rest-to-soap-proxy-1 ls -la /app/src/clients/*.png`
3. 重啟容器：`docker restart docker-rest-to-soap-proxy-1`

### 如果構建失敗
1. 清理 Docker 緩存：`docker system prune -a`
2. 重新構建：`docker build --no-cache -t docker-rest-to-soap-proxy .`

### 查看 Puppeteer 日誌
```bash
docker logs docker-rest-to-soap-proxy-1 | grep -E "Puppeteer|下載|登入"
```
