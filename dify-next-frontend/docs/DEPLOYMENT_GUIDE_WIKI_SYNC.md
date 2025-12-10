# 🚀 Wiki.js → Dify 同步系統部署指南

## 📋 部署前檢查清單

在開始部署前，請確認以下項目：

- [ ] ✅ Wiki.js 正常運行並可訪問
- [ ] ✅ Dify API 正常運行並可訪問
- [ ] ✅ PostgreSQL 資料庫可連接
- [ ] ✅ Node.js >= 20 已安裝
- [ ] ✅ 已取得 10 個 Dify Dataset ID
- [ ] ✅ 已取得 Wiki.js API Key
- [ ] ✅ 已取得 Dify Admin API Key

---

## 🔧 Step 1: 設定環境變數

### 方式 A：使用 .env.local（本機開發）

```bash
cd dify-next-frontend
cp .env.wiki-sync.example .env.local
```

編輯 `.env.local`，填入：

```bash
# Wiki.js API
WIKI_API_KEY=eyJ...你的Wiki.js_Token
WIKI_GRAPHQL_URL=http://wiki:3000/graphql

# Dify API
DIFY_API_URL=http://api:5001/v1
DIFY_ADMIN_API_KEY=dataset-...你的Dify_Admin_Token

# 10 個 Dataset IDs
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
```

### 方式 B：使用 .env.docker（Docker 環境）

同樣的內容加到 `.env.docker`

---

## 🗄️ Step 2: 執行資料庫 Migration

```bash
cd dify-next-frontend

# 生成 Prisma Client
npm run prisma:generate

# 執行 migration
npm run prisma:migrate

# 如果提示輸入 migration 名稱，輸入：
# add_wiki_sync_status
```

確認 migration 成功：

```bash
# 連接資料庫檢查
psql -U postgres -d wiki -c "\d wiki_sync_status"
```

應該看到類似這樣的輸出：

```
                                      Table "public.wiki_sync_status"
     Column      |            Type             | Collation | Nullable |      Default
-----------------+-----------------------------+-----------+----------+--------------------
 id              | integer                     |           | not null | nextval(...)
 department      | character varying(100)      |           | not null |
 wikiPath        | character varying(500)      |           | not null |
 wikiPageId      | integer                     |           | not null |
 wikiTitle       | character varying(500)      |           | not null |
 wikiUpdatedAt   | timestamp(6)                |           | not null |
 difyDocumentId  | character varying(100)      |           |          |
 lastSyncedAt    | timestamp(6)                |           | not null | now()
 syncStatus      | character varying(50)       |           | not null | 'success'
 errorMessage    | text                        |           |          |
```

---

## 🧪 Step 3: 測試同步功能

### 3.1 測試單一部門（Dry Run）

```bash
npm run sync-wiki -- --department COMMON --dry-run
```

預期輸出：

```
🚀 Starting Wiki.js → Dify Enhanced Sync...
Options: {
  "department": "COMMON",
  "dryRun": true
}

📁 Processing department: COMMON
   📥 Fetching pages from Wiki.js path: /common
   Found 5 pages
   📄 Processing: /common
      🔍 Dry run: would sync this page
   📄 Processing: /common/introduction
      🔍 Dry run: would sync this page
   ...

✅ Sync completed!
📊 Statistics:
   Total processed: 5
   Created: 0
   Updated: 0
   Skipped: 5
   Failed: 0
```

### 3.2 測試實際同步（先測試單一部門）

```bash
npm run sync-wiki -- --department COMMON
```

### 3.3 檢查 Dify 是否收到文件

1. 登入 Dify Console
2. 進入對應的 Dataset（例如 COMMON）
3. 確認文件已上傳
4. 檢查 Metadata 是否正確

### 3.4 測試全部門同步

```bash
npm run sync-wiki -- --force-full-sync
```

---

## 📊 Step 4: 監控同步狀態

### 查看統計資訊

```bash
npm run sync-wiki -- --stats
```

### 查看資料庫記錄

```sql
-- 查看所有同步記錄
SELECT 
  department, 
  COUNT(*) as total,
  SUM(CASE WHEN "syncStatus" = 'success' THEN 1 ELSE 0 END) as success,
  SUM(CASE WHEN "syncStatus" = 'failed' THEN 1 ELSE 0 END) as failed,
  MAX("lastSyncedAt") as last_sync
FROM wiki_sync_status
GROUP BY department
ORDER BY department;

-- 查看失敗的同步
SELECT * FROM wiki_sync_status 
WHERE "syncStatus" = 'failed' 
ORDER BY "lastSyncedAt" DESC;

-- 查看特定部門的最近同步
SELECT * FROM wiki_sync_status 
WHERE department = 'DQE' 
ORDER BY "lastSyncedAt" DESC 
LIMIT 10;
```

---

## ⏰ Step 5: 設定自動同步

### 方式 A：Linux Cron Job

```bash
# 自動設定腳本
chmod +x setup-wiki-sync-cron.sh
./setup-wiki-sync-cron.sh
```

或手動設定：

```bash
# 編輯 crontab
crontab -e

# 加入這一行（每天凌晨 2 點執行）
0 2 * * * cd /path/to/dify-next-frontend && npm run sync-wiki >> /var/log/wiki-sync.log 2>&1
```

### 方式 B：Docker Compose（推薦）

在 `docker-compose.yml` 加入：

```yaml
services:
  wiki-sync-cron:
    build:
      context: ./dify-next-frontend
      dockerfile: Dockerfile
    container_name: wiki-sync-cron
    command: sh -c "while true; do npm run sync-wiki; sleep 86400; done"
    environment:
      - NODE_ENV=production
    env_file:
      - ./dify-next-frontend/.env.docker
    networks:
      - dify-network
    depends_on:
      - db
      - wiki
      - api
    restart: unless-stopped
```

重啟 Docker：

```bash
docker-compose up -d wiki-sync-cron
```

### 方式 C：Kubernetes CronJob

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: wiki-sync-cronjob
spec:
  schedule: "0 2 * * *"  # 每天 2:00 AM
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: wiki-sync
            image: your-registry/dify-next-frontend:latest
            command: ["npm", "run", "sync-wiki"]
            envFrom:
            - configMapRef:
                name: wiki-sync-config
          restartPolicy: OnFailure
```

---

## 🔍 故障排除

### 問題 1: `WIKI_API_KEY` 無效

**錯誤訊息：**
```
Wiki GraphQL Error: {"message":"Invalid token"}
```

**解決方案：**
1. 檢查 Wiki.js Admin → API Access
2. 重新生成 API Key
3. 確認 Key 沒有多餘空格或換行

### 問題 2: `DIFY_ADMIN_API_KEY` 無效

**錯誤訊息：**
```
Dify API Error [401]: Unauthorized
```

**解決方案：**
1. 確認使用的是 **Dataset API Key**，不是 App API Key
2. Dify Console → 知識庫 → API → 複製 API Key
3. 格式應為 `dataset-xxxxxxxxxx`

### 問題 3: Dataset ID 不存在

**錯誤訊息：**
```
Dify API Error [404]: Dataset not found
```

**解決方案：**
1. 重新檢查 Dataset ID（從網址複製）
2. 確認 Dataset 沒有被刪除
3. 確認 API Key 有權限訪問該 Dataset

### 問題 4: Prisma 連接失敗

**錯誤訊息：**
```
PrismaClientInitializationError: Can't reach database server
```

**解決方案：**
```bash
# 檢查 DATABASE_URL
echo $DATABASE_URL

# 測試資料庫連接
psql $DATABASE_URL -c "SELECT 1"

# 重新生成 Prisma Client
npm run prisma:generate
```

### 問題 5: Preprocessor 失敗

**錯誤訊息：**
```
Preprocessing failed: Unsupported file type
```

**解決方案：**
- Wiki.js 內容應該是 Markdown 格式
- 如果有特殊字元，可能需要 escape
- 檢查 `lib/preprocess/parsers/parseMarkdown.ts`

---

## 📈 效能優化

### 1. 批次處理

修改 `lib/wiki-sync-enhanced.ts`，加入批次邏輯：

```typescript
// 每次處理 10 個頁面
const BATCH_SIZE = 10;
for (let i = 0; i < pagesToProcess.length; i += BATCH_SIZE) {
  const batch = pagesToProcess.slice(i, i + BATCH_SIZE);
  await Promise.allSettled(batch.map(page => syncPage(...)));
}
```

### 2. 快取機制

```typescript
// 已同步且未變更的頁面跳過
if (!forceFullSync && existingSync && wikiUpdatedAt <= lastSyncedAt) {
  return 'skipped';
}
```

### 3. 並行上傳

```typescript
// 使用 Promise.allSettled 並行上傳多個 chunks
await Promise.allSettled(chunks.map(chunk => 
  difyClient.createDocumentByText(...)
));
```

---

## 🎯 下一步計畫

- [ ] 增量更新：只同步有變化的頁面 ✅ (已實作)
- [ ] Webhook 觸發：Wiki.js 更新時自動同步
- [ ] Web UI：視覺化同步狀態與管理介面
- [ ] 版本控制：追蹤文件版本歷史
- [ ] 錯誤重試：自動重試失敗的同步
- [ ] 通知系統：同步失敗時發送通知

---

## 📞 需要幫助？

如遇到任何問題：

1. 檢查日誌：`tail -f /var/log/wiki-sync.log`
2. 檢查 Docker logs：`docker logs wiki-sync-cron`
3. 檢查資料庫：查詢 `wiki_sync_status` 表
4. 測試 API：使用 Postman 測試 Dify 和 Wiki.js API

---

## ✅ 部署完成檢查

部署完成後，請確認：

- [ ] ✅ 手動執行 `npm run sync-wiki` 成功
- [ ] ✅ Dify Console 可以看到上傳的文件
- [ ] ✅ 資料庫 `wiki_sync_status` 有記錄
- [ ] ✅ Cron Job 已設定並正常執行
- [ ] ✅ 監控系統可以追蹤同步狀態
- [ ] ✅ 日誌檔案正常記錄

恭喜！你的 Wiki.js → Dify 同步系統已經上線 🎉
