# Docker 容器部署指南 - 前處理系統

## 📋 前置檢查

你的環境使用 Docker Compose 部署,所有服務都在容器中運行。前處理系統已完成以下工作:

✅ **已完成的程式碼變更**:
- 建立 `lib/preprocess/` 完整前處理系統 (18 個檔案)
- 修改 `components/Knowledge/DocumentManagement.tsx` 加入前處理呼叫
- 修改 `next.config.js` 設定 15MB 上傳限制
- 新增 `pages/api/documents/preprocess.ts` API 路由
- **更新 `package.json` 加入所有必要套件**

⚠️ **需要執行的部署步驟**:
- 重新建置 Docker 映像檔 (安裝新套件)
- 重啟容器使變更生效

---

## 🐳 Docker 容器重建流程

### 步驟 1: 進入 docker 目錄

```bash
cd ~/dify/docker
```

### 步驟 2: 停止現有的 dify-next-frontend 容器

```bash
docker-compose stop dify-next-frontend
```

### 步驟 3: 重新建置 dify-next-frontend 映像檔

這個指令會:
1. 從 `../dify-next-frontend/package.json` 安裝新套件 (pdf-parse, mammoth, xlsx 等)
2. 編譯 TypeScript (包含新的 lib/preprocess 程式碼)
3. 執行 `npm run build` 產生 Next.js 生產環境建置

```bash
docker-compose build --no-cache dify-next-frontend
```

> **⏱️ 預計時間**: 5-10 分鐘 (視網路速度而定)

### 步驟 4: 啟動容器

```bash
docker-compose up -d dify-next-frontend
```

### 步驟 5: 檢查容器狀態

```bash
# 檢查容器是否正常運行
docker-compose ps dify-next-frontend

# 查看即時日誌 (按 Ctrl+C 退出)
docker-compose logs -f dify-next-frontend
```

**預期成功日誌**:
```
dify-next-frontend_1  | Listening on http://0.0.0.0:3000
dify-next-frontend_1  | ✓ Ready in XXXms
```

---

## 🧪 驗證前處理系統

### 測試 1: 檢查容器內套件安裝

```bash
# 進入容器內部
docker exec -it docker-dify-next-frontend-1 sh

# 檢查 PDF 處理套件
node -e "console.log(require('pdf-parse'))"

# 檢查 DOCX 處理套件
node -e "console.log(require('mammoth'))"

# 檢查 Excel 處理套件
node -e "console.log(require('xlsx'))"

# 離開容器
exit
```

### 測試 2: 測試前處理 API 端點

```bash
# 準備測試檔案
echo "# 測試標題\n\n這是測試內容" > test.md

# 呼叫前處理 API
curl -X POST http://localhost:3001/api/documents/preprocess \
  -F "file=@test.md" \
  -v
```

**預期回應**:
```json
{
  "success": true,
  "markdown": "# 測試標題\n\n這是測試內容\n\n---",
  "chunks": [
    {
      "title": "測試標題",
      "content": "這是測試內容",
      "index": 0
    }
  ],
  "metadata": {
    "fileType": "MARKDOWN",
    "fileName": "test.md",
    "processingDate": "2025-06-09T..."
  }
}
```

### 測試 3: 瀏覽器端測試

1. 開啟 http://localhost:3001/knowledge-management
2. 點擊「上傳文件」
3. 選擇一個支援的格式檔案 (PDF, DOCX, XLSX, HTML, Markdown 等)
4. 上傳後查看前端通知訊息

**預期行為**:
- ✅ 上傳前顯示「正在前處理文件...」
- ✅ 前處理成功後顯示「前處理完成,正在上傳...」
- ✅ 最終顯示「文件上傳成功」

---

## 🔍 除錯指令

### 查看容器日誌

```bash
# 查看最後 100 行日誌
docker-compose logs --tail=100 dify-next-frontend

# 即時追蹤日誌
docker-compose logs -f dify-next-frontend

# 查看錯誤日誌
docker-compose logs dify-next-frontend | grep -i error
```

### 檢查容器資源使用

```bash
docker stats docker-dify-next-frontend-1
```

### 重新建置的快速指令 (開發模式)

如果需要頻繁測試程式碼變更:

```bash
# 停止 → 重建 → 啟動 (一行完成)
docker-compose stop dify-next-frontend && \
docker-compose build dify-next-frontend && \
docker-compose up -d dify-next-frontend
```

---

## 📂 Docker 相關檔案路徑

| 檔案 | 路徑 | 說明 |
|------|------|------|
| Docker Compose | `~/dify/docker/docker-compose.yaml` | 容器編排設定 (line 782: dify-next-frontend) |
| Dockerfile | `~/dify/dify-next-frontend/Dockerfile` | 多階段建置設定 (deps → builder → runner) |
| 容器資料卷 | `~/dify/docker/volumes/dify-next-frontend/` | 持久化資料儲存 (/app/data) |
| 原始碼 | `~/dify/dify-next-frontend/` | 應用程式原始碼 |
| 前處理系統 | `~/dify/dify-next-frontend/lib/preprocess/` | 前處理模組 (18 個檔案) |

---

## ⚠️ 常見問題與解決方案

### 問題 1: 建置失敗 - "Cannot find module 'pdf-parse'"

**原因**: 建置快取導致 package.json 變更未生效

**解決方案**:
```bash
# 清除建置快取
docker-compose build --no-cache dify-next-frontend
```

### 問題 2: TypeScript 編譯錯誤

**原因**: 型別定義未正確安裝

**解決方案**:
```bash
# 進入原始碼目錄手動安裝 (僅用於除錯)
cd ~/dify/dify-next-frontend
npm install @types/formidable @types/node

# 然後重新建置 Docker
cd ~/dify/docker
docker-compose build --no-cache dify-next-frontend
```

### 問題 3: 容器無法啟動 - "Address already in use"

**原因**: 3001 埠號已被占用

**解決方案**:
```bash
# 檢查埠號占用
sudo netstat -tulnp | grep 3001

# 停止所有相關容器
docker-compose down dify-next-frontend

# 重新啟動
docker-compose up -d dify-next-frontend
```

### 問題 4: 前處理 API 回傳 500 錯誤

**檢查步驟**:
```bash
# 1. 查看容器日誌
docker-compose logs --tail=50 dify-next-frontend | grep preprocess

# 2. 檢查套件是否正確安裝
docker exec -it docker-dify-next-frontend-1 npm list pdf-parse mammoth xlsx

# 3. 測試 Node.js 模組載入
docker exec -it docker-dify-next-frontend-1 node -e "require('pdf-parse')"
```

---

## 🚀 快速部署檢查清單

在執行重建前,請確認:

- [ ] 所有程式碼變更已儲存並提交 (或至少存在於 `~/dify/dify-next-frontend/`)
- [ ] `package.json` 已更新 (包含 pdf-parse, mammoth, xlsx 等 8 個新套件)
- [ ] 沒有其他容器占用 3001 埠號
- [ ] Docker daemon 正在運行 (`docker ps` 可正常執行)
- [ ] 有足夠的磁碟空間進行建置 (建議至少 2GB 可用空間)

**執行部署**:
```bash
cd ~/dify/docker
docker-compose stop dify-next-frontend
docker-compose build --no-cache dify-next-frontend
docker-compose up -d dify-next-frontend
docker-compose logs -f dify-next-frontend  # 監控啟動日誌
```

---

## 📊 預期建置輸出

**Dockerfile 多階段建置流程**:

```
[deps] Stage 1: 安裝相依套件
 ✓ npm ci (base dependencies)
 ✓ 安裝 pdf-parse, mammoth, xlsx, csv-parse, cheerio, formidable...

[builder] Stage 2: 編譯應用程式
 ✓ Prisma generate
 ✓ TypeScript compilation (lib/preprocess/*, pages/api/documents/preprocess.ts)
 ✓ npm run build (Next.js production build)

[runner] Stage 3: 生產環境容器
 ✓ Copy node_modules (包含新套件)
 ✓ Copy lib/, pages/, .next/
 ✓ Start Next.js server
```

**成功建置的最後幾行**:
```
Successfully built abc123def456
Successfully tagged dify-next-frontend:latest
```

---

## 📝 下一步建議

容器重建完成後,建議執行以下測試:

1. **功能測試**: 上傳各種格式檔案 (PDF, DOCX, XLSX, HTML, CSV, TXT)
2. **錯誤處理測試**: 上傳超大檔案 (>15MB) 確認錯誤提示
3. **效能測試**: 上傳 10-15MB 的大型 PDF,檢查處理時間
4. **日誌監控**: 持續監控 `docker-compose logs -f dify-next-frontend` 確認無異常

**成功標準**:
- ✅ 所有測試格式檔案都能正確轉換為 Markdown 格式
- ✅ 轉換後的 Markdown 符合「格式 A」規範 (# 標題 + 內容 + 分隔線)
- ✅ 前端顯示「前處理完成」通知
- ✅ 轉換失敗時能自動 fallback 到原始檔案上傳

---

## 🆘 支援與聯絡

如果遇到無法解決的問題,請提供以下資訊:

1. **容器日誌**: `docker-compose logs --tail=200 dify-next-frontend > logs.txt`
2. **建置輸出**: `docker-compose build dify-next-frontend 2>&1 | tee build.log`
3. **容器狀態**: `docker-compose ps`
4. **錯誤訊息**: 完整的錯誤訊息與堆疊追蹤

---

**最後更新**: 2025-06-09
**版本**: v1.0 (Docker Deployment)
**相容性**: Docker Compose v2.x, Node.js 18.x, Next.js 15.3.3
