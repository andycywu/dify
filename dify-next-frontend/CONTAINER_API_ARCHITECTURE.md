# 🚀 容器 API 調用架構說明

## 📋 架構原則

### 🏠 容器間內部調用
**使用 Docker 服務名，確保容器網路內部通信高效且安全**

```bash
# 容器內部服務通信地址
API_URL=http://api:5001                    # dify-api 服務
DATABASE_URL=postgresql://user:pass@db:5432/wiki  # PostgreSQL 資料庫
WIKI_GRAPHQL_URL=http://wiki:3000/graphql  # Wiki.js GraphQL API
```

### 🌍 瀏覽器外部調用
**瀏覽器端必須使用可公開訪問的地址**

```bash
# 開發環境（本地）
NEXT_PUBLIC_API_URL=http://localhost/api
NEXT_PUBLIC_DIFY_API_BASE_URL=http://localhost/api/v1
NEXTAUTH_URL=http://localhost

# 生產環境（需修改域名）
NEXT_PUBLIC_API_URL=https://your-domain.com/api
NEXT_PUBLIC_DIFY_API_BASE_URL=https://your-domain.com/api/v1
NEXTAUTH_URL=https://your-domain.com
```

### 🤖 外部服務調用
**Ollama 運行在 Docker 外部，容器內使用 host.docker.internal 訪問**

```bash
# 本地 Ollama 服務（端口 11434）
OLLAMA_BASE_URL=http://host.docker.internal:11434
```

## 🔧 環境文件配置

### 統一的容器間調用配置
**所有環境文件（.env.docker、.env.local、.env.production、.env.production.template）中的容器間調用配置完全一致：**

```bash
# 容器間內部通信（在所有環境中保持一致）
API_URL=http://api:5001
DATABASE_URL=postgresql://postgres:PASSWORD@db:5432/wiki
WIKI_GRAPHQL_URL=http://wiki:3000/graphql
OLLAMA_BASE_URL=http://host.docker.internal:11434
```

### 環境差異配置
**只有瀏覽器端外部訪問地址和密鑰在不同環境中有差異：**

#### 開發環境：`.env.docker` / `.env.local`
```bash
# 瀏覽器端外部訪問
NEXT_PUBLIC_API_URL=http://localhost/api
NEXT_PUBLIC_DIFY_API_BASE_URL=http://localhost/api/v1
NEXTAUTH_URL=http://localhost

# 開發用密鑰
NEXTAUTH_SECRET=dev-nextauth-secret-key
WIKI_API_KEY=eyJhbGciOiJSUzI1NiIs... (開發密鑰)
```

#### 生產環境：`.env.production`
```bash
# 瀏覽器端外部訪問（部署時修改域名）
NEXT_PUBLIC_API_URL=https://your-domain.com/api
NEXT_PUBLIC_DIFY_API_BASE_URL=https://your-domain.com/api/v1
NEXTAUTH_URL=https://your-domain.com

# 生產用密鑰（部署時替換）
NEXTAUTH_SECRET=PRODUCTION-SECURE-SECRET
WIKI_API_KEY=PRODUCTION-WIKI-API-KEY
```

## 🚀 部署步驟

### 1. 準備生產環境配置
```bash
# 複製模板
cp .env.production.template .env.production

# 編輯生產配置
# 替換 YOUR_PRODUCTION_DOMAIN.com 為實際域名
# 替換所有 PRODUCTION-*-SECRET 為安全密鑰
```

### 2. 更新 Docker Compose
```bash
# 修改 docker-compose.yaml 中的 ENV_FILE 參數
build:
  context: ../dify-next-frontend
  args:
    ENV_FILE: .env.production  # 改為生產配置
```

### 3. 部署
```bash
docker-compose build dify-next-frontend
docker-compose up -d
```

## 📊 調用流程圖

```
瀏覽器 → Nginx (localhost:80) → dify-next-frontend (容器內 :3000)
                ↓
         dify-api (api:5001) ← 容器間內部調用
                ↓
         PostgreSQL (db:5432) ← 容器間內部調用
                ↓
         Wiki.js (wiki:3000) ← 容器間內部調用

dify-next-frontend → host.docker.internal:11434 → 本地 Ollama
```

## ⚠️ 重要注意事項

1. **容器間調用**：永遠使用 Docker 服務名，不使用 localhost
2. **瀏覽器調用**：必須使用可公開訪問的地址（localhost 或域名）
3. **安全密鑰**：生產環境必須替換所有 DUMMY 值
4. **Ollama 特殊性**：運行在 Docker 外部，使用 host.docker.internal 訪問

## 🔍 故障排除

### 檢查容器間連通性
```bash
# 從 dify-next-frontend 容器測試連接到 api
docker exec docker-dify-next-frontend-1 wget -qO- http://api:5001/health

# 測試資料庫連接
docker exec docker-dify-next-frontend-1 pg_isready -h db -p 5432
```

### 檢查環境變數
```bash
# 查看容器內環境變數
docker exec docker-dify-next-frontend-1 env | grep -E "(API_URL|NEXT_PUBLIC)"
```