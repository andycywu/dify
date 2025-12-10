# 🚀 Ubuntu Server 快速部署清單

> **大叔專用！** 複製貼上就能完成部署 💪

---

## 📋 前置準備（在 Windows 先做好）

### 1. 取得必要資訊

開啟這些網頁，把資訊複製到記事本：

**Wiki.js API Key:**
```
http://your-server-ip:3000/admin
→ API Access → Generate New Key → 複製 Token
```

**Dify Admin API Key:**
```
http://your-server-ip/console
→ 知識庫 → API → 複製 API Key
```

**10 個 Dataset ID:**（從網址複製 UUID）
```
http://your-server-ip/console/datasets/[UUID]/documents
```

把這些資訊存到記事本備用！

---

## 🖥️ Ubuntu Server 部署（複製貼上就對了）

### Step 1: SSH 連線

```bash
# 從 Windows PowerShell 連線
ssh your-username@your-server-ip
```

### Step 2: 拉取程式碼

```bash
# 進入專案目錄
cd /path/to/dify

# 拉取最新程式碼
git pull origin main

# 確認檔案存在
ls -la dify-next-frontend/lib/wiki-sync-enhanced.ts
ls -la dify-next-frontend/scripts/sync-wiki-cli.js
```

### Step 3: 設定環境變數

```bash
# 進入目錄
cd dify-next-frontend

# 複製範本
cp .env.wiki-sync.example .env.docker

# 編輯（用 nano 或 vim）
nano .env.docker
```

**貼上你準備好的資訊：**

```bash
WIKI_API_KEY=eyJ...你的Token
WIKI_GRAPHQL_URL=http://wiki:3000/graphql

DIFY_API_URL=http://api:5001/v1
DIFY_ADMIN_API_KEY=dataset-...你的Token

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

**儲存：** `Ctrl+O` → `Enter` → `Ctrl+X`

### Step 4: 執行 Migration

```bash
# 進入容器
docker exec -it dify-next-frontend bash

# 生成 Prisma Client
npm run prisma:generate

# 執行 Migration（提示時輸入：add_wiki_sync_status）
npm run prisma:migrate

# 離開容器
exit
```

### Step 5: 測試同步

```bash
# Dry Run（不實際執行）
docker exec -it dify-next-frontend npm run sync-wiki -- --department COMMON --dry-run

# 實際同步一個部門
docker exec -it dify-next-frontend npm run sync-wiki -- --department COMMON
```

### Step 6: 驗證結果

```bash
# 檢查資料庫
docker exec -it postgres psql -U postgres -d wiki -c "
SELECT department, COUNT(*), MAX(\"lastSyncedAt\") 
FROM wiki_sync_status 
GROUP BY department;
"
```

### Step 7: 全部門同步

```bash
# 同步所有部門
docker exec -it dify-next-frontend npm run sync-wiki
```

### Step 8: 設定自動同步

```bash
# 編輯 docker-compose.yml
cd /path/to/dify
nano docker-compose.yml
```

**在 `services:` 區塊最後加入：**

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

**啟動服務：**

```bash
# 建置並啟動
docker-compose up -d wiki-sync

# 檢查狀態
docker ps | grep wiki-sync

# 查看日誌
docker logs -f wiki-sync
```

---

## ✅ 完成檢查

執行這些命令確認一切正常：

```bash
# 1. 查看統計
docker exec -it dify-next-frontend npm run sync-wiki -- --stats

# 2. 查看資料庫記錄
docker exec -it postgres psql -U postgres -d wiki -c "
SELECT 
  department,
  COUNT(*) as total,
  SUM(CASE WHEN \"syncStatus\" = 'success' THEN 1 ELSE 0 END) as success,
  MAX(\"lastSyncedAt\") as last_sync
FROM wiki_sync_status
GROUP BY department;
"

# 3. 檢查 Dify Console（開啟瀏覽器）
echo "http://your-server-ip/console → 知識庫 → 檢查文件"
```

---

## 🎯 常用命令

```bash
# 手動同步
docker exec -it dify-next-frontend npm run sync-wiki

# 同步特定部門
docker exec -it dify-next-frontend npm run sync-wiki -- --department DQE

# 查看統計
docker exec -it dify-next-frontend npm run sync-wiki -- --stats

# 強制全量同步
docker exec -it dify-next-frontend npm run sync-wiki -- --force-full-sync

# 查看日誌
docker logs -f wiki-sync

# 重啟服務
docker-compose restart wiki-sync
```

---

## 🐛 快速除錯

### 問題 1: Migration 失敗

```bash
# 重置並重新執行
docker exec -it dify-next-frontend npm run prisma:migrate -- reset
docker exec -it dify-next-frontend npm run prisma:migrate
```

### 問題 2: 無法連接 Wiki.js 或 Dify

```bash
# 測試 Wiki.js
docker exec -it dify-next-frontend curl http://wiki:3000/graphql

# 測試 Dify
docker exec -it dify-next-frontend curl http://api:5001/v1/datasets

# 檢查網路
docker network inspect dify-network
```

### 問題 3: 容器啟動失敗

```bash
# 重新建置
docker-compose build wiki-sync

# 重新啟動
docker-compose up -d wiki-sync

# 查看錯誤
docker logs wiki-sync
```

---

## 🎊 完成！

你的 Ubuntu Server 上的 Wiki.js → Dify 同步系統已經完全部署並運行了！

**系統會：**
- ✅ 每天自動同步 Wiki.js 到 Dify
- ✅ 支援 10 個部門獨立知識庫
- ✅ 自動處理文件格式轉換
- ✅ 追蹤同步狀態與錯誤

**需要更詳細的說明？** 參考：
- `docs/UBUNTU_SERVER_DEPLOYMENT.md` - 完整部署指南
- `docs/README_WIKI_SYNC.md` - 系統總覽

**有問題隨時問！** 💪
