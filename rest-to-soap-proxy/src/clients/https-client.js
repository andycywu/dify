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
      // 根據您提供的最新截圖，使用 name 屬性來精準定位按鈕
      const finalExportButtonSelector = 'input[name="ctl00$CP1$btnExport"]';

      console.log('   ⏳ 等待最終的導出按鈕完全載入...');
      await this.page.waitForSelector(finalExportButtonSelector, { timeout: 10000 });
      console.log('   ✅ 導出按鈕已找到。');

      let downloadStarted = false;
      client.on('Page.downloadWillBegin', () => {
        downloadStarted = true;
      });

      // 實施重試機制，並使用更底層的點擊方法
      for (let i = 1; i <= 3; i++) {
        console.log(`\n   [第 ${i} 次嘗試] 準備點擊導出按鈕...`);

        // 列印出點擊的動作內容 (按鈕的 HTML)
        const buttonHTML = await this.page.evaluate(sel => document.querySelector(sel)?.outerHTML, finalExportButtonSelector);
        console.log(`   🖱️  點擊目標內容: ${buttonHTML}`);

        // 使用 evaluate 執行點擊，這比 page.click 更可靠
        await this.page.evaluate(sel => document.querySelector(sel).click(), finalExportButtonSelector);
        console.log(`   📡 第 ${i} 次點擊事件已發送。`);

        // 等待 3 秒，檢查下載是否已開始
        await new Promise(resolve => setTimeout(resolve, 3000));
        if (downloadStarted) {
          console.log('   👍 偵測到下載已開始！');
          break;
        } else {
          console.log('   ...3秒後下載未開始，準備重試...');
        }
        if (i === 3 && !downloadStarted) {
            throw new Error('重試 3 次後，點擊導出按鈕仍未觸發下載。');
        }
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
