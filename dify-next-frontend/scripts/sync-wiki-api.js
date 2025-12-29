#!/usr/bin/env node

/**
 * Wiki.js → Dify 同步 CLI (通過 Next.js API)
 *
 * 這個版本通過 HTTP API 調用,避免直接導入 TypeScript 模塊
 */

const http = require('http');
const dotenv = require('dotenv');
const path = require('path');

// 載入 .env.docker
dotenv.config({ path: path.resolve(process.cwd(), '.env.docker') });

// 確保 API_BASE_URL 已定義
const apiUrl = process.env.API_BASE_URL;
if (!apiUrl) {
  console.error('❌ 未定義 API_BASE_URL，請確認 .env.docker 中的設定');
  process.exit(1);
}

// 解析命令列參數
const args = process.argv.slice(2);
const options = {
  department: undefined,
  forceFullSync: false,
  dryRun: false,
  stats: false,
};

for (let i = 0; i < args.length; i++) {
  const arg = args[i];

  if (arg === '--department' && args[i + 1]) {
    options.department = args[++i];
  } else if (arg === '--force-full-sync') {
    options.forceFullSync = true;
  } else if (arg === '--dry-run') {
    options.dryRun = true;
  } else if (arg === '--stats') {
    options.stats = true;
  } else if (arg === '--help' || arg === '-h') {
    showHelp();
    process.exit(0);
  }
}

function showHelp() {
  console.log(`
Wiki.js → Dify Sync CLI (API Version)

Usage:
  node scripts/sync-wiki-api.js [options]

Options:
  --department <dept>    只同步特定部門
  --force-full-sync      強制全量同步
  --dry-run              只檢查不執行
  --stats                顯示統計資訊
  --help, -h             顯示此幫助訊息
  `);
}

async function main() {
  try {
    console.log('🚀 Wiki.js → Dify Sync CLI (API Version)\n');

    if (options.stats) {
      // GET 請求獲取統計
      const url = options.department
        ? `${apiUrl}/admin/sync-wiki?department=${options.department}`
        : `${apiUrl}/admin/sync-wiki`;

      console.log(`📊 Fetching sync statistics from ${url}...\n`);

      // 簡單的 HTTP GET 請求
      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        console.log('Statistics:', JSON.stringify(data.stats, null, 2));
      } else {
        console.error('Failed to fetch stats:', data.error);
        process.exit(1);
      }
    } else {
      // POST 請求執行同步
      console.log(`🔄 Starting sync...`);
      console.log(`   Department: ${options.department || 'ALL'}`);
      console.log(`   Force full sync: ${options.forceFullSync}`);
      console.log(`   Dry run: ${options.dryRun}\n`);

      const response = await fetch(`${apiUrl}/admin/sync-wiki`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          department: options.department,
          forceFullSync: options.forceFullSync,
          dryRun: options.dryRun,
        }),
      });

      const data = await response.json();

      if (data.success) {
        console.log('\n✅ Sync completed successfully!');
        if (data.result) {
          console.log('Result:', JSON.stringify(data.result, null, 2));
        }
        process.exit(0);
      } else {
        console.error('\n❌ Sync failed:', data.error);
        process.exit(1);
      }
    }
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// 執行
main();
