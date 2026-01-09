#!/bin/bash
# 檢查 Wiki.js 用戶的 role 值

echo "======================================"
echo "檢查 Wiki.js 用戶角色"
echo "======================================"
echo ""

echo "1. 查看所有可能的 role 值:"
docker exec docker-db-1 psql -U postgres -d wiki -c "SELECT DISTINCT role FROM users ORDER BY role;"

echo ""
echo "2. 查看前 10 個用戶的 role 資訊:"
docker exec docker-db-1 psql -U postgres -d wiki -c "SELECT id, email, name, role FROM users ORDER BY id LIMIT 10;"

echo ""
echo "3. 檢查 admin 用戶:"
docker exec docker-db-1 psql -U postgres -d wiki -c "SELECT id, email, name, role FROM users WHERE role LIKE '%admin%';"
