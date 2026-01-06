require('dotenv').config();
const express = require('express');
const cors = require('cors');

// 導入路由
const httpsRoutes = require('./src/routes/https-routes');

const app = express();
const PORT = process.env.PORT || 5001;

// ============ 中間件配置 ============
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 請求日誌中間件
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// ============ 路由配置 ============

// HTTPS API 路由 (新增 - VBA 模式)
app.use('/api/https', httpsRoutes);

// SOAP API 路由 (保留原有功能)
// 將原有的 SOAP 相關代碼移到這裡或保持在原文件
const legacySoapRoutes = require('./index-soap');
app.use('/', legacySoapRoutes);

// ============ 首頁和文檔 ============
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Urtracker API Proxy</title>
      <style>
        body { 
          font-family: 'Segoe UI', Arial, sans-serif; 
          max-width: 1200px; 
          margin: 40px auto; 
          padding: 0 20px;
          line-height: 1.6;
          color: #333;
        }
        h1 { 
          color: #0066cc; 
          border-bottom: 3px solid #0066cc; 
          padding-bottom: 10px;
        }
        h2 { 
          color: #0088cc; 
          margin-top: 30px;
          border-left: 4px solid #0088cc;
          padding-left: 15px;
        }
        h3 { 
          color: #00aacc; 
          margin-top: 20px;
        }
        .mode-section {
          background-color: #f8f9fa;
          padding: 20px;
          margin: 20px 0;
          border-radius: 8px;
          border-left: 5px solid #0066cc;
        }
        .endpoint {
          background-color: #fff;
          padding: 15px;
          margin: 10px 0;
          border-radius: 5px;
          border: 1px solid #ddd;
        }
        .method {
          display: inline-block;
          padding: 3px 10px;
          border-radius: 3px;
          font-weight: bold;
          margin-right: 10px;
          font-size: 0.9em;
        }
        .get { background-color: #61affe; color: white; }
        .post { background-color: #49cc90; color: white; }
        .delete { background-color: #f93e3e; color: white; }
        code {
          background-color: #f4f4f4;
          padding: 2px 6px;
          border-radius: 3px;
          font-family: 'Courier New', monospace;
          font-size: 0.9em;
        }
        pre {
          background-color: #2d2d2d;
          color: #f8f8f2;
          padding: 15px;
          border-radius: 5px;
          overflow-x: auto;
          font-size: 0.9em;
        }
        .badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 0.85em;
          font-weight: bold;
          margin-left: 10px;
        }
        .badge-new { background-color: #28a745; color: white; }
        .badge-legacy { background-color: #6c757d; color: white; }
        .info-box {
          background-color: #d1ecf1;
          border: 1px solid #bee5eb;
          border-radius: 5px;
          padding: 15px;
          margin: 15px 0;
        }
        .warning-box {
          background-color: #fff3cd;
          border: 1px solid #ffeeba;
          border-radius: 5px;
          padding: 15px;
          margin: 15px 0;
        }
      </style>
    </head>
    <body>
      <h1>🚀 Urtracker API Proxy Server</h1>
      
      <div class="info-box">
        <strong>📡 服務狀態:</strong> 運行中<br>
        <strong>🕐 啟動時間:</strong> ${new Date().toISOString()}<br>
        <strong>🔧 模式:</strong> 雙模式 (HTTPS + SOAP)
      </div>

      <!-- HTTPS 模式 (新增) -->
      <div class="mode-section">
        <h2>🆕 HTTPS API Mode <span class="badge badge-new">NEW</span></h2>
        <p>
          基於 VBA 原始實現的 HTTPS 方式訪問 Urtracker<br>
          模擬 Excel VBA 的登入和下載流程，支持直接下載 Excel 文件
        </p>

        <h3>認證端點</h3>
        <div class="endpoint">
          <span class="method post">POST</span>
          <code>/api/https/login</code>
          <p>登入 Urtracker 並獲取 Session</p>
          <pre>curl -X POST http://localhost:${PORT}/api/https/login \\
  -H "Content-Type: application/json" \\
  -d '{"username":"your_username","password":"your_password"}'</pre>
        </div>

        <div class="endpoint">
          <span class="method get">GET</span>
          <code>/api/https/status</code>
          <p>檢查登入狀態</p>
        </div>

        <div class="endpoint">
          <span class="method post">POST</span>
          <code>/api/https/logout</code>
          <p>登出並清除 Session</p>
        </div>

        <h3>專案管理</h3>
        <div class="endpoint">
          <span class="method get">GET</span>
          <code>/api/https/projects</code>
          <p>獲取可用專案列表 (TV, PD, MNT, AVA)</p>
        </div>

        <h3>數據下載</h3>
        <div class="endpoint">
          <span class="method get">GET</span>
          <code>/api/https/download/:projectId</code>
          <p>下載指定專案的 Excel 數據</p>
          <pre>curl -O http://localhost:${PORT}/api/https/download/2558?name=TV-Data</pre>
        </div>

        <div class="endpoint">
          <span class="method get">GET</span>
          <code>/api/https/download-by-name/:projectKey</code>
          <p>通過專案代號下載 (TV, PD, MNT, AVA)</p>
          <pre>curl -O http://localhost:${PORT}/api/https/download-by-name/TV</pre>
        </div>

        <div class="endpoint">
          <span class="method get">GET</span>
          <code>/api/https/download-all</code>
          <p>批量下載所有專案 (返回摘要)</p>
        </div>

        <h3>完整工作流程範例</h3>
        <pre># 1. 登入
curl -X POST http://localhost:${PORT}/api/https/login \\
  -H "Content-Type: application/json" \\
  -d '{"username":"your_user","password":"your_pass"}'

# 2. 檢查狀態
curl http://localhost:${PORT}/api/https/status

# 3. 查看可用專案
curl http://localhost:${PORT}/api/https/projects

# 4. 下載 TV 專案數據
curl -O http://localhost:${PORT}/api/https/download-by-name/TV

# 5. 下載所有專案
curl http://localhost:${PORT}/api/https/download-all

# 6. 登出
curl -X POST http://localhost:${PORT}/api/https/logout</pre>
      </div>

      <!-- SOAP 模式 (原有) -->
      <div class="mode-section">
        <h2>🔧 SOAP API Mode <span class="badge badge-legacy">LEGACY</span></h2>
        <p>
          原有的 REST to SOAP 代理功能<br>
          支持 ${[
            'CreateIssue', 'UpdateIssueById', 'GetIssueInfo', 
            'GetProjectPRList', 'GetURTTaskList', '等 18 個 SOAP 方法'
          ].join(', ')}
        </p>

        <div class="endpoint">
          <span class="method post">POST</span>
          <code>/:method</code>
          <p>調用 SOAP 方法並返回清理後的 JSON 數據</p>
          <pre>curl -X POST http://localhost:${PORT}/GetIssueInfo \\
  -H "Content-Type: application/json" \\
  -d '{"issueID":1484510,"includeFields":true}'</pre>
        </div>

        <div class="endpoint">
          <span class="method post">POST</span>
          <code>/:method/full</code>
          <p>返回完整的 SOAP 響應</p>
        </div>

        <div class="endpoint">
          <span class="method post">POST</span>
          <code>/soap12/:method</code>
          <p>返回原始 XML 響應</p>
        </div>

        <div class="endpoint">
          <span class="method post">POST</span>
          <code>/getProjectIssuesDetails</code>
          <p>獲取專案所有問題的詳細信息</p>
        </div>
      </div>

      <div class="warning-box">
        <strong>⚠️ 注意事項:</strong>
        <ul>
          <li>HTTPS 模式需要先登入才能下載數據</li>
          <li>Session 會在服務器重啟後失效</li>
          <li>建議在生產環境中使用持久化的 Session 管理</li>
          <li>SOAP 模式的認證信息從環境變數 APP_ID 和 API_PWD 讀取</li>
        </ul>
      </div>

      <h2>📚 環境變數配置</h2>
      <pre># .env 文件
# SOAP API 認證 (用於 SOAP 模式)
APP_ID=your_app_id
API_PWD=your_api_password

# 服務器配置
PORT=5001

# Urtracker 基礎 URL (可選)
URTRACKER_BASE_URL=https://fwtrack.tpv-tech.com</pre>

      <h2>🔗 相關鏈接</h2>
      <ul>
        <li><a href="/api/https/test-connection">測試 Urtracker 連接</a></li>
        <li><a href="https://fwtrack.tpv-tech.com" target="_blank">Urtracker 官網</a></li>
      </ul>

      <hr style="margin: 40px 0;">
      <p style="text-align: center; color: #666;">
        <small>Urtracker API Proxy Server v2.0 | 支持 HTTPS 和 SOAP 雙模式</small>
      </p>
    </body>
    </html>
  `);
});

// ============ 健康檢查 ============
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    modes: {
      https: 'available',
      soap: 'available'
    },
    version: '2.0.0'
  });
});

// ============ 404 處理 ============
app.use((req, res) => {
  res.status(404).json({
    error: '端點不存在',
    message: `找不到 ${req.method} ${req.path}`,
    availableEndpoints: {
      https: '/api/https/*',
      soap: '/:method',
      docs: '/',
      health: '/health'
    }
  });
});

// ============ 錯誤處理 ============
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: '服務器錯誤',
    message: err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ============ 啟動服務器 ============
app.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log(`🚀 Urtracker API Proxy Server 啟動成功`);
  console.log('='.repeat(60));
  console.log(`📍 服務地址: http://localhost:${PORT}`);
  console.log(`📄 API 文檔: http://localhost:${PORT}/`);
  console.log(`\n📡 API 模式:`);
  console.log(`   🆕 HTTPS API: http://localhost:${PORT}/api/https`);
  console.log(`      - 模擬 VBA 登入和下載流程`);
  console.log(`      - 支持直接下載 Excel 文件`);
  console.log(`   🔧 SOAP API:  http://localhost:${PORT}/:method`);
  console.log(`      - 原有 REST to SOAP 代理功能`);
  console.log(`\n🔧 環境配置:`);
  console.log(`   • PORT: ${PORT}`);
  console.log(`   • APP_ID: ${process.env.APP_ID ? '[已設置]' : '[未設置]'}`);
  console.log(`   • API_PWD: ${process.env.API_PWD ? '[已設置]' : '[未設置]'}`);
  console.log('='.repeat(60));
  console.log(`\n💡 快速開始 (HTTPS 模式):`);
  console.log(`   1. 登入: curl -X POST http://localhost:${PORT}/api/https/login -H "Content-Type: application/json" -d '{"username":"USER","password":"PASS"}'`);
  console.log(`   2. 下載: curl -O http://localhost:${PORT}/api/https/download-by-name/TV`);
  console.log('='.repeat(60));
});

module.exports = app;
