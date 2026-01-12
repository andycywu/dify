const express = require('express');
const router = express.Router();
const UrtrackerHttpsClient = require('../clients/https-client');

// 全局 client 實例 (保持 session)
// 在生產環境中，建議使用 session 管理中間件
let globalClient = null;

/**
 * 獲取或創建 client 實例
 */
function getClient(req) {
  // 可以從 req.session 獲取用戶專屬的 client
  // 這裡簡化處理，使用全局 client
  if (!globalClient) {
    globalClient = new UrtrackerHttpsClient();
  }
  return globalClient;
}

/**
 * POST /api/https/login
 * 登入 Urtracker
 *
 * Body:
 *   - username: 用戶名
 *   - password: 密碼
 */
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      error: '缺少必要參數',
      message: '請提供 username 和 password'
    });
  }

  try {
    const client = getClient(req);
    const result = await client.login(username, password);

    res.json({
      success: true,
      message: '登入成功',
      data: {
        session: result.session,
        cookieCount: result.cookies.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: '登入失敗',
      message: error.message
    });
  }
});

/**
 * POST /api/https/logout
 * 登出
 */
router.post('/logout', (req, res) => {
  const client = getClient(req);
  client.logout();

  res.json({
    success: true,
    message: '已登出'
  });
});

/**
 * GET /api/https/status
 * 檢查登入狀態
 */
router.get('/status', (req, res) => {
  const client = getClient(req);
  const isLoggedIn = client.isLoggedIn();

  res.json({
    success: true,
    loggedIn: isLoggedIn,
    message: isLoggedIn ? '已登入' : '未登入'
  });
});

/**
 * GET /api/https/projects
 * 獲取專案列表
 */
router.get('/projects', (req, res) => {
  const client = getClient(req);
  const projects = client.getProjects();

  res.json({
    success: true,
    projects: Object.entries(projects).map(([key, value]) => ({
      key,
      id: value.id,
      name: value.name
    }))
  });
});

/**
 * GET /api/https/download/:projectId
 * 下載單一專案數據 (Excel)
 *
 * Params:
 *   - projectId: 專案 ID (例如: 2558)
 *
 * Query:
 *   - name: 專案名稱 (可選)
 *   - state: Issue 狀態 (可選: 'open', 'closed', 'all', 預設: 'all')
 */
router.get('/download/:projectId', async (req, res) => {
  const client = getClient(req);

  // 如果未登入，自動使用環境變數中的憑證登入
  if (!client.isLoggedIn()) {
    console.log('⚠️  未登入，嘗試使用環境變數憑證自動登入...');
    try {
      const username = process.env.URTRACKER_USERNAME;
      const password = process.env.URTRACKER_PASSWORD;
      console.log(`   📌 環境變數 URTRACKER_USERNAME: ${username || '(未設置)'}`);
      console.log(`   📌 環境變數 URTRACKER_PASSWORD: ${password ? '***已設置***' : '(未設置)'}`);

      if (!username || !password) {
        console.error('❌ 缺少 URTRACKER_USERNAME 或 URTRACKER_PASSWORD 環境變數');
        return res.status(401).json({
          success: false,
          error: '未配置認證信息',
          message: '請在環境變數中設置 URTRACKER_USERNAME 和 URTRACKER_PASSWORD'
        });
      }

      await client.login(username, password);
      console.log('✅ 自動登入成功');
    } catch (error) {
      console.error('❌ 自動登入失敗:', error.message);
      return res.status(401).json({
        success: false,
        error: '未登入且自動登入失敗',
        message: `請先調用 /api/https/login 登入: ${error.message}`
      });
    }
  }

  const { projectId } = req.params;
  const projectName = req.query.name || `Project-${projectId}`;
  const filterState = req.query.state || 'all';

  // 驗證 state 參數
  const validStates = ['open', 'closed', 'all'];
  if (!validStates.includes(filterState)) {
    return res.status(400).json({
      success: false,
      error: '無效的 state 參數',
      message: `state 必須是: ${validStates.join(', ')}`
    });
  }

  try {
    const result = await client.downloadProjectData(
      parseInt(projectId),
      projectName,
      filterState
    );

    // 設置 HTTP 響應頭，讓瀏覽器下載文件
    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.setHeader('Content-Length', result.size);
    res.end(result.buffer);
  } catch (error) {
    console.error('Download error:', error);

    // 根據錯誤訊息返回更具體的 HTTP 狀態碼
    let statusCode = 500;
    let errorType = '下載失敗';

    if (error.message.includes('權限') || error.message.includes('permission')) {
      statusCode = 403;
      errorType = '權限不足';
    } else if (error.message.includes('不存在') || error.message.includes('not found') || error.message.includes('找不到')) {
      statusCode = 404;
      errorType = '專案不存在';
    } else if (error.message.includes('Session') || error.message.includes('登入')) {
      statusCode = 401;
      errorType = '未授權';
    } else if (error.message.includes('超時') || error.message.includes('timeout')) {
      statusCode = 408;
      errorType = '請求超時';
    }

    res.status(statusCode).json({
      success: false,
      error: errorType,
      message: error.message,
      projectId: req.params.projectId,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/https/download/:projectId
 * 下載單一專案數據 (支持更多選項)
 * 與 GET 方法相同，但支持 POST body 傳遞更複雜的參數
 */
router.post('/download/:projectId', async (req, res) => {
  const client = getClient(req);

  // 如果未登入，自動使用環境變數中的憑證登入
  if (!client.isLoggedIn()) {
    console.log('⚠️  未登入，嘗試使用環境變數憑證自動登入...');
    try {
      const username = process.env.URTRACKER_USERNAME;
      const password = process.env.URTRACKER_PASSWORD;
      console.log(`   📌 環境變數 URTRACKER_USERNAME: ${username || '(未設置)'}`);
      console.log(`   📌 環境變數 URTRACKER_PASSWORD: ${password ? '***已設置***' : '(未設置)'}`);

      if (!username || !password) {
        console.error('❌ 缺少 URTRACKER_USERNAME 或 URTRACKER_PASSWORD 環境變數');
        return res.status(401).json({
          success: false,
          error: '未配置認證信息',
          message: '請在環境變數中設置 URTRACKER_USERNAME 和 URTRACKER_PASSWORD'
        });
      }

      await client.login(username, password);
      console.log('✅ 自動登入成功');
    } catch (error) {
      console.error('❌ 自動登入失敗:', error.message);
      return res.status(401).json({
        success: false,
        error: '未登入且自動登入失敗',
        message: `請先調用 /api/https/login 登入，或檢查默認憑證: ${error.message}`
      });
    }
  }

  const { projectId } = req.params;
  const { name, format, fieldStart, fieldEnd } = req.body;
  const projectName = name || `Project-${projectId}`;
  const options = {
    format: format || 'xls',
    fieldStart: fieldStart || 2,
    fieldEnd: fieldEnd || 68
  };

  try {
    const result = await client.downloadProjectData(
      parseInt(projectId),
      projectName,
      options
    );

    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.setHeader('Content-Length', result.size);
    res.send(result.data);
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({
      success: false,
      error: '下載失敗',
      message: error.message
    });
  }
});

/**
 * GET /api/https/download-all
 * 批量下載所有專案 (返回 JSON 摘要)
 *
 * 注意：此方法不直接返回文件，而是返回下載結果摘要
 * 如需獲取實際文件，請使用 /api/https/download-all-zip
 */
router.get('/download-all', async (req, res) => {
  const client = getClient(req);

  if (!client.isLoggedIn()) {
    return res.status(401).json({
      success: false,
      error: '未登入',
      message: '請先調用 /api/https/login 登入'
    });
  }

  try {
    const results = await client.downloadAllProjects();

    // 返回摘要信息（不包含實際文件數據）
    const summary = {
      ...results,
      results: results.results.map(r => ({
        projectId: r.projectId,
        projectName: r.projectName,
        filename: r.filename,
        size: r.size,
        contentType: r.contentType
        // 不包含 data 字段以減少響應大小
      }))
    };

    res.json(summary);
  } catch (error) {
    console.error('Download all error:', error);
    res.status(500).json({
      success: false,
      error: '批量下載失敗',
      message: error.message
    });
  }
});

/**
 * POST /api/https/download-by-name/:projectKey
 * 通過專案代號下載數據
 *
 * Params:
 *   - projectKey: 專案代號 (TV, PD, MNT, AVA)
 *
 * Query:
 *   - state: Issue 狀態 (可選: 'open', 'closed', 'all', 預設: 'all')
 */
router.get('/download-by-name/:projectKey', async (req, res) => {
  const client = getClient(req);

  // 如果未登入，自動使用環境變數中的憑證登入
  if (!client.isLoggedIn()) {
    console.log('⚠️  未登入，嘗試使用環境變數憑證自動登入...');
    try {
      const username = process.env.URTRACKER_USERNAME;
      const password = process.env.URTRACKER_PASSWORD;
      console.log(`   📌 環境變數 URTRACKER_USERNAME: ${username || '(未設置)'}`);
      console.log(`   📌 環境變數 URTRACKER_PASSWORD: ${password ? '***已設置***' : '(未設置)'}`);

      if (!username || !password) {
        console.error('❌ 缺少 URTRACKER_USERNAME 或 URTRACKER_PASSWORD 環境變數');
        return res.status(401).json({
          success: false,
          error: '未配置認證信息',
          message: '請在環境變數中設置 URTRACKER_USERNAME 和 URTRACKER_PASSWORD'
        });
      }

      await client.login(username, password);
      console.log('✅ 自動登入成功');
    } catch (error) {
      console.error('❌ 自動登入失敗:', error.message);
      return res.status(401).json({
        success: false,
        error: '未登入且自動登入失敗',
        message: `請先調用 /api/https/login 登入，或檢查默認憑證: ${error.message}`
      });
    }
  }

  const { projectKey } = req.params;
  const filterState = req.query.state || 'all';
  const projects = client.getProjects();
  const project = projects[projectKey.toUpperCase()];

  if (!project) {
    return res.status(404).json({
      success: false,
      error: '專案不存在',
      message: `找不到專案: ${projectKey}`,
      availableProjects: Object.keys(projects)
    });
  }

  // 驗證 state 參數
  const validStates = ['open', 'closed', 'all'];
  if (!validStates.includes(filterState)) {
    return res.status(400).json({
      success: false,
      error: '無效的 state 參數',
      message: `state 必須是: ${validStates.join(', ')}`
    });
  }

  try {
    const result = await client.downloadProjectData(project.id, project.name, filterState);

    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.setHeader('Content-Length', result.size);
    res.end(result.buffer);
  } catch (error) {
    console.error('Download by name error:', error);

    // 根據錯誤訊息返回更具體的 HTTP 狀態碼
    let statusCode = 500;
    let errorType = '下載失敗';

    if (error.message.includes('權限') || error.message.includes('permission')) {
      statusCode = 403;
      errorType = '權限不足';
    } else if (error.message.includes('不存在') || error.message.includes('not found') || error.message.includes('找不到')) {
      statusCode = 404;
      errorType = '專案不存在';
    } else if (error.message.includes('Session') || error.message.includes('登入')) {
      statusCode = 401;
      errorType = '未授權';
    } else if (error.message.includes('超時') || error.message.includes('timeout')) {
      statusCode = 408;
      errorType = '請求超時';
    }

    res.status(statusCode).json({
      success: false,
      error: errorType,
      message: error.message,
      projectKey: req.params.projectKey,
      projectId: project.id,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/https/test-connection
 * 測試連接到 Urtracker
 */
router.get('/test-connection', async (req, res) => {
  const axios = require('axios');

  try {
    const response = await axios.get('https://fwtrack.tpv-tech.com', {
      timeout: 5000,
      validateStatus: () => true
    });

    res.json({
      success: true,
      message: '連接成功',
      status: response.status,
      statusText: response.statusText
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '連接失敗',
      message: error.message
    });
  }
});

module.exports = router;
