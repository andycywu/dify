# 錯誤處理機制說明

## ✅ 已實作的錯誤檢查

### 1. 登入狀態檢查
**檢查點**：導航到導出頁面後
```javascript
// 檢查是否被重定向到登入頁面
if (pageTitle.includes('Login') || pageTitle.includes('登入')) {
  throw new Error('Session 已過期，請重新登入');
}
```
**HTTP 狀態碼**：401 Unauthorized

---

### 2. 權限檢查
**檢查點**：頁面內容分析
```javascript
// 檢查是否有 "access denied" 或 "沒有權限" 等訊息
if (/access denied|沒有權限|無權限|permission denied/i.test(pageContent)) {
  throw new Error('沒有權限訪問此專案');
}
```
**HTTP 狀態碼**：403 Forbidden

**錯誤回應範例**：
```json
{
  "success": false,
  "error": "權限不足",
  "message": "沒有權限訪問此專案 (Project ID: 9999)",
  "projectId": "9999",
  "timestamp": "2026-01-08T10:30:00.000Z"
}
```

---

### 3. 專案存在性檢查
**檢查點**：頁面內容分析
```javascript
// 檢查是否有 "project not found" 或 "專案不存在" 等訊息
if (/project not found|專案不存在|找不到專案/i.test(pageContent)) {
  throw new Error('專案不存在或ID錯誤');
}
```
**HTTP 狀態碼**：404 Not Found

**錯誤回應範例**：
```json
{
  "success": false,
  "error": "專案不存在",
  "message": "專案不存在或ID錯誤 (Project ID: 9999)",
  "projectId": "9999",
  "timestamp": "2026-01-08T10:30:00.000Z"
}
```

---

### 4. 匯出按鈕檢查
**檢查點**：頁面 DOM 元素檢查
```javascript
// 檢查導出按鈕是否存在
const exportButtonExists = await this.page.evaluate(() => {
  const btn = document.querySelector('[id*="btnExport"]');
  return btn !== null;
});

if (!exportButtonExists) {
  throw new Error('找不到導出按鈕，可能是專案 ID 無效或沒有資料可匯出');
}
```
**HTTP 狀態碼**：404 Not Found

---

### 5. 下載超時檢查
**檢查點**：文件下載等待（最多 30 秒）
```javascript
if (!downloadedFile) {
  // 額外檢查頁面狀態
  const currentTitle = await this.page.title();
  if (currentTitle.includes('Error') || currentTitle.includes('錯誤')) {
    throw new Error('下載失敗：頁面顯示錯誤');
  }
  
  throw new Error('下載超時：30 秒內未檢測到文件。這可能表示專案沒有資料可匯出或沒有匯出權限。');
}
```
**HTTP 狀態碼**：408 Request Timeout

**錯誤回應範例**：
```json
{
  "success": false,
  "error": "請求超時",
  "message": "下載超時：30 秒內未檢測到文件。這可能表示專案沒有資料可匯出或沒有匯出權限。",
  "projectId": "2561",
  "timestamp": "2026-01-08T10:30:00.000Z"
}
```

---

### 6. 文件大小驗證
**檢查點**：文件下載完成後
```javascript
if (downloadBuffer.length < 1024) {
  throw new Error(`下載失敗: 文件大小只有 ${downloadBuffer.length} bytes`);
}
```
**HTTP 狀態碼**：500 Internal Server Error

**說明**：如果下載的檔案小於 1KB，通常表示下載失敗或檔案為空

---

### 7. 錯誤截圖
**功能**：當任何錯誤發生時，自動保存頁面截圖
```javascript
const errorScreenshotPath = path.resolve(__dirname, `error_${projectName}_${Date.now()}.png`);
await this.page.screenshot({ path: errorScreenshotPath, fullPage: true });
console.error(`📸 錯誤截圖已保存至: ${errorScreenshotPath}`);
```

**位置**：`rest-to-soap-proxy/src/clients/error_*.png`

---

## 📊 HTTP 狀態碼總覽

| 狀態碼 | 錯誤類型 | 觸發條件 |
|--------|---------|---------|
| 400 | Bad Request | 無效的參數（如 state 參數錯誤） |
| 401 | Unauthorized | Session 過期、未登入 |
| 403 | Forbidden | 沒有權限訪問專案 |
| 404 | Not Found | 專案不存在、找不到導出按鈕 |
| 408 | Request Timeout | 下載超時（30秒） |
| 500 | Internal Server Error | 文件大小異常、其他未預期錯誤 |

---

## 🧪 測試錯誤情境

### 測試 1: 不存在的專案 ID
```bash
curl -X GET "http://localhost:5100/api/https/download/99999?name=Invalid" -v
```

**預期結果**：
- HTTP 404
- 錯誤訊息：專案不存在或找不到導出按鈕

---

### 測試 2: 無效的 state 參數
```bash
curl -X GET "http://localhost:5100/api/https/download/2561?state=invalid" -v
```

**預期結果**：
```json
{
  "success": false,
  "error": "無效的 state 參數",
  "message": "state 必須是: open, closed, all"
}
```

---

### 測試 3: 無效的專案代號
```bash
curl -X GET "http://localhost:5100/api/https/download-by-name/INVALID" -v
```

**預期結果**：
```json
{
  "success": false,
  "error": "專案不存在",
  "message": "找不到專案: INVALID",
  "availableProjects": ["TV", "PD", "MNT", "AVA"]
}
```

---

## 🔍 除錯方法

### 1. 查看日誌
所有錯誤都會記錄在 console 中：
```bash
docker logs rest-to-soap-proxy -f
```

### 2. 查看錯誤截圖
當發生錯誤時，檢查截圖檔案：
```bash
ls rest-to-soap-proxy/src/clients/error_*.png
```

### 3. 測試連線
使用測試端點確認服務狀態：
```bash
curl http://localhost:5100/api/https/test-connection
```

---

## 💡 常見錯誤及解決方案

### 錯誤：Session 已過期
**原因**：登入 session 過期或被清除  
**解決**：重新啟動服務或等待自動重新登入

### 錯誤：下載超時
**可能原因**：
1. 專案沒有任何 issues（空資料）
2. 網路連線問題
3. URTracker 系統回應慢

**解決**：
1. 確認專案是否有資料
2. 檢查網路連線
3. 重試請求

### 錯誤：找不到導出按鈕
**可能原因**：
1. 專案 ID 不正確
2. 沒有權限訪問該專案
3. 頁面結構變更

**解決**：
1. 確認專案 ID 是否正確
2. 檢查使用者權限
3. 查看錯誤截圖確認頁面狀態

---

## 🚀 最佳實踐

1. **總是檢查 HTTP 狀態碼**：根據狀態碼判斷錯誤類型
2. **查看錯誤訊息**：錯誤訊息會提供具體的失敗原因
3. **使用錯誤截圖**：視覺化除錯，快速定位問題
4. **設置適當的超時時間**：避免長時間等待
5. **記錄所有錯誤**：便於後續分析和改進
