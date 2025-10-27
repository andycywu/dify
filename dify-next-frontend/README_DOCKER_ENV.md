# Dify Next Frontend Docker 環境配置指南

## 快速開始

1. **複製環境配置範例檔案**：

   ```bash
   cp .env.docker.example .env.docker
   ```

2. **編輯配置檔案**：
   開啟 `.env.docker` 並修改以下必要配置：

### 必須修改的配置項目

#### 資料庫密碼

```bash
# 將 YOUR_DB_PASSWORD 替換為您的實際資料庫密碼
DATABASE_URL=postgresql://postgres:YOUR_DB_PASSWORD@db:5432/wiki
DIFY_DATABASE_URL=postgresql://postgres:YOUR_DB_PASSWORD@db:5432/dify
```

#### 安全密鑰（生產環境必須修改）

```bash
# 生成強密碼替換以下項目：
NEXTAUTH_SECRET=YOUR_NEXTAUTH_SECRET_KEY_HERE
JWT_SECRET=YOUR_JWT_SECRET_KEY_HERE
SECRET_KEY=YOUR_SECRET_KEY_HERE
```

#### API 密鑰

```bash
# 從您的 Wiki.js 管理後台取得
WIKI_API_KEY=YOUR_WIKI_API_KEY_HERE

# 從您的 Dify 控制台取得
NEXT_PUBLIC_DIFY_API_KEY=YOUR_DIFY_API_KEY_HERE
NEXT_PUBLIC_DIFY_DATASET_KEY=YOUR_DIFY_DATASET_KEY_HERE
```

#### 管理員帳號

```bash
# 修改預設管理員密碼
NEXT_PUBLIC_DEFAULT_ADMIN_PASSWORD=YOUR_ADMIN_PASSWORD
```

## 如何取得 API 密鑰

### Wiki.js API 密鑰

1. 登入 Wiki.js 管理後台
2. 前往 "Administration" > "API Access"
3. 創建新的 API 金鑰
4. 複製生成的密鑰到 `WIKI_API_KEY`

### Dify API 密鑰

1. 登入 Dify 控制台
2. 前往您的應用設定
3. 在 "API Access" 區域取得 API 密鑰
4. 複製到對應的配置項目

## 密鑰生成建議

您可以使用以下方法生成安全的密鑰：

```bash
# 生成 32 字元隨機密鑰
openssl rand -hex 32

# 或使用 Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 注意事項

- ⚠️ **絕不要將包含真實密鑰的 `.env.docker` 檔案提交到版本控制**
- 🔒 **生產環境務必使用強密碼和隨機生成的密鑰**
- 📝 **定期更新 API 密鑰以確保安全性**

## 疑難排解

如果遇到連線問題，請檢查：

1. 資料庫密碼是否正確
2. API 密鑰是否有效
3. 服務間的網路連線是否正常

## 相關檔案

- `.env.docker.example` - 本範例檔案
- `.env.production.template` - 生產環境模板
- `docker-compose.yaml` - Docker Compose 配置
