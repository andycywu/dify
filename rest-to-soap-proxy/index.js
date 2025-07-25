require('dotenv').config();
const express = require('express');
const soap = require('soap');
const bodyParser = require('body-parser');
const axios = require('axios');
const xml2js = require('xml2js');

const app = express();
app.use(bodyParser.json());

const wsdlUrl = 'https://fwtrack.tpv-tech.com/api/issue.asmx';

// 清理SOAP響應，提取業務數據
function cleanSoapResponse(soapResult, method) {
  try {
    console.log(`DEBUG - cleanSoapResponse for method ${method}:`, JSON.stringify(soapResult, null, 2));
    
    // 從SOAP響應中提取實際數據
    const envelope = soapResult['soap:Envelope'] || soapResult['soap12:Envelope'];
    if (!envelope) {
      console.log('No SOAP envelope found, returning original result');
      return soapResult;
    }

    const body = envelope['soap:Body'] || envelope['soap12:Body'];
    if (!body) {
      console.log('No SOAP body found, returning envelope');
      return envelope;
    }

    console.log(`DEBUG - SOAP Body keys:`, Object.keys(body));

    // 查找方法響應 (methodNameResponse)
    const responseKey = `${method}Response`;
    const methodResponse = body[responseKey];
    if (!methodResponse) {
      console.log(`No ${responseKey} found, checking for other response patterns...`);
      
      // 嘗試查找其他可能的響應格式
      const bodyKeys = Object.keys(body);
      console.log(`DEBUG - Available body keys:`, bodyKeys);
      
      const possibleResponse = bodyKeys.find(key => 
        key.toLowerCase().includes(method.toLowerCase()) && 
        key.toLowerCase().includes('response')
      );
      
      if (possibleResponse) {
        console.log(`Found alternative response key: ${possibleResponse}`);
        const altMethodResponse = body[possibleResponse];
        console.log(`DEBUG - Alternative method response:`, JSON.stringify(altMethodResponse, null, 2));
        
        // 查找結果數據
        const altResultKey = Object.keys(altMethodResponse || {}).find(key => 
          key.toLowerCase().includes('result')
        );
        
        if (altResultKey && altMethodResponse[altResultKey] !== undefined) {
          console.log(`Extracted alternative result from ${altResultKey}:`, altMethodResponse[altResultKey]);
          return altMethodResponse[altResultKey];
        }
        
        // 如果找不到result鍵，但響應對象有實際內容，則返回響應對象
        const responseKeys = Object.keys(altMethodResponse || {});
        const dataKeys = responseKeys.filter(key => !key.startsWith('$') && !key.includes('xmlns'));
        
        if (dataKeys.length > 0) {
          console.log(`Found data keys in alternative response:`, dataKeys);
          return altMethodResponse;
        }
        
        return altMethodResponse;
      }
      
      // 如果沒有找到特定的響應，檢查 body 是否只包含業務數據
      const bodyKeys2 = Object.keys(body);
      console.log(`DEBUG - Body keys for fallback check:`, bodyKeys2);
      
      if (bodyKeys2.length === 1 && !bodyKeys2[0].includes('soap')) {
        console.log('Found single non-SOAP key in body, returning its value');
        return body[bodyKeys2[0]];
      }
      
      // 檢查是否有 Fault 或錯誤信息
      if (body['soap:Fault'] || body['soap12:Fault']) {
        const fault = body['soap:Fault'] || body['soap12:Fault'];
        console.log('SOAP Fault detected:', JSON.stringify(fault, null, 2));
        return { error: 'SOAP Fault', fault: fault };
      }
      
      console.log('Returning body as fallback');
      return body;
    }

    console.log(`DEBUG - Method response for ${responseKey}:`, JSON.stringify(methodResponse, null, 2));

    // 查找結果數據 (methodNameResult)
    const resultKey = `${method}Result`;
    const methodResult = methodResponse[resultKey];
    if (methodResult !== undefined) {
      console.log(`Extracted ${resultKey}:`, methodResult);
      return methodResult;
    }

    // 嘗試查找其他可能的結果格式
    const responseKeys = Object.keys(methodResponse);
    console.log(`DEBUG - Method response keys:`, responseKeys);
    
    const possibleResult = responseKeys.find(key => 
      key.toLowerCase().includes('result') || 
      key.toLowerCase().includes('return') ||
      (!key.includes('xmlns') && !key.includes('soap') && !key.startsWith('$'))
    );
    
    if (possibleResult && methodResponse[possibleResult] !== undefined) {
      console.log(`Found alternative result key: ${possibleResult}`, methodResponse[possibleResult]);
      return methodResponse[possibleResult];
    }

    // 如果響應中只有一個非屬性字段，返回它
    const dataKeys = responseKeys.filter(key => 
      !key.startsWith('$') && !key.includes('xmlns') && !key.includes('soap')
    );
    
    console.log(`DEBUG - Data keys in method response:`, dataKeys);
    
    if (dataKeys.length === 1) {
      console.log(`Found single data key: ${dataKeys[0]}`, methodResponse[dataKeys[0]]);
      return methodResponse[dataKeys[0]];
    } else if (dataKeys.length > 1) {
      console.log(`Found multiple data keys, returning filtered response`);
      const filteredResponse = {};
      dataKeys.forEach(key => {
        filteredResponse[key] = methodResponse[key];
      });
      return filteredResponse;
    }

    console.log('No specific result found, returning method response');
    return methodResponse;
  } catch (error) {
    console.error('Error cleaning SOAP response:', error);
    return soapResult;
  }
}

// 進一步清理結果，確保沒有SOAP包裝
function deepCleanResult(result) {
  console.log(`DEBUG - deepCleanResult input:`, JSON.stringify(result, null, 2));
  
  if (typeof result !== 'object' || result === null) {
    return result;
  }

  // 如果結果是對象，檢查是否還有SOAP相關的鍵
  if (typeof result === 'object' && !Array.isArray(result)) {
    const keys = Object.keys(result);
    console.log(`DEBUG - deepCleanResult keys:`, keys);
    
    // 移除所有SOAP相關的屬性
    const cleanedResult = {};
    for (const [key, value] of Object.entries(result)) {
      if (!key.includes('soap') && !key.includes('xmlns') && !key.startsWith('$')) {
        cleanedResult[key] = deepCleanResult(value);
      }
    }
    
    console.log(`DEBUG - cleanedResult after filtering:`, JSON.stringify(cleanedResult, null, 2));
    
    // 如果清理後沒有任何鍵，檢查原始結果是否為空響應
    const cleanedKeys = Object.keys(cleanedResult);
    if (cleanedKeys.length === 0) {
      console.log('No data keys found after cleaning, this might be empty response or error');
      
      // 檢查是否有錯誤信息
      if (result.error || result.fault) {
        return result;
      }
      
      // 如果只是空響應，返回空對象或 null
      return null;
    }
    
    // 如果清理後只剩一個鍵，且該鍵看起來像是包裝，則進一步提取
    if (cleanedKeys.length === 1) {
      const singleKey = cleanedKeys[0];
      const singleValue = cleanedResult[singleKey];
      
      // 如果值是對象且鍵名看起來像包裝層，則返回值
      if (typeof singleValue === 'object' && singleValue !== null && 
          (singleKey.toLowerCase().includes('result') || 
           singleKey.toLowerCase().includes('response') ||
           singleKey.toLowerCase().includes('return'))) {
        console.log(`Unwrapping single key: ${singleKey}`);
        return deepCleanResult(singleValue);
      }
    }
    
    return cleanedResult;
  }

  return result;
}

// 支援的 SOAP 方法
const soapMethods = [
  'CreateIssueNewVerMail',
  'CreateIssueMail',
  'CreateIssueNewVer',
  'CreateIssue',
  'UpdateIssueById',
  'AddComment',
  'GetIssueInfo',
  'GetIssueInfobyIssueCode',
  'GetIssueExtInfo',
  'GetManagerListbyState',
  'ChangeAssigneeMail',
  'ChangeAssignee',
  'UploadFile',
  'DownloadFile',
  'GetProjectPRList',
  'GetProjectPRListByUpdatedTime',
  'GetProjectPRListCountByUpdatedTime',
  'GetURTTaskList',
  'GetURTTaskCount',
];

// 動態建立 REST 端點 (全部強制 SOAP 1.2)
soapMethods.forEach((method) => {
  app.post(`/${method}`, async (req, res) => {
    const appID = req.body.appID !== undefined ? req.body.appID : process.env.APP_ID || '';
    const apiPwd = req.body.apiPwd !== undefined ? req.body.apiPwd : process.env.API_PWD || '';
    const params = { ...req.body };
    delete params.appID;
    delete params.apiPwd;
    
    // 檢查認證參數
    if (!appID) {
      console.warn(`[${method}] Missing APP_ID - this may cause authentication failure`);
    }
    if (!apiPwd) {
      console.warn(`[${method}] Missing API_PWD - this may cause authentication failure`);
    }
    
    // 組 SOAP 1.2 XML
    let paramXML = '';
    for (const [k, v] of Object.entries(params)) {
      paramXML += `<${k}>${v}</${k}>`;
    }
    const soapBody =
      `<${method} xmlns=\"http://tempuri.org/\">` +
      `<appID>${appID}</appID>` +
      `<apiPwd>${apiPwd}</apiPwd>` +
      paramXML +
      `</${method}>`;
    const xml =
      `<?xml version=\"1.0\" encoding=\"utf-8\"?>` +
      `<soap12:Envelope xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:xsd=\"http://www.w3.org/2001/XMLSchema\" xmlns:soap12=\"http://www.w3.org/2003/05/soap-envelope\">` +
      `<soap12:Body>${soapBody}</soap12:Body></soap12:Envelope>`;
    // log 實際送出的 XML
    console.log(`---SOAP 1.2 XML---\n${xml}\n---END---`);
    // 組 headers，模仿 curl/Postman
    const headers = {
      'Content-Type': 'application/soap+xml; charset=utf-8',
      'User-Agent': 'PostmanRuntime/7.36.3',
      'Accept': '*/*',
      'Connection': 'keep-alive'
    };
    try {
      const response = await axios.post(
        wsdlUrl,
        Buffer.from(xml, 'utf8'),
        {
          headers,
          timeout: 15000,
          maxBodyLength: Infinity,
          maxContentLength: Infinity
        }
      );
      // log SOAP response
      console.log(`---SOAP 1.2 RESPONSE---\n${response.status} ${response.statusText}\n${response.data}\n---END---`);
      // parse SOAP XML to JSON
      xml2js.parseString(response.data, { explicitArray: false }, (err, result) => {
        if (err) {
          console.error('XML parse error:', err);
          return res.status(500).json({ error: 'XML parse error', detail: err.toString() });
        }
        
        // log parsed JSON result (完整的)
        console.log('---SOAP 1.2 JSON (RAW)---\n', JSON.stringify(result, null, 2), '\n---END---');
        
        // 清理SOAP包裝，只返回業務數據
        const cleanResult = cleanSoapResponse(result, method);
        
        // 進一步深度清理，確保沒有SOAP殘留
        const finalResult = deepCleanResult(cleanResult);
        
        // log 清理後的結果
        console.log('---CLEANED RESULT---\n', JSON.stringify(finalResult, null, 2), '\n---END---');
        
        res.json(finalResult);
      });
    } catch (err) {
      if (err.response) {
        console.error(`[SOAP12][${method}] ERROR RESPONSE`, err.response.status, err.response.statusText, err.response.data);
      } else {
        console.error(`[SOAP12][${method}]`, err.toString());
      }
      res.status(500).json({ error: err?.toString(), detail: err?.response?.data });
    }
  });
});

// 添加完整SOAP響應的端點
soapMethods.forEach((method) => {
  app.post(`/${method}/full`, async (req, res) => {
    const appID = req.body.appID !== undefined ? req.body.appID : process.env.APP_ID || '';
    const apiPwd = req.body.apiPwd !== undefined ? req.body.apiPwd : process.env.API_PWD || '';
    const params = { ...req.body };
    delete params.appID;
    delete params.apiPwd;
    
    // 組 SOAP 1.2 XML
    let paramXML = '';
    for (const [k, v] of Object.entries(params)) {
      paramXML += `<${k}>${v}</${k}>`;
    }
    const soapBody =
      `<${method} xmlns=\"http://tempuri.org/\">` +
      `<appID>${appID}</appID>` +
      `<apiPwd>${apiPwd}</apiPwd>` +
      paramXML +
      `</${method}>`;
    const xml =
      `<?xml version=\"1.0\" encoding=\"utf-8\"?>` +
      `<soap12:Envelope xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:xsd=\"http://www.w3.org/2001/XMLSchema\" xmlns:soap12=\"http://www.w3.org/2003/05/soap-envelope\">` +
      `<soap12:Body>${soapBody}</soap12:Body></soap12:Envelope>`;
    
    // log 實際送出的 XML
    console.log(`---SOAP 1.2 XML (FULL)---\n${xml}\n---END---`);
    
    const headers = {
      'Content-Type': 'application/soap+xml; charset=utf-8',
      'User-Agent': 'PostmanRuntime/7.36.3',
      'Accept': '*/*',
      'Connection': 'keep-alive'
    };
    
    try {
      const response = await axios.post(
        wsdlUrl,
        Buffer.from(xml, 'utf8'),
        {
          headers,
          timeout: 15000,
          maxBodyLength: Infinity,
          maxContentLength: Infinity
        }
      );
      
      // log SOAP response
      console.log(`---SOAP 1.2 RESPONSE (FULL)---\n${response.status} ${response.statusText}\n${response.data}\n---END---`);
      
      // parse SOAP XML to JSON
      xml2js.parseString(response.data, { explicitArray: false }, (err, result) => {
        if (err) {
          console.error('XML parse error:', err);
          return res.status(500).json({ error: 'XML parse error', detail: err.toString() });
        }
        
        // 返回完整的SOAP響應
        console.log('---FULL SOAP JSON---\n', JSON.stringify(result, null, 2), '\n---END---');
        res.json(result);
      });
    } catch (err) {
      if (err.response) {
        console.error(`[SOAP12][${method}/full] ERROR RESPONSE`, err.response.status, err.response.statusText, err.response.data);
      } else {
        console.error(`[SOAP12][${method}/full]`, err.toString());
      }
      res.status(500).json({ error: err?.toString(), detail: err?.response?.data });
    }
  });
});

// 新增：獲取項目所有問題點詳細內容的組合 API
app.post('/getProjectIssuesDetails', async (req, res) => {
  const appID = req.body.appID !== undefined ? req.body.appID : process.env.APP_ID || '';
  const apiPwd = req.body.apiPwd !== undefined ? req.body.apiPwd : process.env.API_PWD || '';
  const { projectCode, ...otherParams } = req.body;
  
  if (!projectCode) {
    return res.status(400).json({ 
      error: 'Missing required parameter', 
      detail: 'projectCode is required' 
    });
  }

  console.log(`---Getting all issues details for project: ${projectCode}---`);
  console.log(`Using appID: ${appID ? '[SET]' : '[EMPTY]'}, apiPwd: ${apiPwd ? '[SET]' : '[EMPTY]'}`);
  
  // 檢查認證參數00
  if (!apiPwd) {
    return res.status(400).json({ 
      error: 'Missing API_PWD', 
      detail: 'API_PWD is required for authentication. Please set API_PWD environment variable or provide apiPwd in request body.' 
    });
  }

  try {
    // 組合多個 SOAP 調用的輔助函數 - 使用內部 API 調用而不是重新實現 SOAP
    const callInternalAPI = async (endpoint, params) => {
      try {
        const response = await axios.post(
          `http://localhost:${PORT}/${endpoint}`,
          params,
          {
            headers: {
              'Content-Type': 'application/json',
            },
            timeout: 15000,
          }
        );
        return response.data;
      } catch (error) {
        console.error(`Internal API call failed for ${endpoint}:`, error.message);
        throw error;
      }
    };

    // 步驟1：使用現有的 GetProjectPRList 端點
    console.log('Step 1: Getting project PR list via internal API...');
    const prListParams = { 
      projectCode,
      appID,
      apiPwd,
      ...otherParams 
    };
    
    const prList = await callInternalAPI('GetProjectPRList', prListParams);
    console.log('PR List Result from internal API:', JSON.stringify(prList, null, 2));

    // 檢查是否獲取到問題列表
    if (!prList || prList === null) {
      return res.json({
        projectCode,
        totalIssues: 0,
        issues: [],
        debugInfo: {
          cleanedResponse: prList,
          appID: appID,
          apiPwd: apiPwd ? '[MASKED]' : '[EMPTY]'
        },
        summary: 'Empty response from GetProjectPRList - possible authentication issue or no data for this project',
        troubleshooting: [
          'Check if APP_ID environment variable is set correctly',
          'Verify API_PWD is correct',
          'Confirm projectCode exists and has issues',
          'Check if user has permission to access this project'
        ]
      });
    }
    
    if (Array.isArray(prList) && prList.length === 0) {
      return res.json({
        projectCode,
        totalIssues: 0,
        issues: [],
        summary: 'No issues found for this project'
      });
    }

    // 步驟2：解析問題列表，提取問題ID
    let issueIds = [];
    if (Array.isArray(prList)) {
      issueIds = prList.map(item => item.issueID || item.IssueID || item.id).filter(Boolean);
    } else if (prList && typeof prList === 'object') {
      // 如果返回單一問題或包含問題列表的對象
      if (prList.issueID || prList.IssueID || prList.id) {
        issueIds = [prList.issueID || prList.IssueID || prList.id];
      } else {
        // 嘗試找到包含問題列表的屬性
        const possibleListKeys = Object.keys(prList).filter(key => 
          key.toLowerCase().includes('issue') || 
          key.toLowerCase().includes('list') ||
          Array.isArray(prList[key])
        );
        
        for (const key of possibleListKeys) {
          if (Array.isArray(prList[key])) {
            issueIds = prList[key].map(item => item.issueID || item.IssueID || item.id).filter(Boolean);
            break;
          }
        }
      }
    }

    console.log(`Found ${issueIds.length} issue IDs:`, issueIds);

    if (issueIds.length === 0) {
      return res.json({
        projectCode,
        totalIssues: 0,
        issues: [],
        prListRaw: prList,
        summary: 'No valid issue IDs found in project PR list'
      });
    }

    // 步驟3：批量獲取每個問題的詳細資訊（使用內部 API）
    console.log('Step 2: Getting detailed info for each issue via internal API...');
    const issuesDetails = [];
    const failedIssues = [];

    // 限制併發數量，避免過載
    const batchSize = 5;
    for (let i = 0; i < issueIds.length; i += batchSize) {
      const batch = issueIds.slice(i, i + batchSize);
      const batchPromises = batch.map(async (issueID) => {
        try {
          console.log(`Getting details for issue ID: ${issueID}`);
          
          // 獲取基本問題資訊
          const issueInfo = await callInternalAPI('GetIssueInfo', { 
            issueID, 
            includeFields: true, 
            includeAttachments: true, 
            includeRecords: true,
            appID,
            apiPwd 
          });
          
          // 嘗試獲取擴展資訊
          let extInfo = null;
          try {
            extInfo = await callInternalAPI('GetIssueExtInfo', { 
              issueID,
              appID,
              apiPwd 
            });
          } catch (extErr) {
            console.warn(`Failed to get ext info for issue ${issueID}:`, extErr.message);
          }

          return {
            issueID,
            basicInfo: issueInfo,
            extendedInfo: extInfo,
            status: 'success'
          };
        } catch (error) {
          console.error(`Failed to get details for issue ${issueID}:`, error.message);
          failedIssues.push({ issueID, error: error.message });
          return {
            issueID,
            status: 'failed',
            error: error.message
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      issuesDetails.push(...batchResults.filter(result => result.status === 'success'));
    }

    // 步驟4：整理並回傳結果
    const result = {
      projectCode,
      totalIssues: issueIds.length,
      successfulIssues: issuesDetails.length,
      failedIssues: failedIssues.length,
      issues: issuesDetails,
      failedIssuesList: failedIssues,
      originalPrList: prList,
      summary: `Successfully retrieved details for ${issuesDetails.length} out of ${issueIds.length} issues`,
      timestamp: new Date().toISOString()
    };

    console.log('---PROJECT ISSUES DETAILS COMPLETED---');
    console.log(`Total issues processed: ${issueIds.length}`);
    console.log(`Successful: ${issuesDetails.length}`);
    console.log(`Failed: ${failedIssues.length}`);

    res.json(result);

  } catch (error) {
    console.error('Error in getProjectIssuesDetails:', error);
    res.status(500).json({ 
      error: 'Failed to get project issues details', 
      detail: error.message,
      projectCode 
    });
  }
});

// 調試端點：檢查環境變數和測試 GetProjectPRList
app.post('/debug/testProjectPRList', async (req, res) => {
  const appID = req.body.appID !== undefined ? req.body.appID : process.env.APP_ID || '';
  const apiPwd = req.body.apiPwd !== undefined ? req.body.apiPwd : process.env.API_PWD || '';
  const { projectCode } = req.body;
  
  const debugInfo = {
    environment: {
      APP_ID: process.env.APP_ID ? '[SET]' : '[NOT SET]',
      API_PWD: process.env.API_PWD ? '[SET]' : '[NOT SET]'
    },
    parameters: {
      appID: appID ? '[PROVIDED]' : '[EMPTY]',
      apiPwd: apiPwd ? '[PROVIDED]' : '[EMPTY]',
      projectCode: projectCode || '[NOT PROVIDED]'
    }
  };
  
  if (!projectCode) {
    return res.json({
      error: 'projectCode is required for testing',
      debugInfo
    });
  }
  
  try {
    // 組建 SOAP 請求
    const soapBody =
      `<GetProjectPRList xmlns=\"http://tempuri.org/\">` +
      `<appID>${appID}</appID>` +
      `<apiPwd>${apiPwd}</apiPwd>` +
      `<projectCode>${projectCode}</projectCode>` +
      `</GetProjectPRList>`;
    
    const xml =
      `<?xml version=\"1.0\" encoding=\"utf-8\"?>` +
      `<soap12:Envelope xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:xsd=\"http://www.w3.org/2001/XMLSchema\" xmlns:soap12=\"http://www.w3.org/2003/05/soap-envelope\">` +
      `<soap12:Body>${soapBody}</soap12:Body></soap12:Envelope>`;

    const headers = {
      'Content-Type': 'application/soap+xml; charset=utf-8',
      'User-Agent': 'PostmanRuntime/7.36.3',
      'Accept': '*/*',
      'Connection': 'keep-alive'
    };

    const response = await axios.post(
      wsdlUrl,
      Buffer.from(xml, 'utf8'),
      {
        headers,
        timeout: 15000,
        maxBodyLength: Infinity,
        maxContentLength: Infinity
      }
    );

    const result = await new Promise((resolve, reject) => {
      xml2js.parseString(response.data, { explicitArray: false }, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });

    res.json({
      debugInfo,
      request: {
        url: wsdlUrl,
        headers,
        xmlBody: xml
      },
      response: {
        status: response.status,
        statusText: response.statusText,
        rawXML: response.data,
        parsedJSON: result
      }
    });
  } catch (error) {
    res.status(500).json({
      debugInfo,
      error: error.message,
      detail: error.response ? {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      } : null
    });
  }
});

// SOAP 1.2 RAW XML endpoint
app.post('/soap12/:method', async (req, res) => {
  const method = req.params.method;
  const {
    appID = process.env.APP_ID || '',
    apiPwd = process.env.API_PWD || '',
    ...params
  } = req.body;

  // 組 SOAP 1.2 XML
  let paramXML = '';
  for (const [k, v] of Object.entries(params)) {
    paramXML += `<${k}>${v}</${k}>`;
  }
  const soapBody =
    `<${method} xmlns=\"http://tempuri.org/\">` +
    `<appID>${appID}</appID>` +
    `<apiPwd>${apiPwd}</apiPwd>` +
    paramXML +
    `</${method}>`;
  const xml =
    `<?xml version=\"1.0\" encoding=\"utf-8\"?>` +
    `<soap12:Envelope xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:xsd=\"http://www.w3.org/2001/XMLSchema\" xmlns:soap12=\"http://www.w3.org/2003/05/soap-envelope\">` +
    `<soap12:Body>${soapBody}</soap12:Body></soap12:Envelope>`;

  try {
    const response = await axios.post(
      wsdlUrl.replace('?wsdl', ''),
      xml,
      {
        headers: {
          'Content-Type': 'application/soap+xml; charset=utf-8',
        },
        timeout: 15000,
        maxBodyLength: Infinity,
        maxContentLength: Infinity
      }
    );
    res.type('xml').send(response.data);
  } catch (err) {
    console.error('[SOAP12][RAW]', err?.response?.data || err);
    res.status(500).json({ error: err?.toString(), detail: err?.response?.data });
  }
});

app.get('/', (req, res) => {
  res.send(`
    <h1>REST to SOAP Proxy Server</h1>
    
    <h2>🆕 Enhanced API</h2>
    <div style="background-color: #f0f8ff; padding: 15px; border-left: 4px solid #0066cc; margin-bottom: 20px;">
      <h3>POST /getProjectIssuesDetails</h3>
      <p><strong>Description:</strong> Get complete details for all issues in a project</p>
      <p><strong>Parameters:</strong></p>
      <ul>
        <li><code>projectCode</code> (required) - The project code to query</li>
        <li><code>appID</code> (optional) - Override default APP_ID</li>
        <li><code>apiPwd</code> (optional) - Override default API_PWD</li>
        <li>Additional parameters will be passed to GetProjectPRList</li>
      </ul>
      <p><strong>Returns:</strong> Comprehensive project issues data including basic info and extended info for each issue</p>
      <pre style="background-color: #f5f5f5; padding: 10px; border-radius: 4px;">
curl -X POST http://localhost:5001/getProjectIssuesDetails \\
  -H "Content-Type: application/json" \\
  -d '{"projectCode": "PROJECT_CODE_HERE"}'</pre>
    </div>

    <h2>🔧 Debug API</h2>
    <div style="background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin-bottom: 20px;">
      <h3>POST /debug/testProjectPRList</h3>
      <p><strong>Description:</strong> Test GetProjectPRList SOAP method with detailed debugging info</p>
      <p><strong>Parameters:</strong></p>
      <ul>
        <li><code>projectCode</code> (required) - The project code to test</li>
        <li><code>appID</code> (optional) - Override default APP_ID</li>
        <li><code>apiPwd</code> (optional) - Override default API_PWD</li>
      </ul>
      <pre style="background-color: #f5f5f5; padding: 10px; border-radius: 4px;">
curl -X POST http://localhost:5001/debug/testProjectPRList \\
  -H "Content-Type: application/json" \\
  -d '{"projectCode": "2897"}'</pre>
    </div>

    <h2>Standard SOAP Method Endpoints</h2>
    <p>Available endpoints:</p>
    <ul>
      ${soapMethods.map(method => `
        <li>
          <strong>POST /${method}</strong> - Returns clean business data (recommended)
          <br>
          <strong>POST /${method}/full</strong> - Returns full SOAP response
          <br>
          <strong>POST /soap12/${method}</strong> - Returns raw XML
          <br><br>
        </li>
      `).join('')}
    </ul>
    <h2>Usage Examples:</h2>
    <pre>
# Clean JSON response (business data only)
curl -X POST http://localhost:5001/GetIssueInfo \\
  -H "Content-Type: application/json" \\
  -d '{"issueID": "12345"}'

# Full SOAP response
curl -X POST http://localhost:5001/GetIssueInfo/full \\
  -H "Content-Type: application/json" \\
  -d '{"issueID": "12345"}'

# Raw XML response
curl -X POST http://localhost:5001/soap12/GetIssueInfo \\
  -H "Content-Type: application/json" \\
  -d '{"issueID": "12345"}'
    </pre>
  `);
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`REST-to-SOAP Proxy Server listening on port ${PORT}`);
  console.log(`\n🔧 Environment Check:`);
  console.log(`• APP_ID: ${process.env.APP_ID ? `[SET: ${process.env.APP_ID.substring(0, 3)}...]` : '[NOT SET]'}`);
  console.log(`• API_PWD: ${process.env.API_PWD ? '[SET]' : '[NOT SET]'}`);
  console.log(`\n🆕 Enhanced API:`);
  console.log(`• Project Issues Details: POST /getProjectIssuesDetails`);
  console.log(`\nStandard SOAP Method Endpoints:`);
  console.log(`• Clean JSON: /${soapMethods.join('/, /')}`);
  console.log(`• Full SOAP: /${soapMethods.join('/full, /')}/full`);
  console.log(`• Raw XML: /soap12/{method}`);
  console.log(`\nVisit http://localhost:${PORT} for more information`);
});
