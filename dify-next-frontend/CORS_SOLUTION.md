# 🌐 CORS 問題解決方案：Next.js API 代理架構

## 🚨 問題分析

### CORS 錯誤原因
```
Access to XMLHttpRequest at 'http://localhost/api/v1/conversations' 
from origin 'http://localhost:3001' has been blocked by CORS policy
```

**問題根源：**
- 瀏覽器從 `http://localhost:3001` (dify-next-frontend) 
- 嘗試訪問 `http://localhost/api/v1/*` (通過 Nginx 代理的 Dify API)
- 這是**跨來源請求**，需要 CORS 頭支持

## 💡 解決方案：Next.js API 代理

### 🏗️ 新架構設計

```text
瀏覽器端 JavaScript
        ↓
http://localhost:3001/api/dify/*  (Next.js API 代理)
        ↓
http://api:5001/v1/*  (容器內部調用 Dify API)
```

### 📁 實現文件

#### 1. API 代理：`/pages/api/dify/[...path].ts`
```typescript
// 統一代理所有 Dify API 請求
// 路徑映射：/api/dify/conversations → http://api:5001/v1/conversations
// 自動添加 CORS 頭和 API 密鑰
```

#### 2. 環境配置更新
```bash
# 舊配置（會產生 CORS 錯誤）
NEXT_PUBLIC_DIFY_API_BASE_URL=http://localhost/v1

# 新配置（通過 Next.js 代理）
NEXT_PUBLIC_DIFY_API_BASE_URL=http://localhost:3001/api/dify
```

## 🔄 請求流程對比

### ❌ 舊流程（CORS 錯誤）
```text
瀏覽器 → http://localhost/v1/conversations
         ↓ (跨來源請求被阻擋)
      Nginx → http://api:5001/v1/conversations
```

### ✅ 新流程（CORS 解決）
```text
瀏覽器 → http://localhost:3001/api/dify/conversations
         ↓ (同源請求，無 CORS 問題)
   Next.js API 代理 → http://api:5001/v1/conversations
                    ↓ (容器內部調用)
                 Dify API 服務器
```

## 🎯 優勢

1. **解決 CORS**：瀏覽器只訪問同源 API
2. **統一管理**：API 密鑰和認證在服務器端處理
3. **安全性**：避免在瀏覽器端暴露 API 密鑰
4. **靈活性**：可以在代理層添加額外邏輯（緩存、驗證等）
5. **容器化友好**：利用 Docker 內部網路進行高效通信

## 📊 端口分配總結

```text
:80   → Nginx (官方 Dify Web + API 代理)
:3001 → dify-next-frontend (自定義前端)
:3002 → Wiki.js (外部訪問)
:5001 → Dify API (容器內部)
:5432 → PostgreSQL (容器內部)
:11434 → Ollama (本地外部服務)
```

## 🔧 測試方法

構建完成後，測試 API 代理：

```bash
# 測試健康檢查（如果 Dify API 有此端點）
curl http://localhost:3001/api/dify/health

# 測試對話 API
curl -H "Authorization: Bearer YOUR_API_KEY" \
     http://localhost:3001/api/dify/conversations
```

這個架構完全解決了 CORS 問題，同時保持了容器間高效通信！🚀