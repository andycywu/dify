#!/bin/bash
# 測試 Wiki.js 認證整合

echo "=== Testing Wiki.js Authentication Integration ==="
echo ""

# 1. 測試 CSRF Token
echo "1. Testing CSRF endpoint..."
CSRF_RESPONSE=$(curl -s http://localhost:3001/custom/api/auth/csrf)
CSRF_TOKEN=$(echo $CSRF_RESPONSE | grep -o '"csrfToken":"[^"]*' | cut -d'"' -f4)

if [ -n "$CSRF_TOKEN" ]; then
    echo "✓ CSRF Token received: ${CSRF_TOKEN:0:20}..."
else
    echo "✗ Failed to get CSRF token"
    exit 1
fi

echo ""

# 2. 測試資料庫連接
echo "2. Testing database connection..."
DB_TEST=$(docker exec docker-db-1 psql -U postgres -d wiki -c "SELECT COUNT(*) FROM users WHERE email='andycy.wu@tpv-tech.com';" -t 2>/dev/null)

if [ "$DB_TEST" -eq 1 ]; then
    echo "✓ User exists in database"
else
    echo "✗ User not found in database"
    exit 1
fi

echo ""

# 3. 測試密碼格式
echo "3. Checking password format..."
PASSWORD_HASH=$(docker exec docker-db-1 psql -U postgres -d wiki -c "SELECT substring(password, 1, 4) FROM users WHERE email='andycy.wu@tpv-tech.com';" -t 2>/dev/null | tr -d ' ')

if [ "$PASSWORD_HASH" = "\$2a\$" ]; then
    echo "✓ Password is bcrypt encrypted"
else
    echo "✗ Password format incorrect: $PASSWORD_HASH"
fi

echo ""

# 4. 測試用戶組
echo "4. Checking user groups..."
USER_GROUPS=$(docker exec docker-db-1 psql -U postgres -d wiki -c "SELECT g.name FROM groups g JOIN \"userGroups\" ug ON g.id = ug.\"groupId\" JOIN users u ON u.id = ug.\"userId\" WHERE u.email='andycy.wu@tpv-tech.com';" -t 2>/dev/null | tr -d ' ')

if [ -n "$USER_GROUPS" ]; then
    echo "✓ User groups: $USER_GROUPS"
else
    echo "⚠ No groups found for user"
fi

echo ""
echo "=== Test Complete ==="
echo ""
echo "Next steps:"
echo "1. Open browser: http://localhost:3001/custom/login"
echo "2. Enter email: andycy.wu@tpv-tech.com"
echo "3. Enter your Wiki.js password"
echo "4. Check browser console for any errors"
