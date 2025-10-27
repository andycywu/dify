#!/bin/bash

# 測試批量目錄導入功能

echo "========================================"
echo "測試 Wiki.js 批量目錄導入功能"
echo "========================================"
echo ""

API_BASE="http://localhost:5050/api/wiki"

# 創建測試目錄結構
TEST_DIR="/tmp/wiki_test_import"
echo "📂 創建測試目錄: $TEST_DIR"
rm -rf "$TEST_DIR"
mkdir -p "$TEST_DIR/project1/docs"
mkdir -p "$TEST_DIR/project1/specs"
mkdir -p "$TEST_DIR/project2"

# 創建測試文件
echo "📝 創建測試 Markdown 文件..."

cat > "$TEST_DIR/README.md" << 'EOF'
# 測試項目集合

這是根目錄的 README 文件。

## 項目列表

- Project 1: 第一個測試項目
- Project 2: 第二個測試項目
EOF

cat > "$TEST_DIR/project1/README.md" << 'EOF'
# Project 1

這是 Project 1 的說明文檔。

## 功能

- 功能 A
- 功能 B
- 功能 C
EOF

cat > "$TEST_DIR/project1/docs/installation.md" << 'EOF'
# 安裝指南

## 系統需求

- Python 3.8+
- Docker
- PostgreSQL

## 安裝步驟

1. 克隆倉庫
2. 安裝依賴
3. 配置環境變量
4. 啟動服務
EOF

cat > "$TEST_DIR/project1/specs/architecture.md" << 'EOF'
# 架構設計

## 系統架構

```
Frontend -> API Gateway -> Backend Services
```

## 組件說明

- Frontend: React + TypeScript
- Backend: Python Flask
- Database: PostgreSQL
EOF

cat > "$TEST_DIR/project2/guide.md" << 'EOF'
# Project 2 使用指南

## 快速開始

1. 登錄系統
2. 創建新項目
3. 配置參數
4. 開始使用

## 注意事項

- 定期備份數據
- 檢查日誌文件
EOF

echo "✅ 測試文件創建完成"
echo ""

# 1. 掃描目錄
echo "1️⃣ 測試: 掃描目錄"
echo "請求: POST $API_BASE/scan-directory"
echo ""

SCAN_RESPONSE=$(curl -s -X POST "$API_BASE/scan-directory" \
  -H "Content-Type: application/json" \
  -d "{\"sourcePath\": \"$TEST_DIR\"}")

echo "響應:"
echo "$SCAN_RESPONSE" | jq '.'
echo ""

# 獲取文件數量
FILE_COUNT=$(echo "$SCAN_RESPONSE" | jq -r '.total // 0')
echo "📊 找到 $FILE_COUNT 個支持的文件"
echo ""

# 2. 批量導入 (保留目錄結構)
echo "2️⃣ 測試: 批量導入 (保留目錄結構)"
echo "請求: POST $API_BASE/batch-directory-import"
echo ""

IMPORT_RESPONSE=$(curl -s -X POST "$API_BASE/batch-directory-import" \
  -H "Content-Type: application/json" \
  -d "{
    \"sourcePath\": \"$TEST_DIR\",
    \"targetFolder\": \"/batch-test\",
    \"preserveStructure\": \"true\"
  }")

echo "響應:"
echo "$IMPORT_RESPONSE" | jq '.'
echo ""

# 檢查結果
SUCCESS_COUNT=$(echo "$IMPORT_RESPONSE" | jq -r '.success_count // 0')
FAILED_COUNT=$(echo "$IMPORT_RESPONSE" | jq -r '.failed_count // 0')
TOTAL_COUNT=$(echo "$IMPORT_RESPONSE" | jq -r '.total // 0')

echo "📊 導入統計:"
echo "   總計: $TOTAL_COUNT"
echo "   成功: $SUCCESS_COUNT"
echo "   失敗: $FAILED_COUNT"
echo ""

# 顯示導入的頁面
echo "📄 已創建的頁面:"
echo "$IMPORT_RESPONSE" | jq -r '.results[] | select(.success == true) | "   ✅ \(.file) -> \(.wiki_url)"'
echo ""

if [ "$FAILED_COUNT" -gt 0 ]; then
    echo "❌ 失敗的文件:"
    echo "$IMPORT_RESPONSE" | jq -r '.results[] | select(.success == false) | "   ❌ \(.file): \(.error)"'
    echo ""
fi

# 3. 測試扁平化導入
echo "3️⃣ 測試: 批量導入 (扁平化結構)"
echo ""

FLAT_RESPONSE=$(curl -s -X POST "$API_BASE/batch-directory-import" \
  -H "Content-Type: application/json" \
  -d "{
    \"sourcePath\": \"$TEST_DIR\",
    \"targetFolder\": \"/batch-flat\",
    \"preserveStructure\": \"false\"
  }")

echo "響應:"
echo "$FLAT_RESPONSE" | jq '.'
echo ""

SUCCESS_COUNT_FLAT=$(echo "$FLAT_RESPONSE" | jq -r '.success_count // 0')
echo "📊 扁平化導入成功: $SUCCESS_COUNT_FLAT 個頁面"
echo ""

# 4. 顯示目錄結構對比
echo "4️⃣ 目錄結構對比"
echo ""

echo "原始目錄結構:"
tree -F "$TEST_DIR" 2>/dev/null || find "$TEST_DIR" -type f -name "*.md" | sed 's|'"$TEST_DIR"'||g' | sort
echo ""

echo "Wiki.js 頁面結構 (保留結構):"
echo "$IMPORT_RESPONSE" | jq -r '.results[] | select(.success == true) | .wiki_url' | sort
echo ""

echo "Wiki.js 頁面結構 (扁平化):"
echo "$FLAT_RESPONSE" | jq -r '.results[] | select(.success == true) | .wiki_url' | sort
echo ""

# 5. 清理測試目錄
echo "🧹 清理測試目錄"
rm -rf "$TEST_DIR"
echo "✅ 清理完成"
echo ""

echo "========================================"
echo "測試完成"
echo "========================================"
echo ""
echo "📋 測試摘要:"
echo "   - 目錄掃描: $FILE_COUNT 個文件"
echo "   - 保留結構導入: $SUCCESS_COUNT 成功"
echo "   - 扁平化導入: $SUCCESS_COUNT_FLAT 成功"
echo ""
echo "🌐 訪問 Wiki.js 查看結果:"
echo "   http://localhost:3000/wiki/batch-test"
echo "   http://localhost:3000/wiki/batch-flat"
