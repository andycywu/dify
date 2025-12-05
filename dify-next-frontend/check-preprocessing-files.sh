#!/bin/bash

# 前處理系統檔案檢查腳本
# 執行此腳本以驗證所有必要檔案是否已建立

echo "🔍 檢查前處理系統檔案..."
echo ""

# 計數器
total=0
success=0
missing=0

# 檢查函數
check_file() {
    local file=$1
    total=$((total + 1))
    if [ -f "$file" ]; then
        echo "✅ $file"
        success=$((success + 1))
    else
        echo "❌ $file (缺失)"
        missing=$((missing + 1))
    fi
}

# 核心檔案
echo "📁 核心模組..."
check_file "lib/preprocess/types.ts"
check_file "lib/preprocess/config.ts"
check_file "lib/preprocess/index.ts"
echo ""

# 偵測模組
echo "📁 檔案偵測..."
check_file "lib/preprocess/detector/detectFileType.ts"
echo ""

# Parser 模組
echo "📁 Parser 模組..."
check_file "lib/preprocess/parsers/index.ts"
check_file "lib/preprocess/parsers/parseTxt.ts"
check_file "lib/preprocess/parsers/parseMarkdown.ts"
check_file "lib/preprocess/parsers/parseCsv.ts"
check_file "lib/preprocess/parsers/parseExcel.ts"
check_file "lib/preprocess/parsers/parseDocx.ts"
check_file "lib/preprocess/parsers/parsePdf.ts"
check_file "lib/preprocess/parsers/parseHtml.ts"
check_file "lib/preprocess/parsers/parseVtt.ts"
check_file "lib/preprocess/parsers/parseProperties.ts"
echo ""

# Chunker 模組
echo "📁 Chunker 模組..."
check_file "lib/preprocess/chunker/chunkMarkdown.ts"
echo ""

# API Route
echo "📁 API Route..."
check_file "pages/api/documents/preprocess.ts"
echo ""

# 修改過的檔案
echo "📁 已修改的檔案..."
check_file "components/Knowledge/DocumentManagement.tsx"
check_file "next.config.js"
echo ""

# 文件
echo "📁 文件..."
check_file "PREPROCESSING_INSTALLATION.md"
check_file "PREPROCESSING_IMPLEMENTATION_SUMMARY.md"
echo ""

# 總結
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 檢查結果："
echo "   總計: $total 個檔案"
echo "   ✅ 成功: $success 個"
echo "   ❌ 缺失: $missing 個"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ $missing -eq 0 ]; then
    echo "🎉 所有檔案都已建立！可以開始部署。"
    echo ""
    echo "📝 下一步："
    echo "   1. 執行: npm install --save pdf-parse mammoth xlsx csv-parse cheerio node-html-markdown formidable @types/formidable gray-matter"
    echo "   2. 執行: npm install --save-dev @types/node"
    echo "   3. 執行: npm run build"
    echo "   4. 執行: npm start"
    echo "   5. 測試前處理功能"
    exit 0
else
    echo "⚠️  有 $missing 個檔案缺失，請檢查。"
    exit 1
fi
