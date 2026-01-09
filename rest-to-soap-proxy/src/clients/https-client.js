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
      AVA: { id: 2337, name: 'AVA-Data' }
    };
  }

  /**
   * 初始化 Puppeteer 瀏覽器實例
   */
  async _initialize() {
    if (this.browser) return;
    console.log('🚀 啟動 Puppeteer 瀏覽器...');

    // 配置瀏覽器啟動選項
    const launchOptions = {
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
    };

    // 在 Docker 環境中，使用系統提供的 Chrome
    // Puppeteer 官方鏡像將 Chrome 安裝在 /usr/bin/google-chrome-stable
    if (process.env.PUPPETEER_EXECUTABLE_PATH || process.env.CHROME_BIN) {
      launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || process.env.CHROME_BIN;
      console.log(`   📍 使用指定的瀏覽器: ${launchOptions.executablePath}`);
    }

    this.browser = await puppeteer.launch(launchOptions);
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
   * @param {string} filterState - Issue 狀態過濾: 'open', 'closed', 'all' (預設: 'all')
   * @returns {Object} 下載結果 { buffer, filename, size, contentType }
   */
  async downloadProjectData(projectId, projectName = 'Data', filterState = 'all') {
    if (!this.page) {
      throw new Error('未登入，請先調用 login() 方法');
    }

    // 根據 filterState 決定 procName 和 Title
    const filterConfig = {
      'open': { procName: 'State_1', title: 'Open+issues' },
      'closed': { procName: 'State_2', title: 'Closed' },
      'all': { procName: 'State_3', title: 'All+Issues' }
    };

    const filter = filterConfig[filterState] || filterConfig['all'];
    console.log(`\n📥 開始下載專案: ${projectName} (ID: ${projectId}, 狀態: ${filterState}) - 採用簡化流程`);

    try {
      // 步驟 1: 直接導航到導出頁面
      // FilterType=1 代表 "跟蹤中"
      const exportPageUrl = `${this.baseURL}/Pts/ProblemListExport.aspx?project=${projectId}&FilterType=1&procName=${filter.procName}&Title=${filter.title}`;
      console.log(`   步驟1: 直接導航到導出頁面...`);
      await this.page.goto(exportPageUrl, { waitUntil: 'networkidle2' });

      const pageTitle = await this.page.title();
      console.log(`   ✓ 成功到達導出頁面: ${pageTitle}`);

      // 檢查是否被重定向到登入頁面（Session 過期）
      if (pageTitle.includes('Login') || pageTitle.includes('登入')) {
        throw new Error('Session 已過期，請重新登入');
      }

      // 檢查頁面是否有錯誤訊息（更精確的檢查）
      const pageContent = await this.page.content();
      const errorChecks = [
        { pattern: /access denied|沒有權限|無權限|permission denied/i, message: '沒有權限訪問此專案' },
        { pattern: /project not found|專案不存在|找不到專案/i, message: '專案不存在或ID錯誤' },
        // 移除過於寬泛的錯誤檢查，只保留更具體的錯誤模式
        { pattern: /<div[^>]*class="[^"]*error[^"]*"[^>]*>|<span[^>]*class="[^"]*error[^"]*"[^>]*>/i, message: '頁面包含錯誤元素' }
      ];

      for (const check of errorChecks) {
        if (check.pattern.test(pageContent)) {
          console.log(`   ⚠️  檢測到錯誤模式: ${check.message}`);
          throw new Error(`${check.message} (Project ID: ${projectId})`);
        }
      }

      // 檢查導出按鈕是否存在
      const exportButtonExists = await this.page.evaluate(() => {
        const btn = document.querySelector('[id*="btnExport"]');
        return btn !== null;
      });

      if (!exportButtonExists) {
        throw new Error(`找不到導出按鈕，可能是專案 ID (${projectId}) 無效或沒有資料可匯出`);
      }

      // 步驟 2: 配置下載行為並點擊按鈕
      console.log('   步驟2: 配置下載行為並觸發下載...');

      // 創建臨時下載目錄
      const downloadPath = path.resolve(__dirname, 'temp_downloads');
      await fs.mkdir(downloadPath, { recursive: true });
      console.log(`   📁 下載目錄: ${downloadPath}`);

      // 使用 CDP 設置下載行為
      const client = await this.page.target().createCDPSession();
      await client.send('Page.setDownloadBehavior', {
        behavior: 'allow',
        downloadPath: downloadPath
      });
      console.log('   ✅ 下載行為已配置');

      // 點擊導出按鈕前，設置 __EVENTTARGET
      console.log('   🖱️  設置 __EVENTTARGET 並觸發下載...');
      await this.page.evaluate(() => {
        const eventTarget = document.getElementById('__EVENTTARGET');
        if (eventTarget) {
          eventTarget.value = 'ctl00$CP1$btnExport';
        }
        const eventArgument = document.getElementById('__EVENTARGUMENT');
        if (eventArgument) {
          eventArgument.value = '';
        }

        // 提交表單
        const form = document.getElementById('aspnetForm');
        if (form) {
          form.submit();
        }
      });

      // 等待文件下載完成
      console.log('   ⏳ 等待文件下載...');

      // 輪詢下載目錄，等待文件出現
      let downloadedFile = null;
      const maxWaitTime = 30000; // 最多等待 30 秒
      const startTime = Date.now();

      while (!downloadedFile && (Date.now() - startTime) < maxWaitTime) {
        await new Promise(resolve => setTimeout(resolve, 500)); // 每 500ms 檢查一次

        const files = await fs.readdir(downloadPath);
        // 尋找 .xls 或 .xlsx 文件（不包括 .crdownload 等臨時文件）
        const excelFile = files.find(f =>
          (f.endsWith('.xls') || f.endsWith('.xlsx')) &&
          !f.endsWith('.crdownload') &&
          !f.endsWith('.tmp')
        );

        if (excelFile) {
          downloadedFile = path.join(downloadPath, excelFile);
          console.log(`   ✅ 發現下載文件: ${excelFile}`);
        }
      }

      if (!downloadedFile) {
        // 檢查是否真的沒有文件，還是下載被阻擋
        const currentUrl = this.page.url();
        const currentTitle = await this.page.title();

        if (currentTitle.includes('Error') || currentTitle.includes('錯誤')) {
          throw new Error(`下載失敗：頁面顯示錯誤 (${currentTitle})`);
        }

        throw new Error(`下載超時：${maxWaitTime / 1000} 秒內未檢測到文件。這可能表示專案沒有資料可匯出或沒有匯出權限。`);
      }

      // 讀取下載的文件
      console.log('   📖 讀取下載的文件...');
      const downloadBuffer = await fs.readFile(downloadedFile);
      console.log(`   ✅ 文件讀取成功，大小: ${downloadBuffer.length} bytes`);

      // 清理臨時文件
      await fs.unlink(downloadedFile);
      console.log('   🧹 臨時文件已清理');

      if (downloadBuffer.length < 1024) {
        throw new Error(`下載失敗: 文件大小只有 ${downloadBuffer.length} bytes`);
      }

      // 生成包含狀態的檔名
      const stateLabel = filterState.charAt(0).toUpperCase() + filterState.slice(1); // Open, Closed, All
      const dateStr = new Date().toISOString().split('T')[0]; // 2026-01-08

      return {
        buffer: downloadBuffer,
        filename: `${projectName}-${stateLabel}-${dateStr}.xls`,
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
