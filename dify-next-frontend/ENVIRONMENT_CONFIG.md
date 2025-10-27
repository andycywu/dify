# Dify Next Frontend 環境配置說明

## 📋 配置文件結構

### 環境文件說明

- **`.env.local`** - 本地開發環境
- **`.env.docker`** - Docker 容器環境  
- **`.env.production`** - 生產環境模板

## 🔧 配置原則

### 1. URL與PORT分開定義
- `HOST/PROTOCOL/PORT` 分別定義，避免硬編碼完整URL
- 支援靈活的域名和端口配置

### 2. 安全密鑰管理
- 所有環境文件中都使用 DUMMY 值
- 生產環境部署時必須手動替換所有標記為 `REPLACE-IN-PRODUCTION` 的值
- 每個 DUMMY 密鑰都有明確的註釋說明

### 3. 容器內外變數分離
- **容器內部變數**: 用於容器內部服務間通信（如 `API_URL=http://api:5001`）
- **容器外部變數**: 用於瀏覽器訪問（如 `NEXT_PUBLIC_*` 變數）

## 🚀 部署步驟

### 開發環境
```bash
# 使用本地環境配置
cp .env.local .env
npm run dev
```

### Docker 環境
```bash
# 已自動使用 .env.docker 配置
docker-compose up dify-next-frontend -d
```

### 生產環境部署

1. **複製生產環境模板**
   ```bash
   cp .env.production .env
   ```

2. **必須手動替換的安全密鑰**
   ```bash
   # 生成安全密鑰
   openssl rand -base64 32  # 生成 NextAuth 密鑰
   openssl rand -base64 32  # 生成 JWT 密鑰  
   openssl rand -base64 32  # 生成應用密鑰
   ```

3. **修改 .env 文件中的以下項目**
   - `NEXT_PUBLIC_HOST` - 您的生產域名
   - `DATABASE_URL` - 生產資料庫連接字串
   - `NEXTAUTH_SECRET` - NextAuth 安全密鑰
   - `JWT_SECRET` - JWT 安全密鑰
   - `SECRET_KEY` - 應用安全密鑰
   - `WIKI_API_KEY` - Wiki.js API 密鑰
   - `NEXT_PUBLIC_DIFY_API_KEY` - Dify API 密鑰

4. **移除或設置安全的管理員帳號**
   ```bash
   # 清空預設管理員帳號（推薦）
   NEXT_PUBLIC_DEFAULT_ADMIN_USERNAME=
   NEXT_PUBLIC_DEFAULT_ADMIN_PASSWORD=
   ```

## ⚠️ 安全注意事項

### 必須替換的 DUMMY 值
所有包含以下模式的值都必須在生產環境中替換：
- `DUMMY-*-REPLACE-IN-PRODUCTION`
- `PRODUCTION-*-REPLACE-WITH-SECURE-KEY`
- `YOUR_PRODUCTION_DOMAIN`
- `PRODUCTION_DB_*`

### 密鑰生成建議
```bash
# NextAuth 密鑰
openssl rand -base64 32

# JWT 密鑰  
openssl rand -hex 64

# 通用安全密鑰
openssl rand -base64 48
```

## 🌐 訪問地址

### 開發環境
- http://localhost:3000

### Docker 環境  
- http://localhost:3001

### 生產環境
- https://YOUR_PRODUCTION_DOMAIN

## 📊 變數說明

### 容器內部變數
| 變數名 | 說明 | 示例 |
|--------|------|------|
| `API_URL` | 內部API地址 | `http://api:5001` |
| `DATABASE_URL` | 資料庫連接 | `postgresql://...` |
| `WIKI_GRAPHQL_URL` | Wiki內部地址 | `http://wiki:3002/graphql` |

### 容器外部變數  
| 變數名 | 說明 | 示例 |
|--------|------|------|
| `NEXT_PUBLIC_API_URL` | 瀏覽器API地址 | `http://localhost/api` |
| `NEXTAUTH_URL` | 認證回調地址 | `http://localhost` |
| `NEXT_PUBLIC_HOST` | 外部主機名 | `localhost` |

### 安全變數
| 變數名 | 說明 | 生成方式 |
|--------|------|----------|
| `NEXTAUTH_SECRET` | NextAuth密鑰 | `openssl rand -base64 32` |
| `JWT_SECRET` | JWT密鑰 | `openssl rand -hex 64` |
| `SECRET_KEY` | 應用密鑰 | `openssl rand -base64 48` |

## 🔄 重新構建

修改配置後重新構建容器：
```bash
# 停止並移除舊容器
docker-compose stop dify-next-frontend
docker-compose rm -f dify-next-frontend

# 重新構建並啟動
docker-compose build --no-cache dify-next-frontend
docker-compose up dify-next-frontend -d
```