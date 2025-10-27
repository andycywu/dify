#!/bin/bash

echo "🚀 設置 Wiki.js 批量文檔導入功能..."

# 安裝 Python 依賴
echo "📦 安裝 Python 依賴包..."
pip3 install flask pypandoc pypdfium2 python-docx openpyxl python-pptx pandas psycopg2-binary requests markdown

# 創建目錄結構
echo "📁 創建目錄結構..."
mkdir -p /Users/andycyw/dify/wiki/batch-import
mkdir -p /Users/andycyw/dify/wiki/batch-import/uploads
mkdir -p /Users/andycyw/dify/wiki/batch-import/templates

# 移動文件到正確位置
echo "📄 移動文件..."
mv /Users/andycyw/dify/wiki/batch-document-importer.html /Users/andycyw/dify/wiki/batch-import/templates/
mv /Users/andycyw/dify/wiki/batch_import_server.py /Users/andycyw/dify/wiki/batch-import/

# 創建啟動腳本
cat > /Users/andycyw/dify/wiki/batch-import/start.sh << 'EOF'
#!/bin/bash
echo "🚀 啟動 Wiki.js 批量文檔導入服務..."
cd "$(dirname "$0")"

# 檢查 Python 依賴
python3 -c "import flask, pypandoc, pypdfium2, docx, openpyxl, pptx, pandas, psycopg2" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "❌ Python 依賴未完全安裝，正在安裝..."
    pip3 install flask pypandoc pypdfium2 python-docx openpyxl python-pptx pandas psycopg2-binary requests markdown
fi

# 設置環境變量
export FLASK_APP=batch_import_server.py
export WIKI_DB_HOST=${WIKI_DB_HOST:-localhost}
export WIKI_DB_PORT=${WIKI_DB_PORT:-5432}
export WIKI_DB_NAME=${WIKI_DB_NAME:-wiki}
export WIKI_DB_USER=${WIKI_DB_USER:-postgres}
export WIKI_DB_PASSWORD=${WIKI_DB_PASSWORD:-difyai123456}

echo "🌐 服務將在 http://localhost:5000 啟動"
echo "📚 Wiki.js 數據庫: $WIKI_DB_HOST:$WIKI_DB_PORT/$WIKI_DB_NAME"

python3 batch_import_server.py
EOF

chmod +x /Users/andycyw/dify/wiki/batch-import/start.sh

# 創建 Docker 配置更新腳本
cat > /Users/andycyw/dify/wiki/batch-import/update-docker-compose.sh << 'EOF'
#!/bin/bash

echo "📝 更新 Docker Compose 配置以包含批量導入服務..."

# 備份原始 docker-compose 文件
cp /Users/andycyw/dify/docker/docker-compose.yaml /Users/andycyw/dify/docker/docker-compose.yaml.backup

# 添加批量導入服務到 docker-compose.yaml
cat >> /Users/andycyw/dify/docker/docker-compose.yaml << 'COMPOSE_EOF'

  wiki-batch-importer:
    build:
      context: ../wiki/batch-import
      dockerfile: Dockerfile
    ports:
      - "5000:5000"
    environment:
      - WIKI_DB_HOST=db
      - WIKI_DB_PORT=5432
      - WIKI_DB_NAME=wiki
      - WIKI_DB_USER=postgres
      - WIKI_DB_PASSWORD=difyai123456
    volumes:
      - ../wiki/batch-import/uploads:/app/uploads
    depends_on:
      - db
      - wiki
    restart: unless-stopped
COMPOSE_EOF

echo "✅ Docker Compose 配置已更新"
EOF

chmod +x /Users/andycyw/dify/wiki/batch-import/update-docker-compose.sh

# 創建 Dockerfile
cat > /Users/andycyw/dify/wiki/batch-import/Dockerfile << 'EOF'
FROM python:3.11-slim

WORKDIR /app

# 安裝系統依賴
RUN apt-get update && apt-get install -y \
    pandoc \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# 安裝 Python 依賴
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 複製應用代碼
COPY . .

# 創建上傳目錄
RUN mkdir -p uploads

EXPOSE 5000

CMD ["python", "batch_import_server.py"]
EOF

# 創建 requirements.txt
cat > /Users/andycyw/dify/wiki/batch-import/requirements.txt << 'EOF'
Flask==2.3.3
pypandoc==1.11
pypdfium2==4.23.1
python-docx==0.8.11
openpyxl==3.1.2
python-pptx==0.6.21
pandas==2.1.1
psycopg2-binary==2.9.7
requests==2.31.0
markdown==3.5.1
Werkzeug==2.3.7
EOF

# 創建整合到 Wiki.js 的腳本
cat > /Users/andycyw/dify/wiki/batch-import/integrate-with-wiki.js << 'EOF'
// Wiki.js 頁面整合腳本
// 將此腳本添加到 Wiki.js 的自定義 HTML 中

(function() {
    // 添加批量導入按鈕到 Wiki.js 導航欄
    function addBatchImportButton() {
        const nav = document.querySelector('.v-toolbar__content .v-btn-group');
        if (nav && !document.getElementById('batch-import-btn')) {
            const importBtn = document.createElement('button');
            importBtn.id = 'batch-import-btn';
            importBtn.className = 'v-btn v-btn--flat theme--dark';
            importBtn.innerHTML = '<i class="material-icons">cloud_upload</i> 批量導入';
            importBtn.onclick = openBatchImporter;
            nav.appendChild(importBtn);
        }
    }
    
    // 打開批量導入工具
    function openBatchImporter() {
        const modal = document.createElement('div');
        modal.id = 'batch-import-modal';
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.8); z-index: 10000; display: flex;
            align-items: center; justify-content: center;
        `;
        
        const iframe = document.createElement('iframe');
        iframe.src = 'http://localhost:5000';
        iframe.style.cssText = `
            width: 90%; height: 90%; border: none; border-radius: 8px;
            background: white; box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        `;
        
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '✕';
        closeBtn.style.cssText = `
            position: absolute; top: 20px; right: 20px; background: white;
            border: none; width: 40px; height: 40px; border-radius: 50%;
            font-size: 20px; cursor: pointer; z-index: 10001;
        `;
        closeBtn.onclick = () => document.body.removeChild(modal);
        
        modal.appendChild(iframe);
        modal.appendChild(closeBtn);
        document.body.appendChild(modal);
    }
    
    // 等待頁面加載完成
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', addBatchImportButton);
    } else {
        addBatchImportButton();
    }
    
    // 監聽路由變化（SPA）
    let lastUrl = location.href;
    new MutationObserver(() => {
        const url = location.href;
        if (url !== lastUrl) {
            lastUrl = url;
            setTimeout(addBatchImportButton, 1000);
        }
    }).observe(document, {subtree: true, childList: true});
})();
EOF

# 創建 Wiki.js 主題修改指南
cat > /Users/andycyw/dify/wiki/batch-import/INTEGRATION_GUIDE.md << 'EOF'
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
EOF

echo "✅ Wiki.js 批量文檔導入功能設置完成！"
echo ""
echo "🎯 下一步操作："
echo "1. 啟動服務: cd /Users/andycyw/dify/wiki/batch-import && ./start.sh"
echo "2. 訪問工具: http://localhost:5000"
echo "3. 查看整合指南: cat /Users/andycyw/dify/wiki/batch-import/INTEGRATION_GUIDE.md"
echo ""
echo "📚 支援格式: PDF, PPT, Excel, Word, TXT, Markdown, CSV"
echo "🔧 詳細配置請參考 INTEGRATION_GUIDE.md"
