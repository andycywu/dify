import type { NextApiRequest, NextApiResponse } from 'next';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { promises as fs } from 'fs';

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
      // 檢查配置文件
      try {
        const configPath = path.join(process.cwd(), '.wiki-sync-cron-config');
        const configContent = await fs.readFile(configPath, 'utf-8');
        const config = JSON.parse(configContent);

        return res.status(200).json({
          success: true,
          cronJobs: config.enabled ? [`自動同步已設置為每日 ${config.time}`] : [],
          hasWikiSyncCron: config.enabled || false,
        });
      } catch (error) {
        // 配置文件不存在或無效
        return res.status(200).json({
          success: true,
          cronJobs: [],
          hasWikiSyncCron: false,
        });
      }
    } else if (req.method === 'POST') {
      console.log('Raw request body:', req.body);
      const { action, time = '02:00' } = req.body;
      console.log('Parsed request:', { action, time, timeType: typeof time });

      if (action === 'check') {
        try {
          const configPath = path.join(process.cwd(), '.wiki-sync-cron-config');
          const configContent = await fs.readFile(configPath, 'utf-8');
          const config = JSON.parse(configContent);

          return res.status(200).json({
            success: true,
            cronJobs: config.enabled ? [`自動同步已設置為每日 ${config.time}`] : [],
            hasWikiSyncCron: config.enabled || false,
          });
        } catch (error) {
          return res.status(200).json({
            success: true,
            cronJobs: [],
            hasWikiSyncCron: false,
          });
        }
      }

      if (action === 'setup') {
        // 解析時間
        console.log('Parsing time:', time);
        const timeStr = String(time).trim();
        const [hour, minute] = timeStr.split(':');
        console.log('Parsed time:', { hour, minute, timeStr });

        if (!hour || !minute) {
          console.log('Invalid time format - missing hour or minute');
          return res.status(400).json({ error: 'Invalid time format. Use HH:MM' });
        }

        // 驗證小時和分鐘是否為有效數字
        const hourNum = parseInt(hour, 10);
        const minuteNum = parseInt(minute, 10);

        if (isNaN(hourNum) || isNaN(minuteNum)) {
          console.log('Invalid time values - not numbers:', { hourNum, minuteNum });
          return res.status(400).json({ error: 'Invalid time values. Hour and minute must be numbers' });
        }

        if (hourNum < 0 || hourNum > 23 || minuteNum < 0 || minuteNum > 59) {
          console.log('Invalid time range:', { hourNum, minuteNum });
          return res.status(400).json({ error: 'Invalid time values. Hour must be 0-23, minute must be 0-59' });
        }

        console.log('Time validation passed:', { hourNum, minuteNum });

        // 在 Docker 容器中，我們不能直接修改系統 crontab
        // 改為創建一個配置記錄，應用可以檢查這個配置來決定是否運行同步
        try {
          // 創建一個標記文件來表示已設置自動同步
          const configPath = path.join(process.cwd(), '.wiki-sync-cron-config');
          const config = {
            enabled: true,
            time: time,
            createdAt: new Date().toISOString()
          };

          // 寫入配置文件
          await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8');

          return res.status(200).json({
            success: true,
            message: `自動同步已設置為每日 ${time}。請在宿主機上運行以下命令設置系統 cron：\n\n0 ${hour} * * * /path/to/dify/auto-sync-call.sh\n\n或者使用 '測試自動同步' 按鈕進行手動測試。`,
          });
        } catch (error) {
          console.error('Failed to create cron config:', error);
          return res.status(500).json({ error: '無法創建自動同步配置' });
        }
      }

      if (action === 'remove') {
        try {
          // 刪除配置文件
          const configPath = path.join(process.cwd(), '.wiki-sync-cron-config');
          await fs.unlink(configPath).catch(() => {}); // 忽略如果文件不存在的錯誤

          return res.status(200).json({
            success: true,
            message: '自動同步配置已移除',
          });
        } catch (error) {
          console.error('Failed to remove cron config:', error);
          return res.status(500).json({ error: '無法移除自動同步配置' });
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
