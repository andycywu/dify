# Wiki.js 聊天機器人設置與測試指南

## 📋 概述

本指南協助您完成 Wiki.js 聊天機器人的完整設置和測試，包括：
1. ✅ 修正 Custom Head HTML 路徑
2. ✅ 配置部門 API 金鑰
3. ✅ 測試聊天機器人功能
4. ✅ 驗證部門切換功能

---

## 🔧 第一步：修正 Custom Head HTML

### 問題
之前您使用了錯誤的路徑 `/assets/js/chatbot-widget.js`（缺少底線），導致 500 錯誤和 MIME type 錯誤。

### ✅ 正確的配置

1. **登入 Wiki.js 管理界面**
   - 訪問: http://localhost:3002
   - 點擊右上角 **頭像** → **Administration**

2. **進入主題設定**
   - 左側選單: **Theme** → **Code Injection**

3. **在 "Head HTML Injection" 區域使用以下代碼**：

```html
<!-- 載入 Dify 聊天機器人 Widget -->
<script src="/_assets/js/chatbot-widget.js"></script>

<style>
/* 確保聊天機器人在最上層 */
#dify-chatbot-widget {
    z-index: 99999 !important;
}
</style>
```

**⚠️ 重要提醒**：路徑必須是 `/_assets/js/` （有底線），不是 `/assets/js/`！

4. **儲存設定**
   - 點擊頁面底部的 **APPLY** 按鈕

---

## 🔑 第二步：配置部門 API 金鑰

### 在 `.env.local` 中設置真實的 Dify API 金鑰

編輯檔案：`/Users/andycyw/dify/dify-next-frontend/.env.local`

找到以下部分並替換成您的真實 API 金鑰：

```bash
# ============================================
# 部門知識庫 API 密鑰（生產環境必須配置）
# ============================================
DIFY_ADMINISTRATORS_API_KEY=app-your-actual-administrators-api-key
DIFY_GUESTS_API_KEY=app-your-actual-guests-api-key
DIFY_EE_API_KEY=app-your-actual-ee-api-key
DIFY_ME_LCM_API_KEY=app-your-actual-me-lcm-api-key
DIFY_PWR_API_KEY=app-your-actual-pwr-api-key
DIFY_SW_API_KEY=app-your-actual-sw-api-key
DIFY_PJM_API_KEY=app-your-actual-pjm-api-key
```

### 如何獲取 Dify API 金鑰

1. 登入 Dify 管理介面 (http://localhost/apps)
2. 為每個部門創建一個應用 (或使用現有的)
3. 在應用設定中找到 **API Access** → **API Key**
4. 複製金鑰並粘貼到 `.env.local` 中對應的變數

### 重啟服務以應用新配置

```bash
docker restart docker-dify-next-frontend-1
```

---

## 🧪 第三步：測試聊天機器人

### 1. 檢查聊天機器人是否載入

1. **訪問 Wiki.js 首頁**: http://localhost:3002
2. **打開瀏覽器開發者工具**:
   - Chrome/Edge: `F12` 或 `Cmd+Option+I` (Mac)
   - Firefox: `F12` 或 `Cmd+Option+K` (Mac)
3. **查看 Console 標籤**，應該看到以下訊息：

```
🚀 Dify 聊天機器人初始化中...
🔍 正在獲取用戶數據和可用知識庫...
📡 API 端點: http://localhost:3001/api/wiki-proxy/datasets
📦 API 返回數據: {...}
✅ 可用知識庫: [...]
👤 用戶所屬組別: [...]
🎯 自動選擇知識庫: ...
✅ 聊天機器人初始化完成
```

4. **檢查右下角是否出現藍色聊天圖示** 💬

### 2. 測試未登入用戶（訪客模式）

1. **確保已登出** Wiki.js
2. **重新整理頁面**
3. **點擊聊天圖示**
4. **觀察 Console 訊息**：
   - 應該看到 `👤 用戶所屬組別: ["Guests"]`
   - 知識庫選擇器應該只顯示 "訪客知識庫"
5. **發送測試訊息**: "你好，請問你能幫我什麼？"
6. **驗證響應**：
   - 訊息下方應顯示 `📚 來自 訪客知識庫`

### 3. 測試已登入用戶（多部門）

1. **登入 Wiki.js** (使用管理員帳號)
2. **重新整理頁面**
3. **打開聊天機器人**
4. **觀察 Console 訊息**：
   - 應該看到 `👤 用戶所屬組別: ["administrators", ...]`
   - 知識庫選擇器應該顯示多個選項
5. **測試切換知識庫**：
   - 點擊知識庫下拉選單
   - 選擇不同的部門知識庫
   - 發送訊息確認回應來源
6. **發送測試訊息**: "這個系統如何使用？"
7. **驗證響應**：
   - 訊息下方應顯示當前知識庫名稱

### 4. 測試部門權限隔離

#### 創建測試用戶

1. **登入 Wiki.js 管理界面** (使用管理員帳號)
2. **導航到**: Administration → Users → **+ NEW USER**
3. **創建 EE 部門測試用戶**：
   - Email: `ee_test@example.com`
   - Name: `EE Test User`
   - Provider: Local
   - Password: 設置測試密碼
   - Group: 選擇 **EE** 組別

4. **登出管理員帳號**
5. **使用 EE 測試用戶登入**
6. **打開聊天機器人，檢查**：
   - Console 顯示: `👤 用戶所屬組別: ["EE", "Guests"]`
   - 知識庫選擇器只顯示 **EE 部門知識庫** 和 **訪客知識庫**
   - 不應該看到其他部門（如 SW、PWR）的知識庫

7. **重複測試其他部門**（可選）：
   - 創建 SW 部門用戶，驗證只能訪問 SW 和 Guests 知識庫
   - 創建 PWR 部門用戶，驗證只能訪問 PWR 和 Guests 知識庫

---

## 🔍 第四步：除錯檢查點

### API 端點檢查

#### 1. 測試 Datasets API

```bash
curl -I http://localhost:3001/api/wiki-proxy/datasets
```

**預期結果**: `HTTP/1.1 200 OK` 或 `HTTP/1.1 401 Unauthorized`（未登入）

#### 2. 測試 Chat API

```bash
curl -X POST http://localhost:3001/api/wiki-proxy/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"測試訊息","group_id":"Guests"}'
```

**預期結果**: 應返回 JSON 響應，包含 `success` 和 `answer` 欄位

### Console 錯誤檢查

如果遇到錯誤，請檢查以下 Console 訊息：

| 錯誤訊息 | 可能原因 | 解決方法 |
|---------|---------|---------|
| `Failed to load resource: 500` | 路徑錯誤 | 確認使用 `/_assets/js/` 路徑 |
| `MIME type ('text/plain') is not executable` | 檔案未正確載入 | 檢查檔案 bind mount |
| `404 (Not Found)` on datasets API | API 未啟動 | 確認 `docker-dify-next-frontend-1` 已重啟 |
| `401 Unauthorized` | Session 問題 | 嘗試重新登入 Wiki.js |
| `Dify API error` | API 金鑰錯誤 | 檢查 `.env.local` 中的 API 金鑰 |
| `CORS error` | 跨域問題 | 檢查 `next.config.js` 的 CORS 設定 |

### Docker 容器檢查

```bash
# 檢查容器狀態
docker ps --filter "name=dify"

# 查看 dify-next-frontend 日誌
docker logs docker-dify-next-frontend-1 --tail 50

# 查看 Wiki.js 日誌
docker logs dify-wiki --tail 50
```

---

## 📊 測試結果驗證

完成測試後，您應該能夠確認以下功能：

### ✅ 基本功能
- [ ] 聊天機器人圖示出現在右下角
- [ ] 點擊圖示可以打開/關閉聊天窗口
- [ ] Console 顯示詳細的初始化日誌
- [ ] 可以發送訊息並收到回覆

### ✅ 部門權限管理
- [ ] 未登入用戶只能訪問 "訪客知識庫"
- [ ] 管理員可以看到所有知識庫
- [ ] EE 部門用戶只能看到 EE 和 Guests 知識庫
- [ ] 知識庫選擇器正確顯示可用選項

### ✅ 對話功能
- [ ] 可以切換不同的知識庫
- [ ] 回覆訊息顯示來源知識庫
- [ ] 每個知識庫的對話歷史獨立保存
- [ ] 錯誤訊息有明確的提示

---

## 🆘 常見問題

### Q1: 聊天機器人圖示沒有出現？
**檢查**:
1. Custom Head HTML 是否使用正確路徑 `/_assets/js/`
2. 瀏覽器 Console 是否有錯誤訊息
3. 嘗試清除瀏覽器快取並重新整理 (`Cmd+Shift+R` / `Ctrl+Shift+R`)

### Q2: API 返回 404 錯誤？
**檢查**:
1. `docker-dify-next-frontend-1` 容器是否正在運行
2. 檔案 `/dify-next-frontend/pages/api/wiki-proxy/datasets.ts` 是否存在
3. 重啟容器: `docker restart docker-dify-next-frontend-1`

### Q3: 訊息發送後沒有回覆？
**檢查**:
1. `.env.local` 中的 Dify API 金鑰是否正確
2. Console 中的錯誤訊息
3. Dify API 服務是否正常運行 (http://localhost/apps)

### Q4: 無法切換知識庫？
**檢查**:
1. 用戶是否屬於多個組別
2. Console 中 `👤 用戶所屬組別` 是否正確
3. 知識庫選擇器是否正確渲染

---

## 📝 下一步

完成測試後，您可以：

1. **生產環境部署**：
   - 替換所有 `.env.local` 中的 DUMMY 密鑰
   - 配置 HTTPS 和域名
   - 設置備份策略

2. **自定義聊天機器人**：
   - 修改 `chatbot-widget.js` 中的顏色和標題
   - 調整對話框大小和位置
   - 添加更多互動功能

3. **監控和優化**：
   - 設置日誌收集
   - 監控 API 響應時間
   - 優化知識庫內容

---

## 📞 支援

如果遇到問題，請提供以下資訊：

1. **瀏覽器 Console 的完整錯誤訊息**
2. **Docker 日誌** (`docker logs docker-dify-next-frontend-1`)
3. **測試時的步驟和預期結果**
4. **您當前的用戶組別和權限設定**

---

**最後更新**: 2025-01-01
**版本**: 2.0
**狀態**: ✅ 已完成整合 dify-next-frontend 代理 API
