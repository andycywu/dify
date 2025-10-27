#!/bin/bash
# 批量導入服務測試腳本

echo "🧪 測試批量導入服務 API"
echo "================================"

# 測試 1: 檢查支持的格式
echo ""
echo "📋 測試 1: 獲取支持的文件格式"
echo "curl http://localhost:5050/api/wiki/supported-formats"
curl -s http://localhost:5050/api/wiki/supported-formats
echo ""
echo ""

# 測試 2: 檢查服務健康狀態
echo "🏥 測試 2: 檢查服務健康狀態"
echo "curl http://localhost:5050/health"
curl -s http://localhost:5050/health
echo ""
echo ""

# 測試 3: 創建測試文件並上傳
echo "📤 測試 3: 上傳測試 Markdown 文件"
TEST_FILE="/tmp/test_upload.md"
cat > $TEST_FILE << 'EOF'
# 測試文檔

這是一個測試文檔，用於驗證批量導入功能。

## 功能特點

- 支持多種文件格式
- 自動轉換為 Markdown
- 批量處理能力

## 代碼示例

```python
def hello_world():
    print("Hello, Wiki.js!")
```

## 表格示例

| 欄位 | 說明 |
|------|------|
| 姓名 | 用戶姓名 |
| 郵箱 | 聯繫郵箱 |
EOF

echo "測試文件已創建: $TEST_FILE"
echo ""
echo "執行上傳..."
curl -X POST http://localhost:5050/api/wiki/batch-import \
  -F "file=@$TEST_FILE" \
  -F "target_folder=/test" \
  -F "naming_rule=original" \
  -F "preserve_formatting=true"
echo ""
echo ""

echo "✅ 測試完成！"
