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
    // 使用應用目錄中的日誌文件
    const logPath = path.join(process.cwd(), 'logs', 'sync.log');

    let logContent = '';

    try {
      // 確保日誌目錄存在
      await fs.mkdir(path.dirname(logPath), { recursive: true });

      // 嘗試讀取日誌文件
      logContent = await fs.readFile(logPath, 'utf-8');
      console.log(`Found log file at: ${logPath}`);
    } catch (error) {
      // 如果日誌文件不存在，創建一個示例日誌
      logContent = `[${new Date().toISOString()}] 系統日誌初始化\n[${new Date().toISOString()}] 尚未執行任何同步操作\n[${new Date().toISOString()}] 請先執行同步操作以生成日誌`;

      // 寫入示例日誌
      await fs.writeFile(logPath, logContent, 'utf-8');
      console.log(`Created new log file at: ${logPath}`);
    }

    // 分割為行數組
    const logLines = logContent.split('\n').filter(line => line.trim());

    return res.status(200).json({
      log: logLines,
      foundPath: logPath,
    });
  } catch (error) {
    console.error('Sync log API error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
