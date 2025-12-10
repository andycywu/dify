/**
 * Wiki.js → Dify 增強版同步系統
 * 整合 Preprocessor 進行智能文件處理
 */

import { prisma } from './prisma';
import { DifyClient } from './dify-client';
import { preprocessFile } from './preprocess';

// ==================== 配置 ====================

const WIKI_GRAPHQL_URL = process.env.WIKI_GRAPHQL_URL || 'http://wiki:3000/graphql';
const WIKI_API_KEY = process.env.WIKI_API_KEY;
const DIFY_API_URL = process.env.DIFY_API_URL || 'http://api:5001/v1';
const DIFY_ADMIN_API_KEY = process.env.DIFY_ADMIN_API_KEY;

if (!WIKI_API_KEY) {
  throw new Error('WIKI_API_KEY is required');
}

if (!DIFY_ADMIN_API_KEY) {
  throw new Error('DIFY_ADMIN_API_KEY is required');
}

const difyClient = new DifyClient(DIFY_API_URL, DIFY_ADMIN_API_KEY);

// ==================== 部門與 Dataset 映射 ====================

type Department = 'COMMON' | 'DQE' | 'DQE_CERTI' | 'HW' | 'PWR' | 'ME_LCM' | 'SW' | 'PJM' | 'ARCH' | 'TM';

const DEPARTMENT_CONFIG: Record<Department, { path: string; datasetId: string }> = {
  COMMON: {
    path: 'common',
    datasetId: process.env.DIFY_DATASET_COMMON_ID || '',
  },
  DQE: {
    path: 'dqe',
    datasetId: process.env.DIFY_DATASET_DQE_ID || '',
  },
  DQE_CERTI: {
    path: 'dqe-certi',
    datasetId: process.env.DIFY_DATASET_DQE_CERTI_ID || '',
  },
  HW: {
    path: 'hw',
    datasetId: process.env.DIFY_DATASET_HW_ID || '',
  },
  PWR: {
    path: 'pwr',
    datasetId: process.env.DIFY_DATASET_PWR_ID || '',
  },
  ME_LCM: {
    path: 'me-lcm',
    datasetId: process.env.DIFY_DATASET_ME_LCM_ID || '',
  },
  SW: {
    path: 'sw',
    datasetId: process.env.DIFY_DATASET_SW_ID || '',
  },
  PJM: {
    path: 'pjm',
    datasetId: process.env.DIFY_DATASET_PJM_ID || '',
  },
  ARCH: {
    path: 'arch',
    datasetId: process.env.DIFY_DATASET_ARCH_ID || '',
  },
  TM: {
    path: 'tm',
    datasetId: process.env.DIFY_DATASET_TM_ID || '',
  },
};

// ==================== Wiki.js GraphQL 請求 ====================

async function wikiRequest(query: string, variables: any = {}) {
  const response = await fetch(WIKI_GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${WIKI_API_KEY}`,
    },
    body: JSON.stringify({ query, variables }),
  });

  const json = await response.json();

  if (json.errors) {
    throw new Error(`Wiki GraphQL Error: ${JSON.stringify(json.errors)}`);
  }

  return json.data;
}

// ==================== 同步選項 ====================

export interface SyncOptions {
  department?: Department;       // 只同步特定部門
  forceFullSync?: boolean;        // 強制全量同步
  resetFailed?: boolean;          // 重置失敗狀態
  dryRun?: boolean;               // 只檢查不執行
  pagePath?: string;              // 只同步特定頁面
}

// ==================== 主同步函數 ====================

export async function syncWikiToDifyEnhanced(options: SyncOptions = {}) {
  console.log('🚀 Starting Wiki.js → Dify Enhanced Sync...');
  console.log('Options:', JSON.stringify(options, null, 2));

  const stats = {
    total: 0,
    created: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
    errors: [] as Array<{ department: string; path: string; error: string }>,
  };

  // 確定要同步的部門
  const departments = options.department
    ? [options.department]
    : (Object.keys(DEPARTMENT_CONFIG) as Department[]);

  for (const department of departments) {
    console.log(`\n📁 Processing department: ${department}`);

    try {
      const deptStats = await syncDepartment(department, options);

      stats.total += deptStats.total;
      stats.created += deptStats.created;
      stats.updated += deptStats.updated;
      stats.skipped += deptStats.skipped;
      stats.failed += deptStats.failed;
      stats.errors.push(...deptStats.errors);
    } catch (error) {
      console.error(`❌ Failed to sync department ${department}:`, error);
      stats.failed++;
      stats.errors.push({
        department,
        path: '*',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  console.log('\n✅ Sync completed!');
  console.log('📊 Statistics:');
  console.log(`   Total processed: ${stats.total}`);
  console.log(`   Created: ${stats.created}`);
  console.log(`   Updated: ${stats.updated}`);
  console.log(`   Skipped: ${stats.skipped}`);
  console.log(`   Failed: ${stats.failed}`);

  if (stats.errors.length > 0) {
    console.log('\n⚠️  Errors:');
    stats.errors.forEach((err, i) => {
      console.log(`   ${i + 1}. [${err.department}] ${err.path}: ${err.error}`);
    });
  }

  return stats;
}

// ==================== 部門同步邏輯 ====================

async function syncDepartment(department: Department, options: SyncOptions) {
  const config = DEPARTMENT_CONFIG[department];
  const { path: wikiPath, datasetId } = config;

  if (!datasetId) {
    throw new Error(`Dataset ID not configured for ${department}`);
  }

  const stats = {
    total: 0,
    created: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
    errors: [] as Array<{ department: string; path: string; error: string }>,
  };

  // 1. 從 Wiki.js 獲取所有頁面
  console.log(`   📥 Fetching pages from Wiki.js path: /${wikiPath}`);

  const allPages = await fetchWikiPages();
  const deptPages = allPages.filter((p: any) =>
    p.path === wikiPath || p.path.startsWith(`${wikiPath}/`)
  );

  console.log(`   Found ${deptPages.length} pages`);
  stats.total = deptPages.length;

  if (deptPages.length === 0) {
    console.log(`   ⚠️  No pages found for ${department}, skipping...`);
    return stats;
  }

  // 2. 如果指定了特定頁面，只處理該頁面
  const pagesToProcess = options.pagePath
    ? deptPages.filter((p: any) => p.path === options.pagePath)
    : deptPages;

  // 3. 獲取現有的同步狀態
  const existingSyncStatus = await prisma.wikiSyncStatus.findMany({
    where: { department },
  });

  const syncStatusMap = new Map(
    existingSyncStatus.map((s) => [s.wikiPath, s])
  );

  // 4. 處理每個頁面
  for (const page of pagesToProcess) {
    try {
      const result = await syncPage(
        department,
        datasetId,
        page,
        syncStatusMap.get(page.path),
        options
      );

      if (result === 'created') stats.created++;
      else if (result === 'updated') stats.updated++;
      else if (result === 'skipped') stats.skipped++;
    } catch (error) {
      console.error(`   ❌ Failed to sync page ${page.path}:`, error);
      stats.failed++;
      stats.errors.push({
        department,
        path: page.path,
        error: error instanceof Error ? error.message : String(error),
      });

      // 記錄失敗狀態
      await prisma.wikiSyncStatus.upsert({
        where: {
          department_wikiPath: {
            department,
            wikiPath: page.path,
          },
        },
        create: {
          department,
          wikiPath: page.path,
          wikiPageId: page.id,
          wikiTitle: page.title,
          wikiUpdatedAt: new Date(page.updatedAt),
          syncStatus: 'failed',
          errorMessage: error instanceof Error ? error.message : String(error),
        },
        update: {
          syncStatus: 'failed',
          errorMessage: error instanceof Error ? error.message : String(error),
          lastSyncedAt: new Date(),
        },
      });
    }
  }

  return stats;
}

// ==================== 單頁同步邏輯 ====================

async function syncPage(
  department: Department,
  datasetId: string,
  page: any,
  existingSync: any,
  options: SyncOptions
): Promise<'created' | 'updated' | 'skipped'> {
  const { path, id: wikiPageId, title, content, updatedAt } = page;
  const wikiUpdatedAt = new Date(updatedAt);

  console.log(`   📄 Processing: ${path}`);

  // 檢查是否需要同步
  if (!options.forceFullSync && existingSync) {
    const lastSyncedAt = new Date(existingSync.lastSyncedAt);

    if (wikiUpdatedAt <= lastSyncedAt && existingSync.syncStatus === 'success') {
      console.log(`      ⏭️  Skipped (no changes since last sync)`);
      return 'skipped';
    }
  }

  if (options.dryRun) {
    console.log(`      🔍 Dry run: would sync this page`);
    return 'skipped';
  }

  // 1. 使用 Preprocessor 處理內容
  console.log(`      🔄 Preprocessing content...`);

  const markdownContent = `# ${title}\n\n${content}`;
  const buffer = Buffer.from(markdownContent, 'utf-8');

  const preprocessResult = await preprocessFile(buffer, `${path}.md`);

  if (!preprocessResult.success) {
    throw new Error(`Preprocessing failed: ${preprocessResult.error}`);
  }

  // 2. 加入 metadata
  const metadata = `<!-- department: ${department} -->
<!-- source: ${path} -->
<!-- wikiPageId: ${wikiPageId} -->
<!-- lastUpdated: ${wikiUpdatedAt.toISOString()} -->

`;

  const finalContent = metadata + preprocessResult.markdown;

  // 3. 上傳或更新到 Dify
  let difyDocumentId: string;
  let action: 'created' | 'updated';

  if (existingSync?.difyDocumentId) {
    // 更新現有文件
    console.log(`      ⬆️  Updating in Dify...`);

    await difyClient.updateDocumentByText(
      datasetId,
      existingSync.difyDocumentId,
      path,
      finalContent
    );

    difyDocumentId = existingSync.difyDocumentId;
    action = 'updated';
  } else {
    // 建立新文件
    console.log(`      ⬆️  Creating in Dify...`);

    const result = await difyClient.createDocumentByText(
      datasetId,
      path,
      finalContent
    );

    difyDocumentId = result.document.id;
    action = 'created';
  }

  // 4. 更新同步狀態
  await prisma.wikiSyncStatus.upsert({
    where: {
      department_wikiPath: {
        department,
        wikiPath: path,
      },
    },
    create: {
      department,
      wikiPath: path,
      wikiPageId,
      wikiTitle: title,
      wikiUpdatedAt,
      difyDocumentId,
      syncStatus: 'success',
      lastSyncedAt: new Date(),
    },
    update: {
      wikiPageId,
      wikiTitle: title,
      wikiUpdatedAt,
      difyDocumentId,
      syncStatus: 'success',
      lastSyncedAt: new Date(),
      errorMessage: null,
    },
  });

  console.log(`      ✅ ${action === 'created' ? 'Created' : 'Updated'} successfully`);

  return action;
}

// ==================== Wiki.js 頁面獲取 ====================

async function fetchWikiPages() {
  const query = `
    query {
      pages {
        list {
          id
          path
          title
          content
          updatedAt
          isPublished
        }
      }
    }
  `;

  const result = await wikiRequest(query);

  // 只返回已發布的頁面
  return result.pages.list.filter((p: any) => p.isPublished);
}

// ==================== 輔助函數 ====================

/**
 * 重置失敗的同步狀態
 */
export async function resetFailedSyncs(department?: Department) {
  const where = department
    ? { department, syncStatus: 'failed' }
    : { syncStatus: 'failed' };

  const result = await prisma.wikiSyncStatus.updateMany({
    where,
    data: {
      syncStatus: 'pending',
      errorMessage: null,
    },
  });

  console.log(`✅ Reset ${result.count} failed syncs`);
  return result.count;
}

/**
 * 清空所有同步狀態（用於強制全量重新同步）
 */
export async function clearSyncStatus(department?: Department) {
  const where = department ? { department } : {};

  const result = await prisma.wikiSyncStatus.deleteMany({ where });

  console.log(`✅ Cleared ${result.count} sync status records`);
  return result.count;
}

/**
 * 獲取同步統計
 */
export async function getSyncStats(department?: Department) {
  const where = department ? { department } : {};

  const [total, success, failed, pending] = await Promise.all([
    prisma.wikiSyncStatus.count({ where }),
    prisma.wikiSyncStatus.count({ where: { ...where, syncStatus: 'success' } }),
    prisma.wikiSyncStatus.count({ where: { ...where, syncStatus: 'failed' } }),
    prisma.wikiSyncStatus.count({ where: { ...where, syncStatus: 'pending' } }),
  ]);

  const lastSync = await prisma.wikiSyncStatus.findFirst({
    where,
    orderBy: { lastSyncedAt: 'desc' },
  });

  return {
    total,
    success,
    failed,
    pending,
    lastSyncAt: lastSync?.lastSyncedAt,
  };
}
