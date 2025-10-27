#!/bin/bash
#
# 檢查已導入的 Wiki 頁面
#

echo "================================"
echo "📄 已導入的 Wiki 頁面列表"
echo "================================"
echo ""

echo "🗄️  數據庫中的頁面："
docker exec docker-db-1 psql -U wiki_app -d wiki -c "
SELECT
    p.id,
    p.path,
    p.title,
    p.\"isPublished\",
    pt.id as tree_id,
    pt.depth,
    LENGTH(p.content) as content_length
FROM pages p
LEFT JOIN \"pageTree\" pt ON p.id = pt.\"pageId\"
ORDER BY p.id DESC
LIMIT 10;
"

echo ""
echo "🌳 PageTree 結構："
docker exec docker-db-1 psql -U wiki_app -d wiki -c "
SELECT
    id,
    path,
    title,
    \"pageId\",
    depth,
    \"isFolder\"
FROM \"pageTree\"
ORDER BY id DESC
LIMIT 10;
"

echo ""
echo "================================"
echo "✅ 驗證建議："
echo "================================"
echo ""
echo "1. 在瀏覽器中打開 Wiki.js:"
echo "   http://localhost:3002"
echo ""
echo "2. 使用以下路徑訪問頁面:"
echo "   - http://localhost:3002/e/en/imported/final_test"
echo "   - http://localhost:3002/e/en/imported/test_markdown"
echo "   - http://localhost:3002/e/en/imported/test_text"
echo ""
echo "3. 或者在 Wiki.js 中搜索頁面標題"
echo ""
echo "4. 查看 Wiki.js 的所有頁面:"
echo "   http://localhost:3002/t/all"
echo ""
