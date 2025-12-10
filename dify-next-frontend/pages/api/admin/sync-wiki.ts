import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { syncWikiToDifyEnhanced, getSyncStats } from '../../../lib/wiki-sync-enhanced';

/**
 * API: 觸發 Wiki.js → Dify 同步（增強版）
 *
 * GET /api/admin/sync-wiki?stats=true&department=DQE
 *   - 返回同步統計
 *
 * POST /api/admin/sync-wiki
 *   body: {
 *     department?: string,
 *     forceFullSync?: boolean,
 *     dryRun?: boolean
 *   }
 *   - 執行同步
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // 驗證管理員權限
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.email) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // TODO: 實作真正的管理員檢查
  // 目前暫時允許所有登入用戶
  const isAdmin = true;

  if (!isAdmin) {
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  }

  try {
    if (req.method === 'GET') {
      // 返回統計資訊
      const { department } = req.query;

      const stats = await getSyncStats(
        department ? String(department) : undefined
      );

      return res.status(200).json({
        success: true,
        stats,
      });
    } else if (req.method === 'POST') {
      // 執行同步
      const {
        department,
        forceFullSync = false,
        dryRun = false,
      } = req.body;

      const result = await syncWikiToDifyEnhanced({
        department,
        forceFullSync,
        dryRun,
      });

      return res.status(200).json({
        success: true,
        result,
      });
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Sync API error:', error);

    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
