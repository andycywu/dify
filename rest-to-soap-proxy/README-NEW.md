# Urtracker API Proxy Server v2.0

🚀 支持**雙模式**訪問 Urtracker 的 REST API 代理服務器

## ✨ 功能特色

### 🆕 HTTPS 模式 (新增)
- 模擬 Excel VBA 的 HTTPS 登入和下載流程
- 直接下載 Excel 格式的專案數據
- 支持 TV、PD、MNT、AVA 四個專案
- Session 管理和認證

### 🔧 SOAP 模式 (原有)
- REST to SOAP 代理功能
- 支持 18 個 SOAP 方法
- 三種響應格式：Clean JSON、Full SOAP、Raw XML
- 組合 API（批量獲取專案問題詳情）

## 📦 安裝

```bash
cd rest-to-soap-proxy
npm install
```

## 🔧 配置

1. 複製環境變數範例文件：
```bash
cp .env.example .env
```

2. 編輯 `.env` 文件：
```bash
# SOAP 模式認證
APP_ID=your_app_id_here
API_PWD=your_api_password_here

# 服務器端口
PORT=5001
```

## 🚀 啟動服務

```bash
# 生產模式
npm start

# 開發模式 (自動重啟)
npm run dev

# 使用原有版本 (僅 SOAP)
npm run legacy
```

啟動後訪問：http://localhost:5001

## 📡 API 使用指南

### 🆕 HTTPS 模式 API

#### 1. 登入
```bash
curl -X POST http://localhost:5001/api/https/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "your_username",
    "password": "your_password"
  }'
```

**響應範例：**
```json
{
  "success": true,
  "message": "登入成功",
  "data": {
    "session": "ASP.NET_SessionId=...; .ASPXAUTH=...",
    "cookieCount": 2,
    "timestamp": "2026-01-06T10:30:00.000Z"
  }
}
```

#### 2. 檢查登入狀態
```bash
curl http://localhost:5001/api/https/status
```

#### 3. 獲取可用專案列表
```bash
curl http://localhost:5001/api/https/projects
```

**響應範例：**
```json
{
  "success": true,
  "projects": [
    { "key": "TV", "id": 2558, "name": "TV-Data" },
    { "key": "PD", "id": 2559, "name": "PD-Data" },
    { "key": "MNT", "id": 2561, "name": "MNT-Data" },
    { "key": "AVA", "id": 2560, "name": "AVA-Data" }
  ]
}
```

#### 4. 下載專案數據

**方式 A：通過專案 ID**
```bash
curl -O http://localhost:5001/api/https/download/2558?name=TV-Data
```

**方式 B：通過專案代號（推薦）**
```bash
curl -O http://localhost:5001/api/https/download-by-name/TV
curl -O http://localhost:5001/api/https/download-by-name/PD
curl -O http://localhost:5001/api/https/download-by-name/MNT
curl -O http://localhost:5001/api/https/download-by-name/AVA
```

**方式 C：自定義參數**
```bash
curl -O "http://localhost:5001/api/https/download/2558?name=TV-Data&format=xls&fieldStart=2&fieldEnd=68"
```

#### 5. 批量下載所有專案
```bash
curl http://localhost:5001/api/https/download-all
```

**響應範例：**
```json
{
  "success": true,
  "totalProjects": 4,
  "successCount": 4,
  "failCount": 0,
  "results": [
    {
      "projectId": 2558,
      "projectName": "TV-Data",
      "filename": "TV-Data_2026-01-06.xls",
      "size": 245678,
      "contentType": "application/vnd.ms-excel"
    }
    // ... 其他專案
  ]
}
```

#### 6. 登出
```bash
curl -X POST http://localhost:5001/api/https/logout
```

### 🔧 SOAP 模式 API

#### 獲取問題資訊
```bash
curl -X POST http://localhost:5001/GetIssueInfo \
  -H "Content-Type: application/json" \
  -d '{
    "issueID": 1484510,
    "includeFields": true,
    "includeAttachments": false,
    "includeRecords": false
  }'
```

#### 獲取專案問題列表
```bash
curl -X POST http://localhost:5001/GetProjectPRList \
  -H "Content-Type: application/json" \
  -d '{
    "projectID": 2558
  }'
```

#### 獲取專案所有問題詳情（組合 API）
```bash
curl -X POST http://localhost:5001/getProjectIssuesDetails \
  -H "Content-Type: application/json" \
  -d '{
    "projectID": 2558,
    "newRecordOnly": false
  }'
```

#### 完整 SOAP 響應
```bash
curl -X POST http://localhost:5001/GetIssueInfo/full \
  -H "Content-Type: application/json" \
  -d '{"issueID": 1484510}'
```

#### 原始 XML 響應
```bash
curl -X POST http://localhost:5001/soap12/GetIssueInfo \
  -H "Content-Type: application/json" \
  -d '{"issueID": 1484510}'
```

## 📋 支持的 SOAP 方法

| 方法名 | 說明 |
|--------|------|
| `CreateIssue` | 創建問題 |
| `CreateIssueNewVer` | 創建問題（新版） |
| `CreateIssueMail` | 創建問題並發送郵件 |
| `CreateIssueNewVerMail` | 創建問題並發送郵件（新版） |
| `UpdateIssueById` | 更新問題 |
| `AddComment` | 添加評論 |
| `GetIssueInfo` | 獲取問題資訊 |
| `GetIssueInfobyIssueCode` | 通過代碼獲取問題資訊 |
| `GetIssueExtInfo` | 獲取問題擴展資訊 |
| `GetManagerListbyState` | 獲取狀態管理員列表 |
| `ChangeAssignee` | 更改負責人 |
| `ChangeAssigneeMail` | 更改負責人並發送郵件 |
| `UploadFile` | 上傳文件 |
| `DownloadFile` | 下載文件 |
| `GetProjectPRList` | 獲取專案問題列表 |
| `GetProjectPRListByUpdatedTime` | 按更新時間獲取專案問題列表 |
| `GetProjectPRListCountByUpdatedTime` | 獲取專案問題數量 |
| `GetURTTaskList` | 獲取任務列表 |
| `GetURTTaskCount` | 獲取任務數量 |

## 🔄 完整工作流程範例

### Node.js / JavaScript
```javascript
const axios = require('axios');
const fs = require('fs');

async function downloadAllProjects() {
  const baseURL = 'http://localhost:5001';
  
  // 1. 登入
  const loginRes = await axios.post(`${baseURL}/api/https/login`, {
    username: 'your_username',
    password: 'your_password'
  });
  
  console.log('登入成功:', loginRes.data.message);
  
  // 2. 獲取專案列表
  const projectsRes = await axios.get(`${baseURL}/api/https/projects`);
  console.log('可用專案:', projectsRes.data.projects);
  
  // 3. 下載每個專案
  for (const project of projectsRes.data.projects) {
    const response = await axios.get(
      `${baseURL}/api/https/download-by-name/${project.key}`,
      { responseType: 'arraybuffer' }
    );
    
    fs.writeFileSync(`${project.name}.xls`, response.data);
    console.log(`已下載: ${project.name}.xls`);
  }
  
  // 4. 登出
  await axios.post(`${baseURL}/api/https/logout`);
  console.log('已登出');
}

downloadAllProjects().catch(console.error);
```

### Python
```python
import requests

def download_all_projects():
    base_url = 'http://localhost:5001'
    session = requests.Session()
    
    # 1. 登入
    login_res = session.post(f'{base_url}/api/https/login', json={
        'username': 'your_username',
        'password': 'your_password'
    })
    print('登入成功:', login_res.json()['message'])
    
    # 2. 獲取專案列表
    projects_res = session.get(f'{base_url}/api/https/projects')
    projects = projects_res.json()['projects']
    
    # 3. 下載每個專案
    for project in projects:
        response = session.get(
            f"{base_url}/api/https/download-by-name/{project['key']}"
        )
        
        filename = f"{project['name']}.xls"
        with open(filename, 'wb') as f:
            f.write(response.content)
        print(f'已下載: {filename}')
    
    # 4. 登出
    session.post(f'{base_url}/api/https/logout')
    print('已登出')

if __name__ == '__main__':
    download_all_projects()
```

### Bash / Shell
```bash
#!/bin/bash

BASE_URL="http://localhost:5001"

# 1. 登入
echo "正在登入..."
curl -X POST "$BASE_URL/api/https/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"your_username","password":"your_password"}'

# 2. 下載 TV 專案
echo "下載 TV 專案..."
curl -O "$BASE_URL/api/https/download-by-name/TV"

# 3. 下載 PD 專案
echo "下載 PD 專案..."
curl -O "$BASE_URL/api/https/download-by-name/PD"

# 4. 下載 MNT 專案
echo "下載 MNT 專案..."
curl -O "$BASE_URL/api/https/download-by-name/MNT"

# 5. 下載 AVA 專案
echo "下載 AVA 專案..."
curl -O "$BASE_URL/api/https/download-by-name/AVA"

# 6. 登出
echo "登出..."
curl -X POST "$BASE_URL/api/https/logout"

echo "完成！"
```

## 🐳 Docker 部署

```bash
# 構建鏡像
docker build -t urtracker-proxy .

# 運行容器
docker run -d \
  -p 5001:5001 \
  -e APP_ID=your_app_id \
  -e API_PWD=your_api_pwd \
  --name urtracker-proxy \
  urtracker-proxy
```

## 📁 項目結構

```
rest-to-soap-proxy/
├── src/
│   ├── clients/
│   │   └── https-client.js     # HTTPS 客戶端 (模擬 VBA)
│   ├── routes/
│   │   └── https-routes.js     # HTTPS API 路由
│   └── utils/                  # 工具函數
├── index.js                    # 主入口 (雙模式)
├── index-soap.js               # SOAP 路由模塊
├── index-backup.js             # 原版本備份
├── package.json
├── .env.example
├── Dockerfile
└── README.md
```

## 🔍 對應 VBA 代碼

| Node.js 文件 | VBA 文件 | 說明 |
|-------------|----------|------|
| `src/clients/https-client.js` | `Common.bas` + `Download.bas` | 登入和下載邏輯 |
| `login()` | `LoginURTAndGetHttp()` | 登入方法 |
| `getViewState()` | `GetViewState()` | 獲取 ViewState |
| `downloadProjectData()` | `DownloadHandler()` | 下載數據 |
| `downloadAllProjects()` | `Download()` | 批量下載 |
| - | `Config.bas` | 配置 (已遷移到 .env) |

## ⚠️ 注意事項

1. **Session 管理**
   - HTTPS 模式的 Session 存儲在服務器記憶體中
   - 服務器重啟後需要重新登入
   - 建議生產環境使用 Redis 等持久化方案

2. **安全性**
   - 不要在 `.env` 文件中存儲生產環境密碼
   - 建議通過 API 調用時動態傳遞認證信息
   - 使用 HTTPS 協議保護傳輸安全

3. **性能考慮**
   - 批量下載時會有延遲（避免過快請求）
   - Excel 文件可能較大，注意網絡超時設置
   - 建議設置適當的超時時間（默認 30 秒）

4. **SOAP vs HTTPS**
   - SOAP 模式：適合獲取結構化的 JSON 數據
   - HTTPS 模式：適合下載 Excel 文件（與 VBA 兼容）

## 🐛 故障排除

### 登入失敗
- 檢查用戶名和密碼是否正確
- 確認 Urtracker 服務是否可訪問
- 查看服務器日誌獲取詳細錯誤信息

### 下載失敗
- 確保已經登入（調用 `/api/https/login`）
- 檢查專案 ID 是否正確
- 查看 Session 是否過期

### Session 過期
- 重新調用 `/api/https/login` 登入
- 考慮實現自動重新登入機制

## 📝 更新日誌

### v2.0.0 (2026-01-06)
- 🆕 新增 HTTPS 模式（模擬 VBA 實現）
- 🆕 支持直接下載 Excel 文件
- 🆕 Session 管理和認證
- 🔧 重構項目結構
- 📚 完善文檔和範例

### v1.0.0
- 🔧 原有 SOAP 代理功能
- 📡 支持 18 個 SOAP 方法
- 🎯 組合 API

## 📄 授權

MIT License

## 🤝 貢獻

歡迎提交 Issue 和 Pull Request！

## 📧 聯繫方式

如有問題，請聯繫項目維護者。
