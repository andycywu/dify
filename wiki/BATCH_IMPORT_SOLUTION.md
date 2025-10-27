# 📚 Wiki.js 批量文檔導入解決方案

## 🎯 問題分析

您遇到的問題是 **Wiki.js 只支援手動頁面編輯，無法批量導入 PDF/PPT/Excel 等文檔並自動轉換為 Markdown 頁面**。

## ✨ 解決方案

我已經為您開發了一個完整的批量文檔導入系統，包含以下功能：

### 🔧 功能特性
- **多格式支援**: PDF、PPT、Excel、Word、TXT、Markdown、CSV
- **自動轉換**: 文檔內容自動轉換為 Markdown 格式
- **批量處理**: 一次選擇多個文件同時處理
- **進度顯示**: 實時顯示處理進度
- **Wiki.js 整合**: 直接創建 Wiki.js 頁面
- **拖拽上傳**: 支援拖拽文件到界面
- **響應式設計**: 適配不同屏幕尺寸

### 📁 文件結構
```
/Users/andycyw/dify/wiki/
├── simple-chatbot-widget.html          # 整合了批量導入的聊天機器人
├── batch-document-importer.html        # 獨立的批量導入工具
├── batch_import_server.py              # 後端處理服務
└── setup-batch-import.sh              # 一鍵設置腳本
```

## 🚀 快速啟動

### 方法一：使用整合版聊天機器人（推薦）

已將批量導入功能整合到現有的 AI 聊天機器人中：

1. **查看更新的聊天機器人**：
   ```bash
   open /Users/andycyw/dify/wiki/simple-chatbot-widget.html
   ```

2. **使用方式**：
   - 點擊聊天機器人圖標打開對話框
   - 點擊頭部的 📚 圖標切換到批量導入界面
   - 拖拽或選擇文件，然後點擊"開始導入"

### 方法二：使用獨立導入工具

1. **開啟獨立工具**：
   ```bash
   open /Users/andycyw/dify/wiki/batch-document-importer.html
   ```

### 方法三：完整後端服務（推薦用於生產環境）

1. **運行設置腳本**：
   ```bash
   chmod +x /Users/andycyw/dify/wiki/setup-batch-import.sh
   ./Users/andycyw/dify/wiki/setup-batch-import.sh
   ```

2. **啟動服務**：
   ```bash
   cd /Users/andycyw/dify/wiki/batch-import
   ./start.sh
   ```

3. **訪問界面**：
   ```
   http://localhost:5000
   ```

## 📋 支援的文件格式

| 格式 | 擴展名 | 處理方式 |
|------|--------|----------|
| PDF | `.pdf` | 提取文字內容，按頁面分章節 |
| Word | `.doc`, `.docx` | 保持標題結構，轉換表格 |
| Excel | `.xls`, `.xlsx` | 工作表轉為 Markdown 表格 |
| PowerPoint | `.ppt`, `.pptx` | 投影片內容按頁面組織 |
| 文本 | `.txt`, `.md` | 直接導入或格式化 |
| 數據 | `.csv` | 轉換為 Markdown 表格 |

## ⚙️ 配置選項

### 基本設置
- **目標資料夾**: 指定 Wiki 頁面創建位置（預設：`/imported`）
- **頁面模板**: 選擇頁面樣式模板
- **命名規則**: 文件重命名方式
  - 保持原始檔名
  - 檔名 + 時間戳
  - 檔名 + 序號

### 內容處理
- **提取圖片**: 從文檔中提取圖片資源
- **保持格式**: 盡可能保持原始格式
- **生成目錄**: 自動生成頁面目錄

## 🔄 使用流程

1. **選擇文件**: 拖拽或點擊選擇要導入的文檔
2. **配置選項**: 設置目標資料夾和處理選項
3. **開始導入**: 點擊"開始導入"按鈕
4. **監控進度**: 查看實時處理進度
5. **查看結果**: 檢查創建的 Wiki 頁面

## 🛠️ 技術實現

### 前端技術
- **HTML5**: 現代化界面設計
- **CSS3**: 響應式樣式和動畫
- **JavaScript**: 拖拽上傳和進度控制
- **File API**: 本地文件處理

### 後端技術
- **Flask**: Python Web 框架
- **pypandoc**: 文檔格式轉換
- **pypdfium2**: PDF 文本提取
- **python-docx**: Word 文檔處理
- **openpyxl**: Excel 文件處理
- **python-pptx**: PowerPoint 處理
- **PostgreSQL**: Wiki.js 數據庫操作

### 系統架構
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   前端界面       │───▶│  Flask 服務      │───▶│   Wiki.js DB    │
│  (HTML/JS)      │    │  (文檔處理)      │    │  (PostgreSQL)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  批量上傳       │    │  格式轉換        │    │  頁面創建        │
│  進度顯示       │    │  Markdown 輸出   │    │  元數據存儲      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🔐 Wiki.js 整合

### 數據庫直接寫入
系統直接連接 Wiki.js 的 PostgreSQL 數據庫，創建頁面記錄：

```sql
INSERT INTO pages (id, path, title, content, "isPublished", "contentType", "createdAt")
VALUES (uuid, '/imported/document-name', 'Document Title', 'Markdown Content', true, 'markdown', now());
```

### 頁面元數據
每個導入的頁面都包含豐富的元數據：
- 原始文件名和類型
- 導入時間戳
- 處理統計信息
- 自動生成的頁面結構

## 📊 使用範例

### PDF 文檔導入
```
原始文件: report.pdf (25頁)
↓
生成頁面: /imported/report
內容結構:
# report
> 文檔信息: PDF, 25頁, 2024-08-04導入

## 第 1 頁
[第一頁內容...]

## 第 2 頁
[第二頁內容...]
```

### Excel 表格導入
```
原始文件: data.xlsx (3個工作表)
↓
生成頁面: /imported/data
內容結構:
# data
> 文檔信息: Excel, 3個工作表, 2024-08-04導入

## Sheet1
| 欄位1 | 欄位2 | 欄位3 |
|-------|-------|-------|
| 數據1 | 數據2 | 數據3 |

## Sheet2
[第二個工作表的表格...]
```

## 🐛 故障排除

### 常見問題

1. **Python 依賴缺失**
   ```bash
   pip3 install flask pypandoc pypdfium2 python-docx openpyxl python-pptx pandas psycopg2-binary
   ```

2. **文件上傳失敗**
   - 檢查文件大小限制（預設 100MB）
   - 確認文件格式在支援列表中
   - 檢查文件是否損壞

3. **Wiki.js 連接失敗**
   - 確認 PostgreSQL 服務運行正常
   - 檢查數據庫連接配置
   - 驗證數據庫用戶權限

4. **文檔處理錯誤**
   - 檢查文檔是否加密或損壞
   - 確認所需的系統依賴已安裝
   - 查看詳細錯誤日誌

### 調試模式

啟用調試模式查看詳細信息：
```bash
export FLASK_DEBUG=1
python3 batch_import_server.py
```

## 🔄 未來擴展

### 計劃功能
- **更多格式支援**: RTF、ODT、Pages 等
- **圖片處理**: 自動優化和壓縮圖片
- **OCR 支援**: 掃描文檔的文字識別
- **批量模板**: 預定義的導入模板
- **API 整合**: 與 Dify AI 的深度整合
- **權限控制**: 細粒度的用戶權限管理

### 客製化選項
- **自定義處理規則**: 針對特定文檔類型的處理邏輯
- **模板系統**: 可配置的 Markdown 模板
- **自動分類**: 根據內容自動分類和標籤
- **版本控制**: 文檔更新時的版本管理

## 📞 技術支援

如果您在使用過程中遇到問題：

1. **檢查日誌**: 查看詳細的錯誤信息
2. **驗證環境**: 確認所有依賴正確安裝
3. **測試連接**: 驗證數據庫和服務連通性
4. **重啟服務**: 嘗試重新啟動相關服務

## 🎉 結論

這個批量文檔導入解決方案完全解決了您提到的問題：

✅ **支援多種格式**: PDF、PPT、Excel、Word 等  
✅ **自動轉換**: 自動轉換為 Markdown 格式  
✅ **批量處理**: 一次處理多個文檔  
✅ **Wiki.js 整合**: 直接創建 Wiki 頁面  
✅ **用戶友好**: 簡潔直觀的操作界面  
✅ **進度跟蹤**: 實時顯示處理狀態  

**現在您可以輕鬆地將任何文檔批量導入到 Wiki.js 中，大大加速知識庫的建立！** 🚀📚
