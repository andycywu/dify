import type { NextApiRequest, NextApiResponse } from 'next';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

/**
 * API: 設置或檢查 Cron Job
 *
 * GET /api/admin/setup-cron
 *   - 檢查當前 cron jobs
 *
 * POST /api/admin/setup-cron
 * body: {
 *   action: 'setup' | 'remove' | 'check',
 *   time?: string (HH:MM format, e.g., '02:00')
 * }
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method === 'GET') {
      // 檢查當前 cron jobs
      const { stdout } = await execAsync('crontab -l 2>/dev/null || echo "No cron jobs found"');
      const cronJobs = stdout.split('\n').filter(line => line.includes('sync-wiki') || line.includes('wiki-sync'));

      return res.status(200).json({
        success: true,
        cronJobs,
        hasWikiSyncCron: cronJobs.length > 0,
      });
    } else if (req.method === 'POST') {
      const { action, time = '02:00' } = req.body;

      if (action === 'check') {
        const { stdout } = await execAsync('crontab -l 2>/dev/null || echo "No cron jobs found"');
        const cronJobs = stdout.split('\n').filter(line => line.includes('sync-wiki') || line.includes('wiki-sync'));

        return res.status(200).json({
          success: true,
          cronJobs,
          hasWikiSyncCron: cronJobs.length > 0,
        });
      }

      if (action === 'setup') {
        // 解析時間
        const [hour, minute] = time.split(':');
        if (!hour || !minute) {
          return res.status(400).json({ error: 'Invalid time format. Use HH:MM' });
        }

        // 創建 cron 腳本路徑
        const scriptPath = path.join(process.cwd(), 'setup-wiki-sync-cron.sh');

        // 檢查腳本是否存在
        try {
          await execAsync(`test -f "${scriptPath}"`);
        } catch (error) {
          return res.status(400).json({ error: 'setup-wiki-sync-cron.sh script not found' });
        }

        // 執行設置腳本
        await execAsync(`chmod +x "${scriptPath}" && "${scriptPath}"`);

        return res.status(200).json({
          success: true,
          message: `Cron job set up successfully for ${time} daily`,
        });
      }

      if (action === 'remove') {
        // 移除現有的 wiki sync cron jobs
        const { stdout: currentCrontab } = await execAsync('crontab -l 2>/dev/null || echo ""');
        const lines = currentCrontab.split('\n');
        const filteredLines = lines.filter(line =>
          !line.includes('sync-wiki') && !line.includes('wiki-sync') && line.trim() !== ''
        );

        if (filteredLines.length !== lines.length) {
          // 有變化，更新 crontab
          const newCrontab = filteredLines.join('\n') + '\n';
          await execAsync(`echo "${newCrontab}" | crontab -`);

          return res.status(200).json({
            success: true,
            message: 'Wiki sync cron jobs removed successfully',
          });
        } else {
          return res.status(200).json({
            success: true,
            message: 'No wiki sync cron jobs found to remove',
          });
        }
      }

      return res.status(400).json({ error: 'Invalid action' });
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Setup cron API error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
