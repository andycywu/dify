# 🚀 快速啟動指南

## 📦 安裝依賴

```bash
cd c:\Users\andycy.wu\dify\rest-to-soap-proxy
npm install
```

## 🔧 配置環境變數

複製 `.env.example` 為 `.env`：
```bash
copy .env.example .env
```

編輯 `.env` 文件（可選，HTTPS 模式可以在 API 調用時提供認證）：
```env
PORT=5001
APP_ID=your_app_id
API_PWD=your_api_pwd
```

## ▶️ 啟動服務

```bash
npm start
```

或使用開發模式（自動重啟）：
```bash
npm run dev
```

## ✅ 測試 API

### 1️⃣ 打開瀏覽器
訪問: http://localhost:5001

### 2️⃣ 測試 HTTPS 模式

**步驟 1: 登入**
```bash
curl -X POST http://localhost:5001/api/https/login ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"YOUR_USERNAME\",\"password\":\"YOUR_PASSWORD\"}"
```

**步驟 2: 查看可用專案**
```bash
curl http://localhost:5001/api/https/projects
```

**步驟 3: 下載 TV 專案數據**
```bash
curl -O http://localhost:5001/api/https/download-by-name/TV
```

**步驟 4: 下載所有專案摘要**
```bash
curl http://localhost:5001/api/https/download-all
```

### 3️⃣ 測試 SOAP 模式

```bash
curl -X POST http://localhost:5001/GetIssueInfo ^
  -H "Content-Type: application/json" ^
  -d "{\"issueID\":1484510,\"includeFields\":true}"
```

## 📁 重要文件

| 文件 | 說明 |
|------|------|
| `index.js` | 主入口（雙模式） |
| `index-soap.js` | SOAP 路由模塊 |
| `index-backup.js` | 原始版本備份 |
| `src/clients/https-client.js` | HTTPS 客戶端（VBA 風格） |
| `src/routes/https-routes.js` | HTTPS API 路由 |
| `README-NEW.md` | 完整文檔 |

## 🔍 與 VBA 的對應關係

### VBA Download() → Node.js API

**VBA 代碼：**
```vba
Sub Download()
    Call getDownloadURL
    Call DownloadURTdata(globalVariableTVurl, "TV-Data")
    Call DownloadURTdata(globalVariablePDurl, "PD-Data")
    Call DownloadURTdata(globalVariableMNTurl, "MNT-Data")
    Call DownloadURTdata(globalVariableAVAurl, "AVA-Data")
    MsgBox "下載成功"
End Sub
```

**Node.js API 等價調用：**
```bash
# 1. 登入
curl -X POST http://localhost:5001/api/https/login \
  -H "Content-Type: application/json" \
  -d '{"username":"user","password":"pass"}'

# 2. 下載 TV 專案
curl -O http://localhost:5001/api/https/download-by-name/TV

# 3. 下載 PD 專案
curl -O http://localhost:5001/api/https/download-by-name/PD

# 4. 下載 MNT 專案
curl -O http://localhost:5001/api/https/download-by-name/MNT

# 5. 下載 AVA 專案
curl -O http://localhost:5001/api/https/download-by-name/AVA

# 完成！
```

## 🎯 使用場景

### 場景 1: 自動化數據下載
替代 Excel VBA 的定時下載功能

### 場景 2: 與其他系統集成
通過 REST API 將 Urtracker 數據集成到其他系統

### 場景 3: 批量數據處理
使用 Python/Node.js 批量處理 Urtracker 數據

## 💡 下一步

1. 查看完整文檔：`README-NEW.md`
2. 配置自動化腳本定期下載數據
3. 集成到你的 CI/CD 流程
4. 實現 Session 持久化（Redis）

## ⚠️ 故障排除

### 端口被佔用
```bash
# 更改 .env 中的 PORT 配置
PORT=5002
```

### 依賴安裝失敗
```bash
npm cache clean --force
npm install
```

### 登入失敗
- 檢查用戶名和密碼
- 確認網絡連接
- 查看控制台日誌

## 📞 需要幫助？

查看服務器日誌以獲取詳細錯誤信息，日誌會顯示完整的 HTTP 請求和響應。
