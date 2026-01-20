import type { NextApiRequest, NextApiResponse } from 'next';
import { exec, spawn } from 'child_process';
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

  // 只有 POST 請求才檢查請求體
  if (req.method === 'POST' && (!req.body || typeof req.body !== 'object')) {
    console.log('ERROR: Invalid request body for POST');
    return res.status(400).json({ error: 'Invalid request body' });
  }

  try {
    if (req.method === 'GET') {
      // 檢查配置文件和進程
      try {
        const configPath = path.join(process.cwd(), '.wiki-sync-cron-config');
        const configContent = await fs.readFile(configPath, 'utf-8');
        const config = JSON.parse(configContent);

        // 檢查 cron runner 進程是否運行
        let isRunning = false;
        try {
          const { stdout } = await execAsync('tasklist /FI "IMAGENAME eq node.exe" /FO CSV');
          isRunning = stdout.includes('node.exe');
        } catch (error) {
          // 忽略錯誤
        }

        return res.status(200).json({
          success: true,
          cronJobs: config.enabled ? [`自動同步已設置為每日 ${config.time}`] : [],
          hasWikiSyncCron: config.enabled || false,
          isRunnerRunning: isRunning,
        });
      } catch (error) {
        // 配置文件不存在或無效
        return res.status(200).json({
          success: true,
          cronJobs: [],
          hasWikiSyncCron: false,
          isRunnerRunning: false,
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

          // 檢查 cron runner 進程是否運行（適應不同操作系統）
          let isRunning = false;
          try {
            // 檢查是否為 Windows 或 Linux
            const isWindows = process.platform === 'win32';
            if (isWindows) {
              const { stdout } = await execAsync('tasklist /FI "IMAGENAME eq node.exe" /FO CSV');
              isRunning = stdout.includes('node.exe');
            } else {
              // Linux/Unix 系統
              const { stdout } = await execAsync('pgrep -f "cron-runner.js"');
              isRunning = stdout.trim().length > 0;
            }
          } catch (error) {
            // 忽略錯誤，假設進程未運行
            isRunning = false;
          }

          return res.status(200).json({
            success: true,
            cronJobs: config.enabled ? [`自動同步已設置為每日 ${config.time}`] : [],
            hasWikiSyncCron: config.enabled || false,
            isRunnerRunning: isRunning,
          });
        } catch (error) {
          return res.status(200).json({
            success: true,
            cronJobs: [],
            hasWikiSyncCron: false,
            isRunnerRunning: false,
          });
        }
      }

      if (action === 'setup') {
        console.log('=== SETUP ACTION STARTED ===');
        console.log('Time received:', time);

        // 創建配置文件
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

          // 啟動 cron runner 進程
          console.log('Starting cron runner process...');
          const runnerPath = path.join(process.cwd(), 'cron-runner.js');

          // 檢查文件是否存在
          try {
            await fs.access(runnerPath);
          } catch (error) {
            console.error('Cron runner script not found:', runnerPath);
            return res.status(500).json({ error: 'Cron runner script not found' });
          }

          // 使用 spawn 啟動背景進程
          // 對於遠端伺服器，使用外部可訪問的地址
          const externalApiUrl = process.env.NEXT_PUBLIC_ADMIN_PANEL_URL || 'http://172.27.197.100:3001';
          const runnerProcess = spawn('node', [runnerPath], {
            detached: true,
            stdio: 'ignore',
            cwd: process.cwd(),
            env: {
              ...process.env,
              API_BASE_URL: externalApiUrl,
              NODE_ENV: 'production' // 在遠端伺服器上運行
            }
          });

          runnerProcess.unref();

          console.log('Cron runner process started with PID:', runnerProcess.pid);

          return res.status(200).json({
            success: true,
            message: `自動同步已設置為每日 ${time || '02:00'}，並啟動了定時器進程。`,
          });
        } catch (error) {
          console.error('Failed to create config or start runner:', error);
          return res.status(500).json({ error: '無法創建配置文件或啟動定時器' });
        }
      }

      if (action === 'remove') {
        try {
          // 刪除配置文件
          const configPath = path.join(process.cwd(), '.wiki-sync-cron-config');
          await fs.unlink(configPath).catch(() => {}); // 忽略如果文件不存在的錯誤

          // 嘗試終止 cron runner 進程（適應不同操作系統）
          try {
            const isWindows = process.platform === 'win32';
            if (isWindows) {
              await execAsync('taskkill /F /IM node.exe /FI "WINDOWTITLE eq cron-runner"');
            } else {
              // Linux/Unix 系統
              await execAsync('pkill -f "cron-runner.js"');
            }
          } catch (error) {
            // 忽略錯誤
          }

          return res.status(200).json({
            success: true,
            message: '自動同步配置已移除，定時器進程已終止',
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
