目前進度：Item 1 已完成，正在進行 Item 2（多語系 UI 切換）。



# 功能開發 Roadmap（細分步驟）

### 1. 📌 引用來源顯示（metadata.retrievals 前端解析）
**目標**：在前端解析 API 回傳的 `metadata.retrievals`，並將引用來源顯示給用戶。
- 確認 API 回傳的資料格式（含 `metadata.retrievals`）。
- 在前端（如 React component）解析這個欄位，將來源以列表或標註方式顯示。

### 2. 👍👎 評分系統
**目標**：用戶可對每個回答進行正/負評分。
- 在回答區塊下方加入 👍👎 按鈕。
- 點擊時呼叫 `/api/feedback.ts`，將評分結果儲存至 SQLite。

### 3. 建立 `/api/feedback.ts`，儲存至 SQLite
**目標**：後端 API 接收評分，寫入 SQLite。
- 新增 `/api/feedback.ts`，接收 POST 請求。
- 使用 Prisma/Drizzle/Knex 等 ORM 操作 SQLite，將評分資料寫入資料庫。

### 4. 🛠 工程師補答
**目標**：工程師可針對用戶問題補充回答。
- 在前端回答區塊下方加入「工程師補答」按鈕。
- 點擊後可輸入補充內容，送出至後端 API 儲存。

### 5. 建立 `/api/override.ts` + 前端表單與 queue
**目標**：工程師補答內容可透過 `/api/override.ts` API 儲存，並有 queue 管理。
- 新增 `/api/override.ts`，接收補答內容並寫入 queue（可用 SQLite）。
- 前端表單提交補答內容。
- queue 可用於後台審核或自動覆蓋原回答。

### 6. 🔄 Notion 自動同步（可選）
**目標**：定時從 Notion API 抓 chunk，傳入 Dify Dataset。
- 寫一個定時任務（cron job），呼叫 Notion API。
- 解析 chunk，呼叫 Dify Dataset API 匯入資料。

### 7. 📊 管理後台（中長期）
**目標**：建立統計分析、錯誤率報告、標註 FAQ。
- 建立管理後台頁面，顯示評分統計、錯誤率、FAQ 標註功能。
- 可用 Next.js + Ant Design/Material UI 等實作。
