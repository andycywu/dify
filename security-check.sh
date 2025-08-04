#!/bin/bash

# 🔒 Dify 項目安全檢查腳本
# 使用方法: ./security-check.sh

echo "🔍 開始安全檢查..."

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 檢查結果統計
WARNINGS=0
ERRORS=0

echo "======================================================="
echo "1. 🔍 檢查是否有新的 .env 文件"
echo "======================================================="

ENV_FILES=$(find . -name ".env*" -type f | grep -v example | grep -v template | grep -v node_modules)
if [ -n "$ENV_FILES" ]; then
    echo -e "${RED}⚠️  發現潛在的敏感環境變量文件:${NC}"
    echo "$ENV_FILES"
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "${GREEN}✅ 沒有發現敏感的 .env 文件${NC}"
fi

echo ""
echo "======================================================="
echo "2. 🔍 檢查 Git 狀態中的環境變量文件"
echo "======================================================="

GIT_ENV_STATUS=$(git status --porcelain | grep -i "\.env")
if [ -n "$GIT_ENV_STATUS" ]; then
    echo -e "${RED}⚠️  Git 狀態中發現環境變量文件:${NC}"
    echo "$GIT_ENV_STATUS"
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "${GREEN}✅ Git 狀態正常，無環境變量文件${NC}"
fi

echo ""
echo "======================================================="
echo "3. 🔍 檢查硬編碼的敏感信息"
echo "======================================================="

# 檢查常見的敏感信息模式
SENSITIVE_PATTERNS="password.*=|secret.*=|key.*=|token.*=|api.*key|access.*key"
SENSITIVE_FILES=$(grep -r -i -E "$SENSITIVE_PATTERNS" \
    --include="*.py" --include="*.js" --include="*.ts" --include="*.json" --include="*.yaml" --include="*.yml" \
    . 2>/dev/null | grep -v example | grep -v template | grep -v node_modules | head -5)

if [ -n "$SENSITIVE_FILES" ]; then
    echo -e "${YELLOW}⚠️  發現可能的硬編碼敏感信息:${NC}"
    echo "$SENSITIVE_FILES"
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "${GREEN}✅ 沒有發現明顯的硬編碼敏感信息${NC}"
fi

echo ""
echo "======================================================="
echo "4. 🔍 檢查 .gitignore 配置"
echo "======================================================="

if grep -q "\.env" .gitignore; then
    echo -e "${GREEN}✅ .gitignore 已正確配置排除 .env 文件${NC}"
else
    echo -e "${RED}❌ .gitignore 未配置排除 .env 文件${NC}"
    ERRORS=$((ERRORS + 1))
fi

echo ""
echo "======================================================="
echo "5. 🔍 檢查大文件 (可能包含敏感數據)"
echo "======================================================="

LARGE_FILES=$(find . -type f -size +10M | grep -v node_modules | grep -v .git | head -5)
if [ -n "$LARGE_FILES" ]; then
    echo -e "${YELLOW}⚠️  發現大文件 (>10MB):${NC}"
    echo "$LARGE_FILES"
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "${GREEN}✅ 沒有發現異常大文件${NC}"
fi

echo ""
echo "======================================================="
echo "📊 檢查結果摘要"
echo "======================================================="

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}🎉 恭喜！所有安全檢查都通過了！${NC}"
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠️  檢查完成，發現 $WARNINGS 個警告${NC}"
    echo "建議檢查上述警告項目"
else
    echo -e "${RED}❌ 檢查完成，發現 $ERRORS 個錯誤和 $WARNINGS 個警告${NC}"
    echo "請立即處理上述錯誤項目"
fi

echo ""
echo "🔒 安全檢查完成於 $(date)"
echo "建議定期運行此腳本以確保項目安全"
