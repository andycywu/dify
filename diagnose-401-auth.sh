#!/bin/bash
# Dify 401 認證問題診斷和修復腳本

echo "🔍 Dify 401 UNAUTHORIZED 錯誤診斷開始..."
echo "============================================="

# 檢查 Docker 服務狀態
echo "📦 檢查 Docker 服務狀態:"
docker compose ps

echo ""
echo "🌐 檢查 API 連接:"

# 測試基本連接（應該返回 200 或 404，不是 502）
echo "- 測試 API 基本連接:"
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" http://54.169.166.197/console/api/ || echo "❌ 連接失敗"

echo "- 測試健康檢查端點:"
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" http://54.169.166.197/console/api/health || echo "❌ 健康檢查失敗"

echo ""
echo "🔑 檢查認證相關配置:"

# 檢查初始密碼設置
echo "檢查初始密碼配置:"
echo "INIT_PASSWORD: $(grep "^INIT_PASSWORD=" /Users/andycyw/dify/docker/.env | cut -d'=' -f2)"

# 檢查密鑰配置
echo "SECRET_KEY 是否設置: $(grep "^SECRET_KEY=" /Users/andycyw/dify/docker/.env | cut -d'=' -f1)"

# 檢查調試模式
echo "DEBUG 模式: $(grep "^DEBUG=" /Users/andycyw/dify/docker/.env | cut -d'=' -f2)"

echo ""
echo "📋 檢查 API 和數據庫日誌:"

echo "=== API 服務日誌 (最後 20 行) ==="
docker compose logs --tail=20 api | grep -E "(ERROR|WARN|401|unauthorized|auth)" || echo "無認證相關錯誤"

echo ""
echo "=== 數據庫連接狀態 ==="
docker compose exec db psql -U postgres -d dify -c "SELECT count(*) FROM accounts;" 2>/dev/null || echo "❌ 數據庫連接失敗或表不存在"

echo ""
echo "🔧 建議的修復步驟:"

echo ""
echo "1. 📝 重置管理員帳號 (推薦):"
echo "   docker compose exec api python -m flask admin reset-password"
echo ""
echo "2. 🔄 清除瀏覽器數據:"
echo "   - 清除 http://54.169.166.197 的所有 Cookie 和本地存儲"
echo "   - 使用無痕模式重新訪問"
echo ""
echo "3. 📊 檢查數據庫用戶表:"
echo "   docker compose exec db psql -U postgres -d dify -c \"SELECT id, email, is_active FROM accounts;\""
echo ""
echo "4. 🏗️ 重新初始化應用 (如果數據庫為空):"
echo "   docker compose exec api python -m flask db upgrade"
echo "   docker compose exec api python -m flask init"
echo ""
echo "5. 🚀 重啟服務:"
echo "   docker compose restart api web"

echo ""
echo "💡 常見解決方案:"
echo ""
echo "方案 A - 快速重置 (如果是新部署):"
echo "  docker compose down -v"
echo "  docker compose up -d"
echo "  # 等待服務啟動，然後訪問 http://54.169.166.197"
echo ""
echo "方案 B - 手動創建管理員帳號:"
echo "  docker compose exec api python -c \""
echo "from extensions.ext_database import db"
echo "from models.account import Account"
echo "import uuid"
echo "account = Account()"
echo "account.id = str(uuid.uuid4())"
echo "account.email = 'admin@example.com'"
echo "account.password = 'dify12345'"
echo "account.is_active = True"
echo "db.session.add(account)"
echo "db.session.commit()"
echo "print('Admin account created')"
echo "\""

echo ""
echo "============================================="
echo "🔍 診斷完成"

echo ""
echo "📞 下一步建議:"
echo "1. 首先嘗試清除瀏覽器緩存和 Cookie"
echo "2. 如果仍有問題，運行重置命令"
echo "3. 檢查 API 日誌以獲取更多詳細信息"
