#!/bin/bash
# Wiki.js 批量導入測試腳本

echo "🧪 Wiki.js 批量導入功能測試腳本"
echo "=================================="
echo ""

# 顏色定義
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# API 端點
API_URL="http://localhost:5050/api/wiki/batch-import"
WIKI_URL="http://localhost:3000"

# 測試函數
test_upload() {
    local file=$1
    local name=$(basename "$file")

    echo -e "${YELLOW}📤 上傳: $name${NC}"

    response=$(curl -s -X POST $API_URL \
        -F "file=@$file" \
        -F "targetFolder=/imported" \
        -F "pageTemplate=standard" \
        -F "namingRule=original")

    if echo "$response" | grep -q '"success": true'; then
        page_id=$(echo "$response" | grep -o '"page_id": [0-9]*' | grep -o '[0-9]*')
        wiki_url=$(echo "$response" | grep -o '"/wiki/[^"]*"' | tr -d '"')
        echo -e "${GREEN}✅ 成功! Page ID: $page_id${NC}"
        echo -e "${GREEN}   URL: $WIKI_URL$wiki_url${NC}"

        # 檢查資料庫
        docker exec docker-db-1 psql -U wiki_app -d wiki -t -c \
            "SELECT '   render: ' || LENGTH(render) || ' bytes, toc: ' || (toc IS NOT NULL) FROM pages WHERE id = $page_id;" 2>/dev/null | xargs
        echo ""
        return 0
    else
        error=$(echo "$response" | grep -o '"error": "[^"]*"' | sed 's/"error": "\(.*\)"/\1/')
        echo -e "${RED}❌ 失敗: $error${NC}"
        echo ""
        return 1
    fi
}

# 創建測試文件
create_test_files() {
    echo "📝 創建測試文件..."

    # Markdown 測試
    cat > /tmp/test_markdown.md << 'EOF'
# Markdown 測試文件

這是一個 **Markdown** 測試文件。

## 功能列表

- 粗體和斜體
- 代碼塊
- 列表
- 表格

## 代碼示例

```python
def hello_world():
    print("Hello, Wiki.js!")
```

## 表格

| 列A | 列B | 列C |
|-----|-----|-----|
| 1   | 2   | 3   |
| 4   | 5   | 6   |
EOF

    # 純文本測試
    cat > /tmp/test_text.txt << 'EOF'
純文本測試文件

這是一個簡單的純文本文件。
用於測試 Wiki.js 批量導入功能。

多行文本測試
第一行
第二行
第三行
EOF

    # CSV 測試
    cat > /tmp/test_data.csv << 'EOF'
名稱,年齡,城市
張三,25,台北
李四,30,台中
王五,28,高雄
EOF

    echo -e "${GREEN}✅ 測試文件創建完成${NC}"
    echo ""
}

# 檢查服務狀態
check_service() {
    echo "🔍 檢查服務狀態..."

    if ! docker ps | grep -q wiki-batch-importer; then
        echo -e "${RED}❌ wiki-batch-importer 服務未運行${NC}"
        return 1
    fi

    if ! docker ps | grep -q dify-wiki; then
        echo -e "${RED}❌ Wiki.js 服務未運行${NC}"
        return 1
    fi

    # 檢查 API Key
    api_key=$(docker exec wiki-batch-importer env | grep WIKI_API_KEY= | cut -d= -f2)
    if [ -z "$api_key" ]; then
        echo -e "${RED}❌ WIKI_API_KEY 未配置${NC}"
        return 1
    fi

    echo -e "${GREEN}✅ 所有服務正常運行${NC}"
    echo -e "${GREEN}✅ API Key 已配置${NC}"
    echo ""
    return 0
}

# 查看最近的頁面
view_recent_pages() {
    echo "📊 最近創建的頁面:"
    docker exec docker-db-1 psql -U wiki_app -d wiki -c \
        "SELECT id, path, title,
                CASE WHEN render IS NOT NULL THEN '✅' ELSE '❌' END as render,
                LENGTH(render) as render_len,
                \"createdAt\"
         FROM pages
         WHERE path LIKE 'imported/%'
         ORDER BY id DESC
         LIMIT 10;" 2>/dev/null
    echo ""
}

# 清理測試頁面
cleanup_test_pages() {
    echo "🧹 清理測試頁面..."

    read -p "確定要刪除所有測試頁面嗎? (y/N) " -n 1 -r
    echo ""

    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker exec docker-db-1 psql -U wiki_app -d wiki -c \
            "DELETE FROM pages WHERE path LIKE 'imported/test_%';" 2>/dev/null
        docker exec docker-db-1 psql -U wiki_app -d wiki -c \
            "DELETE FROM \"pageTree\" WHERE path LIKE 'imported/test_%';" 2>/dev/null
        echo -e "${GREEN}✅ 清理完成${NC}"
    else
        echo "取消清理"
    fi
    echo ""
}

# 主菜單
main_menu() {
    while true; do
        echo "=================================="
        echo "Wiki.js 批量導入測試菜單"
        echo "=================================="
        echo "1. 檢查服務狀態"
        echo "2. 創建測試文件"
        echo "3. 測試 Markdown 導入"
        echo "4. 測試純文本導入"
        echo "5. 測試 CSV 導入"
        echo "6. 測試所有格式"
        echo "7. 查看最近的頁面"
        echo "8. 清理測試頁面"
        echo "9. 查看服務日誌"
        echo "0. 退出"
        echo ""
        read -p "請選擇操作 (0-9): " choice

        case $choice in
            1)
                check_service
                ;;
            2)
                create_test_files
                ;;
            3)
                create_test_files
                test_upload "/tmp/test_markdown.md"
                ;;
            4)
                create_test_files
                test_upload "/tmp/test_text.txt"
                ;;
            5)
                create_test_files
                test_upload "/tmp/test_data.csv"
                ;;
            6)
                create_test_files
                echo "🧪 開始批量測試..."
                echo ""
                test_upload "/tmp/test_markdown.md"
                test_upload "/tmp/test_text.txt"
                test_upload "/tmp/test_data.csv"
                echo "=================================="
                echo -e "${GREEN}✅ 批量測試完成！${NC}"
                ;;
            7)
                view_recent_pages
                ;;
            8)
                cleanup_test_pages
                ;;
            9)
                echo "📋 最近的服務日誌:"
                docker logs wiki-batch-importer --tail 20 2>&1 | grep -E "(🔍|❌|✅)" || echo "無相關日誌"
                echo ""
                ;;
            0)
                echo "👋 再見！"
                exit 0
                ;;
            *)
                echo -e "${RED}❌ 無效選擇${NC}"
                echo ""
                ;;
        esac

        read -p "按 Enter 繼續..."
        clear
    done
}

# 如果有命令行參數，直接執行
if [ $# -gt 0 ]; then
    case $1 in
        check)
            check_service
            ;;
        test)
            check_service || exit 1
            create_test_files
            test_upload "/tmp/test_markdown.md"
            test_upload "/tmp/test_text.txt"
            test_upload "/tmp/test_data.csv"
            ;;
        clean)
            cleanup_test_pages
            ;;
        view)
            view_recent_pages
            ;;
        *)
            echo "用法: $0 [check|test|clean|view]"
            echo "  check - 檢查服務狀態"
            echo "  test  - 運行快速測試"
            echo "  clean - 清理測試頁面"
            echo "  view  - 查看最近的頁面"
            echo ""
            echo "或直接運行腳本進入交互式菜單"
            ;;
    esac
else
    # 清屏並顯示菜單
    clear
    main_menu
fi
