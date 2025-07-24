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

    // 查找方法響應 (methodNameResponse)
    const responseKey = `${method}Response`;
    const methodResponse = body[responseKey];
    if (!methodResponse) {
      console.log(`No ${responseKey} found, checking for other response patterns...`);
      
      // 嘗試查找其他可能的響應格式
      const bodyKeys = Object.keys(body);
      const possibleResponse = bodyKeys.find(key => 
        key.toLowerCase().includes(method.toLowerCase()) && 
        key.toLowerCase().includes('response')
      );
      
      if (possibleResponse) {
        console.log(`Found alternative response key: ${possibleResponse}`);
        const altMethodResponse = body[possibleResponse];
        
        // 查找結果數據
        const altResultKey = Object.keys(altMethodResponse || {}).find(key => 
          key.toLowerCase().includes('result')
        );
        
        if (altResultKey && altMethodResponse[altResultKey] !== undefined) {
          console.log(`Extracted alternative result from ${altResultKey}:`, altMethodResponse[altResultKey]);
          return altMethodResponse[altResultKey];
        }
        
        return altMethodResponse;
      }
      
      // 如果沒有找到特定的響應，檢查 body 是否只包含業務數據
      const bodyKeys2 = Object.keys(body);
      if (bodyKeys2.length === 1 && !bodyKeys2[0].includes('soap')) {
        console.log('Found single non-SOAP key in body, returning its value');
        return body[bodyKeys2[0]];
      }
      
      console.log('Returning body as fallback');
      return body;
    }

    // 查找結果數據 (methodNameResult)
    const resultKey = `${method}Result`;
    const methodResult = methodResponse[resultKey];
    if (methodResult !== undefined) {
      console.log(`Extracted ${resultKey}:`, methodResult);
      return methodResult;
    }

    // 嘗試查找其他可能的結果格式
    const responseKeys = Object.keys(methodResponse);
    const possibleResult = responseKeys.find(key => 
      key.toLowerCase().includes('result') || 
      key.toLowerCase().includes('return') ||
      (!key.includes('xmlns') && !key.includes('soap'))
    );
    
    if (possibleResult && methodResponse[possibleResult] !== undefined) {
      console.log(`Found alternative result key: ${possibleResult}`, methodResponse[possibleResult]);
      return methodResponse[possibleResult];
    }

    // 如果響應中只有一個非屬性字段，返回它
    const dataKeys = responseKeys.filter(key => 
      !key.startsWith('$') && !key.includes('xmlns') && !key.includes('soap')
    );
    
    if (dataKeys.length === 1) {
      console.log(`Found single data key: ${dataKeys[0]}`, methodResponse[dataKeys[0]]);
      return methodResponse[dataKeys[0]];
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
  if (typeof result !== 'object' || result === null) {
    return result;
  }

  // 如果結果是對象，檢查是否還有SOAP相關的鍵
  if (typeof result === 'object' && !Array.isArray(result)) {
    const keys = Object.keys(result);
    
    // 移除所有SOAP相關的屬性
    const cleanedResult = {};
    for (const [key, value] of Object.entries(result)) {
      if (!key.includes('soap') && !key.includes('xmlns') && !key.startsWith('$')) {
        cleanedResult[key] = deepCleanResult(value);
      }
    }
    
    // 如果清理後只剩一個鍵，且該鍵看起來像是包裝，則進一步提取
    const cleanedKeys = Object.keys(cleanedResult);
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
  console.log(`\nAvailable endpoints:`);
  console.log(`• Clean JSON: /${soapMethods.join('/, /')}`);
  console.log(`• Full SOAP: /${soapMethods.join('/full, /')}/full`);
  console.log(`• Raw XML: /soap12/{method}`);
  console.log(`\nVisit http://localhost:${PORT} for more information`);
});
