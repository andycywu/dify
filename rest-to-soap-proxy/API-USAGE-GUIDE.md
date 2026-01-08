# REST to SOAP Proxy - 完整 API 使用指南

## 📋 目錄
- [服務概覽](#服務概覽)
- [Docker 網路配置](#docker-網路配置)
- [從不同容器呼叫](#從不同容器呼叫)
- [API 端點列表](#api-端點列表)
- [使用範例](#使用範例)
- [錯誤處理](#錯誤處理)

---

## 🌐 服務概覽

### 服務資訊
- **容器名稱**: `rest-to-soap-proxy`
- **內部端口**: `5001`
- **外部端口**: `5100` (可通過 `REST_TO_SOAP_PORT` 環境變數調整)
- **健康檢查**: `http://rest-to-soap-proxy:5001/health`

### 支援模式
1. **HTTPS Mode** - 使用 Puppeteer 自動化下載 (新功能)
2. **SOAP Mode** - 傳統 SOAP API 代理 (舊功能)

---

## 🐳 Docker 網路配置

### 在 docker-compose.yaml 中的定義
```yaml
rest-to-soap-proxy:
  container_name: rest-to-soap-proxy
  ports:
    - "${REST_TO_SOAP_PORT:-5100}:5001"
  networks:
    - default
```

### 網路訪問方式

#### 1️⃣ 從宿主機 (Windows/Ubuntu)
```bash
curl http://localhost:5100/api/https/download-by-name/MNT?state=open -OJ
```

#### 2️⃣ 從其他 Docker 容器 (如 dify-next-frontend)
使用容器名稱和內部端口：
```bash
curl http://rest-to-soap-proxy:5001/api/https/download-by-name/MNT?state=open -OJ
```

#### 3️⃣ 從 Ubuntu 伺服器內部 (非容器)
```bash
curl http://172.27.197.100:5100/api/https/download-by-name/MNT?state=open -OJ
```

---

## 🔗 從不同容器呼叫

### 在 dify-next-frontend 中使用

#### 方法 1: 使用 fetch (JavaScript/TypeScript)
```javascript
// 下載專案資料
async function downloadProjectData(projectId, state = 'all') {
  const response = await fetch(
    `http://rest-to-soap-proxy:5001/api/https/download/${projectId}?state=${state}`,
    {
      method: 'GET',
      headers: {
        'Accept': 'application/vnd.ms-excel'
      }
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }

  // 獲取檔案
  const blob = await response.blob();
  const filename = response.headers.get('content-disposition')
    ?.split('filename=')[1]
    ?.replace(/"/g, '');
  
  // 觸發下載
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || 'download.xls';
  a.click();
  window.URL.revokeObjectURL(url);
}

// 使用範例
downloadProjectData(2561, 'open');  // MNT Open issues
```

#### 方法 2: 使用 axios
```javascript
import axios from 'axios';

async function downloadWithAxios(projectKey, state) {
  const response = await axios.get(
    `http://rest-to-soap-proxy:5001/api/https/download-by-name/${projectKey}`,
    {
      params: { state },
      responseType: 'blob'
    }
  );

  // 創建下載連結
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${projectKey}-${state}.xls`);
  document.body.appendChild(link);
  link.click();
  link.remove();
}

// 使用
downloadWithAxios('MNT', 'open');
```

#### 方法 3: 直接使用 <a> 標籤
```jsx
// React 組件範例
function DownloadButton({ projectKey, state = 'all' }) {
  const downloadUrl = `http://rest-to-soap-proxy:5001/api/https/download-by-name/${projectKey}?state=${state}`;
  
  return (
    <a 
      href={downloadUrl} 
      download
      className="btn btn-primary"
    >
      下載 {projectKey} ({state})
    </a>
  );
}

// 使用
<DownloadButton projectKey="MNT" state="open" />
```

---

## 📚 API 端點列表

### HTTPS Mode (Puppeteer 下載)

#### 1. GET /api/https/download/:projectId
使用 Project ID 下載資料

**參數**:
- `projectId` (Path, Required) - 專案 ID (如: 2561)
- `name` (Query, Optional) - 專案名稱，用於檔名
- `state` (Query, Optional) - Issue 狀態: `open`, `closed`, `all` (預設: `all`)

**回應**: Excel 檔案 (application/vnd.ms-excel)

**範例**:
```bash
# 從宿主機
curl http://localhost:5100/api/https/download/2561?name=MNT&state=open -OJ

# 從容器內
curl http://rest-to-soap-proxy:5001/api/https/download/2561?name=MNT&state=open -OJ
```

---

#### 2. GET /api/https/download-by-name/:projectKey
使用專案代號下載資料

**參數**:
- `projectKey` (Path, Required) - 專案代號: `TV`, `MNT`, `PD`, `AVA`
- `state` (Query, Optional) - Issue 狀態: `open`, `closed`, `all` (預設: `all`)

**專案對照表**:
| 代號 | 專案名稱 | Project ID |
|------|---------|-----------|
| TV | TV | 2558 |
| MNT | MNT | 2561 |
| PD | PD | 2559 |
| AVA | AVA | 2337 |

**回應**: Excel 檔案 (application/vnd.ms-excel)

**範例**:
```bash
# 從宿主機
curl http://localhost:5100/api/https/download-by-name/MNT?state=open -OJ

# 從容器內
curl http://rest-to-soap-proxy:5001/api/https/download-by-name/TV?state=closed -OJ
```

---

#### 3. POST /api/https/login
手動登入 (通常不需要，API 會自動登入)

**Body**:
```json
{
  "username": "your_username",
  "password": "your_password"
}
```

**回應**:
```json
{
  "success": true,
  "message": "登入成功",
  "data": {
    "session": "...",
    "cookieCount": 5,
    "timestamp": "2026-01-08T10:30:00.000Z"
  }
}
```

**範例**:
```bash
curl -X POST http://localhost:5100/api/https/login \
  -H "Content-Type: application/json" \
  -d '{"username":"user","password":"pass"}'
```

---

#### 4. POST /api/https/logout
登出當前 session

**回應**:
```json
{
  "success": true,
  "message": "登出成功"
}
```

**範例**:
```bash
curl -X POST http://localhost:5100/api/https/logout
```

---

#### 5. GET /api/https/status
檢查登入狀態

**回應**:
```json
{
  "loggedIn": true,
  "timestamp": "2026-01-08T10:30:00.000Z"
}
```

**範例**:
```bash
curl http://localhost:5100/api/https/status
```

---

#### 6. GET /api/https/projects
獲取可用專案列表

**回應**:
```json
{
  "TV": { "id": 2558, "name": "TV" },
  "MNT": { "id": 2561, "name": "MNT" },
  "PD": { "id": 2559, "name": "PD" },
  "AVA": { "id": 2337, "name": "AVA" }
}
```

**範例**:
```bash
curl http://localhost:5100/api/https/projects
```

---

#### 7. GET /api/https/test-connection
測試與 URTracker 的連接

**回應**:
```json
{
  "success": true,
  "message": "連接成功",
  "status": 200,
  "statusText": "OK"
}
```

**範例**:
```bash
curl http://localhost:5100/api/https/test-connection
```

---

#### 8. GET /health
Docker 健康檢查端點

**回應**:
```json
{
  "status": "ok",
  "timestamp": "2026-01-08T10:30:00.000Z"
}
```

**範例**:
```bash
curl http://localhost:5100/health
```

---

## 💻 使用範例

### 從 dify-next-frontend 下載專案資料

#### Next.js API Route 範例
```typescript
// app/api/urtracker/download/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const projectKey = searchParams.get('project') || 'MNT';
  const state = searchParams.get('state') || 'all';

  try {
    // 使用容器名稱訪問
    const response = await fetch(
      `http://rest-to-soap-proxy:5001/api/https/download-by-name/${projectKey}?state=${state}`
    );

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(error, { status: response.status });
    }

    // 轉發下載
    const buffer = await response.arrayBuffer();
    const filename = response.headers.get('content-disposition')
      ?.split('filename=')[1]
      ?.replace(/"/g, '') || 'download.xls';

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.ms-excel',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
```

#### React Component 範例
```tsx
// components/UrtrackerDownload.tsx
import { useState } from 'react';

type ProjectKey = 'TV' | 'MNT' | 'PD' | 'AVA';
type State = 'open' | 'closed' | 'all';

export function UrtrackerDownload() {
  const [loading, setLoading] = useState(false);
  const [project, setProject] = useState<ProjectKey>('MNT');
  const [state, setState] = useState<State>('all');

  const handleDownload = async () => {
    setLoading(true);
    try {
      // 呼叫自己的 API route (會轉發到 rest-to-soap-proxy)
      const response = await fetch(
        `/api/urtracker/download?project=${project}&state=${state}`
      );

      if (!response.ok) {
        const error = await response.json();
        alert(`下載失敗: ${error.message}`);
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project}-${state}-${new Date().toISOString().split('T')[0]}.xls`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert(`下載失敗: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-4">
      <select value={project} onChange={e => setProject(e.target.value as ProjectKey)}>
        <option value="TV">TV</option>
        <option value="MNT">MNT</option>
        <option value="PD">PD</option>
        <option value="AVA">AVA</option>
      </select>

      <select value={state} onChange={e => setState(e.target.value as State)}>
        <option value="all">All Issues</option>
        <option value="open">Open Issues</option>
        <option value="closed">Closed Issues</option>
      </select>

      <button 
        onClick={handleDownload}
        disabled={loading}
        className="btn btn-primary"
      >
        {loading ? '下載中...' : '下載'}
      </button>
    </div>
  );
}
```

---

### 從其他容器使用 curl

#### 在 Dockerfile 中安裝 curl (如需要)
```dockerfile
FROM node:20
RUN apt-get update && apt-get install -y curl
```

#### 在容器內執行 (例如從 api 容器)
```bash
# 進入容器
docker exec -it dify-api bash

# 下載檔案
curl http://rest-to-soap-proxy:5001/api/https/download-by-name/MNT?state=open -OJ

# 檢查檔案
ls -lh *.xls
```

---

### 在 Python 中呼叫 (如從 dify api 容器)

```python
import requests
from datetime import datetime

def download_urtracker_data(project_key='MNT', state='all'):
    """從 rest-to-soap-proxy 下載專案資料"""
    url = f'http://rest-to-soap-proxy:5001/api/https/download-by-name/{project_key}'
    params = {'state': state}
    
    try:
        response = requests.get(url, params=params, stream=True)
        response.raise_for_status()
        
        # 取得檔名
        content_disposition = response.headers.get('content-disposition', '')
        filename = content_disposition.split('filename=')[1].strip('"') if 'filename=' in content_disposition else f'{project_key}-{state}-{datetime.now().date()}.xls'
        
        # 儲存檔案
        with open(filename, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        
        print(f'✅ 下載成功: {filename}')
        return filename
    
    except requests.exceptions.RequestException as e:
        print(f'❌ 下載失敗: {e}')
        if hasattr(e.response, 'json'):
            error_data = e.response.json()
            print(f'   錯誤詳情: {error_data.get("message")}')
        return None

# 使用範例
download_urtracker_data('MNT', 'open')
download_urtracker_data('TV', 'closed')
```

---

## 🚨 錯誤處理

### HTTP 狀態碼

| 狀態碼 | 說明 | 處理方式 |
|--------|------|---------|
| 200 | 成功 | 處理回應資料 |
| 400 | 無效參數 | 檢查請求參數 |
| 401 | 未授權 | Session 過期，重試 |
| 403 | 權限不足 | 檢查使用者權限 |
| 404 | 專案不存在 | 確認 Project ID 是否正確 |
| 408 | 請求超時 | 專案可能沒有資料或網路問題 |
| 500 | 伺服器錯誤 | 查看錯誤日誌 |

### 錯誤回應格式
```json
{
  "success": false,
  "error": "權限不足",
  "message": "沒有權限訪問此專案 (Project ID: 9999)",
  "projectId": "9999",
  "timestamp": "2026-01-08T10:30:00.000Z"
}
```

### JavaScript 錯誤處理範例
```javascript
async function safeDownload(projectId, state) {
  try {
    const response = await fetch(
      `http://rest-to-soap-proxy:5001/api/https/download/${projectId}?state=${state}`
    );

    if (!response.ok) {
      const error = await response.json();
      
      switch (response.status) {
        case 401:
          console.error('Session 過期，請重試');
          // 重試邏輯
          break;
        case 403:
          console.error('沒有權限:', error.message);
          break;
        case 404:
          console.error('專案不存在:', error.message);
          break;
        case 408:
          console.error('下載超時:', error.message);
          break;
        default:
          console.error('下載失敗:', error.message);
      }
      
      throw new Error(error.message);
    }

    return await response.blob();
  } catch (error) {
    console.error('網路錯誤:', error);
    throw error;
  }
}
```

---

## 🔍 除錯與監控

### 查看容器日誌
```bash
# 即時查看日誌
docker logs rest-to-soap-proxy -f

# 查看最近 100 行
docker logs rest-to-soap-proxy --tail 100
```

### 檢查服務健康狀態
```bash
# 從宿主機
curl http://localhost:5100/health

# 從容器內
docker exec dify-api curl http://rest-to-soap-proxy:5001/health
```

### 測試連接
```bash
# 測試與 URTracker 的連接
curl http://localhost:5100/api/https/test-connection

# 檢查登入狀態
curl http://localhost:5100/api/https/status

# 獲取可用專案
curl http://localhost:5100/api/https/projects
```

---

## 📦 完整下載流程範例

### 場景：從 dify-next-frontend 下載 MNT Open Issues

```
1. 用戶點擊下載按鈕
   ↓
2. Frontend 發送請求
   fetch('http://rest-to-soap-proxy:5001/api/https/download-by-name/MNT?state=open')
   ↓
3. rest-to-soap-proxy 處理
   - 檢查 session (如需要自動登入)
   - 使用 Puppeteer 訪問 URTracker
   - 觸發下載並獲取檔案
   ↓
4. 返回 Excel 檔案
   Content-Type: application/vnd.ms-excel
   Content-Disposition: attachment; filename="MNT-Open-2026-01-08.xls"
   ↓
5. Frontend 處理回應
   - 創建 Blob
   - 觸發瀏覽器下載
   - 檔案儲存到本機
```

---

## 🎯 快速參考

### 常用命令速查

```bash
# 下載 MNT Open Issues
curl http://localhost:5100/api/https/download-by-name/MNT?state=open -OJ

# 下載 TV Closed Issues
curl http://localhost:5100/api/https/download-by-name/TV?state=closed -OJ

# 下載 PD All Issues (預設)
curl http://localhost:5100/api/https/download-by-name/PD -OJ

# 使用自訂 Project ID
curl http://localhost:5100/api/https/download/9999?name=CustomProject&state=all -OJ

# 檢查服務狀態
curl http://localhost:5100/health

# 獲取專案列表
curl http://localhost:5100/api/https/projects
```

### 檔名格式
- 有指定 name: `{ProjectName}-{State}-{Date}.xls`
  - 範例: `MNT-Open-2026-01-08.xls`
- 無指定 name: `Project-{ID}-{State}-{Date}.xls`
  - 範例: `Project-2561-All-2026-01-08.xls`

---

## 📞 支援

如需協助或回報問題：
1. 查看錯誤日誌: `docker logs rest-to-soap-proxy`
2. 查看錯誤截圖: `docker/volumes/rest-to-soap-proxy/temp/error_*.png`
3. 參考 [ERROR-HANDLING.md](ERROR-HANDLING.md) 了解常見錯誤

---

**最後更新**: 2026-01-08
