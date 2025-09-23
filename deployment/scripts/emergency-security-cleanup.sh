#!/bin/bash

# 🚨 緊急安全清理腳本
# 當發現敏感信息洩露時使用

echo "🚨 開始緊急安全清理..."

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 1. 清理 VS Code History 擴展的敏感文件
echo "======================================================="
echo "1. 🧹 清理 VS Code History 擴展文件"
echo "======================================================="

if [ -d ".history" ]; then
    echo -e "${YELLOW}正在刪除 .history 目錄...${NC}"
    rm -rf .history/
    echo -e "${GREEN}✅ 已刪除 .history 目錄${NC}"
else
    echo -e "${GREEN}✅ .history 目錄不存在${NC}"
fi

# 2. 清理 Docker volumes 中的敏感文件
echo ""
echo "======================================================="
echo "2. 🧹 清理 Docker volumes 敏感文件"
echo "======================================================="

if [ -d "../docker/volumes" ]; then
    echo -e "${YELLOW}正在檢查 ../docker/volumes 中的 .env 文件...${NC}"
    find ../docker/volumes -name ".env*" -type f | while read file; do
        echo "發現: $file"
        # 備份後刪除
        cp "$file" "$file.backup.$(date +%Y%m%d_%H%M%S)" 2>/dev/null
        rm -f "$file"
        echo "已刪除: $file"
    done
    echo -e "${GREEN}✅ 已清理 Docker volumes 中的敏感文件${NC}"
else
    echo -e "${GREEN}✅ ../docker/volumes 目錄不存在${NC}"
fi

# 3. 檢查並清理其他潛在敏感文件
echo ""
echo "======================================================="
echo "3. 🧹 清理其他潛在敏感文件"
echo "======================================================="

# 清理臨時文件
find . -name "*.tmp" -name "*.temp" -delete 2>/dev/null
find . -name ".DS_Store" -delete 2>/dev/null

# 清理可能的密鑰文件
find . -name "*.key" -not -path "*/node_modules/*" -not -path "*/.git/*" | while read file; do
    if [[ "$file" != *"example"* ]] && [[ "$file" != *"template"* ]]; then
        echo -e "${YELLOW}發現密鑰文件: $file${NC}"
        echo "請手動檢查是否需要刪除"
    fi
done

# 4. 更新 .gitignore
echo ""
echo "======================================================="
echo "4. 🔒 更新 .gitignore 安全規則"
echo "======================================================="

# 檢查必要的 .gitignore 規則
REQUIRED_RULES=(
    ".history/"
    "../docker/volumes/"
    "*.key"
    "*.pem"
    "secrets/"
    "credentials/"
)

for rule in "${REQUIRED_RULES[@]}"; do
    if ! grep -Fxq "$rule" .gitignore; then
        echo "$rule" >> .gitignore
        echo "添加規則: $rule"
    fi
done

echo -e "${GREEN}✅ .gitignore 已更新${NC}"

# 5. 清理 Git 快取
echo ""
echo "======================================================="
echo "5. 🧹 清理 Git 快取"
echo "======================================================="

echo "清理 Git 快取中的敏感文件..."
git rm -r --cached .history/ 2>/dev/null || true
git rm -r --cached ../docker/volumes/ 2>/dev/null || true

echo -e "${GREEN}✅ Git 快取已清理${NC}"

# 6. 安全檢查摘要
echo ""
echo "======================================================="
echo "📊 安全清理完成摘要"
echo "======================================================="

echo -e "${GREEN}🎉 緊急安全清理完成！${NC}"
echo ""
echo "⚠️  重要提醒："
echo "1. 如果任何敏感信息曾經被提交到遠程倉庫，請立即更換所有相關密鑰"
echo "2. 考慮使用 git filter-repo 清理整個 Git 歷史"
echo "3. 通知團隊成員這次安全清理行動"
echo "4. 設置定期安全檢查計劃"
echo ""
echo "🔒 清理完成於 $(date)"
