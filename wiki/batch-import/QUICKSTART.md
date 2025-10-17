# 🚀 快速開始：Wiki.js 批量導入配置

## ⚠️ 當前狀態
服務已就緒，**僅需配置 API Key** 即可使用。

## 📝 3 步驟配置（預計 5 分鐘）

### 1️⃣ 生成 API Key
1. 打開 http://localhost:3000
2. 登入管理員賬號
3. 點擊 ⚙️ → **API Access**
4. 點擊 **New API Key**
5. 設定：
   - Name: `Batch Import Service`
   - Expiration: `Never`
   - Group: `Administrators`
   - Permissions: ✅ `pages:write` + ✅ `pages:manage`
6. **複製生成的 API Key**

### 2️⃣ 配置環境變數
```bash
cd /Users/andycyw/dify/docker
echo "WIKI_API_KEY=你複製的API_KEY" >> .env
docker-compose -f docker-compose.yaml restart wiki-batch-importer
```

### 3️⃣ 測試
```bash
# 創建測試文件
echo "# 測試頁面

這是測試內容。" > /tmp/test.md

# 上傳
curl -X POST http://localhost:5050/api/wiki/batch-import \
  -F "file=@/tmp/test.md" \
  -F "targetFolder=/imported"

# 查看：http://localhost:3000/imported/test
```

## ✅ 驗證成功的標誌
- API 回應：`"success": true`
- 資料庫：`SELECT render IS NOT NULL FROM pages` → `t`
- 網頁：http://localhost:3000/imported/test 正常顯示

## 🐛 問題排查
```bash
# 檢查 API Key 是否配置
docker exec wiki-batch-importer env | grep WIKI_API_KEY

# 查看日誌
docker logs wiki-batch-importer --tail 50 2>&1 | grep -E "(🔍|❌|✅)"

# 應該看到：
# 🔍 Has API Key: True  ← 確認有 Key
# ✅ Page created successfully  ← 成功創建
```

## 📚 詳細文檔
完整說明請參考 `SOLUTION_GUIDE.md`

---

**需要幫助？** 檢查：
- [ ] API Key 已正確複製（沒有多餘空格）
- [ ] 環境變數已配置（檢查 .env 或 docker-compose.yaml）
- [ ] 服務已重啟（`docker-compose restart wiki-batch-importer`）
- [ ] API Key 的群組有 pages:write 權限
