import type { NextApiRequest, NextApiResponse } from 'next';
import { getSyncStats, type Department } from '../../../lib/wiki-sync-enhanced';

/**
 * API: 獲取同步狀態統計
 *
 * GET /api/admin/sync-status?department=DQE
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { department } = req.query;

    const stats = await getSyncStats(department as Department | undefined);

    // 轉換為前端期望的格式
    const response: Record<string, any> = {};

    if (department) {
      // 單個部門
      response[department] = {
        totalPages: stats.total,
        syncedPages: stats.success,
        status: stats.failed > 0 ? '部分失敗' : stats.pending > 0 ? '進行中' : '完成',
        lastSyncTime: new Date().toISOString(), // TODO: 從數據庫獲取實際時間
      };
    } else {
      // 所有部門 - 需要為每個部門調用 getSyncStats
      const departments: Department[] = ['COMMON', 'DQE', 'DQE_CERTI', 'HW', 'PWR', 'ME_LCM', 'SW', 'PJM', 'ARCH', 'TM'];

      for (const dept of departments) {
        const deptStats = await getSyncStats(dept);
        response[dept] = {
          totalPages: deptStats.total,
          syncedPages: deptStats.success,
          status: deptStats.failed > 0 ? '部分失敗' : deptStats.pending > 0 ? '進行中' : '完成',
          lastSyncTime: new Date().toISOString(),
        };
      }
    }

    return res.status(200).json(response);
  } catch (error) {
    console.error('Sync status API error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
