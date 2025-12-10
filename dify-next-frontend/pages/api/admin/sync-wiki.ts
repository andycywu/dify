import type { NextApiRequest, NextApiResponse } from 'next';
import { syncWikiToDifyEnhanced, getSyncStats, type Department } from '../../../lib/wiki-sync-enhanced';

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
  // 簡化認證檢查 - 用於 CLI 和自動化同步
  // 生產環境建議添加 API Key 驗證或其他安全機制

  try {
    if (req.method === 'GET') {
      // 返回統計資訊
      const { department } = req.query;

      const stats = await getSyncStats(
        department as Department | undefined
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
