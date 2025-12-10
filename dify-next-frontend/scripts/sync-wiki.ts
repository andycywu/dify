#!/usr/bin/env tsx

/**
 * Wiki.js → Dify 同步 CLI (TypeScript 版本)
 *
 * 使用範例:
 *   npx tsx scripts/sync-wiki.ts
 *   npx tsx scripts/sync-wiki.ts --department DQE
 *   npx tsx scripts/sync-wiki.ts --force-full-sync
 *   npx tsx scripts/sync-wiki.ts --dry-run
 */

// 先載入 .env，確保後續匯入的程式碼能讀到環境變數
import path from 'node:path';
import { config as dotenvConfig } from 'dotenv';
// 使用 override: true 以避免被空的環境變數覆蓋 .env 中的有效值
dotenvConfig({ path: path.resolve(process.cwd(), '.env'), override: true });

// 注意：不要使用靜態 import，否則在 dotenv 尚未載入前就會評估被匯入模組
// 後續在 main() 內使用動態 import 以確保環境變數已載入

// 解析命令列參數
const args = process.argv.slice(2);
const options = {
  department: undefined as string | undefined,
  forceFullSync: false,
  resetFailed: false,
  dryRun: false,
  pagePath: undefined as string | undefined,
  stats: false,
  clear: false,
};

for (let i = 0; i < args.length; i++) {
  const arg = args[i];

  if (arg === '--department' && args[i + 1]) {
    options.department = args[++i];
  } else if (arg === '--force-full-sync') {
    options.forceFullSync = true;
  } else if (arg === '--reset-failed') {
    options.resetFailed = true;
  } else if (arg === '--dry-run') {
    options.dryRun = true;
  } else if (arg === '--page-path' && args[i + 1]) {
    options.pagePath = args[++i];
  } else if (arg === '--stats') {
    options.stats = true;
  } else if (arg === '--clear') {
    options.clear = true;
  } else if (arg === '--help' || arg === '-h') {
    showHelp();
    process.exit(0);
  }
}

function showHelp() {
  console.log(`
Wiki.js → Dify Sync CLI

Usage:
  npx tsx scripts/sync-wiki.ts [options]

Options:
  --department <dept>    只同步特定部門 (COMMON, DQE, DQE_CERTI, HW, PWR, ME_LCM, SW, PJM, ARCH, TM)
  --force-full-sync      強制全量同步（忽略上次同步時間）
  --reset-failed         重置失敗狀態後再同步
  --dry-run              只檢查不執行
  --page-path <path>     只同步特定頁面
  --stats                顯示同步統計資訊
  --clear                清空同步狀態（用於完全重新同步）
  --help, -h             顯示此幫助訊息

Examples:
  npx tsx scripts/sync-wiki.ts
  npx tsx scripts/sync-wiki.ts --department DQE
  npx tsx scripts/sync-wiki.ts --force-full-sync
  npx tsx scripts/sync-wiki.ts --dry-run --department COMMON
  npx tsx scripts/sync-wiki.ts --stats
  npx tsx scripts/sync-wiki.ts --clear --department DQE
  `);
}

async function main() {
  try {
    console.log('🚀 Wiki.js → Dify Sync CLI\n');

    // 確保在 dotenv 載入後才載入同步模組，避免 process.env 還沒準備好
    const {
      syncWikiToDifyEnhanced,
      resetFailedSyncs,
      clearSyncStatus,
      getSyncStats,
    } = await import('../lib/wiki-sync-enhanced');

    // 顯示統計
    if (options.stats) {
      console.log('📊 Fetching sync statistics...\n');
  const stats = await getSyncStats(options.department as any);
      console.log('Statistics:');
      console.log(`  Total pages: ${stats.total}`);
      console.log(`  Success: ${stats.success}`);
      console.log(`  Failed: ${stats.failed}`);
      console.log(`  Pending: ${stats.pending}`);
      console.log(`  Last sync: ${stats.lastSyncAt || 'Never'}`);
      return;
    }

    // 清空狀態
    if (options.clear) {
      console.log('🗑️  Clearing sync status...\n');
  const count = await clearSyncStatus(options.department as any);
      console.log(`✅ Cleared ${count} records`);

      if (!options.forceFullSync) {
        console.log('\nℹ️  Use --force-full-sync to sync all pages now');
        return;
      }
    }

    // 重置失敗
    if (options.resetFailed) {
      console.log('🔄 Resetting failed syncs...\n');
  const count = await resetFailedSyncs(options.department as any);
      console.log(`✅ Reset ${count} failed syncs\n`);
    }

    // 執行同步
    const syncOptions = {
      department: options.department as any,
      forceFullSync: options.forceFullSync,
      dryRun: options.dryRun,
      pagePath: options.pagePath,
    };

  await syncWikiToDifyEnhanced(syncOptions);

    console.log('\n✅ Sync completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Sync failed:', error);
    if (error instanceof Error) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// 執行
main();
