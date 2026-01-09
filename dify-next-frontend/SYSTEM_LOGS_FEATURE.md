# System Logs - Docker 容器日誌查看功能

## 概述

Admin Panel 的 **System Logs** 功能已實作完成，可以選擇並查看不同 Docker 容器的即時日誌。

## 功能特性

### ✅ 已實作功能

1. **容器列表顯示**
   - 自動獲取所有 Docker 容器（包含已停止的）
   - 顯示容器名稱、映像、狀態

2. **容器選擇器**
   - 下拉式選單選擇要查看的容器
   - 自動選擇第一個容器

3. **日誌查看**
   - 可設定顯示行數（50/100/200/500/1000）
   - 即時顯示容器日誌
   - 終端風格的黑底綠字顯示
   - 自動滾動到最新日誌

4. **刷新機制**
   - 手動刷新按鈕
   - 自動刷新模式（每 3 秒）
   - 更新容器列表

5. **狀態顯示**
   - 容器運行狀態（Running/Exited 等）
   - 狀態顏色標示（綠色=運行中，紅色=已停止）
   - 載入動畫

## 文件結構

```
dify-next-frontend/
├── pages/
│   ├── admin.tsx                          # 主頁面（已更新）
│   └── api/
│       └── admin/
│           └── docker-logs.ts             # Docker 日誌 API（新增）
├── components/
│   └── Admin/
│       └── SystemLogs.tsx                 # System Logs 組件（新增）
└── locales/
    ├── zh/admin.json                      # 中文翻譯（已更新）
    └── en/admin.json                      # 英文翻譯（已更新）
```

## API 端點

### GET `/api/admin/docker-logs`

#### 列出所有容器
```bash
GET /api/admin/docker-logs?action=list
```

**回應：**
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

#### 獲取容器日誌
```bash
GET /api/admin/docker-logs?action=logs&container=docker-api-1&lines=100
```

**回應：**
```json
{
  "logs": "container log output...",
  "timestamp": "2026-01-09T..."
}
```

## 使用方式

### 1. 訪問 Admin Panel
```
http://your-domain/admin
```

### 2. 切換到 System Logs 標籤
- 在頂部導航欄點擊 **"系統日誌"** 標籤
- 或在 Overview 卡片中點擊 **"查看日誌"** 按鈕

### 3. 查看容器日誌
1. 從下拉選單選擇容器
2. 選擇要顯示的行數
3. 點擊 **"🔄 刷新日誌"** 查看最新日誌
4. （選用）開啟 **"▶️ 自動刷新"** 進行即時監控

## 可查看的容器

系統會列出所有 Docker Compose 啟動的容器，包括但不限於：

- `docker-api-1` - Dify API 服務
- `docker-worker-1` - Dify Worker 服務
- `docker-web-1` - Dify Web 前端
- `dify-wiki` - Wiki.js 服務
- `docker-dify-next-frontend-1` - Next.js 前端
- `rest-to-soap-proxy` - REST-to-SOAP 代理
- `wiki-batch-importer` - Wiki 批次匯入
- `docker-db-1` - PostgreSQL 資料庫
- `docker-redis-1` - Redis 快取
- `docker-nginx-1` - Nginx 反向代理
- `docker-weaviate-1` - Weaviate 向量資料庫

## 技術實作

### 後端 API
- 使用 Node.js `child_process` 執行 `docker` 命令
- `docker ps -a` - 列出所有容器
- `docker logs --tail N <container>` - 獲取日誌

### 前端組件
- React Hooks (useState, useEffect, useRef)
- 自動刷新機制 (setInterval)
- 即時滾動到最新日誌
- 響應式設計

## 安全考量

1. **權限檢查**
   - 需要管理員權限才能訪問
   - API 在 `/api/admin/` 路徑下

2. **Docker 權限**
   - 需要 Node.js 進程有 Docker 訪問權限
   - 在 Docker 內運行需要掛載 Docker socket

3. **建議**
   - 生產環境應加強權限驗證
   - 考慮使用 Docker API 而非 CLI
   - 限制可查看的容器範圍

## 故障排除

### 問題：API 返回 "Failed to fetch Docker information"

**原因：** Node.js 進程無法執行 Docker 命令

**解決方案：**
```bash
# 確保 Docker socket 已掛載（在 docker-compose.yaml）
volumes:
  - /var/run/docker.sock:/var/run/docker.sock:ro
```

### 問題：容器列表為空

**檢查：**
```bash
# 在 dify-next-frontend 容器內測試
docker exec docker-dify-next-frontend-1 docker ps -a
```

### 問題：日誌顯示為 "(No logs available)"

**可能原因：**
- 容器剛啟動，還沒有日誌
- 容器配置為不輸出日誌
- 日誌驅動設定問題

## 未來改進

- [ ] 添加日誌搜尋功能
- [ ] 支援日誌下載
- [ ] 添加時間範圍篩選
- [ ] 支援多容器同時查看
- [ ] 添加日誌等級過濾（ERROR, WARN, INFO）
- [ ] WebSocket 即時串流（取代輪詢）
- [ ] 日誌語法高亮

## 相關文檔

- [Docker Logs 命令文檔](https://docs.docker.com/engine/reference/commandline/logs/)
- [Admin Panel 監控文檔](./ADMIN_PANEL_MONITORING.md)

---

**最後更新：** 2026-01-09  
**版本：** 1.0.0
