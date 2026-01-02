import type { NextApiRequest, NextApiResponse } from 'next';
import { syncWikiToDifyEnhanced, clearSyncStatus, type Department } from '../../../lib/wiki-sync-enhanced';

/**
 * API: 同步特定部門或清除同步狀態
 *
 * POST /api/admin/sync-department
 * body: {
 *   department: string,
 *   action?: 'sync' | 'clear-sync' | 'clear-dataset' | 'clear-all'
 * }
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { department, action = 'sync' } = req.body;

    if (!department) {
      return res.status(400).json({ error: 'Department is required' });
    }

    let result: any;
    let message: string;

    switch (action) {
      case 'sync':
        result = await syncWikiToDifyEnhanced({
          department: department as Department,
          forceFullSync: false,
          dryRun: false,
        });
        message = `成功同步部門 ${department}`;
        break;

      case 'force-sync':
        result = await syncWikiToDifyEnhanced({
          department: department as Department,
          forceFullSync: true,
          dryRun: false,
        });
        message = `成功強制同步部門 ${department}`;
        break;

      case 'clear-sync':
        if (department === 'all') {
          result = await clearSyncStatus(undefined, false);
          message = `成功清除所有同步狀態記錄 (${result} 條)`;
        } else {
          result = await clearSyncStatus(department as Department, false);
          message = `成功清除 ${result} 條同步狀態記錄`;
        }
        break;

      case 'clear-dataset':
        if (department === 'all') {
          // 清除所有部門的 dataset 和同步記錄
          const departments: Department[] = ['COMMON', 'DQE', 'DQE_CERTI', 'HW', 'PWR', 'ME_LCM', 'SW', 'PJM', 'ARCH', 'TM'];
          let totalCleared = 0;
          let successCount = 0;
          let errors: string[] = [];

          // 先清除所有數據庫記錄
          try {
            const dbResult = await clearSyncStatus(undefined, false);
            totalCleared += dbResult;
          } catch (error) {
            console.error('Failed to clear database records:', error);
          }

          // 然後清除每個部門的 Dify dataset
          for (const dept of departments) {
            try {
              await clearSyncStatus(dept, true);
              successCount++;
            } catch (error) {
              // clearSyncStatus 現在不會因為 dataset 清除失敗而拋出錯誤
              // 但我們仍然記錄它以防萬一
              const errorMsg = `Failed to process ${dept}: ${error instanceof Error ? error.message : String(error)}`;
              console.error(errorMsg);
              errors.push(errorMsg);
            }
          }

          // 最後清除日誌和設定文件
          try {
            await clearSyncStatus(undefined, true);
          } catch (error) {
            console.error('Failed to clear global files:', error);
          }

          result = { totalCleared, successCount, errors };
          message = `清除完成：清除 ${totalCleared} 條記錄，成功處理 ${successCount} 個部門的 Dataset${errors.length > 0 ? `，${errors.length} 個部門有錯誤` : ''}`;
          if (errors.length > 0) {
            message += `。注意：數據集文檔可能需要手動刪除。`;
          }
        } else {
          try {
            result = await clearSyncStatus(department as Department, true);
            message = `成功清除同步狀態和 Dataset 記錄`;
          } catch (error) {
            // clearSyncStatus 現在不會拋出錯誤，但以防萬一
            result = 0;
            message = `清除完成，但可能需要手動刪除數據集文檔`;
          }
        }
        break;

      case 'clear-all':
        // 同步所有部門
        if (department === 'all') {
          const departments: Department[] = ['COMMON', 'DQE', 'DQE_CERTI', 'HW', 'PWR', 'ME_LCM', 'SW', 'PJM', 'ARCH', 'TM'];
          result = [];
          for (const dept of departments) {
            const deptResult = await syncWikiToDifyEnhanced({
              department: dept,
              forceFullSync: true,
              dryRun: false,
            });
            result.push(deptResult);
          }
          message = `成功強制同步所有部門`;
        } else {
          result = await syncWikiToDifyEnhanced({
            department: department as Department,
            forceFullSync: true,
            dryRun: false,
          });
          message = `成功強制同步部門 ${department}`;
        }
        break;

      default:
        return res.status(400).json({ error: 'Invalid action' });
    }

    return res.status(200).json({
      success: true,
      message,
      result,
    });
  } catch (error) {
    console.error('Sync department API error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
