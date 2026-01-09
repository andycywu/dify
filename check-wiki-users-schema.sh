#!/bin/bash
# 檢查 Wiki.js users 表結構

echo "======================================"
echo "Wiki.js users 表結構"
echo "======================================"
echo ""

echo "1. 完整表結構:"
docker exec docker-db-1 psql -U postgres -d wiki -c '\d users'

echo ""
echo "2. 查看前 5 個用戶的所有資訊:"
docker exec docker-db-1 psql -U postgres -d wiki -c 'SELECT * FROM users LIMIT 5;'
