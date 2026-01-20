const cron = require('node-cron');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// 配置文件路徑
const CONFIG_PATH = path.join(__dirname, '.wiki-sync-cron-config');

// 日誌文件路徑
const LOG_DIR = path.join(__dirname, 'logs');
const LOG_FILE = path.join(LOG_DIR, 'cron-runner.log');

// 確保日誌目錄存在
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// 日誌函數
function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] ${message}\n`;

  console.log(logMessage.trim());

  try {
    fs.appendFileSync(LOG_FILE, logMessage);
  } catch (error) {
    console.error('Failed to write to log file:', error);
  }
}

// API URL - 從環境變數獲取或使用遠端伺服器地址
const API_URL = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_ADMIN_PANEL_URL || 'http://172.27.197.100:3001';

log('🚀 Starting Wiki-Dify Auto Sync Cron Runner...');
log('📡 API URL: ' + API_URL);
log('📁 Config path: ' + CONFIG_PATH);
log('📝 Log file: ' + LOG_FILE);
log('🖥️  Environment: ' + (process.env.NODE_ENV || 'development'));

// 重試函數
async function retryOperation(operation, maxRetries = 3, delay = 5000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      log(`Attempt ${i + 1} failed: ${error.message}`, 'WARN');
      if (i < maxRetries - 1) {
        log(`Waiting ${delay}ms before retry...`, 'INFO');
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  throw new Error(`Operation failed after ${maxRetries} attempts`);
}

// 執行自動同步
async function performAutoSync() {
  const syncOperation = async () => {
    log('🔄 Starting scheduled auto sync...');

    const response = await axios.post(`${API_URL}/api/admin/auto-sync`, {}, {
      timeout: 900000, // 15 分鐘超時（遠端伺服器可能需要更長時間）
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Wiki-Dify-Cron-Runner/1.0'
      }
    });

    return response;
  };

  try {
    const response = await retryOperation(syncOperation, 3, 10000);
    log('✅ Auto sync completed: ' + (response.data?.message || 'Success'));
    return true;
  } catch (error) {
    log('❌ Auto sync failed after retries: ' + error.message, 'ERROR');
    return false;
  }
}

// 檢查配置文件並設置 cron job
function setupCronJob() {
  try {
    if (!fs.existsSync(CONFIG_PATH)) {
      log('❌ Config file not found. Auto sync not enabled.');
      return;
    }

    const configContent = fs.readFileSync(CONFIG_PATH, 'utf-8');
    const config = JSON.parse(configContent);

    if (!config.enabled) {
      log('❌ Auto sync is disabled in config.');
      return;
    }

    const [hour, minute] = config.time.split(':');
    const cronExpression = `${minute} ${hour} * * *`; // 每天指定時間

    log(`✅ Setting up cron job for ${config.time} (${cronExpression})`);

    // 設置 cron job
    cron.schedule(cronExpression, async () => {
      await performAutoSync();
    });

    log('🎉 Cron job setup completed!');
  } catch (error) {
    log('❌ Failed to setup cron job: ' + error.message, 'ERROR');
  }
}

// 啟動時設置
setupCronJob();

// 每小時檢查配置文件變化（可選）
cron.schedule('0 * * * *', () => {
  log('🔍 Checking for config updates...');
  setupCronJob();
});

log('📅 Cron runner is running. Waiting for scheduled tasks...');

// 保持進程運行
process.on('SIGINT', () => {
  log('👋 Shutting down cron runner...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  log('👋 Shutting down cron runner...');
  process.exit(0);
});
