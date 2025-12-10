# 🚀 Wiki.js → Dify 全自動同步系統

## 📋 系統架構

```
Wiki.js (10 個分類頁面)
    ↓ GraphQL API
【定時同步器】(wiki-sync-enhanced.ts)
    ↓
【Preprocessor】(lib/preprocess)
    ├─ 偵測格式
    ├─ 轉換 Markdown
    └─ 智能分段
    ↓
【Dify Client】(lib/dify-client.ts)
    ↓
【10 個 Dify Datasets】
```

---

## 🔧 設定步驟

### Step 1: 取得 10 個 Dataset ID

在 Dify Console 中：

1. 進入「知識庫 / Datasets」
2. 點進每個 Dataset（例如 `COMMON`、`DQE`...）
3. 從網址列複製 `dataset_id`，格式類似：
   ```
   https://your-dify/datasets/12345678-abcd-1234-5678-xxxxxxxxxxxx/documents
   ```

### Step 2: 更新 `.env` 檔案

在 `.env.local` 或 `.env.docker` 加入：

```bash
# ============================================
# Dify Dataset IDs (Wiki.js 同步目標)
# ============================================

DIFY_DATASET_COMMON_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
DIFY_DATASET_DQE_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
DIFY_DATASET_DQE_CERTI_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
DIFY_DATASET_HW_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
DIFY_DATASET_PWR_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
DIFY_DATASET_ME_LCM_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
DIFY_DATASET_SW_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
DIFY_DATASET_PJM_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
DIFY_DATASET_ARCH_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
DIFY_DATASET_TM_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# Dify Admin API Key (Console → 設定 → API Keys)
DIFY_ADMIN_API_KEY=dataset-xxxxxxxxxxxxxxxxxxxxxx

# Wiki.js API Key (Admin → API Access → 建立新 Token)
WIKI_API_KEY=eyJxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
WIKI_GRAPHQL_URL=http://wiki:3000/graphql
```

### Step 3: 在 Prisma Schema 新增同步狀態表

確認 `prisma/schema.prisma` 有以下 model：

```prisma
model WikiSyncStatus {
  id          Int      @id @default(autoincrement())
  department  String
  wikiPath    String
  wikiPageId  Int
  wikiTitle   String
  wikiUpdatedAt DateTime
  difyDocumentId String?
  lastSyncedAt DateTime @default(now())
  syncStatus  String   @default("success") // success, failed, pending
  errorMessage String?

  @@unique([department, wikiPath])
  @@index([department])
  @@index([lastSyncedAt])
}
```

執行 migration：

```bash
npx prisma migrate dev --name add_wiki_sync_status
```

---

## 🎯 使用方式

### 方法 1: 手動執行同步

```bash
npm run sync-wiki
```

### 方法 2: API 觸發

```bash
curl -X POST http://localhost:3001/api/admin/sync-wiki \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### 方法 3: 設定 Cron Job（自動同步）

在 Ubuntu Server 上：

```bash
# 每天凌晨 2 點自動同步
crontab -e

# 加入這一行：
0 2 * * * cd /path/to/dify-next-frontend && npm run sync-wiki >> /var/log/wiki-sync.log 2>&1
```

在 Docker 環境：

在 `docker-compose.yml` 加入：

```yaml
services:
  wiki-sync-cron:
    image: node:20-alpine
    volumes:
      - ./dify-next-frontend:/app
    working_dir: /app
    command: sh -c "while true; do npm run sync-wiki; sleep 86400; done"
    environment:
      - NODE_ENV=production
    env_file:
      - .env.docker
```

---

## 📊 同步邏輯說明

### 增量同步機制

1. **首次同步**：全量上傳所有 Wiki 頁面
2. **後續同步**：只更新有變化的頁面
   - 比對 `wikiUpdatedAt` 與 `lastSyncedAt`
   - 只處理更新過的頁面

### 分類對應規則

| Wiki.js 路徑 | Department | Dify Dataset |
|-------------|-----------|-------------|
| `/common` | COMMON | DIFY_DATASET_COMMON_ID |
| `/dqe` | DQE | DIFY_DATASET_DQE_ID |
| `/dqe-certi` | DQE_CERTI | DIFY_DATASET_DQE_CERTI_ID |
| `/hw` | HW | DIFY_DATASET_HW_ID |
| `/pwr` | PWR | DIFY_DATASET_PWR_ID |
| `/me-lcm` | ME_LCM | DIFY_DATASET_ME_LCM_ID |
| `/sw` | SW | DIFY_DATASET_SW_ID |
| `/pjm` | PJM | DIFY_DATASET_PJM_ID |
| `/arch` | ARCH | DIFY_DATASET_ARCH_ID |
| `/tm` | TM | DIFY_DATASET_TM_ID |

### Preprocessor 處理流程

每個 Wiki 頁面會經過：

1. **格式偵測**：Markdown
2. **內容清理**：移除多餘空白、統一換行
3. **智能分段**：
   - 根據標題（`#`, `##`, `###`）切分
   - 每段約 1500-3000 字元
   - 保留標題結構
4. **Metadata 注入**：
   ```markdown
   <!-- department: DQE -->
   <!-- source: /dqe/sop-001 -->
   <!-- wikiPageId: 123 -->
   <!-- lastUpdated: 2025-12-10T10:30:00Z -->
   ```

---

## 🔍 監控與除錯

### 查看同步狀態

```sql
-- 查看最近同步記錄
SELECT * FROM "WikiSyncStatus" ORDER BY "lastSyncedAt" DESC LIMIT 20;

-- 查看失敗的同步
SELECT * FROM "WikiSyncStatus" WHERE "syncStatus" = 'failed';

-- 統計各部門同步狀況
SELECT department, COUNT(*), MAX("lastSyncedAt") 
FROM "WikiSyncStatus" 
GROUP BY department;
```

### 常見問題

**Q1: 同步卡住怎麼辦？**
```bash
# 檢查日誌
tail -f /var/log/wiki-sync.log

# 重置失敗的同步
npm run sync-wiki -- --reset-failed
```

**Q2: 如何重新全量同步？**
```bash
# 清空同步狀態表
npm run sync-wiki -- --force-full-sync
```

**Q3: 單獨同步某個部門**
```bash
npm run sync-wiki -- --department DQE
```

---

## 🧪 測試流程

### 1. 測試單一頁面同步

```bash
npm run sync-wiki -- --test --department COMMON --page-path /common/test
```

### 2. 驗證 Preprocessor

在 `lib/preprocess/` 執行：

```bash
npm run test:preprocess
```

### 3. 驗證 Dify 上傳

```bash
curl -X GET "http://localhost/v1/datasets/${DATASET_ID}/documents" \
  -H "Authorization: Bearer ${DIFY_ADMIN_API_KEY}"
```

---

## 📈 效能優化建議

1. **批次上傳**：10 個頁面一批次
2. **並行處理**：使用 `Promise.allSettled()`
3. **快取機制**：已同步頁面不重複處理
4. **錯誤重試**：失敗自動重試 3 次

---

## 🎉 完成檢查清單

- [ ] 10 個 Dataset ID 已設定在 `.env`
- [ ] Prisma migration 完成
- [ ] Wiki.js API Key 可正常存取
- [ ] Dify Admin API Key 可正常存取
- [ ] 手動執行一次 `npm run sync-wiki` 成功
- [ ] 檢查 Dify Console 確認文件已上傳
- [ ] Cron Job 已設定（如需自動同步）

---

## 📞 支援

如遇問題請檢查：
1. `.env` 所有必要變數是否設定
2. Wiki.js 與 Dify API 是否可連線
3. Prisma DB 是否正常連接
4. Node.js 版本 >= 20
