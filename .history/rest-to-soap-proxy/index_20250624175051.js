require('dotenv').config();
const express = require('express');
const soap = require('soap');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

const wsdlUrl = 'https://fwtrack.tpv-tech.com/api/issue.asmx?wsdl';

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

// 動態建立 REST 端點
soapMethods.forEach((method) => {
  app.post(`/${method}`, async (req, res) => {
    // 預設從 .env 讀取 appID 與 apiPwd，若 body 有傳則覆蓋
    const appID = req.body.appID !== undefined ? req.body.appID : process.env.APP_ID || '';
    const apiPwd = req.body.apiPwd !== undefined ? req.body.apiPwd : process.env.API_PWD || '';
    const body = { ...req.body, appID, apiPwd };
    console.log(`[REST][${method}] 收到請求:`, body);
    try {
      const client = await soap.createClientAsync(wsdlUrl);
      if (typeof client[`${method}Async`] !== 'function') {
        return res.status(400).json({ error: `SOAP method ${method} not found` });
      }
      const result = await client[`${method}Async`](body);
      console.log(`[SOAP][${method}] result:`, result);
      res.json(result);
    } catch (err) {
      console.error(`[SOAP][${method}] error:`, err);
      res.status(500).json({ error: err.toString() });
    }
  });
});

app.get('/', (req, res) => {
  res.send('REST to SOAP Proxy Server is running.');
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`REST-to-SOAP listening on port ${PORT}`);
});
