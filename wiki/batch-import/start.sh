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
