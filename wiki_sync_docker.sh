#!/bin/bash

# Wiki.js 使用者同步腳本 (在 Docker 容器內執行)
# 此腳本會在 API 容器內執行同步操作

echo "🚀 Wiki.js 使用者同步工具"
echo "在 Docker 容器內執行同步操作"

# 檢查參數
if [ $# -lt 1 ]; then
    echo "用法:"
    echo "  $0 test-connection                    # 測試連接"
    echo "  $0 list-apps                         # 列出應用程式"
    echo "  $0 sync-user <app_name> <user_id>    # 同步單一使用者"
    echo "  $0 sync-all <app_name>               # 同步所有使用者"
    exit 1
fi

COMMAND=$1

# 設置環境變數 (使用 Docker 內部網路)
export WIKI_DB_HOST="db"
export WIKI_DB_PORT="5432"
export WIKI_DB_NAME="wiki"
export WIKI_DB_USER="postgres"
export WIKI_DB_PASSWORD="difyai123456"

# 在 API 容器內執行 Python 腳本
case $COMMAND in
    "test-connection")
        echo "🔄 在 API 容器內測試連接..."
        docker exec -e WIKI_DB_HOST="db" -e WIKI_DB_PORT="5432" -e WIKI_DB_NAME="wiki" -e WIKI_DB_USER="postgres" -e WIKI_DB_PASSWORD="difyai123456" docker-api-1 python wiki_user_sync_manager.py test-connection
        ;;
    "list-apps")
        echo "📱 在 API 容器內列出應用程式..."
        docker exec -e WIKI_DB_HOST="db" -e WIKI_DB_PORT="5432" -e WIKI_DB_NAME="wiki" -e WIKI_DB_USER="postgres" -e WIKI_DB_PASSWORD="difyai123456" docker-api-1 python wiki_user_sync_manager.py list-apps
        ;;
    "sync-user")
        if [ $# -ne 3 ]; then
            echo "❌ 錯誤: sync-user 需要 app_name 和 user_id 參數"
            exit 1
        fi
        APP_NAME=$2
        USER_ID=$3
        echo "🔄 在 API 容器內同步使用者 $USER_ID 到應用程式 $APP_NAME..."
        docker exec -e WIKI_DB_HOST="db" -e WIKI_DB_PORT="5432" -e WIKI_DB_NAME="wiki" -e WIKI_DB_USER="postgres" -e WIKI_DB_PASSWORD="difyai123456" docker-api-1 python wiki_user_sync_manager.py sync-user "$APP_NAME" "$USER_ID"
        ;;
    "sync-all")
        if [ $# -ne 2 ]; then
            echo "❌ 錯誤: sync-all 需要 app_name 參數"
            exit 1
        fi
        APP_NAME=$2
        echo "🔄 在 API 容器內同步所有使用者到應用程式 $APP_NAME..."
        docker exec -e WIKI_DB_HOST="db" -e WIKI_DB_PORT="5432" -e WIKI_DB_NAME="wiki" -e WIKI_DB_USER="postgres" -e WIKI_DB_PASSWORD="difyai123456" docker-api-1 python wiki_user_sync_manager.py sync-all "$APP_NAME"
        ;;
    *)
        echo "❌ 未知命令: $COMMAND"
        exit 1
        ;;
esac