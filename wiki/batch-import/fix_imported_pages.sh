#!/bin/bash
#
# 修復導入頁面的所有問題
#

echo "🔧 修復 Wiki.js 導入頁面..."
echo "================================"

# 1. 修復 localeCode
echo ""
echo "1️⃣  修復 localeCode..."
docker exec docker-db-1 psql -U wiki_app -d wiki -c "
UPDATE pages
SET \"localeCode\" = 'en'
WHERE \"localeCode\" IS NULL OR \"localeCode\" = '';
"

# 2. 修復 editorKey
echo ""
echo "2️⃣  修復 editorKey..."
docker exec docker-db-1 psql -U wiki_app -d wiki -c "
UPDATE pages
SET \"editorKey\" = 'markdown'
WHERE \"editorKey\" IS NULL OR \"editorKey\" = '';
"

# 3. 為沒有 pageTree 的頁面創建記錄
echo ""
echo "3️⃣  為缺少 pageTree 的頁面創建記錄..."
docker exec docker-db-1 psql -U wiki_app -d wiki -c "
DO \$\$
DECLARE
    page_record RECORD;
    next_tree_id INTEGER;
    page_depth INTEGER;
BEGIN
    -- 遍歷所有沒有 pageTree 的頁面
    FOR page_record IN
        SELECT p.id, p.path, p.title, p.\"localeCode\"
        FROM pages p
        LEFT JOIN \"pageTree\" pt ON p.id = pt.\"pageId\"
        WHERE pt.id IS NULL AND p.id > 1
    LOOP
        -- 獲取下一個 tree ID
        SELECT COALESCE(MAX(id), 0) + 1 INTO next_tree_id FROM \"pageTree\";

        -- 計算深度
        page_depth := array_length(string_to_array(trim(leading '/' from page_record.path), '/'), 1);

        -- 插入 pageTree 記錄
        INSERT INTO \"pageTree\" (
            id,
            path,
            depth,
            title,
            \"isPrivate\",
            \"isFolder\",
            \"pageId\",
            \"localeCode\",
            ancestors
        ) VALUES (
            next_tree_id,
            trim(leading '/' from page_record.path),
            page_depth,
            page_record.title,
            false,
            false,
            page_record.id,
            page_record.\"localeCode\",
            '[]'::json
        );

        RAISE NOTICE 'Created pageTree for page %: % (tree_id: %)', page_record.id, page_record.title, next_tree_id;
    END LOOP;
END\$\$;
"

# 4. 驗證結果
echo ""
echo "================================"
echo "✅ 驗證修復結果"
echo "================================"

echo ""
echo "📄 所有頁面的狀態："
docker exec docker-db-1 psql -U wiki_app -d wiki -c "
SELECT
    p.id,
    p.path,
    p.title,
    p.\"localeCode\",
    p.\"editorKey\",
    CASE WHEN pt.id IS NOT NULL THEN '✅' ELSE '❌' END as has_tree
FROM pages p
LEFT JOIN \"pageTree\" pt ON p.id = pt.\"pageId\"
ORDER BY p.id;
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
    \"localeCode\"
FROM \"pageTree\"
ORDER BY id;
"

echo ""
echo "================================"
echo "🎉 修復完成！"
echo "================================"
echo ""
echo "請重新啟動 Wiki.js 容器以刷新緩存："
echo "  docker-compose restart wiki"
echo ""
