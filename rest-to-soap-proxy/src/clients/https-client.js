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
    // 使用完整的登入 URL（包含 ReturnUrl）
    const loginURL = `${this.baseURL}/Accounts/login.aspx?ReturnUrl=%2fdefault.aspx`;
    
    console.log('🔐 開始登入 Urtracker...');
    console.log(`   用戶: ${username}`);
    
    try {
      // 步驟1: 先訪問登入頁面，獲取初始 session cookie 和 ViewState
      console.log('   步驟1: 訪問登入頁面獲取初始 session...');
      const initialResponse = await axios.get(loginURL, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        },
        validateStatus: () => true,
        timeout: this.timeout
      });
      
      // 收集初始 cookies
      const initialCookies = initialResponse.headers['set-cookie'] || [];
      let sessionCookie = '';
      
      if (initialCookies.length > 0) {
        initialCookies.forEach(cookie => {
          const cookiePair = cookie.split(';')[0];
          if (cookiePair.startsWith('ASP.NET_SessionId=')) {
            sessionCookie = cookiePair;
          }
        });
        console.log(`   ✓ 獲得初始 Session: ${sessionCookie}`);
      }
      
      // 步驟2: 從頁面中提取 ViewState
      console.log('   步驟2: 提取 ViewState...');
      const $ = cheerio.load(initialResponse.data);
      const viewState = $('#__VIEWSTATE').val() || '';
      const viewStateGenerator = $('#__VIEWSTATEGENERATOR').val() || 'FE418D8E';
      console.log(`   ✓ ViewState 長度: ${viewState.length}`);
      
      if (!viewState) {
        throw new Error('無法獲取 ViewState');
      }
      
      // 步驟3: 構建登入POST數據（完全模擬Chrome的請求）
      const postData = qs.stringify({
        ScriptManager1: 'UpdatePanel1|btnLogin',
        __EVENTTARGET: '',
        __EVENTARGUMENT: '',
        __LASTFOCUS: '',
        __VIEWSTATE: viewState,
        __VIEWSTATEGENERATOR: viewStateGenerator,
        'LanguageSelector1$ddlLanguage': 'auto',
        txtEmail: username,
        txtPassword: password,
        __ASYNCPOST: 'true',          // ← 關鍵：AJAX請求
        btnLogin: '登  录'             // ← 注意：兩個空格
      });

      // 步驟4: 提交登入請求（添加關鍵的 X-MicrosoftAjax header）
      console.log('   步驟4: 提交登入表單...');
      const allCookies = [...initialCookies];  // 包含初始 cookies
      
      // 創建臨時 axios 實例並添加響應攔截器
      const axiosInstance = axios.create();
      axiosInstance.interceptors.response.use(
        (response) => {
          // 收集每次響應的 Set-Cookie
          console.log(`   🔍 響應狀態 ${response.status}, headers類型: ${typeof response.headers}`);
          console.log(`   🔍 Set-Cookie類型: ${typeof response.headers['set-cookie']}, 是否為數組: ${Array.isArray(response.headers['set-cookie'])}`);
          
          if (response.headers['set-cookie']) {
            const cookies = response.headers['set-cookie'];
            console.log(`   🔍 原始cookies: ${JSON.stringify(cookies).substring(0, 200)}`);
            allCookies.push(...(Array.isArray(cookies) ? cookies : [cookies]));
            console.log(`   📍 收集到 ${Array.isArray(cookies) ? cookies.length : 1} 個 Cookie (狀態: ${response.status})`);
            // 詳細打印每個 cookie 的名稱和前50個字元
            const cookieArray = Array.isArray(cookies) ? cookies : [cookies];
            cookieArray.forEach((c, i) => {
              const cookieName = c.split('=')[0];
              const cookieValue = c.split('=')[1]?.split(';')[0] || '';
              console.log(`      Cookie ${i+1}: ${cookieName}=${cookieValue.substring(0, 50)}${cookieValue.length > 50 ? '...' : ''}`);
            });
          } else {
            console.log(`   📍 無 Set-Cookie header (狀態: ${response.status})`);
          }
          return response;
        },
        (error) => {
          // 即使錯誤也收集 Cookie
          if (error.response && error.response.headers['set-cookie']) {
            allCookies.push(...error.response.headers['set-cookie']);
          }
          return Promise.reject(error);
        }
      );
      
      // 提交登入表單（禁用自動重定向，手動處理以捕獲所有 cookies）
      const loginResponse = await axiosInstance.post(loginURL, postData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',  // ← 添加 charset
          'X-MicrosoftAjax': 'Delta=true',                                      // ← 關鍵 header！
          'Cookie': sessionCookie,     // 使用初始 session cookie
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': '*/*',             // AJAX 請求使用 */*
          'Accept-Language': 'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7',
          'Referer': loginURL
        },
        maxRedirects: 0,  // 禁用自動重定向，手動處理
        validateStatus: (status) => status < 500,  // 接受所有狀態包括302
        timeout: this.timeout
      });
      
      console.log(`   📊 登入響應狀態: ${loginResponse.status}`);
      
      // 步驟5: 如果是302重定向，手動跟隨並收集 cookies
      if (loginResponse.status === 302 || loginResponse.status === 301) {
        const redirectURL = loginResponse.headers['location'];
        console.log(`   🔄 檢測到重定向: ${redirectURL}`);
        
        // 構建完整的重定向 URL
        const fullRedirectURL = redirectURL.startsWith('http') 
          ? redirectURL 
          : `${this.baseURL}${redirectURL.startsWith('/') ? '' : '/'}${redirectURL}`;
        
        console.log(`   📍 跟隨重定向到: ${fullRedirectURL}`);
        
        // 構建當前的 cookie 字符串（包含所有已收集的 cookies）
        const currentCookieMap = new Map();
        allCookies.forEach(cookie => {
          const [nameValue] = cookie.split(';');
          const [name, value] = nameValue.split('=');
          if (name && value) {
            currentCookieMap.set(name.trim(), nameValue.trim());
          }
        });
        const currentCookieStr = Array.from(currentCookieMap.values()).join('; ');
        
        // 跟隨重定向
        const redirectResponse = await axiosInstance.get(fullRedirectURL, {
          headers: {
            'Cookie': currentCookieStr,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Referer': loginURL
          },
          maxRedirects: 0,
          validateStatus: (status) => status < 500,
          timeout: this.timeout
        });
        
        console.log(`   📊 重定向響應狀態: ${redirectResponse.status}`);
      }
      
      const response = loginResponse;
      
      console.log(`   📊 最終響應狀態: ${response.status}`);

      // 登入成功的標誌：200 OK 或 302 重定向（表示登入後跳轉）
      // VBA 不檢查響應內容，我們也接受這兩種狀態
      if (response.status !== 200 && response.status !== 302) {
        throw new Error(`登入請求失敗: HTTP ${response.status}`);
      }

      // 步驟6: 保存所有 Cookie (包括 .URTracker 認證cookie)
      console.log(`   步驟6: 整理和保存 cookies...`);
      if (allCookies.length > 0) {
        this.cookieJar = allCookies;
        // 提取 Cookie 名稱和值，過濾重複（保留最新的值）
        const cookieMap = new Map();
        allCookies.forEach(cookie => {
          const [nameValue] = cookie.split(';');
          const [name, value] = nameValue.split('=');
          if (name && value) {
            cookieMap.set(name.trim(), nameValue.trim());
          }
        });
        
        this.session = Array.from(cookieMap.values()).join('; ');
        
        console.log('✅ Urtracker 登入成功');
        console.log(`   收集到 ${allCookies.length} 個 Cookie`);
        console.log(`   Cookie 類型: ${Array.from(cookieMap.keys()).join(', ')}`);
        console.log(`   完整 Session: ${this.session.substring(0, 200)}...`);
        
        // 檢查是否有認證 Cookie (.URTracker 或 .ASPXAUTH)
        const hasAuthCookie = Array.from(cookieMap.keys()).some(name => 
          name.includes('URTracker') || name.includes('ASPXAUTH') || name.includes('Auth')
        );
        
        if (!hasAuthCookie) {
          console.warn('   ⚠️  警告: 未檢測到認證 Cookie (.URTracker 或 .ASPXAUTH)');
          console.warn('   可用的 Cookie: ' + Array.from(cookieMap.keys()).join(', '));
          console.warn('   這可能導致後續請求失敗');
          
          // 嘗試訪問主頁來獲取認證 cookie
          console.log('   🔄 嘗試訪問主頁以獲取完整認證...');
          try {
            const homeResponse = await axiosInstance.get(`${this.baseURL}/`, {
              headers: {
                'Cookie': this.session,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
              },
              maxRedirects: 5,
              validateStatus: (status) => status < 500
            });
            
            // 更新 cookies
            if (allCookies.length > 0) {
              this.cookieJar = allCookies;
              const updatedCookieMap = new Map();
              allCookies.forEach(cookie => {
                const [nameValue] = cookie.split(';');
                const [name, value] = nameValue.split('=');
                if (name && value) {
                  updatedCookieMap.set(name.trim(), nameValue.trim());
                }
              });
              this.session = Array.from(updatedCookieMap.values()).join('; ');
              console.log(`   ✅ 主頁訪問完成，Cookie 更新: ${Array.from(updatedCookieMap.keys()).join(', ')}`);
            }
          } catch (homeError) {
            console.warn(`   ⚠️  主頁訪問失敗: ${homeError.message}`);
          }
        }
        
        return { 
          success: true, 
          session: this.session,
          cookies: this.cookieJar,
          cookieTypes: Array.from(cookieMap.keys())
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
    console.log(`   📍 使用 Session: ${this.session ? this.session.substring(0, 50) + '...' : '(無)'}`);
    
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
    // 修正: 使用 Title=Open+issues 而不是舊的中文 Unicode
    const exportURL = `${this.baseURL}/Pts/ProblemListExport.aspx?project=${projectId}&FilterType=1&procName=State_1&Title=Open+issues`;
    
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
      console.log(`   📍 使用 Session Cookie: ${this.session.substring(0, 60)}...`);
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
