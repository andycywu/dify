const express = require('express');
const soap = require('soap');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

// TODO: Replace with your actual WSDL URL or local file path
const wsdlUrl = 'https://fwtrack.tpv-tech.com/api/issue.asmx?wsdl';

// Example endpoint: createIssue
app.post('/createIssue', async (req, res) => {
  try {
    const client = await soap.createClientAsync(wsdlUrl);
    // req.body should match the SOAP method's expected input
    const result = await client.CreateIssueAsync(req.body);
    res.json(result[0]);
  } catch (err) {
    res.status(500).json({ error: err.toString() });
  }
});

app.get('/', (req, res) => {
  res.send('REST to SOAP Proxy Server is running.');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`REST-to-SOAP listening on port ${PORT}`);
});
