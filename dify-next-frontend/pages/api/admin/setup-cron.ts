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
  console.log('=== SETUP-CRON API CALLED ===');
  console.log('Method:', req.method);
  console.log('Headers:', req.headers);
  console.log('Raw body:', req.body);
  console.log('Body type:', typeof req.body);

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
        console.log('=== SETUP ACTION STARTED ===');
        console.log('Time received:', time);

        // 臨時跳過驗證，直接創建配置文件
        try {
          const configPath = path.join(process.cwd(), '.wiki-sync-cron-config');
          const config = {
            enabled: true,
            time: time || '02:00',
            createdAt: new Date().toISOString()
          };

          console.log('Creating config:', config);
          await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8');
          console.log('Config file created successfully');

          return res.status(200).json({
            success: true,
            message: `自動同步已設置為每日 ${time || '02:00'}。`,
          });
        } catch (error) {
          console.error('Failed to create config:', error);
          return res.status(500).json({ error: '無法創建配置文件' });
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
