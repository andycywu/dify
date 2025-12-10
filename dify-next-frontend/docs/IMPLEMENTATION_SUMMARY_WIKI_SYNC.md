# 📦 Wiki.js → Dify 同步系統 - 完整實作清單

## ✅ 已完成的檔案

### 核心模組

1. **`lib/wiki-sync-enhanced.ts`** - 增強版同步引擎
   - ✅ 整合 Preprocessor
   - ✅ 支援 10 個部門獨立同步
   - ✅ 增量更新機制
   - ✅ 錯誤處理與重試
   - ✅ 狀態追蹤與統計

2. **`lib/preprocess/`** - 文件預處理系統（已存在）
   - ✅ 多格式支援（PDF, DOCX, Excel, CSV, Markdown, HTML...）
   - ✅ 智能分段
   - ✅ Metadata 注入

3. **`lib/dify-client.ts`** - Dify API 客戶端（已存在）
   - ✅ Dataset CRUD 操作
   - ✅ 文件上傳與更新

### CLI 與腳本

4. **`scripts/sync-wiki-cli.js`** - 命令列工具
   - ✅ 支援多種參數（department, force-full-sync, dry-run...）
   - ✅ 友善的幫助訊息
   - ✅ 統計資訊查詢

5. **`setup-wiki-sync-cron.sh`** - Cron Job 自動設定
   - ✅ 自動建立 cron script
   - ✅ 設定定時任務
   - ✅ 日誌管理

### API

6. **`pages/api/admin/sync-wiki.ts`** - Web API
   - ✅ GET - 查詢統計
   - ✅ POST - 觸發同步
   - ✅ 權限驗證

### 資料庫

7. **`prisma/schema.prisma`** - 資料模型
   - ✅ WikiSyncStatus model
   - ✅ 唯一約束與索引
   - ✅ 完整的 metadata 欄位

### 配置

8. **`.env.wiki-sync.example`** - 環境變數範本
   - ✅ 所有必要變數說明
   - ✅ 10 個 Dataset ID 佔位符
   - ✅ 詳細註解

9. **`package.json`** - NPM 腳本
   - ✅ `sync-wiki` 命令
   - ✅ `prisma:migrate` 命令
   - ✅ `prisma:generate` 命令

### 文件

10. **`docs/WIKI_DIFY_SYNC_GUIDE.md`** - 完整指南
    - ✅ 系統架構說明
    - ✅ 設定步驟
    - ✅ 使用方式
    - ✅ 監控與除錯

11. **`docs/DEPLOYMENT_GUIDE_WIKI_SYNC.md`** - 部署指南
    - ✅ 部署前檢查清單
    - ✅ 詳細部署步驟
    - ✅ 故障排除
    - ✅ 效能優化建議

12. **`docs/QUICKSTART_WIKI_SYNC.md`** - 5 分鐘快速開始
    - ✅ 精簡的設定步驟
    - ✅ 常用命令速查
    - ✅ 快速除錯技巧

---

## 🎯 系統功能特性

### ✅ 已實作功能

1. **多部門支援**
   - 10 個獨立部門知識庫
   - 部門路徑自動對應
   - 獨立的 Dataset 管理

2. **智能預處理**
   - 自動格式偵測
   - 多格式轉 Markdown
   - 智能分段（400-800 tokens）
   - Metadata 自動注入

3. **增量同步**
   - 比對更新時間
   - 只同步有變化的頁面
   - 狀態持久化追蹤

4. **錯誤處理**
   - 失敗自動記錄
   - 支援重試機制
   - 詳細錯誤訊息

5. **監控與統計**
   - 即時同步狀態
   - 成功/失敗統計
   - 最後同步時間

6. **自動化**
   - Cron Job 定時同步
   - Docker Compose 整合
   - API 觸發同步

7. **靈活控制**
   - 單部門同步
   - 強制全量同步
   - Dry run 模式
   - 特定頁面同步

---

## 📋 部署檢查清單

### 環境準備

- [ ] Node.js >= 20 已安裝
- [ ] PostgreSQL 可連接
- [ ] Wiki.js 正常運行
- [ ] Dify API 正常運行

### 配置設定

- [ ] Wiki.js API Key 已取得並設定
- [ ] Dify Admin API Key 已取得並設定
- [ ] 10 個 Dataset ID 已取得並設定
- [ ] .env.local 或 .env.docker 已正確配置

### 資料庫

- [ ] Prisma Client 已生成
- [ ] Migration 已執行成功
- [ ] wiki_sync_status 表已建立

### 測試

- [ ] Dry run 測試成功
- [ ] 單部門同步測試成功
- [ ] Dify Console 確認文件已上傳
- [ ] 資料庫記錄正確

### 自動化

- [ ] Cron Job 已設定（Linux）或
- [ ] Docker Compose 服務已啟動（Docker）
- [ ] 日誌檔案可正常寫入

---

## 🚀 快速開始命令

```bash
# 1. 設定環境變數
cp .env.wiki-sync.example .env.local
# 編輯 .env.local，填入 Keys 和 IDs

# 2. 執行 Migration
npm run prisma:generate
npm run prisma:migrate

# 3. 測試同步
npm run sync-wiki -- --department COMMON --dry-run

# 4. 正式同步
npm run sync-wiki

# 5. 設定自動同步
./setup-wiki-sync-cron.sh  # Linux
# 或在 docker-compose.yml 加入 wiki-sync 服務
```

---

## 📊 監控命令

```bash
# 查看統計
npm run sync-wiki -- --stats

# 查看特定部門統計
npm run sync-wiki -- --stats --department DQE

# 查看日誌
tail -f /var/log/dify-wiki-sync/sync.log

# 查看 Docker 日誌
docker logs -f wiki-sync

# 查看資料庫記錄
docker exec -it postgres psql -U postgres -d wiki \
  -c "SELECT * FROM wiki_sync_status ORDER BY \"lastSyncedAt\" DESC LIMIT 10;"
```

---

## 🔧 常用維護命令

```bash
# 重置失敗的同步
npm run sync-wiki -- --reset-failed

# 清空所有狀態
npm run sync-wiki -- --clear

# 強制全量重新同步
npm run sync-wiki -- --clear --force-full-sync

# 同步特定頁面
npm run sync-wiki -- --department DQE --page-path /dqe/sop-001
```

---

## 📈 系統架構

```
┌─────────────┐
│  Wiki.js    │
│  (10 個分類) │
└──────┬──────┘
       │ GraphQL API
       ▼
┌─────────────────────────────┐
│  wiki-sync-enhanced.ts      │
│  • 抓取頁面                 │
│  • 比對更新時間             │
│  • 決定同步策略             │
└──────┬──────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│  Preprocessor               │
│  • 格式偵測                 │
│  • 轉換 Markdown            │
│  • 智能分段                 │
│  • Metadata 注入            │
└──────┬──────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│  Dify Client                │
│  • 上傳文件                 │
│  • 更新文件                 │
│  • 管理 Dataset             │
└──────┬──────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│  Dify Datasets              │
│  (10 個獨立知識庫)          │
└─────────────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│  PostgreSQL                 │
│  wiki_sync_status           │
│  (同步狀態追蹤)             │
└─────────────────────────────┘
```

---

## 🎓 部門與路徑對應

| 部門 | Wiki.js 路徑 | Dataset ID 環境變數 |
|------|-------------|-------------------|
| COMMON | `/common` | DIFY_DATASET_COMMON_ID |
| DQE | `/dqe` | DIFY_DATASET_DQE_ID |
| DQE_CERTI | `/dqe-certi` | DIFY_DATASET_DQE_CERTI_ID |
| HW | `/hw` | DIFY_DATASET_HW_ID |
| PWR | `/pwr` | DIFY_DATASET_PWR_ID |
| ME_LCM | `/me-lcm` | DIFY_DATASET_ME_LCM_ID |
| SW | `/sw` | DIFY_DATASET_SW_ID |
| PJM | `/pjm` | DIFY_DATASET_PJM_ID |
| ARCH | `/arch` | DIFY_DATASET_ARCH_ID |
| TM | `/tm` | DIFY_DATASET_TM_ID |

---

## 🔄 同步流程

1. **啟動** - 從 CLI 或 API 觸發
2. **配置** - 讀取環境變數，確定部門與 Dataset 映射
3. **抓取** - 透過 Wiki.js GraphQL API 獲取頁面清單
4. **篩選** - 根據部門路徑過濾頁面
5. **比對** - 查詢資料庫，比對更新時間
6. **決策** - 決定是建立、更新或跳過
7. **預處理** - 呼叫 Preprocessor 轉換內容
8. **上傳** - 呼叫 Dify API 上傳或更新
9. **記錄** - 更新 wiki_sync_status 表
10. **統計** - 返回同步結果統計

---

## 🎉 完成狀態

**系統狀態：** ✅ 完整實作完成

**已交付：**
- ✅ 完整程式碼
- ✅ CLI 工具
- ✅ API 端點
- ✅ 資料庫 Schema
- ✅ 環境變數範本
- ✅ 部署腳本
- ✅ 完整文件

**立即可用：**
1. 複製 .env 範本
2. 填入 API Keys 和 Dataset IDs
3. 執行 Migration
4. 運行 `npm run sync-wiki`

**大叔，你的 Wiki.js → Dify 全自動同步系統已經完全準備好了！🚀**

---

## 📞 需要幫助？

參考這些文件：
- 快速開始：`docs/QUICKSTART_WIKI_SYNC.md`
- 完整部署：`docs/DEPLOYMENT_GUIDE_WIKI_SYNC.md`
- 詳細說明：`docs/WIKI_DIFY_SYNC_GUIDE.md`

或直接執行：
```bash
npm run sync-wiki -- --help
```
