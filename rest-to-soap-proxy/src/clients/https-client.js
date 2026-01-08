const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs').promises;

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

      // 步驟 2: 在導出頁面，配置下載並觸發
      console.log('   步驟2: 配置下載並點擊最終導出按鈕...');
      const downloadPath = path.resolve(__dirname, 'downloads');
      await fs.mkdir(downloadPath, { recursive: true });

      const client = await this.page.target().createCDPSession();
      await client.send('Page.setDownloadBehavior', {
          behavior: 'allow',
          downloadPath: downloadPath,
      });

      // 監聽下載事件
      const downloadPromise = new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('下載超時 (90秒)')), 90000);
        client.on('Page.downloadWillBegin', (data) => {
            console.log(`   📥 偵測到下載: ${data.suggestedFilename}`);
        });
        client.on('Page.downloadProgress', (data) => {
            if (data.state === 'completed') {
                clearTimeout(timeout);
                resolve();
            } else if (data.state === 'canceled') {
                clearTimeout(timeout);
                reject(new Error('下載被伺服器取消'));
            }
        });
      });

      // 點擊最終的導出按鈕
      // 根據您提供的最新截圖和指示，使用 id 屬性來精準定位按鈕
      const finalExportButtonSelector = '#ctl00_CP1_btnExport';

      console.log('   ⏳ 等待最終的導出按鈕完全載入...');
      await this.page.waitForSelector(finalExportButtonSelector, { timeout: 10000 });
      console.log('   ✅ 導出按鈕已找到。');

      // Debug: 截圖並記錄當前頁面狀態
      const beforeSubmitScreenshot = path.resolve(__dirname, `debug_before_submit_${Date.now()}.png`);
      await this.page.screenshot({ path: beforeSubmitScreenshot, fullPage: true });
      console.log(`   📸 提交前截圖: ${beforeSubmitScreenshot}`);

      // Debug: 監聽所有響應，特別是下載相關的
      let downloadResponseDetected = false;
      this.page.on('response', async (response) => {
        const headers = response.headers();
        const contentType = headers['content-type'] || '';
        const contentDisposition = headers['content-disposition'] || '';

        if (contentDisposition.includes('attachment') ||
            contentType.includes('application/vnd.ms-excel') ||
            contentType.includes('application/octet-stream')) {
          console.log(`   🔍 偵測到下載響應: ${response.url()}`);
          console.log(`   📋 Content-Type: ${contentType}`);
          console.log(`   📋 Content-Disposition: ${contentDisposition}`);
          downloadResponseDetected = true;
        }
      });

      // 最終解決方案：不再模擬點擊，而是直接提交表單。
      console.log('   🚀 終極手段：直接提交表單...');

      try {
        // 提交表單並等待可能的導航
        await Promise.race([
          this.page.evaluate(() => {
            const form = document.getElementById('aspnetForm');
            if (form) {
              form.submit();
            } else {
              throw new Error('找不到頁面主表單 (aspnetForm)');
            }
          }),
          this.page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => {
            console.log('   ℹ️  無導航事件發生（這可能是正常的）');
          })
        ]);

        // 等待 5 秒讓頁面完成所有操作
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Debug: 提交後截圖
        const afterSubmitScreenshot = path.resolve(__dirname, `debug_after_submit_${Date.now()}.png`);
        await this.page.screenshot({ path: afterSubmitScreenshot, fullPage: true });
        console.log(`   📸 提交後截圖: ${afterSubmitScreenshot}`);
        console.log(`   📍 當前頁面 URL: ${this.page.url()}`);
        console.log(`   📍 當前頁面標題: ${await this.page.title()}`);
        console.log(`   🔍 是否偵測到下載響應: ${downloadResponseDetected ? '是' : '否'}`);

      } catch (error) {
        console.error(`   ⚠️  表單提交過程出現異常: ${error.message}`);
      }

      // 等待下載完成
      console.log('   ⏳ 等待下載完成...');
      await downloadPromise;

      // 尋找下載目錄中最新的檔案
      const files = await fs.readdir(downloadPath);
      if (files.length === 0) throw new Error('下載目錄為空，找不到下載的檔案');

      const downloadedFilePath = path.join(downloadPath, files.sort((a, b) => {
        return fs.statSync(path.join(downloadPath, b)).mtime.getTime() -
               fs.statSync(path.join(downloadPath, a)).mtime.getTime();
      })[0]);

      console.log(`   ✅ 文件已下載到: ${downloadedFilePath}`);

      const buffer = await fs.readFile(downloadedFilePath);
      const stats = await fs.stat(downloadedFilePath);

      // 刪除臨時文件
      await fs.unlink(downloadedFilePath);

      if (buffer.length < 1024) { // 小於 1KB 的文件很可能是錯誤頁面
        throw new Error(`下載失敗: 文件大小只有 ${buffer.length} bytes`);
      }

      return {
        buffer,
        filename: `${projectName}-Data-${new Date().toISOString().split('T')[0]}.xls`,
        size: stats.size,
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
