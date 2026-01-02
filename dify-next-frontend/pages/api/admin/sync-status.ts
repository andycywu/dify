import type { NextApiRequest, NextApiResponse } from 'next';
import { getDepartmentPageStats, type Department } from '../../../lib/wiki-sync-enhanced';

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
    const departmentStr = Array.isArray(department) ? department[0] : department;

    const stats = await getDepartmentPageStats(departmentStr as Department | undefined);

    // 如果指定了特定部門，返回該部門的統計
    if (departmentStr) {
      const deptStats = stats[departmentStr];
      if (deptStats) {
        return res.status(200).json({
          [departmentStr]: deptStats
        });
      } else {
        return res.status(404).json({ error: `Department ${departmentStr} not found` });
      }
    }

    // 返回所有部門的統計
    return res.status(200).json(stats);
  } catch (error) {
    console.error('Sync status API error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
