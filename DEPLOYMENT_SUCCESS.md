🎉 Wiki.js + Dify 整合部署成功！

## 部署摘要

✅ **成功完成**: Dify + Wiki.js 整合方案已成功部署
✅ **服務狀態**: 所有核心服務都已啟動並運行正常
✅ **訪問測試**: Web 界面可正常訪問

## 可用服務

### 前端界面
- 🔧 **Dify 原始前端**: http://localhost/
- 📚 **Wiki.js 文檔**: http://localhost:3002
- ⚡ **Dify Next前端**: http://localhost:3001 (需單獨啟動)

### 後端 API
- 🚀 **Dify API**: http://localhost:5001 (內部服務)

## 下一步操作

### 1. 設置 Wiki.js (必需)
```bash
# 訪問 Wiki.js 初始化頁面
open http://localhost:3002
```

**數據庫配置信息:**
- 數據庫類型: PostgreSQL
- 主機: `db`
- 端口: `5432` 
- 數據庫: `wiki`
- 用戶名: `postgres`
- 密碼: `difyai123456`

### 2. 配置 Dify API Key (推薦)
```bash
# 1. 登入 Dify 控制台
open http://localhost/

# 2. 前往 API 管理 -> 創建 API Key

# 3. 編輯環境文件
nano docker/.env

# 4. 添加或修改以下行
DIFY_API_KEY=your_actual_api_key_here

# 5. 重啟 Wiki.js 服務
cd docker && docker-compose restart wiki
```

### 3. 啟動 Dify Next 前端 (可選)
```bash
cd dify-next-frontend
npm install
npm run dev
# 將在 http://localhost:3001 運行
```

## 功能特性

### ✨ Wiki.js 功能
- 📝 Markdown 編輯器
- 🔍 全文搜索
- 👥 用戶權限管理
- 🎨 自定義主題
- 📊 分析統計

### 🤖 AI 聊天機器人 (需配置 API Key)
- 💬 浮動聊天窗口
- 📎 多模態文件上傳
- 🔄 對話歷史記錄
- 🌐 前端切換功能
- 📱 響應式設計

### 🔗 整合優勢
- 🚀 三個前端界面可獨立使用
- 🔐 統一後端 API 服務
- 💾 共享數據庫存儲
- ⚡ 無縫切換體驗

## 常用命令

```bash
# 查看服務狀態
cd docker && docker-compose ps

# 查看日誌
cd docker && docker-compose logs -f

# 重啟服務
cd docker && docker-compose restart

# 停止服務
cd docker && docker-compose down

# 更新服務
cd docker && docker-compose pull && docker-compose up -d

# 檢查整合狀態
./check-wiki-integration.sh
```

## 架構說明

```
用戶界面層:
┌─────────────────────────────────────────────────────────┐
│ Dify 原始前端     │ Wiki.js + AI      │ Dify Next前端    │
│ localhost:80      │ localhost:3002    │ localhost:3001   │
└─────────────────────────────────────────────────────────┘
                              │
                              ▼
API 服務層:
┌─────────────────────────────────────────────────────────┐
│ Dify API Server (localhost:5001) - 共享後端服務          │
└─────────────────────────────────────────────────────────┘
                              │
                              ▼
數據存儲層:
┌─────────────────────────────────────────────────────────┐
│ PostgreSQL (dify + wiki) │ Redis │ 向量數據庫 │ 文件存儲 │
└─────────────────────────────────────────────────────────┘
```

## 故障排除

### Wiki.js 無法訪問
```bash
cd docker && docker-compose logs wiki
```

### AI 聊天機器人不工作
1. 檢查 DIFY_API_KEY 是否設置
2. 確認 Dify API 服務正常運行
3. 查看 Wiki.js 日誌

### 數據庫連接問題
```bash
cd docker && docker-compose logs db
```

## 支持資源

- 📖 詳細文檔: `WIKI_INTEGRATION_README.md`
- 🔧 檢查腳本: `./check-wiki-integration.sh`
- 📞 技術支持: 查看項目 GitHub Issues

---

**🎉 恭喜！您的智能文檔管理系統已就緒！**

現在您可以享受：
- 專業的文檔管理 (Wiki.js)
- 強大的 AI 助手 (Dify)
- 靈活的前端選擇
- 統一的後端服務

開始探索您的新系統吧！ 🚀
