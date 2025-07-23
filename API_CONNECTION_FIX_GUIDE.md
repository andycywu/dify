# Dify 502 Bad Gateway 錯誤修復指南

## 問題描述
您遇到的錯誤表明 Dify 前端無法連接到後端 API 服務：
- `502 Bad Gateway` 錯誤
- `SyntaxError: Unexpected token '<', "<html>..."` (HTML 錯誤頁面而非 JSON)

## 根本原因
1. **環境變量配置不完整**: `.env` 文件中的關鍵 URL 配置為空
2. **API 路由問題**: 前端嘗試直接訪問 API 而不是通過 nginx 代理

## 已修復的配置

### 1. 環境變量修復
已更新 `/Users/andycyw/dify/docker/.env` 中的以下配置：

```bash
CONSOLE_API_URL=http://localhost/console/api
CONSOLE_WEB_URL=http://localhost
SERVICE_API_URL=http://localhost/v1
APP_API_URL=http://localhost/v1
APP_WEB_URL=http://localhost
FILES_URL=http://localhost/files
```

### 2. 服務架構確認
- **Nginx** (port 80): 反向代理，處理所有外部請求
- **API** (internal port 5001): 後端 API 服務，只能通過 nginx 訪問
- **Web** (internal port 3000): Dify 控制台前端
- **Next.js Frontend** (port 3000, 8080): 您的自定義前端

## 修復步驟

### 立即修復
```bash
# 1. 運行修復腳本
chmod +x /Users/andycyw/dify/fix-api-connection.sh
./fix-api-connection.sh

# 2. 如果需要診斷
chmod +x /Users/andycyw/dify/diagnose-api-connection.sh
./diagnose-api-connection.sh
```

### 手動修復（如果腳本無法運行）
```bash
cd /Users/andycyw/dify/docker

# 停止服務
docker compose down

# 重啟服務
docker compose up -d

# 檢查狀態
docker compose ps
```

## 驗證修復

### 1. 服務狀態檢查
```bash
docker compose ps
```
確保所有服務都在運行且健康。

### 2. 網絡連接測試
```bash
# 測試 nginx
curl http://localhost/

# 測試 API
curl http://localhost/api/

# 測試控制台 API
curl http://localhost/console/api/
```

### 3. 瀏覽器測試
1. 清除瀏覽器緩存
2. 訪問 `http://localhost` (Dify 控制台)
3. 檢查瀏覽器開發者工具的 Network 標籤
4. 確認 API 請求返回 JSON 而不是 HTML

## 常見問題排除

### 如果仍然出現 502 錯誤
1. **檢查 API 服務健康狀態**:
   ```bash
   docker compose logs api
   ```

2. **檢查 nginx 配置**:
   ```bash
   docker compose logs nginx
   ```

3. **重啟特定服務**:
   ```bash
   docker compose restart api nginx
   ```

### 如果出現 CORS 錯誤
確保 `CONSOLE_WEB_URL` 設置正確，並重啟服務。

### 如果容器無法啟動
檢查端口衝突：
```bash
netstat -tulpn | grep :80
netstat -tulpn | grep :3000
```

## 預防措施

1. **定期檢查環境變量**: 確保 `.env` 文件配置完整
2. **監控服務日誌**: 定期檢查 docker compose logs
3. **備份配置**: 在修改前備份 `.env` 文件

## 技術說明

Dify 使用微服務架構：
- 所有外部請求都通過 nginx 代理
- API 服務不直接對外暴露
- 前端通過配置的 URL 變量知道如何連接後端
- 空的 URL 配置會導致前端使用錯誤的端點

修復後，請求流程：
```
瀏覽器 → nginx:80 → /console/api → api:5001
瀏覽器 → nginx:80 → /v1 → api:5001
瀏覽器 → nginx:80 → / → web:3000
```
