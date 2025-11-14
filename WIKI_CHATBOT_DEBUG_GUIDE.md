# Wiki.js Chatbot Debug 指南

## 📋 問題描述

Wiki.js 的聊天機器人 widget 無法根據登入用戶的部門自動切換不同的 Dify APP。

## 🔍 已完成的修改

### 1. **chatbot-widget.js 增強日誌**

已為 `/Users/andycyw/dify/wiki/assets/js/chatbot-widget.js` 添加詳細的 console.log，可以追蹤：

- ✅ 用戶數據獲取過程
- ✅ 可用知識庫列表
- ✅ 用戶所屬組別
- ✅ 自動選擇的知識庫
- ✅ 每次訊息發送時的狀態
- ✅ API 請求和響應

### 2. **添加 toggleChatbot 函數**

修復了缺少的 `toggleChatbot` 函數，現在聊天機器人可以正常開啟和關閉。

### 3. **改進 updateGroupSelector 函數**

- 添加錯誤處理
- 按優先順序排序知識庫選項
- 標記不可用的知識庫
- 詳細的日誌輸出

## 🧪 測試步驟

### 步驟 1：啟動 Wiki.js 服務

```bash
cd /Users/andycyw/dify
# 使用 Docker Compose 或 Tilt 啟動服務
docker-compose up -d wiki
# 或
tilt up
```

### 步驟 2：複製更新的 chatbot-widget.js 到 Wiki.js 容器

```bash
# 找到 Wiki.js 容器名稱
docker ps | grep wiki

# 複製檔案（假設容器名為 docker-wiki-1）
docker cp /Users/andycyw/dify/wiki/assets/js/chatbot-widget.js docker-wiki-1:/wiki/assets/js/chatbot-widget.js

# 重啟 Wiki.js
docker restart docker-wiki-1
```

### 步驟 3：在瀏覽器中測試

1. **開啟瀏覽器開發者工具**（F12 或 Cmd+Option+I）
2. **訪問 Wiki.js**：`http://localhost:3002`
3. **以不同部門的用戶登入**（例如：EE, ME_LCM, PWR, SW, PJM）

### 步驟 4：檢查 Console 日誌

在開發者工具的 Console 標籤中，你應該看到類似以下的日誌：

```
✅ Dify AI 聊天機器人已成功加載！
💬 點擊右下角的聊天圖標開始對話（可拖拽移動）
🔍 正在獲取用戶數據和可用知識庫...
📦 API 返回數據: {datasets: Array(3), user_groups: Array(2)}
✅ 可用知識庫: ['EE', 'Guests', 'SW']
👤 用戶所屬組別: ['EE', 'Guests']
🎯 自動選擇知識庫: EE
🔄 更新知識庫選單，可用數據集: ['EE', 'Guests', 'SW']
✅ 已選擇知識庫: 電機工程部門知識庫
✅ 知識庫選單更新完成，共 3 個選項
```

### 步驟 5：測試聊天功能

1. **點擊右下角的聊天圖標**
2. **檢查下拉選單是否顯示正確的知識庫**
3. **發送一條測試訊息**
4. **觀察 Console 中的日誌**：

```
💬 聊天機器人已開啟
📤 發送訊息: 測試問題
📚 當前選擇的知識庫: EE
👤 用戶組別: ['EE', 'Guests']
🔄 正在呼叫 GraphQL API...
📥 API 響應狀態: 200
📦 API 返回結果: {data: {...}}
✅ 訊息發送成功，使用知識庫: 電機工程部門知識庫
```

## 🐛 常見問題 Debug

### 問題 1：聊天機器人沒有顯示

**檢查項目**：
1. 確認 `chatbot-widget.js` 是否正確加載
2. 檢查 Console 是否有 JavaScript 錯誤
3. 確認 Wiki.js 的自定義頭部設定中是否添加了加載腳本

**解決方案**：
在 Wiki.js 管理界面 → Theme → Custom Header 中添加：

```html
<script src="/assets/js/chatbot-widget.js"></script>
```

### 問題 2：知識庫下拉選單為空或只顯示「訪客知識庫」

**檢查項目**：
1. 檢查 Console 中 `📦 API 返回數據` 的內容
2. 確認 `/api/dify/datasets` API 是否正常返回數據
3. 檢查用戶是否已登入

**測試 API**：
```bash
# 在已登入的狀態下，在瀏覽器 Console 執行：
fetch('/api/dify/datasets', {credentials: 'same-origin'})
  .then(r => r.json())
  .then(data => console.log('API 數據:', data))
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

### 問題 3：發送訊息後沒有回應

**檢查項目**：
1. 檢查 Console 中 `📥 API 響應狀態`
2. 確認 GraphQL mutation 是否成功
3. 檢查 Dify API 是否正常運行

**測試 GraphQL**：
在瀏覽器 Console 執行：
```javascript
fetch('/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify({
        query: `
            mutation {
                difyChatWithGroup(message: "測試", groupId: "EE") {
                    success
                    answer
                    error
                    selectedGroup
                    groupName
                }
            }
        `
    })
})
.then(r => r.json())
.then(data => console.log('GraphQL 結果:', data))
```

### 問題 4：用戶組別映射不正確

**檢查項目**：
1. 確認 Wiki.js 中的用戶組別名稱
2. 確認 `dify-integration.js` 中的 `groupDatasets` 映射

**Wiki.js 組別名稱檢查**：
```bash
# 在 Wiki.js 管理界面 → Users → Groups 中查看組別名稱
# 確保組別名稱與 dify-integration.js 中的完全匹配
```

**可能的名稱差異**：
- `EE` vs `ee` vs `Ee` (大小寫敏感)
- `ME_LCM` vs `ME-LCM` vs `ME LCM`
- `Guests` vs `guests` vs `Guest`

## 🔧 配置文件位置

### 關鍵文件：
1. **聊天機器人 Widget**：`/Users/andycyw/dify/wiki/assets/js/chatbot-widget.js`
2. **Dify 整合配置**：`/Users/andycyw/dify/wiki/config/dify-integration.js`
3. **環境變數**：檢查 Wiki.js 的環境變數中是否設定了各部門的 Dify API Keys：
   - `DIFY_EE_API_KEY`
   - `DIFY_ME_LCM_API_KEY`
   - `DIFY_PWR_API_KEY`
   - `DIFY_SW_API_KEY`
   - `DIFY_PJM_API_KEY`
   - `DIFY_GUESTS_API_KEY`
   - `DIFY_ADMINISTRATORS_API_KEY`

## 📊 權限檢查

### Wiki.js 權限設定

確保不同部門的用戶只能看到對應的頁面：

1. **進入 Wiki.js 管理界面** → **Groups**
2. **為每個組別設定頁面訪問權限**：
   - 在 "Page Rules" 中添加路徑規則
   - 例如：EE 組只能訪問 `/ee/*` 路徑下的頁面

### 示例配置：

```
Group: EE
Page Rules:
  - Path: /ee/*
    Permissions: read, write
  - Path: /public/*
    Permissions: read
  - Path: /*
    Permissions: deny (默認拒絕其他路徑)

Group: ME_LCM
Page Rules:
  - Path: /me-lcm/*
    Permissions: read, write
  - Path: /public/*
    Permissions: read
  - Path: /*
    Permissions: deny
```

## ✅ 驗證清單

- [ ] Wiki.js 服務正常運行
- [ ] chatbot-widget.js 已更新到最新版本
- [ ] Wiki.js 自定義頭部已添加加載腳本
- [ ] 各部門的 Dify API Keys 已正確配置
- [ ] `/api/dify/datasets` API 返回正確的數據
- [ ] 用戶登入後可以看到對應的知識庫選項
- [ ] 聊天機器人可以正常發送和接收訊息
- [ ] 不同部門用戶的聊天機器人使用不同的知識庫
- [ ] Wiki.js 頁面權限已正確配置
- [ ] 不同部門用戶只能訪問對應的頁面

## 🚀 下一步

1. **啟動 Wiki.js 服務**
2. **複製更新的檔案到容器**
3. **以不同部門用戶測試**
4. **根據 Console 日誌 debug**
5. **調整權限設定**

## 📞 需要協助時提供的資訊

如果遇到問題，請提供：
1. Console 中的完整日誌輸出
2. `/api/dify/datasets` API 的返回數據
3. 用戶所屬的 Wiki.js 組別名稱
4. GraphQL mutation 的錯誤訊息（如果有）
