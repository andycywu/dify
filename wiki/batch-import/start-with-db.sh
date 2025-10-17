#!/bin/bash
# 啟動批量導入服務並連接到 Docker 中的數據庫

echo "🔧 配置數據庫連接..."

# 從 docker-compose.yaml 獲取數據庫配置
export WIKI_DB_HOST=localhost
export WIKI_DB_PORT=5432
export WIKI_DB_NAME=wiki
export WIKI_DB_USER=wiki_app
export WIKI_DB_PASSWORD=wiki_pass

# 如果數據庫在 Docker 中，需要檢查端口映射
# 檢查 Docker 數據庫容器
if docker ps | grep -q "postgres"; then
    echo "✅ 發現 Docker PostgreSQL 容器"

    # 獲取容器名稱
    DB_CONTAINER=$(docker ps --format "{{.Names}}" | grep -E "(postgres|db)" | head -1)
    echo "📦 數據庫容器: $DB_CONTAINER"

    # 檢查端口映射
    DB_PORT=$(docker port $DB_CONTAINER 2>/dev/null | grep 5432 | cut -d':' -f2)
    if [ -n "$DB_PORT" ]; then
        export WIKI_DB_PORT=$DB_PORT
        echo "🔌 數據庫端口: $DB_PORT"
    else
        echo "⚠️  數據庫沒有暴露端口，使用 Docker 內部網絡"
        # 獲取容器 IP
        DB_IP=$(docker inspect -f '{{range.NetworkSettings.Networks}}{{.IPAddress}}{{end}}' $DB_CONTAINER)
        if [ -n "$DB_IP" ]; then
            export WIKI_DB_HOST=$DB_IP
            echo "🌐 數據庫 IP: $DB_IP"
        fi
    fi
fi

echo ""
echo "📋 數據庫配置:"
echo "   主機: $WIKI_DB_HOST"
echo "   端口: $WIKI_DB_PORT"
echo "   數據庫: $WIKI_DB_NAME"
echo "   用戶: $WIKI_DB_USER"
echo ""

# 測試數據庫連接
echo "🧪 測試數據庫連接..."
if command -v psql > /dev/null; then
    PGPASSWORD=$WIKI_DB_PASSWORD psql -h $WIKI_DB_HOST -p $WIKI_DB_PORT -U $WIKI_DB_USER -d $WIKI_DB_NAME -c "SELECT version();" > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo "✅ 數據庫連接成功！"
    else
        echo "❌ 數據庫連接失敗"
        echo "請檢查:"
        echo "1. PostgreSQL 是否運行"
        echo "2. 數據庫憑證是否正確"
        echo "3. 防火牆設置"
    fi
else
    echo "⚠️  psql 未安裝，跳過連接測試"
fi

echo ""
echo "🚀 啟動批量導入服務..."
python3 batch_import_server.py
