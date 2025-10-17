# Wiki.js 批量文檔導入整合指南

## 🎯 功能概述

這個批量導入工具可以將多種格式的文檔（PDF、PPT、Excel、Word等）自動轉換為 Markdown 並創建 Wiki.js 頁面。

## 🚀 快速啟動

### 方法一：獨立服務（推薦）

```bash
cd /Users/andycyw/dify/wiki/batch-import
./start.sh
```

然後訪問：http://localhost:5000

### 方法二：Docker 部署

```bash
cd /Users/andycyw/dify/wiki/batch-import
./update-docker-compose.sh
cd /Users/andycyw/dify/docker
docker-compose up -d wiki-batch-importer
```

## 🔧 Wiki.js 整合

### 1. 添加導航按鈕

在 Wiki.js 管理面板中：
1. 進入 **主題** > **代碼注入**
2. 在 **頁面頭部** 添加以下代碼：

```html
<script src="/js/batch-import-integration.js"></script>
```

3. 在 **頁面底部** 添加整合腳本：

```javascript
// 複製 integrate-with-wiki.js 的內容到這裡
```

### 2. 添加菜單項

在 Wiki.js 管理面板中：
1. 進入 **導航**
2. 添加新的導航項：
   - 標題：批量導入
   - 圖標：cloud_upload
   - 鏈接：http://localhost:5000
   - 在新視窗開啟：是

## 📁 支援的文件格式

- **PDF**: `.pdf`
- **Word**: `.doc`, `.docx`
- **Excel**: `.xls`, `.xlsx`
- **PowerPoint**: `.ppt`, `.pptx`
- **文本**: `.txt`, `.md`
- **數據**: `.csv`

## ⚙️ 配置選項

- **目標資料夾**: 指定頁面創建位置
- **頁面模板**: 選擇頁面樣式模板
- **命名規則**: 文件命名方式
- **內容處理**: 圖片提取、格式保持等

## 🔄 使用流程

1. 選擇或拖拽文件到上傳區域
2. 配置轉換選項
3. 點擊"開始導入"
4. 等待處理完成
5. 查看創建的 Wiki 頁面

## 🛠️ 技術架構

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   前端界面       │───▶│  Flask 服務      │───▶│   Wiki.js DB    │
│  (HTML/JS)      │    │  (文檔處理)      │    │  (PostgreSQL)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  文件上傳       │    │  格式轉換        │    │  頁面創建        │
│  拖拽支援       │    │  Markdown 輸出   │    │  元數據存儲      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🐛 故障排除

### 服務無法啟動
```bash
# 檢查 Python 依賴
python3 -c "import flask, pypandoc, pypdfium2"

# 重新安裝依賴
pip3 install -r requirements.txt
```

### 文檔處理失敗
- 確保文件格式受支援
- 檢查文件是否損壞
- 查看錯誤日誌

### Wiki.js 連接失敗
- 檢查數據庫連接配置
- 確認 PostgreSQL 服務正常
- 驗證數據庫憑證

## 📞 支援

如需協助，請檢查：
1. 服務日誌：`http://localhost:5000/logs`
2. Wiki.js 日誌
3. 數據庫連接狀態

---

**享受批量導入的便利！** 📚✨
