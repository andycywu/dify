#!/bin/bash

# 檢查所有環境文件中的容器間 API 調用配置是否一致

echo "🔍 檢查容器間 API 調用配置一致性..."
echo

# 定義應該在所有環境文件中一致的容器間調用配置
EXPECTED_CONFIGS=(
    "API_URL=http://api:5001"
    "WIKI_GRAPHQL_URL=http://wiki:3000/graphql"
    "OLLAMA_BASE_URL=http://host.docker.internal:11434"
)

# 定義要檢查的環境文件
ENV_FILES=(
    ".env.docker"
    ".env.local"
    ".env.production"
    ".env.production.template"
)

# 檢查每個配置項在所有文件中是否一致
for config in "${EXPECTED_CONFIGS[@]}"; do
    echo "📋 檢查配置: $config"
    
    for file in "${ENV_FILES[@]}"; do
        if [ -f "$file" ]; then
            if grep -q "^$config" "$file"; then
                echo "  ✅ $file: 找到正確配置"
            else
                echo "  ❌ $file: 配置不一致或缺失"
                # 顯示實際的配置
                key=$(echo "$config" | cut -d'=' -f1)
                actual=$(grep "^$key=" "$file" 2>/dev/null || echo "未找到")
                echo "     實際配置: $actual"
            fi
        else
            echo "  ⚠️  $file: 文件不存在"
        fi
    done
    echo
done

# 檢查資料庫連接配置（允許密碼不同，但主機名應該一致）
echo "📋 檢查資料庫連接配置 (主機名應為 db:5432):"
for file in "${ENV_FILES[@]}"; do
    if [ -f "$file" ]; then
        db_url=$(grep "^DATABASE_URL=" "$file" 2>/dev/null)
        if [[ "$db_url" =~ @db:5432/ ]]; then
            echo "  ✅ $file: 資料庫主機名正確 (db:5432)"
        else
            echo "  ❌ $file: 資料庫主機名不正確"
            echo "     實際配置: $db_url"
        fi
    fi
done

echo
echo "🎯 總結: 容器間 API 調用應該在所有環境中使用相同的 Docker 服務名！"
echo "   - API: api:5001"
echo "   - Database: db:5432"  
echo "   - Wiki: wiki:3000"
echo "   - Ollama: host.docker.internal:11434 (外部服務)"