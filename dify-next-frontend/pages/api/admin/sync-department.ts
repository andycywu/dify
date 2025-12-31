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
          // 清除所有部門的 dataset
          const departments: Department[] = ['COMMON', 'DQE', 'DQE_CERTI', 'HW', 'PWR', 'ME_LCM', 'SW', 'PJM', 'ARCH', 'TM'];
          let totalCleared = 0;
          for (const dept of departments) {
            const cleared = await clearSyncStatus(dept, true);
            totalCleared += cleared;
          }
          result = totalCleared;
          message = `成功清除所有部門的同步狀態和 Dataset 記錄 (${result} 條)`;
        } else {
          result = await clearSyncStatus(department as Department, true);
          message = `成功清除同步狀態和 Dataset 記錄`;
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
              forceFullSync: false,
              dryRun: false,
            });
            result.push(deptResult);
          }
          message = `成功同步所有部門`;
        } else {
          result = await syncWikiToDifyEnhanced({
            department: department as Department,
            forceFullSync: false,
            dryRun: false,
          });
          message = `成功同步部門 ${department}`;
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
