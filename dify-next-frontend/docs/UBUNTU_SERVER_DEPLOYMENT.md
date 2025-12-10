# 🐧 Ubuntu Server 部署指南 - Wiki.js → Dify 同步系統

> **適用環境：** Ubuntu 20.04 / 22.04 Server  
> **部署時間：** 約 15-20 分鐘  
> **前置需求：** Docker + Docker Compose 已安裝

---

## 📋 部署步驟總覽

1. SSH 連線到 Ubuntu Server
2. 拉取最新程式碼
3. 設定環境變數
4. 執行資料庫 Migration
5. 測試同步功能
6. 設定自動同步

---

## 🚀 Step 1: 連線到 Ubuntu Server

從 Windows PowerShell 連線：

```powershell
# 替換成你的 Server IP 和使用者名稱
ssh your-username@your-server-ip

# 例如：
ssh ubuntu@192.168.1.100
```

---

## 📥 Step 2: 拉取最新程式碼

```bash
# 進入專案目錄
cd /path/to/dify

# 拉取最新程式碼
git pull origin main

# 確認新檔案都已下載
ls -la dify-next-frontend/lib/wiki-sync-enhanced.ts
ls -la dify-next-frontend/scripts/sync-wiki-cli.js
ls -la dify-next-frontend/docs/
```

應該看到所有檔案都存在。

---

## 🔧 Step 3: 取得必要的 API Keys 和 Dataset IDs

### 3.1 取得 Wiki.js API Key

```bash
# 方法 1: 透過 Wiki.js Admin UI
# 1. 開啟瀏覽器訪問：http://your-server-ip:3000/admin
# 2. 進入 "API Access"
# 3. 點擊 "Generate New Key"
# 4. 權限選擇：query:pages
# 5. 複製產生的 Token

# 方法 2: 透過 Docker 進入 Wiki.js 資料庫查詢（如果忘記）
docker exec -it wiki psql -U postgres -d wiki -c \
  "SELECT key FROM apiKeys WHERE isRevoked = false LIMIT 1;"
```

### 3.2 取得 Dify Admin API Key

```bash
# 開啟瀏覽器訪問：http://your-server-ip/console
# 1. 進入「知識庫」→「API」
# 2. 複製「API Key」（格式：dataset-xxxxxx）
```

### 3.3 取得 10 個 Dataset ID

在 Dify Console 中，依序打開每個 Dataset，從網址複製 UUID：

```
COMMON      → /datasets/[這裡的UUID]/documents
DQE         → /datasets/[這裡的UUID]/documents
DQE_CERTI   → /datasets/[這裡的UUID]/documents
HW          → /datasets/[這裡的UUID]/documents
PWR         → /datasets/[這裡的UUID]/documents
ME_LCM      → /datasets/[這裡的UUID]/documents
SW          → /datasets/[這裡的UUID]/documents
PJM         → /datasets/[這裡的UUID]/documents
ARCH        → /datasets/[這裡的UUID]/documents
TM          → /datasets/[這裡的UUID]/documents
```

**小技巧：** 把這 10 個 ID 先存到一個文字檔，待會直接複製貼上。

---

## ⚙️ Step 4: 設定環境變數

```bash
# 進入 dify-next-frontend 目錄
cd dify-next-frontend

# 複製環境變數範本
cp .env.wiki-sync.example .env.docker

# 編輯環境變數
nano .env.docker
```

在 nano 編輯器中，填入剛剛取得的資訊：

```bash
# Wiki.js API 配置
WIKI_API_KEY=eyJhbGci...你的Wiki_Token
WIKI_GRAPHQL_URL=http://wiki:3000/graphql

# Dify API 配置
DIFY_API_URL=http://api:5001/v1
DIFY_ADMIN_API_KEY=dataset-...你的Dify_Token

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

**儲存並離開：** `Ctrl + O` → `Enter` → `Ctrl + X`

---

## 🗄️ Step 5: 執行資料庫 Migration

### 5.1 進入 dify-next-frontend 容器

```bash
# 方法 1: 如果容器正在運行
docker exec -it dify-next-frontend bash

# 方法 2: 如果需要重新建置
cd /path/to/dify
docker-compose build dify-next-frontend
docker-compose up -d dify-next-frontend
docker exec -it dify-next-frontend bash
```

### 5.2 在容器內執行 Migration

```bash
# 生成 Prisma Client
npm run prisma:generate

# 執行 Migration
npm run prisma:migrate

# 提示輸入 migration 名稱時，輸入：
# add_wiki_sync_status
```

### 5.3 驗證 Migration 成功

```bash
# 連接資料庫檢查
docker exec -it postgres psql -U postgres -d wiki -c \
  "SELECT table_name FROM information_schema.tables WHERE table_name = 'wiki_sync_status';"
```

應該看到：

```
    table_name
------------------
 wiki_sync_status
(1 row)
```

---

## 🧪 Step 6: 測試同步功能

### 6.1 測試 Dry Run（不實際執行）

```bash
# 在容器內執行
docker exec -it dify-next-frontend npm run sync-wiki -- --department COMMON --dry-run
```

預期輸出：

```
🚀 Starting Wiki.js → Dify Enhanced Sync...
Options: { "department": "COMMON", "dryRun": true }

📁 Processing department: COMMON
   📥 Fetching pages from Wiki.js path: /common
   Found 5 pages
   📄 Processing: /common
      🔍 Dry run: would sync this page
   ...

✅ Sync completed!
📊 Statistics:
   Total processed: 5
   Skipped: 5
   Failed: 0
```

### 6.2 測試實際同步（單一部門）

```bash
# 執行實際同步
docker exec -it dify-next-frontend npm run sync-wiki -- --department COMMON
```

### 6.3 驗證結果

**方式 A：檢查 Dify Console**

```bash
# 開啟瀏覽器訪問：http://your-server-ip/console
# 1. 進入「知識庫」
# 2. 打開 COMMON Dataset
# 3. 確認文件已上傳
```

**方式 B：檢查資料庫**

```bash
docker exec -it postgres psql -U postgres -d wiki -c \
  "SELECT department, COUNT(*), MAX(\"lastSyncedAt\") FROM wiki_sync_status GROUP BY department;"
```

應該看到：

```
 department | count |         max
------------+-------+---------------------
 COMMON     |     5 | 2025-12-10 12:30:00
```

---

## 🔄 Step 7: 設定自動同步

### 方式 A：使用 Docker Compose（推薦）

```bash
# 編輯 docker-compose.yml
cd /path/to/dify
nano docker-compose.yml
```

在 `services:` 區塊加入：

```yaml
  wiki-sync:
    build: ./dify-next-frontend
    container_name: wiki-sync
    command: sh -c "while true; do npm run sync-wiki; sleep 86400; done"
    env_file:
      - ./dify-next-frontend/.env.docker
    networks:
      - dify-network
    depends_on:
      - db
      - wiki
      - api
    restart: unless-stopped
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

啟動服務：

```bash
# 建置並啟動
docker-compose up -d wiki-sync

# 檢查狀態
docker-compose ps wiki-sync

# 查看日誌
docker logs -f wiki-sync
```

### 方式 B：使用 Linux Cron Job

```bash
# 進入 dify-next-frontend 目錄
cd /path/to/dify/dify-next-frontend

# 給予執行權限
chmod +x setup-wiki-sync-cron.sh

# 執行自動設定腳本
./setup-wiki-sync-cron.sh
```

驗證 Cron Job：

```bash
# 查看 crontab
crontab -l

# 應該看到：
# Wiki.js → Dify Auto Sync (Daily at 2 AM)
# 0 2 * * * /path/to/dify/dify-next-frontend/scripts/cron-sync-wiki.sh
```

---

## 📊 Step 8: 監控與維護

### 查看同步統計

```bash
# 透過 CLI
docker exec -it dify-next-frontend npm run sync-wiki -- --stats

# 透過資料庫
docker exec -it postgres psql -U postgres -d wiki -c "
SELECT 
  department,
  COUNT(*) as total_pages,
  SUM(CASE WHEN \"syncStatus\" = 'success' THEN 1 ELSE 0 END) as success,
  SUM(CASE WHEN \"syncStatus\" = 'failed' THEN 1 ELSE 0 END) as failed,
  MAX(\"lastSyncedAt\") as last_sync
FROM wiki_sync_status
GROUP BY department
ORDER BY department;
"
```

### 查看同步日誌

```bash
# Docker Compose 方式
docker logs -f wiki-sync

# Cron Job 方式
tail -f /var/log/dify-wiki-sync/sync.log
```

### 手動觸發同步

```bash
# 同步所有部門
docker exec -it dify-next-frontend npm run sync-wiki

# 同步特定部門
docker exec -it dify-next-frontend npm run sync-wiki -- --department DQE

# 強制全量同步
docker exec -it dify-next-frontend npm run sync-wiki -- --force-full-sync
```

---

## 🐛 故障排除

### 問題 1: 容器無法訪問其他服務

**症狀：**
```
Error: getaddrinfo ENOTFOUND wiki
```

**解決方案：**
```bash
# 檢查 Docker 網路
docker network inspect dify-network

# 確認所有容器都在同一網路
docker network connect dify-network wiki-sync
```

### 問題 2: Migration 失敗

**症狀：**
```
Error: Can't reach database server
```

**解決方案：**
```bash
# 檢查資料庫連接
docker exec -it postgres psql -U postgres -d wiki -c "SELECT 1;"

# 檢查 DATABASE_URL
docker exec -it dify-next-frontend printenv | grep DATABASE_URL

# 重新執行 migration
docker exec -it dify-next-frontend npm run prisma:migrate -- reset
docker exec -it dify-next-frontend npm run prisma:migrate
```

### 問題 3: API Key 無效

**症狀：**
```
Wiki GraphQL Error: {"message":"Invalid token"}
```

**解決方案：**
```bash
# 測試 Wiki.js API
docker exec -it dify-next-frontend sh -c '
curl -X POST http://wiki:3000/graphql \
  -H "Authorization: Bearer ${WIKI_API_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"query\":\"{ pages { list { id } } }\"}"
'

# 如果失敗，重新生成 API Key
```

### 問題 4: Dify API 連接失敗

**症狀：**
```
Dify API Error [401]: Unauthorized
```

**解決方案：**
```bash
# 測試 Dify API
docker exec -it dify-next-frontend sh -c '
curl -X GET http://api:5001/v1/datasets \
  -H "Authorization: Bearer ${DIFY_ADMIN_API_KEY}"
'

# 確認 API Key 格式正確（應為 dataset-xxxxxx）
```

---

## 📈 效能優化建議

### 1. 調整同步頻率

```bash
# 編輯 docker-compose.yml
# 修改 sleep 時間（秒）
# 每 12 小時同步一次：sleep 43200
# 每 6 小時同步一次：sleep 21600
```

### 2. 限制 Docker 日誌大小

```yaml
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

### 3. 設定資源限制

```yaml
deploy:
  resources:
    limits:
      cpus: '0.5'
      memory: 512M
    reservations:
      cpus: '0.25'
      memory: 256M
```

---

## ✅ 部署完成檢查清單

- [ ] ✅ Git 程式碼已拉取到最新
- [ ] ✅ 環境變數已正確設定
- [ ] ✅ Prisma Migration 執行成功
- [ ] ✅ wiki_sync_status 表已建立
- [ ] ✅ Dry run 測試成功
- [ ] ✅ 實際同步測試成功
- [ ] ✅ Dify Console 確認文件已上傳
- [ ] ✅ 自動同步服務已啟動
- [ ] ✅ 監控日誌正常運作

---

## 🎊 完成！

你的 Ubuntu Server 上的 Wiki.js → Dify 同步系統已經完全部署完成！

### 快速命令參考

```bash
# 查看同步狀態
docker exec -it dify-next-frontend npm run sync-wiki -- --stats

# 手動同步
docker exec -it dify-next-frontend npm run sync-wiki

# 查看日誌
docker logs -f wiki-sync

# 重啟同步服務
docker-compose restart wiki-sync

# 檢查資料庫
docker exec -it postgres psql -U postgres -d wiki \
  -c "SELECT * FROM wiki_sync_status ORDER BY \"lastSyncedAt\" DESC LIMIT 10;"
```

### 監控建議

設定 Grafana + Prometheus 監控（可選）：
- 同步成功率
- 處理頁面數量
- 執行時間
- 錯誤率

---

**需要幫助？** 參考其他文件：
- [README_WIKI_SYNC.md](./README_WIKI_SYNC.md) - 系統總覽
- [QUICKSTART_WIKI_SYNC.md](./QUICKSTART_WIKI_SYNC.md) - 快速開始
- [DEPLOYMENT_GUIDE_WIKI_SYNC.md](./DEPLOYMENT_GUIDE_WIKI_SYNC.md) - 詳細部署

**維護者：** @andycywu  
**更新日期：** 2025-12-10
