目前進度：Item 1 已完成，正在進行 Item 2（多語系 UI 切換）。



# 功能開發 Roadmap（細分步驟）

### 1. 📌 引用來源顯示（metadata.retrievals 前端解析） ✅ done
**目標**：在前端解析 API 回傳的 `metadata.retrievals`，並將引用來源顯示給用戶。
- 確認 API 回傳的資料格式（含 `metadata.retrievals`）。
- 在前端（如 React component）解析這個欄位，將來源以列表或標註方式顯示。

### 2. 👍👎 評分系統（直接串接 Dify 內建 API） ✅ done
**目標**：用戶可對每個回答進行正/負評分。
- 在回答區塊下方加入 👍👎 按鈕。
- 點擊「👍」時直接呼叫 Dify API，無需填寫內容。
- 點擊「👎」時，彈出輸入框，**必須**填寫 feedback content 才能送出。
- 送出時呼叫 Dify 內建 `/messages/{message_id}/feedbacks` API，不需自建 SQLite。

### 3. 建立 `/api/feedback.ts`，儲存至 SQLite（已不需，Dify 內建） ✅ done
> 本步驟可省略，直接用 Dify 內建 API。

### 4. 🛠 工程師補答 ✅ done
**目標**：工程師可針對用戶問題補充回答。
- 由 Dify 後台標註（Annotation）功能進行補充或修正。
- 前端僅需顯示 Dify API 回傳的標註內容（如官方補充/工程師補答），不需自行設計表單或 API。

### 5. 建立 `/api/override.ts` + 前端表單與 queue ✅ done
**目標**：工程師補答內容可透過 `/api/override.ts` API 儲存，並有 queue 管理。
- 已由 Dify 標註（Annotation）功能取代，無需前端實作。
- 前端僅需顯示標註內容。

### 6. 🔄 Notion 自動同步（可選）
**目標**：定時從 Notion API 抓 chunk，傳入 Dify Dataset。
- 寫一個定時任務（cron job），呼叫 Notion API。
- 解析 chunk，呼叫 Dify Dataset API 匯入資料。

### 7. 📊 管理後台（中長期）
**目標**：建立統計分析、錯誤率報告、標註 FAQ。
- 建立管理後台頁面，顯示評分統計、錯誤率、FAQ 標註功能。
- 可用 Next.js + Ant Design/Material UI 等實作。
