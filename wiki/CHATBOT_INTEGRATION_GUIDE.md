# Wiki.js AI 聊天機器人集成指南

## 🎯 功能概述

本指南將幫您在 Wiki.js 中集成 Dify AI 聊天機器人，為您的知識庫添加智能問答功能。

## ✅ 當前狀態

- ✅ Wiki.js 服務運行正常 (http://localhost:3002)
- ✅ Dify API 服務運行正常 (http://localhost:5001)
- ✅ 聊天機器人腳本已創建並可訪問 (/_assets/js/chatbot-widget.js)
- ✅ 靜態資源路徑已正確配置
- ✅ Docker 單文件掛載配置已修復
- ⏳ 等待管理員配置和激活

## 🚀 快速演示聊天機器人

### 方法 1：瀏覽器控制台注入（臨時演示）

1. 打開 Wiki.js 網站：http://localhost:3002
2. 按 F12 打開開發者工具
3. 切換到 "Console" 控制台標籤
4. 複製以下代碼並貼到控制台中，然後按 Enter：

```javascript
// 複製 /Users/andycyw/dify/wiki/console-chatbot-loader.js 中的所有代碼
```

5. 您將看到右下角出現聊天機器人圖標 💬
6. **新功能**：您可以拖拽圖標來調整垂直位置
7. 點擊圖標開始與 AI 助手對話

### 方法 2：通過 Wiki.js 管理界面（永久集成）

1. 訪問 Wiki.js 管理界面：http://localhost:3002/admin
2. 登入管理員帳戶（預設帳戶：admin@example.com / admin123）
3. 導航到：**設置 → 主題 → 代碼注入**
4. 在 "頁腳代碼" 區域添加：
```html
<script src="/_assets/js/chatbot-widget.js"></script>
```
5. 保存設置
6. 刷新任何 Wiki.js 頁面，您將看到右下角的聊天機器人圖標

**注意**：確保使用正確的路徑 `/_assets/js/chatbot-widget.js`，而不是 `/js/chatbot-widget.js`。

## 🔧 Dify API Key 配置

要啟用完整的 AI 功能，需要配置 Dify API Key：

### 1. 獲取 API Key
- 訪問 Dify 控制台：http://localhost:80
- 登入後進入 **API 管理**
- 創建新的 API Key
- 複製生成的 Key

### 2. 配置環境變量
在 `.env` 文件中設置：
```bash
DIFY_API_KEY=your-actual-api-key-here
```

### 3. 重啟服務
```bash
docker-compose restart wiki
```

## 💬 聊天機器人功能

### 基本功能
- 💬 智能問答對話
- 📖 基於 Wiki 內容的上下文理解
- 🔍 頁面內容分析
- 📱 響應式設計，支持移動設備

### 高級功能（需要 API Key）
- 🤖 真實的 AI 回應
- 📚 知識庫檢索
- 🧠 上下文記憶
- 📄 文件上傳支持

## 🎯 功能特點

- ✅ **智能定位**：固定在右下角，不會影響頁面佈局
- ✅ **拖拽移動**：用戶可以自由調整垂直位置，智能區分點擊和拖拽
- ✅ **響應式設計**：適配桌面和移動設備
- ✅ **DOM 安全**：等待頁面完全加載後才初始化
- ✅ **演示模式**：無需 API Key 即可體驗基本功能
- ✅ **美觀界面**：現代化的 Material Design 風格
- ✅ **事件優化**：解決了拖拽和點擊事件的衝突問題

## 🎨 自定義配置

可以在腳本中修改以下配置：

```javascript
const CONFIG = {
    PRIMARY_COLOR: '#1976d2',        // 主題色
    CHAT_TITLE: 'AI 助手',           // 聊天機器人標題
    WIDGET_POSITION: 'bottom-right'  // 位置
};
```

## 📁 文件結構

```
wiki/
├── config/
│   ├── dify-integration.js      # Dify API 集成模塊
│   ├── chatbot-widget.js        # 聊天機器人前端腳本
│   └── console-chatbot-loader.js # 控制台加載器
├── themes/
│   └── dify-integration/        # 自定義主題
│       ├── definition.yml
│       └── components/
│           └── DifyChatbot.vue
├── chatbot-demo.html           # 聊天機器人演示頁面
└── CHATBOT_INTEGRATION_GUIDE.md # 本指南
```

## 🔍 故障排除

### 聊天機器人腳本無法訪問 (404 錯誤)
1. 檢查 Docker 掛載配置是否包含單文件掛載：`../wiki/assets/js/chatbot-widget.js:/wiki/assets/js/chatbot-widget.js`
2. 重啟 wiki 容器：`docker compose up -d --force-recreate wiki`
3. 確認腳本路徑：`/_assets/js/chatbot-widget.js`

### Wiki.js 頁面樣式丟失
1. 確保沒有掛載整個 `/wiki/assets` 目錄，只掛載單個文件
2. 如果意外掛載了整個目錄，請移除該掛載配置
3. 重啟容器讓原始 assets 文件恢復

### 腳本加載後又消失
1. 這通常是因為容器重啟後掛載的文件丟失
2. 確保 Docker Compose 配置正確掛載了單個腳本文件
3. 檢查宿主機上的文件是否存在：`/Users/andycyw/dify/wiki/assets/js/chatbot-widget.js`

### JavaScript 錯誤：document.body is null
1. 這是因為腳本在 DOM 準備就緒前執行
2. 聊天機器人腳本已實現 DOM 準備檢查
3. 如果使用控制台注入，請確保頁面已完全加載
4. 對於 Wiki.js 集成，腳本會自動等待 DOM 準備就緒

### 聊天機器人按鈕無法使用
1. **檢查腳本是否加載**：在瀏覽器控制台中運行 `document.querySelector('#dify-chatbot-widget')` 檢查元素是否存在
2. **檢查腳本路徑**：確保使用正確的路徑 `/_assets/js/chatbot-widget.js`
3. **檢查 Wiki.js 集成**：確認在管理界面中正確添加了腳本標籤
4. **檢查 JavaScript 錯誤**：打開瀏覽器開發者工具的 Console 標籤查看錯誤
5. **修復**：如果使用控制台注入，請確保頁面已完全加載；如果使用 Wiki.js 集成，請檢查代碼注入設置

### 無法拖拽聊天機器人
1. **檢查事件綁定**：確保腳本正確加載並綁定了事件監聽器
2. **檢查拖拽邏輯**：實現了傳統拖拽行為，按下滑鼠按鍵開始拖拽，放開按鍵結束拖拽
3. **測試拖拽**：按住滑鼠按鍵拖拽圖標來調整位置，放開按鍵結束拖拽
4. **修復**：已實現標準拖拽行為，不會出現黏住或狀態錯亂問題

### AI 回應不工作
1. 檢查 Dify API Key 是否配置正確
2. 確認 Dify 服務是否運行正常
3. 查看網絡連接和 CORS 設置

### 移動設備顯示問題
1. 聊天機器人已適配移動設備
2. 確保視窗寬度檢測正常
3. 檢查響應式 CSS 規則

## 📊 測試命令

```bash
# 檢查服務狀態
docker-compose ps

# 查看 Wiki.js 日誌
docker logs dify-wiki

# 測試 Dify API 連接
curl -H "Authorization: Bearer your-api-key" \
     http://localhost:5001/v1/parameters

# 測試聊天機器人腳本訪問
curl http://localhost:3002/_assets/js/chatbot-widget.js
```

## 🎯 下一步

1. **配置 API Key**：設置真實的 Dify API Key
2. **自定義樣式**：調整聊天機器人外觀
3. **擴展功能**：添加文件上傳、多語言支持
4. **性能優化**：實現對話緩存和負載均衡

## 📞 支持

如果您在集成過程中遇到問題，可以：

1. 檢查本指南的故障排除部分
2. 查看服務日誌獲取詳細錯誤信息
3. 確認所有依賴服務正常運行

---

**集成完成後，您的 Wiki.js 將具備強大的 AI 問答能力，為用戶提供更好的知識獲取體驗！** 🚀
