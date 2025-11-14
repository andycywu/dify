# Wiki.js Chatbot Settings 功能說明

## 概述

此功能允許管理員在 System Management Center 中管理各部門的 Dify API 密鑰,取代了原本需要在 `.env.local` 檔案中硬編碼密鑰的方式。

## 功能特點

✅ **資料庫儲存**: API 密鑰儲存在資料庫中,便於管理和更新
✅ **Web UI 管理**: 透過友善的管理介面設定密鑰
✅ **安全顯示**: 密鑰預設遮蔽顯示,可選擇性查看
✅ **即時生效**: 更新密鑰後立即生效,無需重啟服務
✅ **降級機制**: 若資料庫讀取失敗,自動降級使用環境變數

## 資料庫設定

### 1. 執行 SQL Migration

連接到 PostgreSQL 資料庫並執行以下 SQL:

```bash
docker exec -it docker-db-1 psql -U postgres -d wiki
```

然後執行:

```sql
-- 創建 chatbot_settings 資料表
CREATE TABLE IF NOT EXISTS "chatbot_settings" (
    "id" SERIAL NOT NULL,
    "department" VARCHAR(100) NOT NULL,
    "apiKey" VARCHAR(500) NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "chatbot_settings_pkey" PRIMARY KEY ("id")
);

-- 創建唯一索引
CREATE UNIQUE INDEX "chatbot_settings_department_key" ON "chatbot_settings"("department");
```

或使用提供的 migration 檔案:

```bash
docker exec -i docker-db-1 psql -U postgres -d wiki < prisma/migrations/add_chatbot_settings.sql
```

## 使用方式

### 1. 存取管理介面

1. 以管理員身份登入 dify-next-frontend
2. 前往 **Admin** 頁面
3. 點擊 **Wiki.js Chatbot Settings** 標籤

### 2. 設定部門 API 密鑰

支援以下部門:

- **administrators** (管理員)
- **Guests** (訪客)
- **EE** (電機工程)
- **ME_LCM** (機械工程)
- **PWR** (電源)
- **SW** (軟體)
- **PJM** (專案管理)

#### 新增/更新密鑰

1. 在對應部門卡片中點擊 **設定密鑰** 或 **更新密鑰**
2. 輸入完整的 Dify API 密鑰 (格式: `app-xxxxxxxx`)
3. 點擊 **保存**
4. 確認顯示成功訊息

#### 查看密鑰

1. 點擊 **顯示** 按鈕查看完整密鑰
2. 點擊 **隱藏** 按鈕遮蔽密鑰

#### 刪除密鑰

1. 點擊 **刪除** 按鈕
2. 確認刪除動作
3. 該部門將無法使用聊天機器人功能

## API 端點

### GET /api/chatbot-settings

獲取所有部門 API 密鑰設定 (僅管理員)

**回應範例:**
```json
{
  "settings": [
    {
      "id": 1,
      "department": "EE",
      "apiKey": "app-xxxx...yyyy",
      "createdAt": "2025-11-14T10:00:00.000Z",
      "updatedAt": "2025-11-14T10:00:00.000Z"
    }
  ]
}
```

### POST /api/chatbot-settings

新增或更新部門 API 密鑰 (僅管理員)

**請求範例:**
```json
{
  "department": "EE",
  "apiKey": "app-xxxxxxxxxxxxxxx"
}
```

### DELETE /api/chatbot-settings?department=EE

刪除指定部門的 API 密鑰 (僅管理員)

## 技術實作

### 資料流程

1. **Wiki.js 聊天請求** → `/api/wiki-proxy/chat`
2. **從資料庫讀取密鑰** → `prisma.chatbotSetting.findUnique()`
3. **降級機制** → 若失敗則使用環境變數
4. **呼叫 Dify API** → 使用取得的密鑰

### 檔案結構

```
dify-next-frontend/
├── pages/
│   ├── admin.tsx                          # 整合新標籤
│   └── api/
│       ├── chatbot-settings.ts            # 管理 API
│       └── wiki-proxy/
│           ├── chat.ts                    # 更新使用資料庫密鑰
│           └── datasets.ts                # 更新使用資料庫密鑰
├── components/
│   └── Admin/
│       └── WikiChatbotSettings.tsx        # 管理介面元件
├── prisma/
│   ├── schema.prisma                      # 更新 schema
│   └── migrations/
│       └── add_chatbot_settings.sql       # SQL migration
└── lib/
    └── prisma.ts                          # Prisma client
```

## 安全性注意事項

⚠️ **重要安全提示:**

1. **僅限管理員**: 只有具有 admin 角色的用戶才能存取設定
2. **密鑰加密**: 建議在生產環境中實作額外的加密機制
3. **HTTPS**: 確保生產環境使用 HTTPS 傳輸
4. **定期更新**: 建議定期更換 API 密鑰
5. **審計日誌**: 考慮記錄密鑰變更歷史

## 遷移指南

### 從 .env.local 遷移到資料庫

1. 記錄現有的環境變數密鑰:
```bash
grep DIFY_.*_API_KEY .env.local
```

2. 透過管理介面逐一設定到資料庫

3. 驗證功能正常運作

4. 從 `.env.local` 中移除這些密鑰 (可保留作為降級備份)

## 故障排除

### 問題: 密鑰無法保存

**解決方案:**
- 檢查資料庫連線是否正常
- 確認使用者具有 admin 權限
- 查看瀏覽器 console 和伺服器日誌

### 問題: 聊天機器人無法使用

**解決方案:**
- 確認密鑰已正確設定
- 驗證密鑰格式正確 (app-xxx)
- 檢查 Dify API 是否可正常存取
- 查看 `/api/wiki-proxy/chat` 的錯誤訊息

### 問題: 資料表不存在

**解決方案:**
```bash
# 手動執行 SQL migration
docker exec -i docker-db-1 psql -U postgres -d wiki < prisma/migrations/add_chatbot_settings.sql
```

## 未來改進

- [ ] 密鑰加密儲存
- [ ] 變更審計日誌
- [ ] 批量匯入/匯出
- [ ] 密鑰有效期限管理
- [ ] 使用統計追蹤
- [ ] 密鑰輪替提醒

## 參考資料

- [Prisma Documentation](https://www.prisma.io/docs)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
- [Dify API Documentation](https://docs.dify.ai/)
