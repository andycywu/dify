import type { NextApiRequest, NextApiResponse } from 'next';
import { syncWikiToDifyEnhanced, type Department } from '../../../lib/wiki-sync-enhanced';
import path from 'path';
import { promises as fs } from 'fs';

/**
 * API: 應用內部自動同步
 *
 * GET /api/admin/auto-sync
 *   - 檢查是否應該運行自動同步
 *
 * POST /api/admin/auto-sync
 *   - 執行自動同步（由外部 cron 或定時器調用）
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log('=== AUTO-SYNC API CALLED ===');
  console.log('Method:', req.method);
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);

  try {
    if (req.method === 'GET') {
      // 檢查配置文件，看是否應該運行自動同步
      try {
        const configPath = path.join(process.cwd(), '.wiki-sync-cron-config');
        const configContent = await fs.readFile(configPath, 'utf-8');
        const config = JSON.parse(configContent);

        if (config.enabled) {
          const now = new Date();
          const [hour, minute] = config.time.split(':');
          const scheduledTime = new Date(now);
          scheduledTime.setHours(parseInt(hour), parseInt(minute), 0, 0);

          // 檢查是否是同步時間（允許 5 分鐘的誤差）
          const timeDiff = Math.abs(now.getTime() - scheduledTime.getTime());
          const shouldRun = timeDiff < 5 * 60 * 1000; // 5 分鐘

          return res.status(200).json({
            shouldRun,
            scheduledTime: config.time,
            currentTime: now.toTimeString().slice(0, 5),
          });
        } else {
          return res.status(200).json({
            shouldRun: false,
            reason: '自動同步未啟用',
          });
        }
      } catch (error) {
        return res.status(200).json({
          shouldRun: false,
          reason: '配置文件不存在或無效',
        });
      }
    } else if (req.method === 'POST') {
      // 執行自動同步
      try {
        const configPath = path.join(process.cwd(), '.wiki-sync-cron-config');
        const configContent = await fs.readFile(configPath, 'utf-8');
        const config = JSON.parse(configContent);

        if (!config.enabled) {
          return res.status(400).json({ error: '自動同步未啟用' });
        }

        // 同步所有部門
        const departments: Department[] = ['COMMON', 'DQE', 'DQE_CERTI', 'HW', 'PWR', 'ME_LCM', 'SW', 'PJM', 'ARCH', 'TM'];
        const results = [];

        console.log('Starting auto-sync for departments:', departments);

        for (const dept of departments) {
          try {
            console.log(`Syncing department: ${dept}`);
            const result = await syncWikiToDifyEnhanced({
              department: dept,
              forceFullSync: false,
              dryRun: false,
            });
            results.push({ department: dept, success: true, result });
            console.log(`✅ Department ${dept} synced successfully`);
          } catch (error) {
            console.error(`❌ Failed to sync department ${dept}:`, error);
            results.push({
              department: dept,
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }
        }

        console.log('Auto-sync completed. Results:', results);

        return res.status(200).json({
          success: true,
          message: '自動同步完成',
          results,
        });
      } catch (error) {
        return res.status(500).json({
          error: error instanceof Error ? error.message : '自動同步失敗',
        });
      }
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Auto sync API error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
