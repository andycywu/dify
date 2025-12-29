#!/usr/bin/env node

/**
 * Wiki.js → Dify 同步 CLI
 *
 * 使用範例:
 *   npm run sync-wiki
 *   npm run sync-wiki -- --department DQE
 *   npm run sync-wiki -- --force-full-sync
 *   npm run sync-wiki -- --dry-run
 */

// 動態導入以支持 ESM 和編譯後的代碼
async function loadSyncModule() {
  try {
    // 嘗試從 .next/server 加載編譯後的代碼
    return await import('../.next/server/chunks/lib_wiki-sync-enhanced.js').catch(() =>
      // 如果失敗,使用開發模式的直接導入
      import('../lib/wiki-sync-enhanced.ts')
    );
  } catch (error) {
    console.error('無法加載同步模塊:', error.message);
    console.error('請確保已運行 npm run build');
    process.exit(1);
  }
}

// 設定 API 基底 URL，從環境變數中讀取
const API_BASE_URL = process.env.API_BASE_URL;
if (!API_BASE_URL) {
  console.error('❌ 未定義 API_BASE_URL，請確認 .env.docker 中的設定');
  process.exit(1);
}

// 解析命令列參數
const args = process.argv.slice(2);
const options = {
  department: undefined,
  forceFullSync: false,
  resetFailed: false,
  dryRun: false,
  pagePath: undefined,
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
  npm run sync-wiki [options]

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
  npm run sync-wiki
  npm run sync-wiki -- --department DQE
  npm run sync-wiki -- --force-full-sync
  npm run sync-wiki -- --dry-run --department COMMON
  npm run sync-wiki -- --stats
  npm run sync-wiki -- --clear --department DQE
  `);
}

async function main() {
  try {
    console.log('🚀 Wiki.js → Dify Sync CLI\n');

    // 動態加載模塊
    const syncModule = await loadSyncModule();
    const { syncWikiToDifyEnhanced, resetFailedSyncs, clearSyncStatus, getSyncStats } = syncModule;

    // 顯示統計
    if (options.stats) {
      console.log('📊 Fetching sync statistics...\n');
      const stats = await getSyncStats(options.department);
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
      const count = await clearSyncStatus(options.department);
      console.log(`✅ Cleared ${count} records`);

      if (!options.forceFullSync) {
        console.log('\nℹ️  Use --force-full-sync to sync all pages now');
        return;
      }
    }

    // 重置失敗
    if (options.resetFailed) {
      console.log('🔄 Resetting failed syncs...\n');
      const count = await resetFailedSyncs(options.department);
      console.log(`✅ Reset ${count} failed syncs\n`);
    }

    // 執行同步
    const syncOptions = {
      department: options.department,
      forceFullSync: options.forceFullSync,
      dryRun: options.dryRun,
      pagePath: options.pagePath,
    };

    await syncWikiToDifyEnhanced(syncOptions);

    console.log('\n✅ Sync completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Sync failed:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

// 執行
main();
