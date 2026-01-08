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
    this.sessionToken = null;  // 保存 ASP.NET cookieless session token
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
      const cookieMap = new Map();
      
      if (initialCookies.length > 0) {
        initialCookies.forEach(cookie => {
          const cookiePair = cookie.split(';')[0];
          const [name, value] = cookiePair.split('=');
          if (name && value) {
            cookieMap.set(name, cookiePair);
          }
        });
        const sessionId = cookieMap.get('ASP.NET_SessionId') || '';
        console.log(`   ✓ 獲得初始 Session: ${sessionId}`);
      }
      
      // 步驟2: 從頁面中提取 ViewState 和所有驗證字段
      console.log('   步驟2: 提取 ViewState...');
      const $ = cheerio.load(initialResponse.data);
      const viewState = $('#__VIEWSTATE').val() || '';
      const viewStateGenerator = $('#__VIEWSTATEGENERATOR').val() || 'FE418D8E';
      const eventValidation = $('#__EVENTVALIDATION').val() || '';
      
      console.log(`   ✓ ViewState 長度: ${viewState.length}`);
      if (eventValidation) {
        console.log(`   ✓ EventValidation 長度: ${eventValidation.length}`);
      }
      
      if (!viewState) {
        throw new Error('無法獲取 ViewState');
      }
      
      // 步驟3: 構建登入POST數據（完全模擬瀏覽器表單提交，包含所有驗證字段）
      const postData = qs.stringify({
        __EVENTTARGET: '',
        __EVENTARGUMENT: '',
        __VIEWSTATE: viewState,
        __VIEWSTATEGENERATOR: viewStateGenerator,
        __EVENTVALIDATION: eventValidation,  // 關鍵：ASP.NET 事件驗證
        'LanguageSelector1$ddlLanguage': 'auto',
        txtEmail: username,
        txtPassword: password,
        btnLogin: 'Login'
      });

      // 步驟4: 提交登入請求
      console.log('   步驟4: 提交登入表單...');
      
      // 構建初始 Cookie 字符串（關鍵：必須發送已有的 session cookie）
      const initialCookieString = Array.from(cookieMap.values()).join('; ');
      console.log(`   📍 發送 Cookie: ${initialCookieString}`);
      
      const allCookies = [...initialCookies];  // 包含初始 cookies
      
      // 創建臨時 axios 實例並添加響應攔截器
      const axiosInstance = axios.create();
      axiosInstance.interceptors.response.use(
        (response) => {
          // 收集每次響應的 Set-Cookie
          console.log(`   🔍 響應狀態 ${response.status}, headers類型: ${typeof response.headers}`);
          console.log(`   🔍 Set-Cookie類型: ${typeof response.headers['set-cookie']}, 是否為數組: ${Array.isArray(response.headers['set-cookie'])}`);
          
          // 打印所有 headers 的 keys 來檢查
          console.log(`   🔍 所有 response headers: ${Object.keys(response.headers).join(', ')}`);
          
          if (response.headers['set-cookie']) {
            const cookies = response.headers['set-cookie'];
            console.log(`   🔍 原始cookies完整內容: ${JSON.stringify(cookies, null, 2)}`);
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
      
      // 提交登入表單（關鍵：發送已有的 session cookie）
      const loginResponse = await axiosInstance.post(loginURL, postData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Cookie': initialCookieString,  // 使用已構建的 cookie 字符串
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7',
          'Referer': loginURL,
          'Origin': this.baseURL,
          'Upgrade-Insecure-Requests': '1'
        },
        maxRedirects: 0,  // 禁用自動重定向，手動處理
        validateStatus: (status) => status < 500,  // 接受所有狀態包括302
        timeout: this.timeout,
        withCredentials: true  // 重要：啟用憑證以接收所有 cookies
      });
      
      console.log(`   📊 登入響應狀態: ${loginResponse.status}`);
      
      // 步驟5: 提取 cookieless session token 並跟隨重定向
      if (loginResponse.status === 302 || loginResponse.status === 301) {
        const redirectURL = loginResponse.headers['location'];
        console.log(`   🔄 檢測到重定向: ${redirectURL.substring(0, 100)}...`);
        
        // 關鍵：提取 ASP.NET cookieless session token
        const tokenMatch = redirectURL.match(/\(F\([^)]+\)\)/);
        if (tokenMatch) {
          this.sessionToken = tokenMatch[0];
          console.log(`   ✅ 提取到 Cookieless Session Token: ${this.sessionToken.substring(0, 30)}...`);
        }
        
        const fullRedirectURL = redirectURL.startsWith('http') 
          ? redirectURL 
          : `${this.baseURL}${redirectURL.startsWith('/') ? '' : '/'}${redirectURL}`;
        
        console.log(`   📍 跟隨重定向到: ${fullRedirectURL.substring(0, 100)}...`);
        
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
   * 構建包含 cookieless session token 的 URL
   * ASP.NET cookieless session: https://domain/(F(token))/path
   */
  buildUrlWithSession(path) {
    if (!this.sessionToken) {
      // 沒有 token，使用普通 URL
      return path.startsWith('http') ? path : `${this.baseURL}${path}`;
    }
    
    // 有 token，插入到域名和路徑之間
    if (path.startsWith('http')) {
      // 完整 URL，提取路徑部分
      const urlObj = new URL(path);
      return `${urlObj.origin}/${this.sessionToken}${urlObj.pathname}${urlObj.search}`;
    } else {
      // 相對路徑
      return `${this.baseURL}/${this.sessionToken}${path}`;
    }
  }

  /**
   * 獲取頁面的完整表單狀態
   * 包含 __VIEWSTATE, __VIEWSTATEGENERATOR 等所有隱藏欄位
   * 
   * @param {string} url - 目標 URL
   * @returns {Object} 表單狀態數據
   */
  async getViewState(url) {
    // 使用 cookieless session URL
    const fullUrl = this.buildUrlWithSession(url);
    
    try {
      const response = await axios.get(fullUrl, {
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
      const viewStateGenerator = $('#__VIEWSTATEGENERATOR').val() || 'C91DF0E8';
      const eventValidation = $('#__EVENTVALIDATION').val() || '';
      const scriptManagerHiddenField = $('[name="ctl00_ScriptManager1_HiddenField"]').val() || '';
      const lastFocus = $('[name="__LASTFOCUS"]').val() || '';
      const eventTarget = $('[name="__EVENTTARGET"]').val() || '';
      const eventArgument = $('[name="__EVENTARGUMENT"]').val() || '';
      
      console.log(`   ✓ ViewState 長度: ${viewState.length}`);
      
      return { 
        viewState, 
        viewStateGenerator,
        eventValidation,
        scriptManagerHiddenField,
        lastFocus,
        eventTarget,
        eventArgument
      };
    } catch (error) {
      console.error(`   ❌ 獲取 ViewState 失敗: ${error.message}`);
      throw error;
    }
  }

  /**
   * 下載專案數據 (Excel 格式)
   * 完全按照實際瀏覽器請求方式
   * 
   * @param {number} projectId - 專案 ID
   * @param {string} projectName - 專案名稱
   * @param {Object} options - 額外選項
   * @returns {Object} 下載結果
   */
  async downloadProjectData(projectId, projectName = 'Data', options = {}) {
    // 使用 %u 編碼（舊式 Unicode，與 VBA 和實際瀏覽器一致）
    const titleEncoded = '%u8ddf%u8e64%u4e2d%u7684%u4e8b%u52d9'; // "跟踪中的事務"
    const exportURL = `${this.baseURL}/pts/ProblemListExport.aspx?project=${projectId}&FilterType=1&procName=State_1&Title=${titleEncoded}`;
    
    console.log(`\n📥 下載專案: ${projectName} (ID: ${projectId})`);
    console.log(`   URL: ${exportURL}`);
    
    if (!this.session) {
      throw new Error('未登入，請先調用 login() 方法');
    }

    try {
      // 步驟1: GET 訪問導出頁面（完全匹配瀏覽器）
      console.log('   步驟1: 訪問導出頁面...');
      const getURL = this.sessionToken ? this.buildUrlWithSession(exportURL) : exportURL;
      
      const getResponse = await axios.get(getURL, {
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
          'Accept-Language': 'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Cookie': this.session,
          'Pragma': 'no-cache',
          'Referer': `${this.baseURL}/pts/issuelist.aspx?project=${projectId}`,
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'same-origin',
          'Sec-Fetch-User': '?1',
          'Upgrade-Insecure-Requests': '1',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36',
          'sec-ch-ua': '"Google Chrome";v="143", "Chromium";v="143", "Not A(Brand";v="24"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Windows"'
        },
        timeout: this.timeout
      });

      // 解析 ViewState 和所有驗證字段
      const $ = cheerio.load(getResponse.data);
      const viewState = $('#__VIEWSTATE').val() || '';
      const viewStateGenerator = $('#__VIEWSTATEGENERATOR').val() || 'C91DF0E8';
      const eventValidation = $('#__EVENTVALIDATION').val() || '';
      const scriptManagerHiddenField = $('[name="ctl00_ScriptManager1_HiddenField"]').val() || '';
      
      if (!viewState) {
        throw new Error('無法獲取 ViewState - 可能未正確登入');
      }
      
      console.log(`   ✓ ViewState 長度: ${viewState.length}`);
      if (eventValidation) {
        console.log(`   ✓ EventValidation 長度: ${eventValidation.length}`);
      }

      // 步驟2: 構建 POST 數據（完全匹配瀏覽器請求）
      console.log('   步驟2: 構建 POST 數據...');
      const postFields = {
        'ctl00_ScriptManager1_HiddenField': scriptManagerHiddenField,
        '__EVENTTARGET': '',
        '__EVENTARGUMENT': '',
        '__LASTFOCUS': '',
        '__VIEWSTATE': viewState,
        '__VIEWSTATEGENERATOR': viewStateGenerator,
        '__EVENTVALIDATION': eventValidation,
        'ctl00$Siteheader1$txtProblemID': '',
        'ctl00$CP1$ExportType': 'rdoList'
      };
      
      // 添加所有欄位 (0-23，與瀏覽器完全一致)
      for (let i = 0; i <= 23; i++) {
        postFields[`ctl00$CP1$cblFields$${i}`] = 'on';
      }
      
      // 添加剩餘欄位
      postFields['ctl00$CP1$rblFormat'] = options.format || 'xls';
      postFields['ctl00$CP1$btnExport'] = '導出';
      postFields['ctl00$CP1$txtSaveTitle'] = '';
      postFields['ctl00$CP1$txtSaveDescription'] = '';
      
      console.log(`   選擇字段: 0-23 (共 24 個)`);

      const postData = qs.stringify(postFields);

      // 步驟3: POST 提交並下載 Excel（完全匹配瀏覽器）
      console.log('   步驟3: 提交導出請求...');
      const postURL = this.sessionToken ? this.buildUrlWithSession(exportURL) : exportURL;
      
      if (this.sessionToken) {
        console.log(`   📍 使用 Session Token: ${this.sessionToken.substring(0, 20)}...`);
      }
      console.log(`   📍 使用 Cookie: ${this.session.substring(0, 60)}...`);
      console.log(`   📍 POST URL: ${postURL.substring(0, 150)}...`);
      
      const postResponse = await axios.post(postURL, postData, {
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
          'Accept-Language': 'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Content-Type': 'application/x-www-form-urlencoded',
          'Cookie': this.session,
          'Origin': this.baseURL,
          'Pragma': 'no-cache',
          'Referer': postURL,
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'same-origin',
          'Sec-Fetch-User': '?1',
          'Upgrade-Insecure-Requests': '1',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36',
          'sec-ch-ua': '"Google Chrome";v="143", "Chromium";v="143", "Not A(Brand";v="24"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Windows"'
        },
        responseType: 'arraybuffer',
        maxRedirects: 5,
        validateStatus: (status) => status >= 200 && status < 400,
        timeout: this.timeout
      });

      // 驗證響應
      const buffer = Buffer.from(postResponse.data);
      const fileSize = buffer.length;
      const contentType = postResponse.headers['content-type'] || '';
      
      console.log(`   ✓ 文件大小: ${(fileSize / 1024).toFixed(2)} KB`);
      console.log(`   ✓ Content-Type: ${contentType}`);

      // 檢查是否為 Excel (使用 20KB 閾值)
      if (fileSize < 20000) {
        const textSample = buffer.toString('utf8', 0, Math.min(500, fileSize));
        console.warn('   ⚠️ 文件太小，可能是錯誤頁面:');
        console.warn(`   ${textSample.substring(0, 200)}...`);
        throw new Error(`下載失敗: 文件大小只有 ${(fileSize / 1024).toFixed(2)} KB，應該大於 20KB`);
      }

      // 檢查文件頭是否為 Excel
      const header = buffer.toString('hex', 0, 8);
      if (!header.startsWith('d0cf11e0')) {
        console.warn('   ⚠️ 不是有效的 Excel 文件頭');
        const textSample = buffer.toString('utf8', 0, 200);
        console.warn(`   文件開頭: ${textSample}`);
        throw new Error('下載失敗: 返回的不是 Excel 文件');
      }

      // 成功
      console.log(`   ✅ 下載成功: ${projectName}-Data.xls (${(fileSize / 1024).toFixed(2)} KB)`);
      return {
        buffer,
        filename: `${projectName}-Data-${new Date().toISOString().split('T')[0]}.xls`,
        size: fileSize,
        contentType: contentType || 'application/vnd.ms-excel'
      };

    } catch (error) {
      console.error(`   ❌ 下載失敗: ${error.message}`);
      if (error.response) {
        console.error(`   HTTP ${error.response.status}: ${error.response.statusText}`);
        if (error.response.data) {
          const errorText = Buffer.from(error.response.data).toString('utf8', 0, 200);
          console.error(`   錯誤內容: ${errorText}`);
        }
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
