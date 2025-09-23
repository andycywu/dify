#!/bin/bash

echo "🔍 詳細檢查資料庫內容"
echo "================================"

# 在容器內執行詳細的資料庫檢查
docker-compose exec dify-next-frontend sh -c "
echo '=== 使用 Prisma 檢查所有表的資料 ==='

# 創建一個簡單的 JavaScript 腳本來查詢資料庫
cat > /tmp/check-db.js << 'EOF'
const { PrismaClient } = require('@prisma/client');

async function checkDatabase() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: 'file:/app/data/dev.db'
      }
    }
  });

  try {
    console.log('=== 檢查 User 表 ===');
    const users = await prisma.user.findMany();
    console.log('使用者數量:', users.length);
    if (users.length > 0) {
      console.log('使用者資料:');
      users.forEach((user, index) => {
        console.log(\`\${index + 1}. Email: \${user.email}, Name: \${user.name || 'N/A'}, Role: \${user.role}, Created: \${user.createdAt}\`);
      });
    } else {
      console.log('❌ 沒有使用者資料');
    }

    console.log('\\n=== 檢查 General 表 ===');
    const generals = await prisma.general.findMany();
    console.log('設定數量:', generals.length);
    if (generals.length > 0) {
      generals.forEach((general, index) => {
        console.log(\`\${index + 1}. Key: \${general.key}, Value: \${general.value}\`);
      });
    } else {
      console.log('❌ 沒有一般設定資料');
    }

    console.log('\\n=== 檢查 UserUsage 表 ===');
    const usages = await prisma.userUsage.findMany();
    console.log('使用量記錄數量:', usages.length);
    if (usages.length > 0) {
      usages.forEach((usage, index) => {
        console.log(\`\${index + 1}. UserId: \${usage.userId}, Date: \${usage.date}, Tokens: \${usage.tokenUsage}\`);
      });
    } else {
      console.log('❌ 沒有使用量記錄');
    }

    console.log('\\n=== 資料庫統計 ===');
    console.log('總使用者數:', users.length);
    console.log('總設定數:', generals.length);
    console.log('總使用量記錄數:', usages.length);

  } catch (error) {
    console.error('❌ 資料庫查詢錯誤:', error.message);
  } finally {
    await prisma.\$disconnect();
  }
}

checkDatabase();
EOF

echo '執行資料庫內容檢查...'
cd /app && node /tmp/check-db.js
"

echo ""
echo "🔍 檢查資料庫文件原始內容..."
docker-compose exec dify-next-frontend sh -c "
  if command -v sqlite3 >/dev/null 2>&1; then
    echo '使用 sqlite3 檢查:'
    sqlite3 /app/data/dev.db '.tables'
    echo ''
    sqlite3 /app/data/dev.db 'SELECT COUNT(*) as user_count FROM User;'
    sqlite3 /app/data/dev.db 'SELECT COUNT(*) as general_count FROM General;'
    sqlite3 /app/data/dev.db 'SELECT COUNT(*) as usage_count FROM UserUsage;'
  else
    echo 'sqlite3 不可用，已使用 Prisma 檢查'
  fi
"

echo ""
echo "✅ 詳細資料庫檢查完成！"
