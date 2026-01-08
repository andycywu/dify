# Admin Panel Real-Time Monitoring

## 概述 / Overview

Admin Panel 的系統狀態監控和用戶統計功能已從 Mock 資料升級為真實的即時監控。

The Admin Panel system status monitoring and user statistics features have been upgraded from mock data to real-time monitoring.

---

## 🖥️ System Status 系統狀態

### 監控項目 / Monitored Services

1. **Dify API** - 檢查 Dify API 服務是否可訪問
   - URL: `${NEXT_PUBLIC_DIFY_API_BASE_URL}` (default: http://172.27.197.100/v1)
   - 檢查方式: HTTP GET 請求
   - 判定標準: 返回 404/200/401 即視為可訪問

2. **REST-to-SOAP Proxy** - 檢查代理服務健康狀態
   - URL: `${REST_TO_SOAP_PROXY_URL}/health` (default: http://rest-to-soap-proxy:5001/health)
   - 檢查方式: HTTP GET 請求 health endpoint
   - 判定標準: 返回 200 OK

3. **Wiki.js** - 檢查 Wiki.js 網站可訪問性
   - URL: `${WIKI_GRAPHQL_URL}` (default: http://172.27.197.100:3002)
   - 檢查方式: HTTP GET 請求首頁
   - 判定標準: 返回 200 OK

4. **PostgreSQL** - 檢查資料庫連線
   - 使用環境變數: `DATABASE_URL` 或 `DIFY_DATABASE_URL`
   - 檢查方式: 執行 `SELECT 1` 查詢
   - 超時時間: 5 秒

5. **Redis** - Redis 服務狀態（尚未實作）
   - 目前顯示為 "Not configured" 或 "Not implemented"

### API Endpoint

```
GET /api/admin/system-status
```

**Response:**
```json
{
  "services": [
    {
      "name": "Dify API",
      "status": "running" | "stopped" | "error",
      "message": "API accessible (HTTP 200)",
      "responseTime": 123
    },
    ...
  ],
  "timestamp": "2024-01-01T00:00:00.000Z",
  "overallStatus": "healthy" | "degraded" | "down"
}
```

### 刷新頻率 / Refresh Rate

- 自動刷新: 每 30 秒
- 初次載入: 頁面載入時
- 超時時間: 5 秒

---

## 👥 User Statistics 用戶統計

### 數據來源 / Data Source

所有用戶統計數據直接來自 **Wiki.js PostgreSQL 資料庫**：
- Database: `wiki`
- Host: `${POSTGRES_HOST}` (default: db)
- Port: `${POSTGRES_PORT}` (default: 5432)
- 查詢表: `users`, `groups`, `userGroups`

### 統計項目 / Statistics

1. **總用戶數 / Total Users**
   - 計算方式: 查詢 `users` 表，排除系統帳號（guest）
   - SQL: `SELECT COUNT(*) FROM users WHERE providerKey != 'local' OR email != 'guest'`
   - 包含: 所有非系統用戶

2. **活躍用戶 / Active Users**
   - 定義: 最近 30 天內有登入的用戶
   - SQL: `SELECT COUNT(*) FROM users WHERE lastLoginAt >= (NOW() - INTERVAL '30 days')`
   - 時間範圍: 當前時間 - 30 天

3. **管理員 / Administrators**
   - 來源: `userGroups` 和 `groups` 關聯查詢
   - SQL: `SELECT COUNT(DISTINCT userId) FROM userGroups JOIN groups WHERE name = 'Administrators'`
   - 顯示: Administrators 群組的用戶數量

### API Endpoint

```
GET /api/admin/user-stats
```

**Response:**
```json
{
  "totalUsers": 42,
  "activeUsers": 15,
  "administrators": 3,
  "lastUpdated": "2024-01-01T00:00:00.000Z"
}
```

### 刷新頻率 / Refresh Rate

- 自動刷新: 每 5 分鐘
- 查詢超時: 5載入時
- 超時時間: 10 秒

---

## 📁 檔案結構 / File Structure

```
dify-next-frontend/
├── pages/
│   ├── admin.tsx                          # 前端主頁面（已更新）
│   └── api/
│       └── admin/
│           ├── system-status.ts          # 系統狀態 API（新增）
│           └── user-stats.ts             # 用戶統計 API（新增）
├── locales/
│   ├── en/
│   │   └── admin.json                    # 英文翻譯（已更新）
│   └── zh/
│       └── admin.json                    # 中文翻譯（已更新）
└── ADMIN_PANEL_MONITORING.md            # 本文檔
```

---

## 🔧 環境變數 / Environment Variables

確保以下環境變數已正確設定：

### Required 必要

```env
# PostgreSQL
POSTGRES_HOST=db
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=difyai123456
DATABASE_URL=postgresql://postgres:difyai123456@db:5432/wiki

# REST-to-SOAP Proxy
REST_TO_SOAP_PROXY_URL=http://rest-to-soap-proxy:5001

# PostgreSQL
DATABASE_URL=postgresql://user:password@host:5432/database
# 或
DIFY_DATABASE_URL=postgresql://postgres:difyai123456@db:5432/dify
```

### Optional 可選

```env
# Redis (未來實作)
REDIS_URL=redis://localhost:6379
```

---

## 🚀 使用方式 / Usage

1. **啟動服務 / Start Services**
   ```bash
   cd dify-next-frontend
   npm run dev
   ```

2. **訪問 Admin Panel / Access Admin Panel**
   ```
   http://localhost:3001/admin
   ```

3. **查看監控資訊 / View Monitoring**
   - 切換到 "總覽 / Overview" 標籤
   - 系統狀態和用戶統計會自動載入
   - 狀態會定期自動刷新

---

## 🎨 UI 顯示邏輯 / UI Display Logic

### System Status 狀態顯示

- 🟢 **Running** (運行中) - 服務正常運行
- 🟠 **Warning** (警告) - 服務有問題但仍可部分運行
- 🔴 **Stopped** (已停止) - 服務無法訪問

### 響應時間 / Response Time

- 顯示於每個服務狀態旁
- 單位: 毫秒 (ms)
- 範例: `(123ms)`

### 更新時間 / Last Updated

- 顯示於卡片底部
- 格式: 本地時間 (HH:MM:SS)
- 範例: `Last updated: 14:30:45`

---

## 🐛 錯誤處理 / Error Handling

### API 錯誤

- 顯示: "Failed to load status" 或 "Failed to load statistics"
- Console 記錄: 詳細錯誤訊息
- 不影響: 其他功能正常運作

### 超時處理

- System Status: 5 秒超時
- User Statistics: 10 秒超時
- 超時後: 標記為 "stopped" 或 "error"

### 網路錯誤

- 捕捉所有 fetch 錯誤
- 顯示在 UI 上
- 記錄在 console

---

## 📊 監控數據流程 / Monitoring Data Flow

```
User Browser
    ↓
admin.tsx (Frontend)
    ↓ (fetch every 30s / 5min)
    ├─→ /api/admin/system-status
    │       ↓
    │   Check Services:
    │   ├─→ Dify API (HTTP)
    │   ├─→ REST-to-SOAP (HTTP /health)
    │   ├─→ Wiki.js (HTTP)
    │   └─→ PostgreSQL (SQL)
    │
    └─→ /api/admin/user-stats
            ↓
        Wiki.js PostgreSQL Database
        (Query users, groups, userGroups tables)
```

---

## 🔒 安全性 / Security

1. **權限檢查 / Permission Check**
   - 只有管理員（admin / Administrator）可訪問
   - 在前端和後端都有驗證

2. **資料庫連接 / Database Connection**
   - 使用連接池管理資料庫連線
   - 查詢完成後自動關閉連線
   - 設定連線超時時間（5 秒）

3. **敏感資訊 / Sensitive Information**
   - 不暴露內部 IP 或端口
   - 錯誤訊息不包含敏感資訊
   - 資料庫密碼存儲在環境變數中

---

## 📝 待改進項目 / Future Improvements

1. **Redis 監控**
   - 實作 Redis 連線檢查
   - 顯示 Redis 記憶體使用情況

2. **歷史數據**
   - 記錄系統狀態歷史
   - 顯示趨勢圖表

3. **告警功能**
   - 服務異常時發送通知
   - 支援 Email 或 Webhook

4. **更多統計**
   - 最近登入用戶列表
   - 用戶註冊趨勢
   - 活躍度分析

---

## 🙋 支援 / Support

如有問題或建議，請聯繫開發團隊或提交 Issue。

For questions or suggestions, please contact the development team or submit an issue.
