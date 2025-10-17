#!/bin/bash
# Wiki.js 認證整合 - 手動登入測試指南

echo "🧪 Wiki.js 認證整合 - 手動測試指南"
echo "=================================="
echo ""

# 顯示當前用戶
echo "📋 步驟 1: 查看 Wiki.js 現有用戶"
echo "--------------------------------"
docker exec -i docker-db-1 psql -U postgres -d wiki -c "SELECT id, email, name, \"isActive\" FROM users WHERE \"isSystem\" = false;"
echo ""

# 獲取用戶信息
USER_EMAIL=$(docker exec -i docker-db-1 psql -U postgres -d wiki -t -c "SELECT email FROM users WHERE \"isSystem\" = false LIMIT 1;" | xargs)

echo "🔐 步驟 2: 測試登入"
echo "--------------------------------"
echo "請使用以下帳號測試:"
echo ""
echo "📧 Email: ${USER_EMAIL}"
echo "🔑 密碼: (您的 Wiki.js 密碼)"
echo ""
echo "🌐 測試步驟:"
echo ""
echo "1️⃣  訪問 Wiki.js (驗證帳號有效):"
echo "   🔗 http://localhost:3002"
echo "   ✅ 確認可以成功登入"
echo ""
echo "2️⃣  訪問 dify-next-frontend (測試整合):"
echo "   🔗 http://localhost:3001"
echo "   ✅ 使用相同的 Wiki.js 帳號登入"
echo "   ✅ 應該看到用戶名稱: $(docker exec -i docker-db-1 psql -U postgres -d wiki -t -c "SELECT name FROM users WHERE \"isSystem\" = false LIMIT 1;" | xargs)"
echo ""
echo "3️⃣  驗證用戶組權限:"
echo "   📊 查看當前用戶的用戶組:"
docker exec -i docker-db-1 psql -U postgres -d wiki -c "
SELECT u.email, g.name as group_name 
FROM users u 
JOIN \"userGroups\" ug ON u.id = ug.\"userId\"
JOIN groups g ON ug.\"groupId\" = g.id
WHERE u.\"isSystem\" = false;
"
echo ""
echo "   ✅ 如果用戶在 'administrators' 或 'Administrators' 組,應該有 admin 權限"
echo "   ✅ 其他組的用戶應該有 user 權限"
echo ""

echo "🧪 步驟 3: API 測試 (可選)"
echo "--------------------------------"
echo "測試 NextAuth 登入 API:"
echo ""
echo "curl -X POST http://localhost:3001/api/auth/callback/credentials \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"username\": \"${USER_EMAIL}\", \"password\": \"YOUR_PASSWORD\"}'"
echo ""

echo "✅ 步驟 4: 驗證清單"
echo "--------------------------------"
echo "請確認以下項目:"
echo ""
echo "[ ] Wiki.js (http://localhost:3002) 可以訪問"
echo "[ ] dify-next-frontend (http://localhost:3001) 可以訪問"
echo "[ ] 使用 Wiki.js 帳號可以登入 Wiki.js"
echo "[ ] 使用相同帳號可以登入 dify-next-frontend"
echo "[ ] dify-next-frontend 顯示正確的用戶名稱"
echo "[ ] 用戶組權限映射正確 (admin 或 user)"
echo ""

echo "📊 步驟 5: 檢查服務狀態"
echo "--------------------------------"
docker-compose ps | grep -E "(wiki|frontend)" | awk '{print $1, $NF}'
echo ""

echo "📝 步驟 6: 如果登入失敗,檢查日誌"
echo "--------------------------------"
echo "Wiki.js 日誌:"
echo "  docker logs dify-wiki --tail 50"
echo ""
echo "dify-next-frontend 日誌:"
echo "  docker logs docker-dify-next-frontend-1 --tail 50"
echo ""
echo "數據庫連接測試:"
echo "  docker exec -i docker-db-1 psql -U postgres -d wiki -c 'SELECT version();'"
echo ""

echo "🎉 測試完成!"
echo "如有問題,請參考: /Users/andycyw/dify/dify-next-frontend/WIKI_AUTH_INTEGRATION.md"
