#!/bin/bash

# GitGuardian 設置驗證腳本
# 此腳本用於驗證 GitGuardian 整合是否正確設置

set -e

echo "🔍 GitGuardian 設置驗證工具"
echo "================================"

# 檢查必要的文件是否存在
echo "📁 檢查配置文件..."

required_files=(
    ".github/workflows/gitguardian-security-scan.yml"
    ".github/workflows/gitguardian-advanced-scan.yml"
    ".github/workflows/gitguardian-pr-check.yml"
    ".github/workflows/gitguardian-reliable.yml"
    ".gitguardian.yaml"
    "GITGUARDIAN_SETUP_GUIDE.md"
)

missing_files=()

for file in "${required_files[@]}"; do
    if [[ -f "$file" ]]; then
        echo "✅ $file"
    else
        echo "❌ $file (缺失)"
        missing_files+=("$file")
    fi
done

if [[ ${#missing_files[@]} -gt 0 ]]; then
    echo ""
    echo "❌ 發現缺失的文件，請確保所有必要的文件都已創建。"
    exit 1
fi

echo ""
echo "🔑 檢查 GitHub Secrets..."

# 提醒用戶檢查 GitHub Secrets
echo "請手動確認以下 GitHub Secret 已設置："
echo "- GITGUARDIAN_API_KEY"
echo ""
echo "要檢查 GitHub Secrets："
echo "1. 前往 GitHub repository"
echo "2. Settings → Secrets and variables → Actions"
echo "3. 確認 GITGUARDIAN_API_KEY 存在"

echo ""
echo "🧪 檢查 GitGuardian CLI（可選）..."

if command -v ggshield &> /dev/null; then
    echo "✅ GitGuardian CLI (ggshield) 已安裝"
    
    # 檢查版本
    version=$(ggshield --version 2>/dev/null || echo "無法獲取版本")
    echo "   版本: $version"
    
    echo ""
    echo "🔍 測試本地掃描功能..."
    
    # 創建一個測試文件
    cat > test_secrets.py << 'EOF'
# 這是一個測試文件，包含假的秘密用於測試 GitGuardian
# ggignore - 忽略這些測試秘密

# 假的 API 密鑰（僅用於測試）
fake_api_key = "test_api_12345"
dummy_secret = "dummy_secret_value"

# 真實的敏感信息示例（會被檢測到）
# 注意：這些不是真實的憑證
suspicious_aws_key = "AKIAIOSFODNN7EXAMPLE"
suspicious_secret = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
EOF

    echo "📝 創建測試文件 test_secrets.py..."
    
    # 嘗試掃描測試文件
    if ggshield secret scan path test_secrets.py --exit-zero 2>/dev/null; then
        echo "✅ 本地掃描功能正常"
    else
        echo "⚠️  本地掃描可能需要設置 API 密鑰"
        echo "   執行: export GITGUARDIAN_API_KEY='your_api_key'"
    fi
    
    # 清理測試文件
    rm -f test_secrets.py
    echo "🧹 清理測試文件"
    
else
    echo "⚠️  GitGuardian CLI 未安裝（本地掃描需要）"
    echo "   安裝方式: pip install ggshield"
fi

echo ""
echo "📋 驗證 Workflow 語法..."

# 檢查 YAML 語法（如果有 yamllint）
if command -v yamllint &> /dev/null; then
    echo "🔍 使用 yamllint 檢查 YAML 語法..."
    for file in .github/workflows/gitguardian-*.yml; do
        if yamllint "$file" &> /dev/null; then
            echo "✅ $file 語法正確"
        else
            echo "⚠️  $file 可能有語法問題"
        fi
    done
else
    echo "⚠️  yamllint 未安裝，跳過 YAML 語法檢查"
    echo "   安裝方式: pip install yamllint"
fi

echo ""
echo "🎯 下一步行動清單："
echo "==================="
echo "1. 🔑 確保在 GitHub 中設置了 GITGUARDIAN_API_KEY secret"
echo "2. 🌐 註冊 GitGuardian 帳戶並獲取 API 密鑰"
echo "3. 🧪 創建一個測試 PR 來驗證掃描功能"
echo "4. 📖 閱讀 GITGUARDIAN_SETUP_GUIDE.md 了解詳細使用方法"
echo "5. 🛡️  考慮設置分支保護規則，要求 GitGuardian 檢查通過"

echo ""
echo "✅ GitGuardian 設置驗證完成！"

# 如果在 git repository 中，提供 git 相關建議
if git rev-parse --git-dir > /dev/null 2>&1; then
    echo ""
    echo "📦 Git 操作建議："
    echo "git add ."
    echo "git commit -m 'feat: add GitGuardian security scanning integration'"
    echo "git push origin main"
fi
