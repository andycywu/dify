# Weaviate 獨立部署指南

本指南將幫助您在 Ubuntu 伺服器上部署獨立的 Weaviate 向量資料庫,並與 Dify 整合。

## 📋 前置需求

- Ubuntu 伺服器 (已安裝 Docker)
- 至少 2GB 可用記憶體
- 至少 5GB 可用磁盤空間

## 🚀 快速部署

### 方法 1: 使用部署腳本(推薦)

```bash
# 1. 進入 dify 目錄
cd ~/dify

# 2. 賦予執行權限
chmod +x setup-weaviate.sh

# 3. 執行部署腳本
./setup-weaviate.sh
```

### 方法 2: 手動部署

```bash
# 1. 創建數據目錄
mkdir -p volumes/weaviate
chmod -R 755 volumes/weaviate

# 2. 啟動 Weaviate
docker-compose -f weaviate-standalone-docker-compose.yaml up -d

# 3. 查看啟動日誌
docker logs dify-weaviate -f

# 4. 等待服務就緒 (約 30-60 秒)
# 當看到 "weaviate is ready" 時表示啟動成功
```

## ⚙️ 配置 Dify 連接 Weaviate

### 步驟 1: 修改 docker/.env

確保以下配置正確:

```bash
# 編輯 docker/.env
vim docker/.env

# 確認或修改以下配置
VECTOR_STORE=weaviate
WEAVIATE_ENDPOINT=http://weaviate:8080
WEAVIATE_API_KEY=WVF5YThaHlkYwhGUSmCRgsX3tD5ngdN8pkih
```

### 步驟 2: 修改 Docker Compose 網路配置

#### 如果使用 docker/docker-compose.yaml:

在 `docker/docker-compose.yaml` 中添加外部網路:

```yaml
# 在文件底部添加
networks:
  default:
    name: dify-network
    external: true
```

或者確保 api 和 worker 服務使用相同的網路:

```yaml
services:
  api:
    # ... 其他配置 ...
    networks:
      - dify-network

  worker:
    # ... 其他配置 ...
    networks:
      - dify-network

networks:
  dify-network:
    external: true
```

### 步驟 3: 重啟 Dify 服務

```bash
# 方法 1: 如果使用 docker-compose
cd docker
docker-compose down
docker-compose up -d

# 方法 2: 如果使用 Tilt (不推薦,因為 k8s 問題)
# tilt down
# tilt up
```

## 🧪 測試連接

### 1. 測試 Weaviate 服務

```bash
# 檢查服務健康狀態
curl http://localhost:8080/v1/.well-known/ready

# 查看 Weaviate 元信息
curl http://localhost:8080/v1/meta

# 使用 API Key 測試
curl -H "Authorization: Bearer WVF5YThaHlkYwhGUSmCRgsX3tD5ngdN8pkih" \
  http://localhost:8080/v1/meta
```

### 2. 測試 Dify 連接

```bash
# 查看 API 日誌確認連接
docker logs <dify-api-container> | grep -i "weaviate\|vector"

# 或使用 Tilt (如果還在使用)
# tilt logs api | grep -i weaviate
```

### 3. 在 Dify Web 界面測試

1. 登入 Dify Web 界面
2. 創建或編輯一個知識庫
3. 上傳文檔並查看是否成功向量化
4. 測試向量搜索功能

## 🔧 管理命令

### 查看 Weaviate 狀態

```bash
# 查看容器狀態
docker ps | grep weaviate

# 查看詳細日誌
docker logs dify-weaviate -f

# 查看資源使用
docker stats dify-weaviate
```

### 重啟 Weaviate

```bash
# 重啟容器
docker restart dify-weaviate

# 完全重新部署
docker-compose -f weaviate-standalone-docker-compose.yaml down
docker-compose -f weaviate-standalone-docker-compose.yaml up -d
```

### 備份和恢復數據

```bash
# 備份 Weaviate 數據
tar -czf weaviate-backup-$(date +%Y%m%d).tar.gz volumes/weaviate/

# 恢復數據
docker-compose -f weaviate-standalone-docker-compose.yaml down
tar -xzf weaviate-backup-20231203.tar.gz
docker-compose -f weaviate-standalone-docker-compose.yaml up -d
```

## 🚨 常見問題排除

### 問題 1: Weaviate 無法啟動

**症狀**: 容器持續重啟

```bash
# 查看詳細日誌
docker logs dify-weaviate --tail 100

# 常見原因:
# 1. 端口 8080 被佔用
sudo netstat -tlnp | grep 8080

# 2. 權限問題
sudo chown -R $USER:$USER volumes/weaviate
chmod -R 755 volumes/weaviate

# 3. 記憶體不足
free -h
docker system prune -a  # 清理未使用的資源
```

### 問題 2: Dify API 無法連接 Weaviate

**症狀**: Vector database connection error

```bash
# 1. 檢查網路連接
docker network ls
docker network inspect dify-network

# 2. 測試容器間通信
docker exec <dify-api-container> ping weaviate
docker exec <dify-api-container> curl http://weaviate:8080/v1/meta

# 3. 確認環境變數
docker exec <dify-api-container> env | grep WEAVIATE
```

**解決方案**:

```bash
# 確保所有容器在同一網路
docker network connect dify-network dify-weaviate
docker network connect dify-network <dify-api-container>
docker network connect dify-network <dify-worker-container>
```

### 問題 3: 數據丟失

**症狀**: 重啟後向量數據消失

```bash
# 1. 檢查數據卷掛載
docker inspect dify-weaviate | grep -A 10 Mounts

# 2. 確認數據目錄
ls -la volumes/weaviate/

# 3. 重新掛載數據卷
docker-compose -f weaviate-standalone-docker-compose.yaml down
docker-compose -f weaviate-standalone-docker-compose.yaml up -d
```

### 問題 4: 性能問題

```bash
# 1. 監控資源使用
docker stats dify-weaviate

# 2. 調整記憶體限制 (編輯 docker-compose 文件)
# 在 weaviate 服務下添加:
    deploy:
      resources:
        limits:
          memory: 2G
        reservations:
          memory: 1G

# 3. 重啟服務
docker-compose -f weaviate-standalone-docker-compose.yaml up -d
```

## 📊 監控和維護

### 健康檢查腳本

創建 `check-weaviate-health.sh`:

```bash
#!/bin/bash
echo "🔍 檢查 Weaviate 健康狀態..."
curl -s http://localhost:8080/v1/.well-known/ready || echo "❌ Weaviate 未就緒"
curl -s http://localhost:8080/v1/meta | jq '.version' || echo "❌ 無法獲取版本信息"
docker stats dify-weaviate --no-stream
```

### 定期備份 (Cron Job)

```bash
# 編輯 crontab
crontab -e

# 添加每日備份任務 (每天凌晨 2 點)
0 2 * * * cd ~/dify && tar -czf ~/backups/weaviate-$(date +\%Y\%m\%d).tar.gz volumes/weaviate/ 2>&1 | logger -t weaviate-backup
```

## 🎯 優化建議

### 1. 生產環境配置

```yaml
# 在 weaviate-standalone-docker-compose.yaml 中調整:
environment:
  # 增加查詢限制
  QUERY_DEFAULTS_LIMIT: 100
  
  # 啟用日誌
  LOG_LEVEL: info
  
  # 性能優化
  LIMIT_RESOURCES: 'false'
  
  # 備份配置
  BACKUP_FILESYSTEM_PATH: /var/lib/weaviate/backups
```

### 2. 安全加固

```bash
# 使用強 API Key
# 編輯 docker-compose 文件,更改:
AUTHENTICATION_APIKEY_ALLOWED_KEYS: '<your-strong-api-key>'

# 同步更新 docker/.env
WEAVIATE_API_KEY=<your-strong-api-key>
```

### 3. 持久化存儲

```bash
# 使用命名卷而非本地目錄 (可選)
volumes:
  weaviate-data:
    driver: local
    driver_opts:
      type: none
      device: /data/weaviate
      o: bind
```

## 📚 相關資源

- [Weaviate 官方文檔](https://weaviate.io/developers/weaviate)
- [Weaviate Docker 部署](https://weaviate.io/developers/weaviate/installation/docker-compose)
- [Dify 文檔](https://docs.dify.ai/)

## 🆘 獲取幫助

遇到問題時,請提供:

1. Weaviate 日誌: `docker logs dify-weaviate --tail 100`
2. Dify API 日誌: `docker logs <api-container> | grep -i vector`
3. 網路配置: `docker network inspect dify-network`
4. 環境變數: `cat docker/.env | grep WEAVIATE`

---

**祝您部署順利！** 🚀
