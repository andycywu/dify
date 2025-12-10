# 🚀 Wiki.js → Dify 同步系統 - 5 分鐘快速開始

## 📋 前置準備（5 分鐘內完成）

### 1️⃣ 取得 Wiki.js API Key

```bash
# 1. 登入 Wiki.js Admin (http://wiki:3000/admin)
# 2. 進入「API Access」
# 3. 點擊「Generate New Key」
# 4. 選擇權限：query:pages
# 5. 複製產生的 Token
```

### 2️⃣ 取得 Dify Admin API Key

```bash
# 1. 登入 Dify Console (http://localhost/console)
# 2. 進入「知識庫」→「API」
# 3. 複製「API Key」（格式: dataset-xxxxxxxxxx）
```

### 3️⃣ 取得 10 個 Dataset ID

在 Dify Console 中，依序打開這 10 個 Dataset，從網址複製 ID：

| 部門 | Dataset 名稱 | 網址範例 |
|------|-------------|---------|
| COMMON | 公共知識庫 | `/datasets/[複製這串UUID]/documents` |
| DQE | 設計品質工程 | `/datasets/[複製這串UUID]/documents` |
| DQE_CERTI | DQE 認證 | `/datasets/[複製這串UUID]/documents` |
| HW | 硬體部門 | `/datasets/[複製這串UUID]/documents` |
| PWR | 電源部門 | `/datasets/[複製這串UUID]/documents` |
| ME_LCM | 機械生命週期 | `/datasets/[複製這串UUID]/documents` |
| SW | 軟體部門 | `/datasets/[複製這串UUID]/documents` |
| PJM | 專案管理 | `/datasets/[複製這串UUID]/documents` |
| ARCH | 架構部門 | `/datasets/[複製這串UUID]/documents` |
| TM | 測試管理 | `/datasets/[複製這串UUID]/documents` |

---

## ⚡ 快速部署（3 個命令搞定）

### Step 1: 設定環境變數

```bash
cd dify-next-frontend

# 複製範例檔案
cp .env.wiki-sync.example .env.local

# 編輯 .env.local（填入剛剛取得的 Keys 和 IDs）
nano .env.local  # 或用 VSCode 打開
```

### Step 2: 執行資料庫 Migration

```bash
npm run prisma:generate
npm run prisma:migrate
```

### Step 3: 執行第一次同步

```bash
# 先測試一個部門（Dry Run）
npm run sync-wiki -- --department COMMON --dry-run

# 確認沒問題後，正式同步
npm run sync-wiki -- --department COMMON

# 全部門同步
npm run sync-wiki
```

---

## ✅ 驗證部署

### 1. 檢查資料庫

```bash
docker exec -it postgres psql -U postgres -d wiki \
  -c "SELECT department, COUNT(*), MAX(\"lastSyncedAt\") FROM wiki_sync_status GROUP BY department;"
```

應該看到：

```
 department | count |      max
------------+-------+---------------------
 COMMON     |     5 | 2025-12-10 10:30:00
 DQE        |    12 | 2025-12-10 10:31:00
 ...
```

### 2. 檢查 Dify Console

1. 進入 Dify → 知識庫
2. 打開 COMMON Dataset
3. 應該看到剛剛上傳的文件

### 3. 測試 API

```bash
curl -X GET "http://localhost:3001/api/admin/sync-wiki?stats=true" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION"
```

---

## 🔄 設定自動同步（選擇一種方式）

### 方式 A: Docker Compose（推薦）

在 `docker-compose.yml` 加入：

```yaml
  wiki-sync:
    build: ./dify-next-frontend
    command: sh -c "while true; do npm run sync-wiki; sleep 86400; done"
    env_file: .env.docker
    depends_on: [db, wiki, api]
```

啟動：

```bash
docker-compose up -d wiki-sync
```

### 方式 B: Linux Cron

```bash
chmod +x setup-wiki-sync-cron.sh
./setup-wiki-sync-cron.sh
```

---

## 🎯 常用命令速查

```bash
# 同步所有部門
npm run sync-wiki

# 同步特定部門
npm run sync-wiki -- --department DQE

# 強制全量同步（忽略已同步狀態）
npm run sync-wiki -- --force-full-sync

# 只檢查不執行
npm run sync-wiki -- --dry-run

# 查看統計
npm run sync-wiki -- --stats

# 重置失敗狀態
npm run sync-wiki -- --reset-failed

# 清空所有狀態（用於完全重新同步）
npm run sync-wiki -- --clear --force-full-sync
```

---

## 🐛 快速除錯

### 問題：API Key 無效

```bash
# 測試 Wiki.js API
curl -X POST http://wiki:3000/graphql \
  -H "Authorization: Bearer ${WIKI_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"query":"{ pages { list { id title } } }"}'

# 測試 Dify API
curl -X GET "http://api:5001/v1/datasets" \
  -H "Authorization: Bearer ${DIFY_ADMIN_API_KEY}"
```

### 問題：Migration 失敗

```bash
# 重置 migration
npm run prisma:migrate -- reset

# 重新執行
npm run prisma:migrate
```

### 問題：同步卡住

```bash
# 檢查日誌
docker logs wiki-sync

# 檢查資料庫連接
docker exec -it postgres psql -U postgres -d wiki -c "SELECT 1"

# 重啟同步服務
docker-compose restart wiki-sync
```

---

## 📊 監控儀表板

建立簡單的監控查詢：

```sql
-- 同步總覽
SELECT 
  department,
  COUNT(*) as total_pages,
  SUM(CASE WHEN "syncStatus" = 'success' THEN 1 ELSE 0 END) as success,
  SUM(CASE WHEN "syncStatus" = 'failed' THEN 1 ELSE 0 END) as failed,
  MAX("lastSyncedAt") as last_sync
FROM wiki_sync_status
GROUP BY department
ORDER BY department;

-- 最近錯誤
SELECT * FROM wiki_sync_status 
WHERE "syncStatus" = 'failed' 
ORDER BY "lastSyncedAt" DESC 
LIMIT 10;

-- 同步頻率統計
SELECT 
  DATE("lastSyncedAt") as sync_date,
  COUNT(*) as synced_pages
FROM wiki_sync_status
WHERE "lastSyncedAt" > NOW() - INTERVAL '7 days'
GROUP BY DATE("lastSyncedAt")
ORDER BY sync_date DESC;
```

---

## 🎉 完成！

你現在已經成功部署了 Wiki.js → Dify 自動同步系統！

**已實現功能：**
✅ 全格式文件預處理（PDF, DOCX, Excel, CSV, Markdown...）
✅ 智能分段與 Metadata 注入
✅ 增量同步（只更新有變化的頁面）
✅ 10 個部門獨立知識庫
✅ 自動化定時同步
✅ 完整的錯誤處理與重試
✅ 狀態追蹤與監控

**下一步可以做：**
- 🔔 加入 Webhook（Wiki.js 更新時即時同步）
- 📊 建立 Web UI 管理介面
- 📧 設定同步失敗通知
- 🔍 實作全文搜尋與版本控制

需要幫助？查看完整文件：`docs/DEPLOYMENT_GUIDE_WIKI_SYNC.md`
