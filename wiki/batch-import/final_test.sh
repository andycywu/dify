#!/bin/bash
#
# 批量導入功能 - 最終測試和驗證
#

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║     Wiki.js 批量導入功能 - 完整測試                        ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# 測試計數
TOTAL_TESTS=0
PASSED_TESTS=0

# 測試函數
test_check() {
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    if [ $1 -eq 0 ]; then
        echo "✅ $2"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        echo "❌ $2"
        return 1
    fi
}

# 1. 檢查服務狀態
echo "═══════════════════════════════════════════════════════════"
echo "1️⃣  服務狀態檢查"
echo "═══════════════════════════════════════════════════════════"
echo ""

docker ps | grep -q wiki-batch-importer
test_check $? "批量導入服務運行中"

docker ps | grep -q dify-wiki
test_check $? "Wiki.js 服務運行中"

docker ps | grep -q docker-db-1
test_check $? "PostgreSQL 數據庫運行中"

# 2. 檢查 API
echo ""
echo "═══════════════════════════════════════════════════════════"
echo "2️⃣  API 功能測試"
echo "═══════════════════════════════════════════════════════════"
echo ""

curl -s http://localhost:5050/api/wiki/supported-formats | grep -q "formats"
test_check $? "API 端點響應正常"

curl -s http://localhost:5050/ | grep -q "批量文檔導入"
test_check $? "Web 界面可訪問"

# 3. 檢查數據庫結構
echo ""
echo "═══════════════════════════════════════════════════════════"
echo "3️⃣  數據庫結構驗證"
echo "═══════════════════════════════════════════════════════════"
echo ""

# 檢查所有頁面是否有 localeCode
MISSING_LOCALE=$(docker exec docker-db-1 psql -U wiki_app -d wiki -t -c \
    "SELECT COUNT(*) FROM pages WHERE \"localeCode\" IS NULL OR \"localeCode\" = '';")
test_check $([ "$MISSING_LOCALE" -eq 0 ] && echo 0 || echo 1) "所有頁面都有 localeCode"

# 檢查所有頁面是否有 editorKey
MISSING_EDITOR=$(docker exec docker-db-1 psql -U wiki_app -d wiki -t -c \
    "SELECT COUNT(*) FROM pages WHERE \"editorKey\" IS NULL OR \"editorKey\" = '';")
test_check $([ "$MISSING_EDITOR" -eq 0 ] && echo 0 || echo 1) "所有頁面都有 editorKey"

# 檢查所有頁面是否有 pageTree
MISSING_TREE=$(docker exec docker-db-1 psql -U wiki_app -d wiki -t -c \
    "SELECT COUNT(*) FROM pages p LEFT JOIN \"pageTree\" pt ON p.id = pt.\"pageId\" WHERE pt.id IS NULL AND p.id > 1;")
test_check $([ "$MISSING_TREE" -eq 0 ] && echo 0 || echo 1) "所有頁面都有 pageTree 記錄"

# 4. 數據統計
echo ""
echo "═══════════════════════════════════════════════════════════"
echo "4️⃣  導入數據統計"
echo "═══════════════════════════════════════════════════════════"
echo ""

TOTAL_PAGES=$(docker exec docker-db-1 psql -U wiki_app -d wiki -t -c \
    "SELECT COUNT(*) FROM pages;")
echo "📄 總頁面數: $TOTAL_PAGES"

IMPORTED_PAGES=$(docker exec docker-db-1 psql -U wiki_app -d wiki -t -c \
    "SELECT COUNT(*) FROM pages WHERE path LIKE '/imported%';")
echo "📥 已導入頁面: $IMPORTED_PAGES"

TREE_NODES=$(docker exec docker-db-1 psql -U wiki_app -d wiki -t -c \
    "SELECT COUNT(*) FROM \"pageTree\";")
echo "🌳 PageTree 節點: $TREE_NODES"

# 5. 頁面列表
echo ""
echo "═══════════════════════════════════════════════════════════"
echo "5️⃣  已導入的頁面"
echo "═══════════════════════════════════════════════════════════"
echo ""

docker exec docker-db-1 psql -U wiki_app -d wiki -c "
SELECT
    p.id,
    p.title,
    p.\"localeCode\" as locale,
    p.\"editorKey\" as editor,
    CASE WHEN pt.id IS NOT NULL THEN '✅' ELSE '❌' END as tree,
    LENGTH(p.content) as size
FROM pages p
LEFT JOIN \"pageTree\" pt ON p.id = pt.\"pageId\"
WHERE p.path LIKE '/imported%'
ORDER BY p.id;
"

# 6. 訪問 URL
echo ""
echo "═══════════════════════════════════════════════════════════"
echo "6️⃣  Wiki.js 訪問 URL"
echo "═══════════════════════════════════════════════════════════"
echo ""

echo "🌐 主頁: http://localhost:3002"
echo ""
echo "📝 導入的頁面："
docker exec docker-db-1 psql -U wiki_app -d wiki -t -c \
    "SELECT '   • http://localhost:3002/e/en/' || trim(leading '/' from path)
     FROM pages
     WHERE path LIKE '/imported%'
     ORDER BY id;" | sed 's/^ *//'

# 7. 測試總結
echo ""
echo "═══════════════════════════════════════════════════════════"
echo "📊 測試總結"
echo "═══════════════════════════════════════════════════════════"
echo ""

PASS_RATE=$((PASSED_TESTS * 100 / TOTAL_TESTS))

echo "總測試數: $TOTAL_TESTS"
echo "通過測試: $PASSED_TESTS"
echo "失敗測試: $((TOTAL_TESTS - PASSED_TESTS))"
echo "成功率: $PASS_RATE%"
echo ""

if [ $PASSED_TESTS -eq $TOTAL_TESTS ]; then
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║              🎉 所有測試通過！                              ║"
    echo "║          批量導入功能完全正常工作                           ║"
    echo "╚════════════════════════════════════════════════════════════╝"
elif [ $PASS_RATE -ge 80 ]; then
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║          ⚠️  大部分測試通過                                 ║"
    echo "║        請檢查失敗的測試項目                                 ║"
    echo "╚════════════════════════════════════════════════════════════╝"
else
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║            ❌ 多數測試失敗                                  ║"
    echo "║         請運行修復腳本                                      ║"
    echo "║      ./fix_imported_pages.sh                              ║"
    echo "╚════════════════════════════════════════════════════════════╝"
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "🔧 可用工具"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "  ./quick_verify.sh          - 快速驗證測試"
echo "  ./check_imported_pages.sh  - 查看已導入頁面"
echo "  ./fix_imported_pages.sh    - 修復問題頁面"
echo "  ./final_test.sh            - 完整測試（本腳本）"
echo ""
echo "📖 完整文檔:"
echo "  SOLUTION_GUIDE.md         - 完整解決方案指南"
echo "  VERIFICATION_REPORT.md    - 驗證報告"
echo ""
