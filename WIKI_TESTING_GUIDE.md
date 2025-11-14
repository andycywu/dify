# 📋 Wiki.js 聊天機器人測試指南

## ✅ 當前狀態檢查

### 服務運行狀態
```
✅ dify-wiki (Wiki.js) - 運行中，Port: 3002
✅ docker-dify-next-frontend-1 - 運行中，Port: 3001  
✅ docker-db-1 (PostgreSQL) - 運行中，健康
```

### 檔案掛載狀態
```
✅ chatbot-widget.js - 已透過 bind mount 掛載到容器
   本地路徑: /Users/andycyw/dify/wiki/assets/js/chatbot-widget.js
   容器路徑: /wiki/assets/js/chatbot-widget.js
   
✅ config 目錄 - 已掛載
   本地路徑: /Users/andycyw/dify/wiki/config
   容器路徑: /wiki/config
```

## 🎯 **重要：需要在 Wiki.js 管理界面完成配置**

### 步驟 1：登入 Wiki.js 管理界面

1. 開啟瀏覽器訪問：`http://localhost:3002`
2. 點擊右上角「登入」
3. 使用管理員帳號登入（需要先確認管理員帳號）

### 步驟 2：進入 Theme 設定

1. 點擊右上角的 **「Administration」**（管理）按鈕
2. 左側選單選擇 **「Theme」**（主題）
3. 找到 **「Custom Head HTML」**或**「Code Injection」**區域

### 步驟 3：添加聊天機器人載入腳本

在 **Custom Head HTML** 或 **Code Injection > Head** 區域添加以下代碼：

```html
<!-- 載入 Dify 聊天機器人 Widget -->
<script src="/assets/js/chatbot-widget.js"></script>

<style>
/* 確保聊天機器人在最上層 */
#dify-chatbot-widget {
    z-index: 99999 !important;
}
</style>
```

### 步驟 4：保存設定

1. 點擊頁面底部的 **「Save」**或**「儲存」**按鈕
2. 重新載入 Wiki.js 頁面

---

## 🧪 **測試步驟**

### 測試 1：檢查聊天機器人是否顯示

1. **開啟瀏覽器開發者工具**（F12 或 Cmd+Option+I）
2. **訪問 Wiki.js 首頁**：`http://localhost:3002`
3. **檢查右下角是否出現聊天圖標**（💬）

**預期結果**：
- ✅ 右下角顯示藍色圓形聊天圖標
- ✅ Console 顯示：`✅ Dify AI 聊天機器人已成功加載！`
- ✅ Console 顯示：`💬 點擊右下角的聊天圖標開始對話（可拖拽移動）`

**如果沒有顯示**：
- 檢查 Console 是否有 JavaScript 錯誤
- 確認 Custom Head HTML 是否正確保存
- 按 Ctrl+Shift+R (或 Cmd+Shift+R) 強制重新載入頁面

### 測試 2：檢查用戶數據獲取

1. **在 Console 中觀察日誌**
2. **應該看到以下訊息**：

```
🔍 正在獲取用戶數據和可用知識庫...
📦 API 返回數據: {datasets: Array, user_groups: Array}
✅ 可用知識庫: ['EE', 'Guests']  // 根據登入用戶的組別
👤 用戶所屬組別: ['EE', 'Guests']
🎯 自動選擇知識庫: EE
```

**手動測試 API**：
在 Console 中執行：
```javascript
fetch('/api/dify/datasets', {credentials: 'same-origin'})
  .then(r => r.json())
  .then(data => console.log('✅ API 測試結果:', data))
  .catch(err => console.error('❌ API 測試失敗:', err))
```

**預期返回**：
```json
{
  "datasets": [
    {
      "id": "EE",
      "name": "電機工程部門知識庫",
      "description": "電機工程相關技術文檔和規範",
      "available": true
    },
    {
      "id": "Guests",
      "name": "訪客知識庫",
      "description": "公開資訊和常見問題",
      "available": true
    }
  ],
  "user_groups": ["EE", "Guests"]
}
```

**如果返回 401 Unauthorized**：
- 用戶未登入，請先登入 Wiki.js

**如果返回 404 Not Found**：
- `dify-integration.js` 未正確載入
- 需要檢查 Wiki.js 的模組載入機制

### 測試 3：測試知識庫下拉選單

1. **點擊聊天圖標開啟聊天視窗**
2. **檢查頂部的知識庫下拉選單**

**預期結果**：
- ✅ Console 顯示：`💬 聊天機器人已開啟`
- ✅ Console 顯示：`🔄 更新知識庫選單，可用數據集: ...`
- ✅ Console 顯示：`✅ 已選擇知識庫: 電機工程部門知識庫`
- ✅ 下拉選單顯示多個知識庫選項（根據用戶權限）

**如果只顯示「訪客知識庫」**：
- 用戶可能沒有其他部門的權限
- 或者 API 返回的數據不正確

### 測試 4：發送測試訊息

1. **在輸入框輸入測試訊息**：`測試問題`
2. **點擊「發送」按鈕**
3. **觀察 Console 日誌**

**預期 Console 日誌**：
```
📤 發送訊息: 測試問題
📚 當前選擇的知識庫: EE
👤 用戶組別: ['EE', 'Guests']
🔄 正在呼叫 GraphQL API...
📥 API 響應狀態: 200
📦 API 返回結果: {data: {...}}
✅ 訊息發送成功，使用知識庫: 電機工程部門知識庫
```

**預期聊天視窗**：
- ✅ 用戶訊息顯示在右側（藍色背景）
- ✅ AI 回覆顯示在左側（白色背景）
- ✅ AI 回覆底部顯示來源：`📚 來自 (電機工程部門知識庫)`

**常見錯誤**：

1. **❌ 401 Unauthorized**
   - 用戶未登入或 session 過期
   - 解決：重新登入 Wiki.js

2. **❌ GraphQL Error: Unauthorized**
   - GraphQL resolver 權限檢查失敗
   - 檢查：`WIKI.auth.checkAccess(context.req.user, ['read:pages'])`

3. **❌ Dify API Error: 404**
   - Dify API 不可用或 API Key 未配置
   - 檢查環境變數：`DIFY_EE_API_KEY` 等

4. **❌ 無法訪問此知識庫**
   - 用戶沒有權限訪問所選知識庫
   - 檢查用戶的 Wiki.js 組別配置

---

## 🔍 **進階 Debug**

### 檢查 Dify 整合是否載入

**方法 1：檢查 GraphQL Schema**

在 Console 執行：
```javascript
fetch('/graphql', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  credentials: 'same-origin',
  body: JSON.stringify({
    query: `
      query {
        __schema {
          types {
            name
          }
        }
      }
    `
  })
})
.then(r => r.json())
.then(data => {
  const difyTypes = data.data.__schema.types.filter(t => 
    t.name.includes('Dify')
  );
  console.log('🔍 Dify GraphQL Types:', difyTypes);
})
```

**預期結果**：應該看到 `DifyDataset`、`DifyChatResponse` 等類型

### 檢查用戶的 Wiki.js 組別

在 Console 執行：
```javascript
// 這需要先登入 Wiki.js
fetch('/graphql', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  credentials: 'same-origin',
  body: JSON.stringify({
    query: `
      query {
        authentication {
          isAuthenticated
          user {
            name
            email
            groups {
              name
            }
          }
        }
      }
    `
  })
})
.then(r => r.json())
.then(data => console.log('👤 當前用戶信息:', data))
```

### 測試 GraphQL Mutation

在 Console 執行：
```javascript
fetch('/graphql', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  credentials: 'same-origin',
  body: JSON.stringify({
    query: `
      mutation {
        difyChatWithGroup(message: "測試問題", groupId: "Guests") {
          success
          answer
          error
          selectedGroup
          groupName
          availableGroups
        }
      }
    `
  })
})
.then(r => r.json())
.then(data => console.log('🧪 GraphQL Mutation 測試:', data))
```

---

## 🐛 **常見問題解決**

### 問題 1：dify-integration.js 未載入

**症狀**：
- `/api/dify/datasets` 返回 404
- GraphQL schema 中沒有 Dify 相關類型

**原因**：
Wiki.js 2.x 版本沒有內建的自定義模組載入機制

**解決方案**：
需要通過 Wiki.js 的插件系統或修改 Wiki.js 原始碼來載入自定義模組。

**暫時解決方案**：
1. 使用 Wiki.js 的 Custom Head HTML 載入前端聊天 widget
2. 後端 API 透過 Express middleware 添加（需要修改 Wiki.js 原始碼）

### 問題 2：環境變數未設定

**檢查環境變數**：
```bash
docker exec dify-wiki env | grep DIFY
```

**應該看到**：
```
DIFY_API_URL=http://api:5001
DIFY_EE_API_KEY=app-xxx...
DIFY_ME_LCM_API_KEY=app-xxx...
DIFY_PWR_API_KEY=app-xxx...
DIFY_SW_API_KEY=app-xxx...
DIFY_PJM_API_KEY=app-xxx...
DIFY_GUESTS_API_KEY=app-xxx...
DIFY_ADMINISTRATORS_API_KEY=app-xxx...
```

**如果缺少**：
在 `/Users/andycyw/dify/docker/.env.dify` 或 `.env` 中添加這些環境變數

---

## 📊 **測試清單**

使用不同部門用戶測試：

### EE 部門用戶
- [ ] 登入 Wiki.js
- [ ] 開啟聊天機器人
- [ ] 下拉選單顯示：EE 知識庫、訪客知識庫
- [ ] 預設選擇：EE 知識庫
- [ ] 發送訊息，收到 EE 知識庫的回覆

### ME_LCM 部門用戶
- [ ] 登入 Wiki.js
- [ ] 開啟聊天機器人
- [ ] 下拉選單顯示：ME_LCM 知識庫、訪客知識庫
- [ ] 預設選擇：ME_LCM 知識庫
- [ ] 發送訊息，收到 ME_LCM 知識庫的回覆

### 訪客用戶（未登入）
- [ ] 訪問 Wiki.js（不登入）
- [ ] 開啟聊天機器人
- [ ] 下拉選單只顯示：訪客知識庫
- [ ] 發送訊息，收到訪客知識庫的回覆

---

## 🚀 **下一步行動**

1. **立即執行**：
   - [ ] 登入 Wiki.js 管理界面
   - [ ] 在 Theme > Custom Head HTML 添加聊天機器人載入腳本
   - [ ] 保存並刷新頁面
   - [ ] 檢查聊天圖標是否顯示

2. **如果聊天機器人顯示成功**：
   - [ ] 測試 `/api/dify/datasets` API
   - [ ] 測試知識庫下拉選單
   - [ ] 發送測試訊息

3. **如果 API 返回 404**：
   - [ ] 需要實施後端 API 整合方案
   - [ ] 選項 A：修改 Wiki.js Docker 鏡像
   - [ ] 選項 B：創建反向代理處理 API 請求

---

## 📞 **需要協助時**

請提供以下資訊：
1. Console 的完整日誌（包括錯誤）
2. `/api/dify/datasets` API 的響應
3. 當前登入用戶的組別
4. Wiki.js 的環境變數設定（隱藏敏感信息）
