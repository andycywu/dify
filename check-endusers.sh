#!/bin/bash
# 檢查 end_users 表數據結構

echo "======================================"
echo "檢查 end_users 表結構和數據"
echo "======================================"
echo ""

echo "1. 表結構:"
docker exec docker-db-1 psql -U postgres -d dify -c "\d end_users"

echo ""
echo "2. 前 10 筆記錄:"
docker exec docker-db-1 psql -U postgres -d dify -c "SELECT id, session_id, external_user_id, type, is_anonymous, created_at FROM end_users ORDER BY created_at DESC LIMIT 10;"

echo ""
echo "3. 檢查有 email 格式的記錄:"
docker exec docker-db-1 psql -U postgres -d dify -c "SELECT id, session_id, external_user_id, type FROM end_users WHERE external_user_id LIKE '%@%' OR session_id LIKE '%@%' LIMIT 5;"

echo ""
echo "4. 檢查最近的 messages 記錄:"
docker exec docker-db-1 psql -U postgres -d dify -c "SELECT m.id, m.from_end_user_id, e.session_id, e.external_user_id, m.created_at FROM messages m LEFT JOIN end_users e ON m.from_end_user_id = e.id ORDER BY m.created_at DESC LIMIT 10;"
