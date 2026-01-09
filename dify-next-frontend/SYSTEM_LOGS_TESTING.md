# System Logs 功能測試指南

## 測試步驟

### 1. 重新構建並啟動服務

```bash
cd ~/dify/docker
docker compose up -d --build dify-next-frontend
```

### 2. 訪問 Admin Panel

打開瀏覽器：
```
http://172.27.197.100:3001/admin
```

使用管理員帳號登入。

### 3. 測試功能

#### 3.1 在 Overview 頁面測試
1. 查看 "系統日誌" 卡片
2. 點擊 **"查看日誌"** 按鈕
3. 應該會切換到 System Logs 標籤

#### 3.2 在 System Logs 標籤測試
1. 觀察容器下拉選單
   - 應該列出所有 Docker 容器
   - 預設選中第一個容器

2. 選擇不同容器
   ```
   - docker-api-1
   - docker-worker-1
   - docker-web-1
   - docker-dify-next-frontend-1
   - dify-wiki
   - rest-to-soap-proxy
   - docker-db-1
   - docker-redis-1
   - docker-nginx-1
   ```

3. 測試行數選擇
   - 切換不同行數 (50/100/200/500/1000)
   - 觀察日誌變化

4. 測試手動刷新
   - 點擊 **"🔄 刷新日誌"**
   - 確認日誌更新

5. 測試自動刷新
   - 點擊 **"▶️ 自動刷新"**
   - 觀察日誌每 3 秒更新
   - 點擊 **"⏸️ 停止自動刷新"** 停止

6. 測試容器列表更新
   - 點擊 **"🔄 更新容器列表"**
   - 確認列表更新

### 4. API 測試

#### 4.1 列出容器
```bash
curl http://172.27.197.100:3001/api/admin/docker-logs?action=list | jq
```

預期回應：
```json
{
  "containers": [
    {
      "id": "abc123",
      "name": "docker-api-1",
      "status": "Up 2 hours",
      "image": "langgenius/dify-api:2.0.0"
    }
  ],
  "timestamp": "2026-01-09T..."
}
```

#### 4.2 查看容器日誌
```bash
curl "http://172.27.197.100:3001/api/admin/docker-logs?action=logs&container=docker-api-1&lines=10" | jq
```

預期回應：
```json
{
  "logs": "日誌內容...",
  "timestamp": "2026-01-09T..."
}
```

### 5. 常見容器推薦查看

#### Dify API 服務日誌
```
容器：docker-api-1
用途：查看 API 請求、錯誤、資料庫查詢
```

#### Next.js 前端日誌
```
容器：docker-dify-next-frontend-1
用途：查看前端構建、SSR 請求、API 調用
```

#### Wiki.js 日誌
```
容器：dify-wiki
用途：查看 Wiki 文章操作、用戶活動
```

#### PostgreSQL 資料庫日誌
```
容器：docker-db-1
用途：查看 SQL 查詢、連接狀態
```

#### Redis 快取日誌
```
容器：docker-redis-1
用途：查看快取操作、記憶體使用
```

#### Nginx 反向代理日誌
```
容器：docker-nginx-1
用途：查看 HTTP 請求、路由
```

## 預期結果

### ✅ 成功指標

- [ ] 容器列表正確顯示
- [ ] 可以選擇不同容器
- [ ] 日誌正確顯示
- [ ] 自動滾動到最新日誌
- [ ] 手動刷新功能正常
- [ ] 自動刷新每 3 秒更新
- [ ] 容器狀態顏色正確（綠色=運行中，紅色=已停止）
- [ ] 可以改變顯示行數
- [ ] 終端風格顯示（黑底綠字）

### ❌ 需要檢查的問題

如果出現以下情況，請檢查：

1. **容器列表為空**
   ```bash
   # 檢查 Docker socket 是否掛載
   docker exec docker-dify-next-frontend-1 ls -la /var/run/docker.sock
   
   # 測試 Docker 命令
   docker exec docker-dify-next-frontend-1 docker ps -a
   ```

2. **API 返回錯誤**
   ```bash
   # 查看 Next.js 容器日誌
   docker logs docker-dify-next-frontend-1 --tail 50
   ```

3. **無法訪問 Admin Panel**
   - 確認使用管理員帳號登入
   - 檢查用戶角色是否為 'admin' 或 'Administrator'

## Docker Socket 掛載

確保 `docker-compose.yaml` 中有以下配置：

```yaml
dify-next-frontend:
  volumes:
    - /var/run/docker.sock:/var/run/docker.sock:ro
```

如果沒有，需要添加並重新啟動：

```bash
cd ~/dify/docker
docker compose down dify-next-frontend
# 編輯 docker-compose.yaml 添加 socket 掛載
docker compose up -d dify-next-frontend
```

## 除錯命令

### 在容器內測試 Docker 命令
```bash
docker exec docker-dify-next-frontend-1 docker ps -a
docker exec docker-dify-next-frontend-1 docker logs docker-api-1 --tail 10
```

### 查看 API 日誌
```bash
docker logs docker-dify-next-frontend-1 -f | grep docker-logs
```

### 測試 API 端點
```bash
# 列出容器
curl -v http://172.27.197.100:3001/api/admin/docker-logs?action=list

# 查看日誌
curl -v "http://172.27.197.100:3001/api/admin/docker-logs?action=logs&container=docker-api-1&lines=50"
```

## 性能考量

- **自動刷新間隔：** 3 秒（可根據需求調整）
- **預設顯示行數：** 100 行
- **最大行數：** 1000 行（避免過多數據）

## 安全注意事項

⚠️ **生產環境建議：**

1. 加強 API 權限驗證
2. 限制可查看的容器範圍
3. 添加操作日誌記錄
4. 考慮使用 Docker API 而非 CLI
5. 限制日誌查詢頻率（rate limiting）

---

**測試完成後請回報：**
- ✅ 所有功能正常
- ⚠️ 部分功能有問題（請描述）
- ❌ 無法使用（請提供錯誤訊息）
