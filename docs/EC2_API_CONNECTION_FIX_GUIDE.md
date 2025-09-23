# EC2 環境 Dify 502 Bad Gateway 修復指南

## 問題分析

您在 EC2 環境中遇到的 502 Bad Gateway 錯誤，主要原因是：

1. **環境變數配置錯誤**：`.env` 文件中的 URL 配置指向 `localhost` 而不是 EC2 公共 IP
2. **前端 API 路由問題**：Dify 控制台嘗試訪問錯誤的端點
3. **可能的安全組配置問題**：EC2 安全組可能沒有開放必要的端口

## 已修復的配置

### 1. 更新環境變數 (已完成)
修改 `/Users/andycyw/dify/docker/.env`：

```bash
# 修改前（錯誤）
CONSOLE_API_URL=http://localhost/console/api
SERVICE_API_URL=http://localhost/v1

# 修改後（正確）
CONSOLE_API_URL=http://54.169.166.197/console/api
SERVICE_API_URL=http://54.169.166.197/v1
```

### 2. 服務架構確認
您的 EC2 環境架構：
```
Internet → EC2 (54.169.166.197:80) → Nginx → API (internal:5001)
```

## 立即修復步驟

### 方法 1: 使用自動修復腳本
```bash
# SSH 到您的 EC2 實例
ssh -i tpv-dify-key.pem ec2-user@54.169.166.197

# 進入專案目錄
cd /home/ec2-user/dify

# 運行修復腳本（如果已同步）
chmod +x fix-api-connection.sh
./fix-api-connection.sh
```

### 方法 2: 手動修復
```bash
# SSH 到 EC2
ssh -i tpv-dify-key.pem ec2-user@54.169.166.197

# 進入 docker 目錄
cd /home/ec2-user/dify/docker

# 停止所有服務
docker compose down

# 編輯 .env 文件
nano .env

# 找到並修改以下行：
CONSOLE_API_URL=http://54.169.166.197/console/api
CONSOLE_WEB_URL=http://54.169.166.197
SERVICE_API_URL=http://54.169.166.197/v1
APP_API_URL=http://54.169.166.197/v1
APP_WEB_URL=http://54.169.166.197
FILES_URL=http://54.169.166.197/files

# 重啟服務
docker compose up -d

# 檢查狀態
docker compose ps
```

## 驗證修復

### 1. 檢查服務狀態
```bash
docker compose ps
# 確保所有容器都在運行且健康

docker compose logs nginx
# 檢查 nginx 日誌是否有錯誤

docker compose logs api
# 檢查 API 日誌是否有錯誤
```

### 2. 測試網絡連接
```bash
# 在 EC2 實例內測試
curl http://54.169.166.197/
curl http://54.169.166.197/api/
curl http://54.169.166.197/console/api/
```

### 3. 瀏覽器測試
- 清除瀏覽器緩存
- 訪問 `http://54.169.166.197`
- 檢查開發者工具的 Network 標籤

## EC2 安全組檢查

確保您的 EC2 安全組包含以下規則：

| 類型 | 協議 | 端口範圍 | 來源 | 描述 |
|------|------|----------|------|------|
| HTTP | TCP | 80 | 0.0.0.0/0 | Dify 控制台 |
| Custom TCP | TCP | 3000 | 0.0.0.0/0 | Next.js 前端 |
| Custom TCP | TCP | 8080 | 0.0.0.0/0 | Next.js 備用端口 |
| SSH | TCP | 22 | Your-IP/32 | SSH 訪問 |

## 常見問題排除

### 問題 1: 仍然出現 502 錯誤
**解決方案**：
```bash
# 檢查 API 容器是否正常
docker compose exec api curl http://localhost:5001/health

# 重啟 API 和 nginx
docker compose restart api nginx

# 檢查端口綁定
docker compose ps
```

### 問題 2: CORS 錯誤
**解決方案**：
確保 `CONSOLE_WEB_URL` 設置正確並重啟服務。

### 問題 3: 無法訪問 EC2
**解決方案**：
- 檢查安全組設置
- 確認 EC2 實例正在運行
- 確認公共 IP 地址正確

## 預防措施

1. **定期備份 .env 文件**
2. **監控 Docker 日誌**：`docker compose logs -f`
3. **設置健康檢查**：確保服務運行正常
4. **文檔化環境配置**：記錄所有環境變數

## 技術說明

### EC2 環境的特殊考量：
- 公共 IP 可能會改變（除非使用彈性 IP）
- 安全組規則影響網絡訪問
- 內部 Docker 網絡使用容器名稱解析
- 外部訪問需要通過公共 IP

### 請求流程：
```
瀏覽器 → Internet → EC2公共IP:80 → Nginx → API:5001
用戶   → 54.169.166.197  → docker-nginx-1 → docker-api-1
```

## 緊急聯絡信息

如果問題持續：
1. 檢查 EC2 實例狀態
2. 重新啟動 EC2 實例
3. 檢查 CloudWatch 日誌
4. 考慮重新部署應用程式

修復完成後，您應該能夠正常訪問：
- Dify 控制台：http://54.169.166.197
- API 文檔：http://54.169.166.197/docs
