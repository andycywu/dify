# Wiki.js AI 聊天機器人集成指南

## 🎯 功能概述

本指南將幫您在 Wiki.js 中集成 Dify AI 聊天機器人，為您的知識庫添加智能問答功能。

## ✅ 當前狀態

- ✅ Wiki.js 服務運行正常 (http://localhost:3002)
- ✅ Dify API 服務運行正常 (http://localhost:5001)
- ✅ 聊天機器人腳本已創建
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
6. 點擊圖標開始與 AI 助手對話

### 方法 2：通過 Wiki.js 管理界面（永久集成）

1. 訪問 Wiki.js 管理界面：http://localhost:3002/admin
2. 登入管理員帳戶
3. 導航到：**設置 → 主題 → 代碼注入**
4. 在 "頁腳代碼" 區域添加：
```html
<script src="/js/chatbot-widget.js"></script>
```
5. 保存設置

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

### 聊天機器人不顯示
1. 檢查瀏覽器控制台是否有錯誤
2. 確認腳本路徑是否正確
3. 檢查 Wiki.js 代碼注入設置

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
curl http://localhost:3002/js/chatbot-widget.js
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
