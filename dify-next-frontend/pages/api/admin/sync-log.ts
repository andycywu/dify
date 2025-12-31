import type { NextApiRequest, NextApiResponse } from 'next';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * API: 獲取同步日誌
 *
 * GET /api/admin/sync-log
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 可能的日誌文件路徑
    const possibleLogPaths = [
      '/var/log/dify-wiki-sync/sync.log',
      path.join(process.cwd(), 'logs', 'sync.log'),
      path.join(process.cwd(), 'sync.log'),
    ];

    let logContent = '';

    for (const logPath of possibleLogPaths) {
      try {
        logContent = await fs.readFile(logPath, 'utf-8');
        break;
      } catch (error) {
        // 繼續嘗試下一個路徑
        continue;
      }
    }

    if (!logContent) {
      logContent = '未找到日誌文件或日誌為空';
    }

    // 分割為行數組
    const logLines = logContent.split('\n').filter(line => line.trim());

    return res.status(200).json({
      log: logLines,
    });
  } catch (error) {
    console.error('Sync log API error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
