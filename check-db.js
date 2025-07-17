const { PrismaClient } = require('@prisma/client');

async function checkDatabase() {
  const prisma = new PrismaClient();

  try {
    console.log('=== 檢查使用者資料 ===');
    const users = await prisma.user.findMany();
    console.log('使用者總數:', users.length);
    
    if (users.length > 0) {
      console.log('\n使用者詳細資料:');
      users.forEach((user, index) => {
        console.log(`${index + 1}. Email: ${user.email}`);
        console.log(`   Name: ${user.name || 'N/A'}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Created: ${user.createdAt}`);
        console.log('');
      });
    } else {
      console.log('❌ 沒有使用者資料');
    }

    console.log('=== 檢查設定資料 ===');
    const generals = await prisma.general.findMany();
    console.log('設定總數:', generals.length);
    
    console.log('\n=== 檢查使用量資料 ===');
    const usages = await prisma.userUsage.findMany();
    console.log('使用量記錄總數:', usages.length);

  } catch (error) {
    console.error('❌ 資料庫查詢錯誤:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
