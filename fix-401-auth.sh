#!/bin/bash
# Dify 401 認證問題快速修復腳本

echo "🔧 開始修復 Dify 401 認證問題..."

# 檢查服務是否運行
echo "📦 檢查服務狀態..."
if ! docker compose ps | grep -q "Up"; then
    echo "❌ Docker 服務未運行，請先啟動服務"
    echo "執行: docker compose up -d"
    exit 1
fi

echo "✅ Docker 服務正在運行"

echo ""
echo "🔄 步驟 1: 重啟 API 和 Web 服務..."
docker compose restart api web

echo "⏳ 等待服務重啟..."
sleep 10

echo ""
echo "🔄 步驟 2: 檢查數據庫初始化..."

# 檢查數據庫是否有用戶表
DB_READY=$(docker compose exec -T db psql -U postgres -d dify -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'accounts');" 2>/dev/null | grep -c "t")

if [ "$DB_READY" = "1" ]; then
    echo "✅ 數據庫表存在"
    
    # 檢查是否有用戶
    USER_COUNT=$(docker compose exec -T db psql -U postgres -d dify -c "SELECT count(*) FROM accounts;" 2>/dev/null | grep -E "^\s*[0-9]+\s*$" | tr -d ' ')
    
    if [ "$USER_COUNT" = "0" ]; then
        echo "⚠️  數據庫中沒有用戶，需要初始化"
        echo "🏗️ 執行數據庫初始化..."
        docker compose exec api python -m flask init-db
    else
        echo "✅ 數據庫中有 $USER_COUNT 個用戶"
    fi
else
    echo "⚠️  數據庫表不存在，執行遷移..."
    docker compose exec api python -m flask db upgrade
    docker compose exec api python -m flask init-db
fi

echo ""
echo "🔄 步驟 3: 重置管理員密碼..."

# 嘗試重置管理員密碼
echo "正在重置管理員密碼為: dify12345"
docker compose exec api python -c "
from extensions.ext_database import db
from models.account import Account
from werkzeug.security import generate_password_hash
import uuid

# 查找或創建管理員帳號
admin = Account.query.filter_by(email='admin@dify.ai').first()
if not admin:
    admin = Account.query.first()
    if not admin:
        # 創建新的管理員帳號
        admin = Account()
        admin.id = str(uuid.uuid4())
        admin.email = 'admin@dify.ai'
        admin.name = 'Admin'
        admin.is_active = True
        db.session.add(admin)

# 設置密碼
admin.password = 'dify12345'
admin.password_salt = ''
db.session.commit()
print(f'管理員帳號已重置: {admin.email}')
"

echo ""
echo "🔄 步驟 4: 清除應用緩存..."
docker compose exec api python -c "
from extensions.ext_redis import redis_client
try:
    redis_client.flushdb()
    print('Redis 緩存已清除')
except:
    print('無法清除 Redis 緩存')
"

echo ""
echo "🔄 步驟 5: 重啟服務以應用更改..."
docker compose restart api web nginx

echo "⏳ 等待服務完全啟動..."
sleep 15

echo ""
echo "✅ 修復完成！"
echo ""
echo "🌐 現在請嘗試:"
echo "1. 清除瀏覽器的所有 Cookie 和本地存儲"
echo "2. 訪問: http://54.169.166.197"
echo "3. 使用以下憑據登入:"
echo "   Email: admin@dify.ai"
echo "   Password: dify12345"
echo ""
echo "🔍 如果仍有問題，請檢查:"
echo "- 瀏覽器開發者工具的 Console 和 Network 標籤"
echo "- API 日誌: docker compose logs api"
echo ""
echo "💡 備用登入憑據 (如果上述不起作用):"
echo "   嘗試檢查: docker compose exec db psql -U postgres -d dify -c \"SELECT email FROM accounts;\""
