#!/bin/bash
# 檢查 Wiki userId 和 Dify session_id 的對應關係

echo "======================================"
echo "檢查用戶映射關係"
echo "======================================"
echo ""

echo "1. Wiki.js 用戶列表 (前 15 個):"
docker exec docker-db-1 psql -U postgres -d wiki -c "SELECT id, email, name FROM users ORDER BY id LIMIT 15;"

echo ""
echo "2. Dify end_users 的 session_id 統計:"
docker exec docker-db-1 psql -U postgres -d dify -c "SELECT session_id, COUNT(*) as count, MIN(created_at) as first_created FROM end_users GROUP BY session_id ORDER BY session_id;"

echo ""
echo "3. 檢查各 session_id 的 messages 數量:"
docker exec docker-db-1 psql -U postgres -d dify -c "SELECT e.session_id, COUNT(m.id) as message_count, MIN(m.created_at) as first_message, MAX(m.created_at) as last_message FROM end_users e LEFT JOIN messages m ON e.id = m.from_end_user_id GROUP BY e.session_id ORDER BY message_count DESC;"
