# 🎉 Wiki.js → Dify 全自動同步系統

> **狀態：** ✅ 完整實作完成  
> **版本：** 1.0.0  
> **最後更新：** 2025-12-10

## 🚀 快速開始

```bash
# 1. 設定環境變數
cp .env.wiki-sync.example .env.local
# 編輯 .env.local，填入你的 API Keys 和 Dataset IDs

# 2. 執行資料庫 Migration
npm run prisma:generate
npm run prisma:migrate

# 3. 執行同步
npm run sync-wiki
```

**就這麼簡單！** 🎊

詳細步驟請參考：[5 分鐘快速開始指南](./QUICKSTART_WIKI_SYNC.md)

---

## 📖 完整文件

| 文件 | 說明 | 適用對象 |
|------|------|---------|
| [QUICKSTART_WIKI_SYNC.md](./QUICKSTART_WIKI_SYNC.md) | 5 分鐘快速開始 | 想快速測試的人 |
| [DEPLOYMENT_GUIDE_WIKI_SYNC.md](./DEPLOYMENT_GUIDE_WIKI_SYNC.md) | 完整部署指南 | 正式部署到生產環境 |
| [WIKI_DIFY_SYNC_GUIDE.md](./WIKI_DIFY_SYNC_GUIDE.md) | 系統說明文件 | 了解系統架構與原理 |
| [IMPLEMENTATION_SUMMARY_WIKI_SYNC.md](./IMPLEMENTATION_SUMMARY_WIKI_SYNC.md) | 實作總結 | 開發者/維護者 |

---

## 🎯 核心功能

✅ **多部門支援** - 10 個獨立部門知識庫  
✅ **智能預處理** - 自動格式轉換、智能分段、Metadata 注入  
✅ **增量同步** - 只更新有變化的頁面  
✅ **錯誤處理** - 自動記錄、支援重試  
✅ **自動化** - Cron Job / Docker Compose 定時同步  
✅ **監控統計** - 即時狀態追蹤  

---

## 🏗️ 系統架構

```
Wiki.js (10 個分類)
    ↓ GraphQL API
【同步引擎】wiki-sync-enhanced.ts
    ↓
【預處理器】lib/preprocess/
    ↓
【Dify API】lib/dify-client.ts
    ↓
Dify Datasets (10 個知識庫)
    ↓
PostgreSQL (狀態追蹤)
```

---

## 📦 支援的檔案格式

透過 **Preprocessor** 系統，支援以下格式自動轉換為 Markdown：

- ✅ TXT
- ✅ Markdown (MD, MDX)
- ✅ PDF
- ✅ DOCX
- ✅ Excel (XLSX, XLS)
- ✅ CSV
- ✅ HTML
- ✅ VTT (字幕)
- ✅ Properties

---

## 🎓 10 個部門對應

| 部門 | Wiki.js 路徑 | Dify Dataset |
|------|-------------|-------------|
| COMMON | `/common` | 公共知識庫 |
| DQE | `/dqe` | 設計品質工程 |
| DQE_CERTI | `/dqe-certi` | DQE 認證 |
| HW | `/hw` | 硬體部門 |
| PWR | `/pwr` | 電源部門 |
| ME_LCM | `/me-lcm` | 機械生命週期 |
| SW | `/sw` | 軟體部門 |
| PJM | `/pjm` | 專案管理 |
| ARCH | `/arch` | 架構部門 |
| TM | `/tm` | 測試管理 |

---

## 🔧 常用命令

```bash
# 同步所有部門
npm run sync-wiki

# 同步特定部門
npm run sync-wiki -- --department DQE

# 強制全量同步
npm run sync-wiki -- --force-full-sync

# 測試模式（不實際執行）
npm run sync-wiki -- --dry-run

# 查看統計
npm run sync-wiki -- --stats

# 查看幫助
npm run sync-wiki -- --help
```

---

## 📊 API 端點

### GET `/api/admin/sync-wiki?stats=true`
查詢同步統計

### POST `/api/admin/sync-wiki`
觸發同步

```json
{
  "department": "DQE",
  "forceFullSync": false,
  "dryRun": false
}
```

---

## 🔄 自動同步設定

### Docker Compose（推薦）

在 `docker-compose.yml` 加入：

```yaml
  wiki-sync:
    build: ./dify-next-frontend
    command: sh -c "while true; do npm run sync-wiki; sleep 86400; done"
    env_file: .env.docker
    depends_on: [db, wiki, api]
    restart: unless-stopped
```

### Linux Cron Job

```bash
# 自動設定
chmod +x setup-wiki-sync-cron.sh
./setup-wiki-sync-cron.sh

# 或手動編輯
crontab -e
# 加入：0 2 * * * cd /path/to/project && npm run sync-wiki
```

---

## 📈 監控與維護

### 查看同步狀態

```sql
SELECT 
  department,
  COUNT(*) as total,
  SUM(CASE WHEN "syncStatus" = 'success' THEN 1 ELSE 0 END) as success,
  MAX("lastSyncedAt") as last_sync
FROM wiki_sync_status
GROUP BY department;
```

### 查看日誌

```bash
# Cron 日誌
tail -f /var/log/dify-wiki-sync/sync.log

# Docker 日誌
docker logs -f wiki-sync
```

---

## 🐛 故障排除

### API Key 無效？

```bash
# 測試 Wiki.js API
curl -X POST http://wiki:3000/graphql \
  -H "Authorization: Bearer ${WIKI_API_KEY}" \
  -d '{"query":"{ pages { list { id } } }"}'

# 測試 Dify API
curl -X GET "http://api:5001/v1/datasets" \
  -H "Authorization: Bearer ${DIFY_ADMIN_API_KEY}"
```

### Migration 失敗？

```bash
npm run prisma:migrate -- reset
npm run prisma:migrate
```

### 同步卡住？

```bash
# 重置失敗狀態
npm run sync-wiki -- --reset-failed

# 完全重新同步
npm run sync-wiki -- --clear --force-full-sync
```

更多問題請參考：[完整部署指南](./DEPLOYMENT_GUIDE_WIKI_SYNC.md)

---

## 🎊 完成檢查清單

部署完成後，請確認：

- [ ] ✅ 手動執行 `npm run sync-wiki` 成功
- [ ] ✅ Dify Console 可以看到上傳的文件
- [ ] ✅ 資料庫 `wiki_sync_status` 有記錄
- [ ] ✅ 自動同步已設定（Cron 或 Docker）
- [ ] ✅ 可以透過 API 觸發同步
- [ ] ✅ 監控系統正常運作

---

## 📞 需要幫助？

1. 查看 [快速開始指南](./QUICKSTART_WIKI_SYNC.md)
2. 參考 [部署指南](./DEPLOYMENT_GUIDE_WIKI_SYNC.md)
3. 閱讀 [系統說明](./WIKI_DIFY_SYNC_GUIDE.md)
4. 執行 `npm run sync-wiki -- --help`

---

## 🚀 下一步

系統已完全就緒！你可以：

1. ✅ 立即開始同步 Wiki.js 到 Dify
2. 🔔 加入 Webhook（Wiki.js 更新時即時同步）
3. 📊 建立 Web UI 管理介面
4. 📧 設定同步失敗通知
5. 🔍 實作全文搜尋與版本控制

**恭喜！你的企業級 AI 知識庫同步系統已經上線了！** 🎉

---

**維護者：** [@andycywu](https://github.com/andycywu)  
**專案：** dify-next-frontend  
**授權：** MIT
