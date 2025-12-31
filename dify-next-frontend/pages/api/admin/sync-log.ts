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
      path.join(process.cwd(), '..', 'logs', 'sync.log'), // 檢查父目錄
    ];

    let logContent = '';
    let foundPath = '';

    for (const logPath of possibleLogPaths) {
      try {
        logContent = await fs.readFile(logPath, 'utf-8');
        foundPath = logPath;
        console.log(`Found log file at: ${logPath}`);
        break;
      } catch (error) {
        // 繼續嘗試下一個路徑
        console.log(`Log file not found at: ${logPath}`);
        continue;
      }
    }

    if (!logContent) {
      // 如果沒有找到日誌文件，創建一個示例日誌
      logContent = `[${new Date().toISOString()}] 系統日誌初始化\n[${new Date().toISOString()}] 尚未執行任何同步操作\n[${new Date().toISOString()}] 請先執行同步操作以生成日誌`;
    }

    // 分割為行數組
    const logLines = logContent.split('\n').filter(line => line.trim());

    return res.status(200).json({
      log: logLines,
      foundPath: foundPath || '未找到日誌文件，使用默認內容',
    });
  } catch (error) {
    console.error('Sync log API error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
