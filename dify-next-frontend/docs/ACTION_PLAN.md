# 🎯 Wiki.js → Dify 同步系統 - 執行計畫

## ✅ 已完成的工作

### 1. 核心程式碼 ✅
- `lib/wiki-sync-enhanced.ts` - 完整同步引擎
- `lib/preprocess/` - 已存在的預處理系統
- `lib/dify-client.ts` - 已存在的 Dify 客戶端

### 2. CLI 工具 ✅
- `scripts/sync-wiki-cli.js` - 命令列介面
- `setup-wiki-sync-cron.sh` - Cron 自動設定腳本

### 3. API 端點 ✅
- `pages/api/admin/sync-wiki.ts` - Web API

### 4. 資料庫 ✅
- Prisma Schema 已更新（WikiSyncStatus model）

### 5. 配置檔案 ✅
- `.env.wiki-sync.example` - 環境變數範本
- `package.json` - NPM 腳本已更新

### 6. 完整文件 ✅
- README_WIKI_SYNC.md - 總覽
- QUICKSTART_WIKI_SYNC.md - 快速開始
- DEPLOYMENT_GUIDE_WIKI_SYNC.md - 部署指南
- WIKI_DIFY_SYNC_GUIDE.md - 系統說明
- IMPLEMENTATION_SUMMARY_WIKI_SYNC.md - 實作總結

---

## 🚀 接下來你要做的事（按順序）

### 第 1 步：取得必要資訊（10 分鐘）

#### 1.1 取得 Wiki.js API Key
```
1. 開啟 http://your-wiki:3000/admin
2. 進入「API Access」
3. 點擊「Generate New Key」
4. 權限選擇：query:pages
5. 複製 Token（格式：eyJhbGci...）
```

#### 1.2 取得 Dify Admin API Key
```
1. 開啟 http://your-dify/console
2. 進入「知識庫」→「API」
3. 複製「API Key」（格式：dataset-xxxxxx）
```

#### 1.3 取得 10 個 Dataset ID
在 Dify Console 中，依序開啟每個 Dataset，從網址複製 UUID：

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

---

### 第 2 步：設定環境變數（5 分鐘）

在 PowerShell 中執行：

```powershell
cd c:\Users\andycy.wu\dify\dify-next-frontend

# 複製範本
Copy-Item .env.wiki-sync.example .env.local

# 用 VSCode 開啟編輯
code .env.local
```

填入剛剛取得的資訊：

```bash
WIKI_API_KEY=eyJ...你的Wiki_Token
WIKI_GRAPHQL_URL=http://wiki:3000/graphql

DIFY_API_URL=http://api:5001/v1
DIFY_ADMIN_API_KEY=dataset-...你的Dify_Token

DIFY_DATASET_COMMON_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
DIFY_DATASET_DQE_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
# ... 填完 10 個
```

---

### 第 3 步：執行資料庫 Migration（2 分鐘）

```powershell
cd c:\Users\andycy.wu\dify\dify-next-frontend

# 生成 Prisma Client
npm run prisma:generate

# 執行 Migration（會提示輸入名稱）
npm run prisma:migrate
# 輸入：add_wiki_sync_status
```

---

### 第 4 步：測試同步（5 分鐘）

```powershell
# 先測試一個部門（Dry Run - 不會實際執行）
npm run sync-wiki -- --department COMMON --dry-run

# 看起來 OK 的話，執行實際同步
npm run sync-wiki -- --department COMMON
```

檢查結果：
1. 在 Dify Console 檢查 COMMON Dataset 是否有新文件
2. 查看資料庫記錄

---

### 第 5 步：全部門同步（10 分鐘）

```powershell
# 全部門同步
npm run sync-wiki

# 或強制全量同步
npm run sync-wiki -- --force-full-sync
```

---

### 第 6 步：設定自動同步（選擇一種）

#### 方式 A：Docker Compose（推薦）

編輯 `docker-compose.yml`，加入：

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
```

啟動：

```powershell
docker-compose up -d wiki-sync
```

#### 方式 B：Windows Task Scheduler

1. 開啟「工作排程器」
2. 建立基本工作
3. 觸發程序：每天 02:00
4. 動作：啟動程式
   - 程式：`C:\Program Files\nodejs\node.exe`
   - 引數：`c:\Users\andycy.wu\dify\dify-next-frontend\scripts\sync-wiki-cli.js`
   - 起始於：`c:\Users\andycy.wu\dify\dify-next-frontend`

---

## 📊 驗證檢查清單

完成部署後，請確認：

### 功能測試
- [ ] ✅ 手動執行 `npm run sync-wiki` 成功
- [ ] ✅ Dify Console 可以看到文件
- [ ] ✅ 文件內容正確（有 Metadata）
- [ ] ✅ 資料庫有 wiki_sync_status 記錄

### 資料庫檢查
```powershell
# 連接資料庫
docker exec -it postgres psql -U postgres -d wiki

# 查詢同步狀態
SELECT department, COUNT(*), MAX("lastSyncedAt") 
FROM wiki_sync_status 
GROUP BY department;
```

### API 測試
```powershell
# 查看統計
curl http://localhost:3001/api/admin/sync-wiki?stats=true

# 觸發同步
curl -X POST http://localhost:3001/api/admin/sync-wiki `
  -H "Content-Type: application/json" `
  -d '{"department":"COMMON"}'
```

### 自動同步檢查
- [ ] ✅ Docker 容器正常運行（`docker ps | grep wiki-sync`）
- [ ] ✅ 或 Windows Task Scheduler 任務已建立
- [ ] ✅ 日誌檔案正常記錄

---

## 🐛 常見問題快速解決

### 問題 1：TypeScript 編譯錯誤

```powershell
# 重新安裝依賴
npm install --save-dev @types/node

# 重新建置
npm run build
```

### 問題 2：Prisma Client 錯誤

```powershell
# 重新生成
npm run prisma:generate

# 重置資料庫（注意：會清空資料）
npm run prisma:migrate -- reset
```

### 問題 3：API 連接失敗

檢查網路：
```powershell
# 測試 Wiki.js
curl http://wiki:3000/graphql

# 測試 Dify
curl http://api:5001/v1/datasets
```

如果失敗，檢查 Docker 網路：
```powershell
docker network inspect dify-network
```

---

## 📈 監控建議

### 每日檢查
```powershell
# 查看最近同步狀態
npm run sync-wiki -- --stats

# 查看失敗記錄
docker exec -it postgres psql -U postgres -d wiki `
  -c "SELECT * FROM wiki_sync_status WHERE \"syncStatus\" = 'failed';"
```

### 每週檢查
- 檢查 Dify Dataset 文件數量
- 檢查日誌檔案大小
- 清理過期日誌

---

## 🎯 下一步優化

系統上線後，可以考慮：

1. **Webhook 整合** - Wiki.js 更新時即時同步
2. **Web UI** - 視覺化管理介面
3. **通知系統** - 同步失敗時發送 Email/Slack
4. **版本控制** - 追蹤文件版本歷史
5. **效能優化** - 批次處理、快取機制

---

## 📞 需要幫助？

參考這些文件：
1. [README_WIKI_SYNC.md](./README_WIKI_SYNC.md) - 總覽
2. [QUICKSTART_WIKI_SYNC.md](./QUICKSTART_WIKI_SYNC.md) - 快速開始
3. [DEPLOYMENT_GUIDE_WIKI_SYNC.md](./DEPLOYMENT_GUIDE_WIKI_SYNC.md) - 完整部署
4. [WIKI_DIFY_SYNC_GUIDE.md](./WIKI_DIFY_SYNC_GUIDE.md) - 系統說明

或執行：
```powershell
npm run sync-wiki -- --help
```

---

## ✅ 最終確認

當你完成所有步驟後，應該會看到：

```
🚀 Starting Wiki.js → Dify Enhanced Sync...

📁 Processing department: COMMON
   📥 Fetching pages from Wiki.js path: /common
   Found 5 pages
   📄 Processing: /common
      🔄 Preprocessing content...
      ⬆️  Creating in Dify...
      ✅ Created successfully

... (更多部門)

✅ Sync completed!
📊 Statistics:
   Total processed: 50
   Created: 45
   Updated: 3
   Skipped: 2
   Failed: 0
```

**恭喜！你的 Wiki.js → Dify 全自動同步系統已經完全運作了！** 🎉

---

**大叔，準備好開始了嗎？從「第 1 步」開始執行，有任何問題隨時問我！** 🚀
