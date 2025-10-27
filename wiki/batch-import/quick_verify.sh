#!/bin/bash
#
# 快速驗證批量導入功能
#
set -e

echo "🧪 Wiki.js 批量導入功能快速驗證"
echo "================================"
echo ""

# 1. 檢查服務狀態
echo "1️⃣  檢查服務狀態..."
if docker ps | grep -q wiki-batch-importer; then
    echo "✅ 批量導入服務運行中"
else
    echo "❌ 批量導入服務未運行"
    exit 1
fi

# 2. 測試 API
echo ""
echo "2️⃣  測試 API 連接..."
if curl -s http://localhost:5050/api/wiki/supported-formats | grep -q "formats"; then
    echo "✅ API 響應正常"
else
    echo "❌ API 無法訪問"
    exit 1
fi

# 3. 上傳測試文件
echo ""
echo "3️⃣  上傳測試文件..."
TEST_FILE="/tmp/quick_verify_$(date +%s).md"
cat > "$TEST_FILE" << EOF
# 快速驗證測試

這是一個快速驗證測試文件。

## 測試信息
- 測試時間: $(date '+%Y-%m-%d %H:%M:%S')
- 測試類型: 快速驗證

## 結果
如果您能在 Wiki.js 中看到這個頁面，說明批量導入功能正常工作！
EOF

RESULT=$(curl -s -X POST http://localhost:5050/api/wiki/batch-import \
    -F "file=@$TEST_FILE" \
    -F "target_folder=/imported/verification")

if echo "$RESULT" | grep -q "success"; then
    PAGE_ID=$(echo "$RESULT" | grep -o '"page_id": [0-9]*' | awk '{print $2}')
    TITLE=$(echo "$RESULT" | grep -o '"title": "[^"]*"' | cut -d'"' -f4)
    echo "✅ 文件上傳成功!"
    echo "   Page ID: $PAGE_ID"
    echo "   標題: $TITLE"
else
    echo "❌ 文件上傳失敗"
    echo "$RESULT"
    exit 1
fi

# 4. 驗證數據庫
echo ""
echo "4️⃣  驗證數據庫記錄..."
DB_CHECK=$(docker exec docker-db-1 psql -U wiki_app -d wiki -t -c \
    "SELECT COUNT(*) FROM pages WHERE id = $PAGE_ID;")

if [ "$DB_CHECK" -eq 1 ]; then
    echo "✅ 數據庫記錄正確"
else
    echo "❌ 數據庫記錄驗證失敗"
    exit 1
fi

# 5. 檢查 pageTree
echo ""
echo "5️⃣  檢查 PageTree..."
TREE_CHECK=$(docker exec docker-db-1 psql -U wiki_app -d wiki -t -c \
    "SELECT COUNT(*) FROM \"pageTree\" WHERE \"pageId\" = $PAGE_ID;")

if [ "$TREE_CHECK" -eq 1 ]; then
    echo "✅ PageTree 記錄正確"
else
    echo "⚠️  PageTree 記錄缺失（可能影響 Wiki.js 導航）"
fi

# 6. 顯示內容預覽
echo ""
echo "6️⃣  內容預覽..."
CONTENT=$(docker exec docker-db-1 psql -U wiki_app -d wiki -t -c \
    "SELECT LEFT(content, 150) FROM pages WHERE id = $PAGE_ID;")
echo "$CONTENT"

# 總結
echo ""
echo "================================"
echo "✅ 驗證完成！"
echo "================================"
echo ""
echo "📝 下一步："
echo "1. 打開 Wiki.js: http://localhost:3002"
echo "2. 登入後搜索: \"$TITLE\""
echo "3. 或訪問所有頁面查看導入的內容"
echo ""
echo "🎉 批量導入功能運行正常！"
echo ""

# 清理
rm -f "$TEST_FILE"
