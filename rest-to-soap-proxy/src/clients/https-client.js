const axios = require('axios');
const cheerio = require('cheerio');
const qs = require('querystring');

/**
 * Urtracker HTTPS 客戶端
 * 模擬 VBA 的 HTTPS 方式訪問 Urtracker
 * 對應 VBA 文件: Common.bas, Download.bas
 */
class UrtrackerHttpsClient {
  constructor(options = {}) {
    this.baseURL = options.baseURL || 'https://fwtrack.tpv-tech.com';
    this.session = null;
    this.cookieJar = [];
    this.timeout = options.timeout || 30000;
    
    // 項目配置 (對應 VBA getDownloadURL)
    this.projects = {
      TV: { id: 2558, name: 'TV-Data' },
      PD: { id: 2559, name: 'PD-Data' },
      MNT: { id: 2561, name: 'MNT-Data' },
      AVA: { id: 2560, name: 'AVA-Data' }
    };
  }

  /**
   * 登入 Urtracker
   * 對應 VBA: LoginURTAndGetHttp() in Common.bas
   * 
   * @param {string} username - 用戶名
   * @param {string} password - 密碼
   * @returns {Object} 登入結果
   */
  async login(username, password) {
    const loginURL = `${this.baseURL}/Accounts/Login.aspx`;
    
    console.log('🔐 開始登入 Urtracker...');
    console.log(`   用戶: ${username}`);
    
    try {
      // 步驟1: 獲取登入頁面的 ViewState
      console.log('   獲取登入頁面 ViewState...');
      const { viewState, viewStateGenerator } = await this.getViewState(loginURL);
      
      // 步驟2: 構建登入 POST 數據
      const postData = qs.stringify({
        ScriptManager1: 'UpdatePanel1|btnLogin',
        __EVENTTARGET: '',
        __EVENTARGUMENT: '',
        __LASTFOCUS: '',
        __VIEWSTATE: viewState,
        __VIEWSTATEGENERATOR: viewStateGenerator || 'FE418D8E',
        'LanguageSelector1$ddlLanguage': 'auto',
        txtEmail: username,
        txtPassword: password,
        __ASYNCPOST: 'false',
        btnLogin: '登  录'
      });

      // 步驟3: 提交登入請求
      const response = await axios.post(loginURL, postData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7',
          'Referer': loginURL
        },
        maxRedirects: 0,
        validateStatus: (status) => status < 500,
        timeout: this.timeout
      });

      // 步驟4: 保存 Cookie Session
      const cookies = response.headers['set-cookie'];
      if (cookies && cookies.length > 0) {
        this.cookieJar = cookies;
        this.session = cookies.map(cookie => cookie.split(';')[0]).join('; ');
        console.log('✅ Urtracker 登入成功');
        console.log(`   Session Cookies: ${this.cookieJar.length} 個`);
        
        return { 
          success: true, 
          session: this.session,
          cookies: this.cookieJar
        };
      } else {
        throw new Error('登入失敗：未獲得 Session Cookie');
      }
    } catch (error) {
      console.error('❌ Urtracker 登入失敗:', error.message);
      if (error.response) {
        console.error(`   HTTP Status: ${error.response.status}`);
        console.error(`   Response: ${error.response.data?.substring(0, 200)}`);
      }
      throw new Error(`登入失敗: ${error.message}`);
    }
  }

  /**
   * 獲取頁面的 __VIEWSTATE
   * 對應 VBA: GetViewState() in Download.bas
   * 
   * @param {string} url - 目標 URL
   * @returns {Object} ViewState 數據
   */
  async getViewState(url) {
    console.log(`   獲取 ViewState: ${url.substring(0, 80)}...`);
    
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Cookie': this.session || ''
        },
        timeout: this.timeout
      });

      // 使用 cheerio 解析 HTML
      const $ = cheerio.load(response.data);
      const viewState = $('#__VIEWSTATE').val() || '';
      const viewStateGenerator = $('#__VIEWSTATEGENERATOR').val() || '';
      const eventValidation = $('#__EVENTVALIDATION').val() || '';
      
      if (!viewState) {
        console.warn('   ⚠️  未找到 __VIEWSTATE，可能需要登入');
      } else {
        console.log(`   ✓ ViewState 長度: ${viewState.length}`);
      }
      
      return { 
        viewState, 
        viewStateGenerator,
        eventValidation,
        html: response.data 
      };
    } catch (error) {
      console.error(`   ❌ 獲取 ViewState 失敗: ${error.message}`);
      throw error;
    }
  }

  /**
   * 下載專案數據 (Excel 格式)
   * 對應 VBA: DownloadHandler() in Download.bas
   * 
   * @param {number} projectId - 專案 ID
   * @param {string} projectName - 專案名稱
   * @param {Object} options - 額外選項
   * @returns {Object} 下載結果
   */
  async downloadProjectData(projectId, projectName = 'Data', options = {}) {
    // 構建導出 URL (對應 VBA getDownloadURL)
    const exportURL = `${this.baseURL}/Pts/ProblemListExport.aspx?project=${projectId}&FilterType=1&procName=State_1&Title=%u8ddf%u8e2a%u4e2d%u7684%u4e8b%u52a1`;
    
    console.log(`\n📥 下載專案: ${projectName} (ID: ${projectId})`);
    console.log(`   URL: ${exportURL}`);
    
    if (!this.session) {
      throw new Error('未登入，請先調用 login() 方法');
    }

    try {
      // 步驟1: 獲取 ViewState (對應 VBA GetViewState)
      console.log('   步驟1: 獲取 ViewState...');
      const { viewState, viewStateGenerator } = await this.getViewState(exportURL);
      
      if (!viewState) {
        throw new Error('無法獲取 ViewState，Session 可能已過期');
      }

      // 步驟2: 構建 POST 數據 (對應 VBA DownloadHandler)
      // 選擇所有字段 2-68 (cblFields$2 到 cblFields$68)
      console.log('   步驟2: 構建 POST 數據...');
      const fields = {};
      const fieldStart = options.fieldStart || 2;
      const fieldEnd = options.fieldEnd || 68;
      
      for (let i = fieldStart; i <= fieldEnd; i++) {
        fields[`ctl00$CP1$cblFields$${i}`] = 'on';
      }
      
      const postData = qs.stringify({
        __EVENTARGUMENT: '',
        __VIEWSTATE: viewState,
        __VIEWSTATEGENERATOR: viewStateGenerator || 'C91DF0E8',
        'ctl00$Siteheader1$txtProblemID': '',
        'ctl00$CP1$ExportType': 'rdoList',
        ...fields,
        'ctl00$CP1$rblFormat': options.format || 'xls',
        'ctl00$CP1$btnExport': '导出',
        'ctl00$CP1$txtSaveTitle': '',
        'ctl00$CP1$txtSaveDescription': ''
      });
      
      console.log(`   選擇字段: ${fieldStart}-${fieldEnd} (共 ${fieldEnd - fieldStart + 1} 個)`);

      // 步驟3: 提交導出請求並下載 Excel
      console.log('   步驟3: 提交導出請求...');
      const response = await axios.post(exportURL, postData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Cookie': this.session,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Referer': exportURL
        },
        responseType: 'arraybuffer',
        timeout: this.timeout,
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      });

      const contentType = response.headers['content-type'] || '';
      const contentLength = response.data.length;
      
      // 檢查是否成功下載 Excel
      if (contentType.includes('excel') || contentType.includes('ms-excel') || 
          contentType.includes('spreadsheetml') || contentLength > 1000) {
        console.log(`✅ ${projectName} 下載成功`);
        console.log(`   文件大小: ${(contentLength / 1024).toFixed(2)} KB`);
        console.log(`   Content-Type: ${contentType}`);
        
        return {
          success: true,
          projectId,
          projectName,
          data: response.data,
          size: contentLength,
          contentType: contentType,
          filename: `${projectName}_${new Date().toISOString().split('T')[0]}.xls`
        };
      } else {
        // 可能返回的是錯誤頁面
        const htmlContent = Buffer.from(response.data).toString('utf-8');
        console.error(`❌ ${projectName} 下載失敗：返回的不是 Excel 文件`);
        console.error(`   Content-Type: ${contentType}`);
        console.error(`   內容預覽: ${htmlContent.substring(0, 200)}`);
        
        throw new Error(`下載失敗：服務器返回的不是 Excel 文件 (${contentType})`);
      }
    } catch (error) {
      console.error(`❌ ${projectName} 下載失敗:`, error.message);
      if (error.response) {
        console.error(`   HTTP Status: ${error.response.status}`);
      }
      throw error;
    }
  }

  /**
   * 批量下載所有專案
   * 對應 VBA: Download() in Download.bas
   * 
   * @returns {Array} 所有下載結果
   */
  async downloadAllProjects() {
    console.log('\n🚀 開始批量下載所有專案...');
    console.log(`   專案列表: ${Object.keys(this.projects).join(', ')}`);
    
    if (!this.session) {
      throw new Error('未登入，請先調用 login() 方法');
    }

    const results = [];
    const errors = [];
    
    for (const [key, project] of Object.entries(this.projects)) {
      try {
        const result = await this.downloadProjectData(project.id, project.name);
        results.push(result);
        
        // 添加延遲，避免請求過快
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`   ${project.name} 下載失敗: ${error.message}`);
        errors.push({
          project: project.name,
          projectId: project.id,
          error: error.message
        });
      }
    }

    console.log('\n📊 下載完成統計:');
    console.log(`   成功: ${results.length} 個`);
    console.log(`   失敗: ${errors.length} 個`);
    
    if (errors.length > 0) {
      console.log('\n❌ 失敗列表:');
      errors.forEach(e => console.log(`   - ${e.project}: ${e.error}`));
    }

    return {
      success: errors.length === 0,
      totalProjects: Object.keys(this.projects).length,
      successCount: results.length,
      failCount: errors.length,
      results,
      errors
    };
  }

  /**
   * 檢查 Session 是否有效
   */
  isLoggedIn() {
    return this.session !== null && this.session.length > 0;
  }

  /**
   * 清除 Session
   */
  logout() {
    this.session = null;
    this.cookieJar = [];
    console.log('🔓 已登出');
  }

  /**
   * 獲取專案列表
   */
  getProjects() {
    return this.projects;
  }
}

module.exports = UrtrackerHttpsClient;
