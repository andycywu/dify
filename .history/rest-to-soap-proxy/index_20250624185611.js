require('dotenv').config();
const express = require('express');
const soap = require('soap');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());

const wsdlUrl = 'https://fwtrack.tpv-tech.com/api/issue.asmx';

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
    // 組 headers，模仿 Postman
    const headers = {
      'Content-Type': 'application/soap+xml; charset=utf-8',
      'User-Agent': 'PostmanRuntime/7.36.3',
      'Accept': '*/*',
      'Connection': 'keep-alive',
      // SOAP 1.2 通常不用 SOAPAction，但有些服務端會要求
      'SOAPAction': `http://tempuri.org/${method}`
    };
    try {
      const response = await axios.post(
        wsdlUrl,
        xml,
        {
          headers,
          timeout: 15000,
        }
      );
      res.type('xml').send(response.data);
    } catch (err) {
      console.error(`[SOAP12][${method}]`, err?.response?.data || err);
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
      }
    );
    res.type('xml').send(response.data);
  } catch (err) {
    console.error('[SOAP12][RAW]', err?.response?.data || err);
    res.status(500).json({ error: err?.toString(), detail: err?.response?.data });
  }
});

app.get('/', (req, res) => {
  res.send('REST to SOAP Proxy Server is running.');
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`REST-to-SOAP listening on port ${PORT}`);
});
