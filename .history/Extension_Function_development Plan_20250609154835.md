# Extension Function Development Plan

## 1. 歷史對話紀錄不誤觸發建議問題 API（已完成）
- 確保載入歷史訊息時不會呼叫 suggestion API。
- 僅在用戶主動發送訊息後才呼叫 suggestion API。
- 加入 fromHistory 標記與 useEffect 條件防呆。

## 2. 支援多語系 UI 切換（進行中）
- 目標：讓使用者可於 UI 介面自由切換語言（如繁中、簡中、英文等）。
- 任務：
  - 整理現有 i18n 架構與語系檔案。
  - 設計語言切換元件（下拉選單或按鈕）。
  - 將主要 UI 元素與訊息接入 i18n。
  - 測試語言切換流程與 fallback 行為。

## 3. 支援訊息附件上傳與預覽
- 允許用戶在對話中上傳檔案（如圖片、PDF）。
- 前端顯示附件縮圖或下載連結。
- 後端 API 串接與權限驗證。

## 4. 對話訊息標籤與分類
- 允許用戶為訊息加上自訂標籤。
- 支援訊息分類、搜尋與過濾。

## 5. 進階訊息搜尋功能
- 關鍵字全文檢索。
- 支援依標籤、日期、角色等條件篩選。

## 6. 對話紀錄匯出/匯入
- 支援將對話紀錄匯出為 JSON/CSV/PDF。
- 支援匯入外部對話紀錄。

## 7. 聊天機器人個人化設定
- 允許用戶自訂歡迎詞、主題色、頭像等。
- 支援多組個人化設定儲存與切換。

---

> 目前進度：Item 1 已完成，正在進行 Item 2（多語系 UI 切換）。

---

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
