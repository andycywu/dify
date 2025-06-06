const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // 建立各種角色的 user
  const passwordHash = await bcrypt.hash('dify12345', 10);
  await prisma.user.upsert({
    where: { email: 'superadmin@example.com' },
    update: {},
    create: {
      email: 'superadmin@example.com',
      password: passwordHash,
      name: 'Super Admin',
      role: 'super admin',
    },
  });
  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: passwordHash,
      name: 'Admin',
      role: 'admin',
    },
  });
  await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      email: 'user@example.com',
      password: passwordHash,
      name: 'Normal User',
      role: 'user',
    },
  });
    await prisma.user.upsert({
    where: { email: 'admin' },
    update: {},
    create: {
      email: 'admin',
      password: passwordHash,
      name: 'Admin',
      role: 'admin',
    },
  });
  // General 設定範例
  await prisma.general.upsert({
    where: { key: 'openai_rate' },
    update: { value: JSON.stringify({ model: 'gpt-3.5-turbo', pricePer1KToken: 0.0015 }) },
    create: {
      key: 'openai_rate',
      value: JSON.stringify({ model: 'gpt-3.5-turbo', pricePer1KToken: 0.0015 }),
    },
  });
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
