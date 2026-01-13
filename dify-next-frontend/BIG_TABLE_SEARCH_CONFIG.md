# 大表檢索系統 - 環境變數配置指南

## 必須設定的環境變數

在使用大表檢索功能前，請在 `.env.local` 或 `.env.production` 中添加以下配置：

```bash
# ============================================
# 大表檢索系統 Dataset IDs
# ============================================

# Project KB (InHouse) - 內部專案大表
NEXT_PUBLIC_KB_INHOUSE_ID=your_inhouse_dataset_id_here

# Project KB (Outsourcing) - 外包專案大表
NEXT_PUBLIC_KB_OUTSOURCING_ID=your_outsourcing_dataset_id_here

# Dataset API Key (用於後端 API 查詢)
DIFY_DATASET_API_KEY=dataset-0pqLI4nLt079UGOibC7fSabe
```

## 如何取得 Dataset ID

### 方法 1：從 Knowledge Management 頁面取得

1. 登入系統後前往 **Knowledge Management** 頁面
2. 找到 "Project KB (InHouse)" 和 "Project KB (Outsourcing)" 這兩個知識庫
3. 點擊進入任一知識庫，查看 URL 中的 Dataset ID
   - 例如：`http://localhost:3001/knowledge-management?datasetId=abc123...`
   - 其中 `abc123...` 就是 Dataset ID

### 方法 2：從 Dify 後台取得

1. 登入 Dify 管理後台
2. 前往 **知識庫 (Knowledge)** 頁面
3. 找到對應的 Dataset，點擊設定查看 ID

### 方法 3：使用 API 查詢

```bash
curl -X GET 'http://your-dify-api/v1/datasets' \
  -H 'Authorization: Bearer your-api-key'
```

## 配置範例

完整的 `.env.local` 配置範例：

```bash
# Dify API 基礎設定
NEXT_PUBLIC_DIFY_API_BASE_URL=http://172.27.197.100/v1
DIFY_DATASET_API_KEY=dataset-0pqLI4nLt079UGOibC7fSabe

# 大表檢索 Dataset IDs（請替換為實際的 ID）
NEXT_PUBLIC_KB_INHOUSE_ID=ab29375f-c25f-4768-b8f9-5c94b61f6cd5
NEXT_PUBLIC_KB_OUTSOURCING_ID=85f623b3-919c-4ea8-93c3-c06b2b03e10d
```

## 驗證配置

設定完成後，請執行以下步驟驗證：

1. **重啟開發服務器**
   ```bash
   npm run dev
   ```

2. **訪問大表檢索頁面**
   ```
   http://localhost:3001/big-table-search
   ```

3. **測試搜尋功能**
   - 輸入關鍵字（如：專案名稱、負責人）
   - 選擇搜尋範圍
   - 點擊「開始搜尋」

4. **檢查瀏覽器控制台**
   - 如果出現 "Dataset ID not configured" 警告，表示環境變數未正確設定
   - 確認 `.env.local` 檔案中的 Dataset IDs 是否正確

## 常見問題

### Q1: 搜尋沒有結果？

**檢查項目：**
- ✅ Dataset IDs 是否正確設定
- ✅ API Key 是否有效
- ✅ Dataset 中是否已上傳文檔
- ✅ 關鍵字是否存在於文檔中

### Q2: 出現 "Server configuration error"？

**解決方法：**
- 確認 `NEXT_PUBLIC_DIFY_API_BASE_URL` 已設定
- 確認 `DIFY_DATASET_API_KEY` 已設定
- 確認 API 端點可訪問

### Q3: 只有一個 Dataset 有結果？

**原因：**
- 可能只設定了一個 Dataset ID
- 或另一個 Dataset 中沒有相關資料

**解決方法：**
- 檢查兩個 Dataset IDs 都已正確設定
- 確認兩個 Dataset 都已上傳文檔

## 進階配置

### 調整搜尋參數

如需調整搜尋行為，可以修改 `pages/big-table-search.tsx` 中的 `retrieveChunks` 參數：

```typescript
const response = await retrieveChunks(
  datasetId, 
  keyword, 
  50  // ← 調整返回結果數量（預設 50）
);
```

### 使用後端 API

如需批次查詢或後端處理，可以使用提供的 API 路由：

```typescript
const response = await fetch('/api/big-table-search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    keyword: '搜尋關鍵字',
    datasets: ['inhouse', 'outsourcing'],
    limit: 50
  })
});

const data = await response.json();
console.log(data.results);
```

## 安全性建議

1. **不要將 API Key 提交到 Git**
   - 確保 `.env.local` 在 `.gitignore` 中
   - 使用 `.env.example` 作為配置範本

2. **生產環境使用獨立的 API Key**
   - 開發環境和生產環境應使用不同的密鑰
   - 定期輪換 API Key

3. **限制 API 權限**
   - 大表檢索 API Key 只需要 Dataset 讀取權限
   - 不要使用具有寫入權限的 Key

## 技術支援

如遇到問題，請檢查：
1. 瀏覽器開發者工具的 Console
2. Next.js 伺服器的終端輸出
3. Dify API 的日誌

或聯繫系統管理員獲取協助。
