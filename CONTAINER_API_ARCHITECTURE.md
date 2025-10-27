# Dify 擴展容器架構說明

## 架構概覽

本項目基於 Dify 2.0.0-beta.2 原生架構，新增了自定義功能容器，採用**升級友好**的設計原則，確保 Dify 升級時不影響自定義功能。

## 完整架構圖

```
┌─────────────────────────────────────────────────────────────────┐
│                     Docker 容器架構                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  🌐 Dify 原生系統（Port 80）                                    │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  nginx:80 → {                                             │  │
│  │    /console/api/* → api:5001  (Console管理API)            │  │
│  │    /api/*         → api:5001  (Service API)               │  │
│  │    /v1/*          → api:5001  (App API) ← 我們使用這個     │  │
│  │    /files/*       → api:5001  (文件服務)                  │  │
│  │    /*             → web:3000  (Dify原生前端)              │  │
│  │  }                                                        │  │
│  │                                                           │  │
│  │  Supporting Services:                                     │  │
│  │  - db:5432 (PostgreSQL)                                  │  │
│  │  - redis:6379 (Redis)                                    │  │
│  │  - weaviate (Vector DB)                                  │  │
│  │  - worker, worker_beat (後台任務)                         │  │
│  │  - plugin_daemon:5002                                    │  │
│  │  - ssrf_proxy:3128                                       │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  🔧 自定義擴展系統（獨立端口）                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  dify-next-frontend:3001  (自定義管理前端)                │  │
│  │    ↓ 直接調用 ↓                                          │  │
│  │  localhost/v1/* (Dify 原生 API)                          │  │
│  │                                                           │  │
│  │  dify-wiki:3002           (Wiki.js 知識庫)               │  │
│  │  wiki-batch-importer:5050 (批量導入工具)                 │  │
│  │  rest-to-soap-proxy:5100  (REST轉SOAP代理)               │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## API 調用架構

### 🎯 升級友好設計原則

```javascript
// ✅ 正確：直接調用 Dify 原生 API
const API_BASE_URL = 'http://localhost/v1';
const response = await axios.get(`${API_BASE_URL}/datasets`, {
  headers: {
    'Authorization': `Bearer ${API_KEY}`
  }
});

// ❌ 錯誤：通過自定義代理（升級時可能破壞）
const API_BASE_URL = 'http://localhost:3001/api/dify';
```

### API 端點映射

| 功能 | 原生端點 | 說明 |
|------|---------|------|
| 數據集管理 | `GET /v1/datasets` | 知識庫列表 |
| 對話管理 | `GET /v1/conversations` | 對話歷史 |
| 參數配置 | `GET /v1/parameters` | 應用參數 |
| 文件上傳 | `POST /files/upload` | 文件服務 |

## 環境變數配置

### dify-next-frontend 配置

```bash
# 直接指向 Dify 原生 API（無代理）
NEXT_PUBLIC_DIFY_API_BASE_URL=http://localhost/v1

# API 認證密鑰
NEXT_PUBLIC_DIFY_API_KEY=app-PxzkiLjnjcU2w2ARj5qeflQq
NEXT_PUBLIC_DIFY_DATASET_KEY=dataset-cELaA8GGeLpoeXZZXsibGqI3

# 應用訪問端口
NEXTAUTH_URL=http://localhost:3001
```

### 不同環境配置

| 環境 | API Base URL | 說明 |
|------|-------------|------|
| 開發環境 | `http://localhost/v1` | 本地開發 |
| 生產環境 | `https://yourdomain.com/v1` | 生產部署 |

## 升級策略

### 🚀 Dify 版本升級步驟

1. **備份自定義配置**
   ```bash
   # 備份自定義容器配置
   cp -r dify-next-frontend/ backup/
   cp -r wiki/ backup/
   ```

2. **升級 Dify 核心**
   ```bash
   # 按照官方文檔升級 Dify
   git pull origin main
   docker-compose -f docker/docker-compose.yaml pull
   docker-compose -f docker/docker-compose.yaml up -d
   ```

3. **測試 API 兼容性**
   ```bash
   # 測試關鍵 API 端點
   curl -H "Authorization: Bearer ${API_KEY}" http://localhost/v1/datasets
   ```

4. **重新部署自定義服務**
   ```bash
   # 重新構建和部署自定義容器
   docker-compose -f docker/docker-compose.yaml build dify-next-frontend
   docker-compose -f docker/docker-compose.yaml up -d dify-next-frontend
   ```

### ⚠️ 升級注意事項

- **不要修改 Dify 原生配置文件**（如 nginx.conf）
- **API 端點變更檢查**：升級後檢查 `/v1/*` 端點是否有變化
- **認證方式檢查**：確認 API 密鑰格式是否有更新

## 開發指南

### 添加新的 API 調用

```typescript
// services/newService.ts
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_DIFY_API_BASE_URL || 'http://localhost/v1';
const API_KEY = process.env.NEXT_PUBLIC_DIFY_DATASET_KEY;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json'
  }
});

export const newAPIFunction = async () => {
  const response = await apiClient.get('/new-endpoint');
  return response.data;
};
```

### 錯誤處理

```typescript
try {
  const data = await apiCall();
  return data;
} catch (error) {
  if (error.response?.status === 401) {
    console.error('API key invalid or expired');
  } else if (error.response?.status === 404) {
    console.error('API endpoint not found - check Dify version compatibility');
  }
  throw error;
}
```

## 監控和維護

### 健康檢查

```bash
# 檢查所有容器狀態
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# 檢查 API 連通性
curl -I http://localhost/v1/datasets

# 檢查自定義前端
curl -I http://localhost:3001/
```

### 日誌查看

```bash
# Dify API 日誌
docker logs docker-api-1

# 自定義前端日誌
docker logs docker-dify-next-frontend-1

# Nginx 日誌
docker logs docker-nginx-1
```

## 故障排除

### 常見問題

1. **API 401 錯誤**
   - 檢查 API 密鑰是否正確
   - 確認使用正確的密鑰類型（app-* 或 dataset-*）

2. **CORS 錯誤**
   - 確認使用正確的 API Base URL
   - 檢查是否意外使用了代理路徑

3. **升級後 API 無法訪問**
   - 檢查 Dify API 端點是否有變更
   - 確認 nginx 配置是否被覆蓋

### 聯絡支援

如有問題，請檢查：
1. 容器狀態和日誌
2. API 端點連通性
3. 環境變數配置
4. Dify 版本兼容性

---

**最後更新：** 2025年10月22日  
**Dify 版本：** 2.0.0-beta.2  
**架構版本：** 1.0.0-升級友好版