const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs').promises;
const https = require('https');
const { URL, URLSearchParams } = require('url');

/**
 * Urtracker HTTPS 客戶端 (Puppeteer 版本)
 * 使用無頭瀏覽器模擬真實使用者操作，以應對伺服器不穩定和複雜的 ASP.NET 狀態管理。
 */
class UrtrackerHttpsClient {
  constructor(options = {}) {
    this.baseURL = options.baseURL || 'https://fwtrack.tpv-tech.com';
    this.browser = null;
    this.page = null;
    this.timeout = options.timeout || 60000; // 增加超時時間以應對瀏覽器操作

    // 項目配置
    this.projects = {
      TV: { id: 2558, name: 'TV-Data' },
      PD: { id: 2559, name: 'PD-Data' },
      MNT: { id: 2561, name: 'MNT-Data' },
      AVA: { id: 2560, name: 'AVA-Data' }
    };
  }

  /**
   * 初始化 Puppeteer 瀏覽器實例
   */
  async _initialize() {
    if (this.browser) return;
    console.log('🚀 啟動 Puppeteer 瀏覽器...');
    this.browser = await puppeteer.launch({
      headless: true, // 使用無頭模式
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process', // linux only
        '--disable-gpu'
      ]
    });
    this.page = await this.browser.newPage();
    await this.page.setDefaultNavigationTimeout(this.timeout);
    console.log('✅ 瀏覽器和頁面已準備就緒');
  }

  /**
   * 登入 Urtracker
   * @param {string} username - 用戶名
   * @param {string} password - 密碼
   */
  async login(username, password) {
    await this._initialize();
    const loginURL = `${this.baseURL}/Accounts/login.aspx?ReturnUrl=%2fdefault.aspx`;

    console.log('🔐 開始登入 Urtracker...');
    try {
      // 1. 導航到登入頁面
      console.log(`   步驟1: 導航到登入頁面...`);
      await this.page.goto(loginURL, { waitUntil: 'networkidle2' });

      // 2. 輸入帳號和密碼
      console.log(`   步驟2: 輸入用戶名和密碼...`);
      await this.page.type('#txtEmail', username);
      await this.page.type('#txtPassword', password);

      // 3. 點擊登入按鈕並等待導航完成
      console.log('   步驟3: 點擊登入按鈕...');
      await Promise.all([
        this.page.click('#btnLogin'),
        this.page.waitForNavigation({ waitUntil: 'networkidle2' })
      ]);

      // 4. 驗證登入是否成功
      const pageTitle = await this.page.title();
      console.log(`   📊 登入後頁面標題: ${pageTitle}`);
      if (pageTitle.includes('Login')) {
        throw new Error('登入失敗，頁面仍在登入頁。請檢查帳號密碼。');
      }

      console.log('✅ Urtracker 登入成功');
      return { success: true };

    } catch (error) {
      console.error('❌ Urtracker 登入失敗:', error.message);
      await this.logout(); // 登入失敗時關閉瀏覽器
      throw error;
    }
  }

  /**
   * 下載專案數據 (Excel 格式) - PTS 系統版本
   * @param {number} projectId - 專案 ID, 例如 2561 代表 MNT
   * @param {string} projectName - 專案名稱, 用於日誌和檔名
   * @returns {Object} 下載結果 { buffer, filename, size, contentType }
   */
  async downloadProjectData(projectId, projectName = 'Data') {
    if (!this.page) {
      throw new Error('未登入，請先調用 login() 方法');
    }

    console.log(`\n📥 開始下載專案: ${projectName} (ID: ${projectId}) - 採用簡化流程`);

    try {
      // 步驟 1: 直接導航到導出頁面
      // 根據您提供的最新錄製檔，這是一個更直接的路徑
      // FilterType=1 代表 "跟蹤中"
      const exportPageUrl = `${this.baseURL}/Pts/ProblemListExport.aspx?project=${projectId}&FilterType=1&procName=State_3&Title=All+Issues`;
      console.log(`   步驟1: 直接導航到導出頁面...`);
      await this.page.goto(exportPageUrl, { waitUntil: 'networkidle2' });
      console.log(`   ✓ 成功到達導出頁面: ${await this.page.title()}`);

      // 步驟 2: 提取表單數據並使用 HTTP 請求下載
      console.log('   步驟2: 提取表單數據並發送 HTTP 請求...');

      // Debug: 保存頁面 HTML 來檢查 __EVENTVALIDATION
      const pageHtml = await this.page.content();
      const htmlPath = path.resolve(__dirname, `debug_page_${Date.now()}.html`);
      await fs.writeFile(htmlPath, pageHtml);
      console.log(`   🔍 頁面 HTML 已保存: ${htmlPath}`);

      // 檢查 __EVENTVALIDATION 是否存在於頁面中
      const hasEventValidation = pageHtml.includes('__EVENTVALIDATION');
      console.log(`   🔍 頁面中是否包含 __EVENTVALIDATION: ${hasEventValidation ? '✅ 是' : '❌ 否'}`);

      // 提取頁面中的所有表單數據
      const formData = await this.page.evaluate(() => {
        const form = document.getElementById('aspnetForm');
        if (!form) return null;

        const data = {};
        const inputs = form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
          if (input.name) {
            if (input.type === 'checkbox' || input.type === 'radio') {
              if (input.checked) {
                data[input.name] = input.value || 'on';
              }
            } else {
              data[input.name] = input.value || '';
            }
          }
        });
        return data;
      });

      if (!formData) {
        throw new Error('無法提取表單數據');
      }

      // 設置 __EVENTTARGET 來觸發導出按鈕
      formData['__EVENTTARGET'] = 'ctl00$CP1$btnExport';
      formData['__EVENTARGUMENT'] = '';

      // 獲取當前頁面的 cookies
      const cookies = await this.page.cookies();
      const cookieString = cookies.map(c => `${c.name}=${c.value}`).join('; ');

      console.log('   📋 表單數據已提取');
      console.log(`   📊 表單欄位數量: ${Object.keys(formData).length}`);
      console.log(`   🔑 關鍵欄位檢查:`);
      console.log(`      - __VIEWSTATE: ${formData['__VIEWSTATE'] ? formData['__VIEWSTATE'].substring(0, 50) + '...' : '❌ 缺失'}`);
      console.log(`      - __VIEWSTATEGENERATOR: ${formData['__VIEWSTATEGENERATOR'] || '❌ 缺失'}`);
      console.log(`      - __EVENTVALIDATION: ${formData['__EVENTVALIDATION'] ? formData['__EVENTVALIDATION'].substring(0, 50) + '...' : '❌ 缺失'}`);
      console.log(`      - __EVENTTARGET: ${formData['__EVENTTARGET']}`);
      console.log('   🍪 Cookies 已獲取');

      // 使用 Node.js 的 https 模組發送請求
      const https = require('https');
      const { URLSearchParams } = require('url');

      const postData = new URLSearchParams(formData).toString();
      const url = new URL(exportPageUrl);

      const options = {
        hostname: url.hostname,
        port: 443,
        path: url.pathname + url.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(postData),
          'Cookie': cookieString,
          'User-Agent': await this.page.evaluate(() => navigator.userAgent),
          'Referer': exportPageUrl
        }
      };

      console.log('   🚀 發送 HTTP POST 請求...');

      const downloadBuffer = await new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
          console.log(`   📡 響應狀態: ${res.statusCode}`);
          console.log(`   📋 Content-Type: ${res.headers['content-type']}`);
          console.log(`   📋 Content-Disposition: ${res.headers['content-disposition']}`);

          const chunks = [];
          res.on('data', (chunk) => chunks.push(chunk));
          res.on('end', () => {
            const buffer = Buffer.concat(chunks);
            console.log(`   ✅ 成功接收數據，大小: ${buffer.length} bytes`);

            // 如果不是 Excel 文件，顯示前 500 個字符以便調試
            const contentType = res.headers['content-type'] || '';
            if (!contentType.includes('excel') && !contentType.includes('application/vnd.ms-excel')) {
              console.log(`   ⚠️  警告：返回的不是 Excel 文件！`);
              console.log(`   📄 響應內容預覽:\n${buffer.toString('utf-8').substring(0, 500)}`);
            }

            resolve(buffer);
          });
        });

        req.on('error', (error) => {
          console.error(`   ❌ 請求失敗: ${error.message}`);
          reject(error);
        });

        req.write(postData);
        req.end();
      });

      if (!downloadBuffer || downloadBuffer.length < 1024) {
        throw new Error(`下載失敗: 文件大小只有 ${downloadBuffer ? downloadBuffer.length : 0} bytes`);
      }

      return {
        buffer: downloadBuffer,
        filename: `${projectName}-Data-${new Date().toISOString().split('T')[0]}.xls`,
        size: downloadBuffer.length,
        contentType: 'application/vnd.ms-excel'
      };

    } catch (error) {
      console.error(`   ❌ ${projectName} 下載失敗: ${error.message}`);
      // 增加錯誤截圖，方便除錯
      const errorScreenshotPath = path.resolve(__dirname, `error_${projectName}_${Date.now()}.png`);
      await this.page.screenshot({ path: errorScreenshotPath, fullPage: true });
      console.error(`   📸 錯誤截圖已保存至: ${errorScreenshotPath}`);
      throw error;
    }
  }

  /**
   * 批量下載所有專案
   * @returns {Array} 所有下載結果
   */
  async downloadAllProjects() {
    console.log('\n🚀 開始批量下載所有專案...');
    if (!this.page) {
      throw new Error('未登入，請先調用 login() 方法');
    }

    const results = [];
    const errors = [];

    for (const [key, project] of Object.entries(this.projects)) {
      try {
        // 特別處理 MNT 專案，因為我們知道它的流程
        if (key === 'MNT') {
            const result = await this.downloadProjectData(project.id, project.name);
            results.push(result);
        } else {
            console.log(`   ⏭️  跳過專案 ${project.name} (目前僅實作 MNT)`);
        }
      } catch (error) {
        errors.push({ project: project.name, error: error.message });
      }
    }

    console.log('\n📊 下載完成統計:');
    console.log(`   成功: ${results.length} 個`);
    console.log(`   失敗: ${errors.length} 個`);

    return { results, errors };
  }

  /**
   * 關閉瀏覽器並清除會話
   */
  async logout() {
    if (this.browser) {
      console.log('🚪 關閉 Puppeteer 瀏覽器...');
      await this.browser.close();
    }
    this.browser = null;
    this.page = null;
    console.log('🔓 已登出');
  }

  /**
   * 檢查是否已登入
   */
  isLoggedIn() {
    return !!this.page;
  }

  /**
   * 獲取專案列表
   */
  getProjects() {
    return this.projects;
  }
}

module.exports = UrtrackerHttpsClient;
