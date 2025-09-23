#!/bin/bash

echo "📤 上傳本機 dev.db 到 EC2"
echo "================================"

# 設定變數
LOCAL_DB_PATH="./dify-next-frontend/prisma/dev.db"
EC2_HOST="ec2-user@ec2-54-169-166-197.ap-southeast-1.compute.amazonaws.com"
EC2_DB_PATH="/home/ec2-user/dify/../docker/volumes/dify-next-frontend/dev.db"
BACKUP_TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "📋 上傳資訊："
echo "本機資料庫: $LOCAL_DB_PATH"
echo "EC2 目標: $EC2_HOST:$EC2_DB_PATH"
echo ""

# 1. 檢查本機資料庫文件
echo "🔍 檢查本機資料庫文件..."
if [ ! -f "$LOCAL_DB_PATH" ]; then
    echo "❌ 找不到本機資料庫文件: $LOCAL_DB_PATH"
    exit 1
fi

echo "✅ 本機資料庫文件資訊："
ls -la "$LOCAL_DB_PATH"
echo ""

# 2. 檢查本機資料庫內容（可選）
echo "🔍 檢查本機資料庫內容..."
if command -v sqlite3 >/dev/null 2>&1; then
    echo "本機資料庫表："
    sqlite3 "$LOCAL_DB_PATH" ".tables"
    echo ""
    echo "本機使用者數量："
    sqlite3 "$LOCAL_DB_PATH" "SELECT COUNT(*) as user_count FROM User;"
    echo ""
else
    echo "⚠️  sqlite3 未安裝，跳過本機資料庫內容檢查"
fi

# 3. 連接 EC2 並備份現有資料庫
echo "💾 備份 EC2 現有資料庫..."
ssh "$EC2_HOST" "
    cd /home/ec2-user/dify/docker
    if [ -f volumes/dify-next-frontend/dev.db ]; then
        echo '備份現有資料庫...'
        cp volumes/dify-next-frontend/dev.db volumes/dify-next-frontend/dev.db.backup.$BACKUP_TIMESTAMP
        echo '✅ 備份完成: dev.db.backup.$BACKUP_TIMESTAMP'
    else
        echo '⚠️  EC2 上沒有現有資料庫文件'
    fi
"

# 4. 停止 dify-next-frontend 容器
echo "⏸️  停止 dify-next-frontend 容器..."
ssh "$EC2_HOST" "
    cd /home/ec2-user/dify/docker
    docker-compose stop dify-next-frontend
"

# 5. 上傳本機資料庫到 EC2
echo "📤 上傳本機資料庫到 EC2..."
scp "$LOCAL_DB_PATH" "$EC2_HOST:$EC2_DB_PATH"

if [ $? -eq 0 ]; then
    echo "✅ 資料庫上傳成功！"
else
    echo "❌ 資料庫上傳失敗！"
    exit 1
fi

# 6. 設定正確的文件權限
echo "🔧 設定文件權限..."
ssh "$EC2_HOST" "
    cd /home/ec2-user/dify/docker
    # 設定正確的所有者和權限
    sudo chown 1001:1001 volumes/dify-next-frontend/dev.db
    sudo chmod 644 volumes/dify-next-frontend/dev.db
    echo '✅ 權限設定完成'
    
    # 檢查上傳後的文件
    echo '📊 上傳後的文件資訊：'
    ls -la volumes/dify-next-frontend/dev.db
"

# 7. 重新啟動 dify-next-frontend 容器
echo "🔄 重新啟動 dify-next-frontend 容器..."
ssh "$EC2_HOST" "
    cd /home/ec2-user/dify/docker
    docker-compose up -d dify-next-frontend
"

# 8. 等待容器啟動
echo "⏳ 等待容器啟動..."
sleep 30

# 9. 驗證上傳後的資料庫
echo "🔍 驗證上傳後的資料庫..."
ssh "$EC2_HOST" "
    cd /home/ec2-user/dify/docker
    
    echo '=== 檢查容器狀態 ==='
    docker-compose ps dify-next-frontend
    
    echo ''
    echo '=== 檢查應用健康狀態 ==='
    curl -s http://localhost:3000/api/health | jq '.' 2>/dev/null || curl -s http://localhost:3000/api/health
    
    echo ''
    echo '=== 檢查容器內資料庫 ==='
    docker-compose exec -T dify-next-frontend sh -c '
        echo \"資料庫文件資訊:\"
        ls -la /app/data/dev.db
        
        echo \"\"
        echo \"使用 Node.js 快速檢查使用者數量:\"
        node -e \"
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();
        prisma.user.count().then(count => {
            console.log('使用者數量:', count);
            return prisma.general.count();
        }).then(count => {
            console.log('設定數量:', count);
            return prisma.userUsage.count();
        }).then(count => {
            console.log('使用量記錄數量:', count);
            prisma.\\\$disconnect();
        }).catch(err => {
            console.error('查詢錯誤:', err.message);
            prisma.\\\$disconnect();
        });
        \"
    '
"

echo ""
echo "✅ 資料庫上傳完成！"
echo ""
echo "📋 總結："
echo "================================"
echo "✅ 本機資料庫已上傳到 EC2"
echo "✅ 原始資料庫已備份為 dev.db.backup.$BACKUP_TIMESTAMP"
echo "✅ 容器已重新啟動"
echo "✅ 權限已正確設定"
echo ""
echo "🌐 現在可以訪問："
echo "   - dify-next-frontend: http://54.169.166.197"
echo "   - 健康檢查: http://54.169.166.197/api/health"
echo ""
echo "📋 如需檢查日誌:"
echo "   ssh $EC2_HOST 'cd /home/ec2-user/docker && docker-compose logs dify-next-frontend'"
echo ""
echo "🔄 如需回滾到舊資料庫:"
echo "   ssh $EC2_HOST 'cd /home/ec2-user/dify/docker && cp volumes/dify-next-frontend/dev.db.backup.$BACKUP_TIMESTAMP volumes/dify-next-frontend/dev.db'"
