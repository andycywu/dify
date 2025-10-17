# Wiki.js 認證整合 - 快速入門

## 🚀 3 步驟完成整合

### 步驟 1: 執行自動部署腳本

```bash
cd /Users/andycyw/dify
./scripts/deploy-wiki-auth-integration.sh
```

這個腳本會自動:
- ✅ 檢查所有先決條件
- ✅ 創建必要的數據庫表
- ✅ 配置 Prisma 連接 PostgreSQL
- ✅ 更新環境變數
- ✅ 生成 Prisma Client
- ✅ 重啟服務

### 步驟 2: 運行測試腳本

```bash
./scripts/test-wiki-auth-integration.sh
```

驗證所有組件正常工作。

### 步驟 3: 測試登入

1. **訪問 Wiki.js**: http://localhost:3000
   - 查看現有用戶 (或創建測試用戶)
   
2. **訪問 dify-next-frontend**: http://localhost:3001
   - 使用 Wiki.js 帳號登入
   - 驗證用戶信息和權限

---

## 📝 現有 Wiki.js 用戶

查看當前 Wiki.js 用戶:

```bash
docker exec -i docker-db-1 psql -U postgres -d wiki -c \
  'SELECT id, email, name, "isActive" FROM users WHERE "isSystem" = false;'
```

---

## 🔧 手動部署 (如果需要)

如果自動腳本失敗,可以手動執行:

### 1. 數據庫遷移

```bash
cd /Users/andycyw/dify/dify-next-frontend
./migrate-to-wiki-auth.sh
```

### 2. 更新環境變數

```bash
cp .env.wiki-integration .env
```

編輯 `.env`:
```env
DATABASE_URL="postgresql://postgres:difyai123456@db:5432/wiki"
NEXTAUTH_SECRET="your-secret-key"
JWT_SECRET="your-jwt-secret"
```

### 3. 生成 Prisma Client

```bash
npx prisma generate
```

### 4. 重啟服務

```bash
cd /Users/andycyw/dify/docker
docker-compose -f docker-compose.yaml -f docker-compose.wiki-auth.yml restart wiki dify-next-frontend
```

---

## ✅ 驗證清單

- [ ] PostgreSQL 容器運行中
- [ ] Wiki.js 容器運行中
- [ ] dify-next-frontend 容器運行中
- [ ] 數據庫表創建成功 (`dify_user_usage`, `dify_general`)
- [ ] Prisma schema 使用 PostgreSQL
- [ ] `.env` 配置正確
- [ ] Wiki.js 認證模組已載入
- [ ] 可以訪問 http://localhost:3000
- [ ] 可以訪問 http://localhost:3001
- [ ] 使用 Wiki.js 帳號成功登入 dify-next-frontend

---

## 🔍 故障排除

### 問題: 無法連接數據庫

```bash
# 檢查 PostgreSQL 狀態
docker ps | grep postgres

# 測試連接
docker exec -i docker-db-1 psql -U postgres -c "SELECT version();"
```

### 問題: Prisma Client 錯誤

```bash
cd /Users/andycyw/dify/dify-next-frontend
npx prisma generate
npm run build
```

### 問題: 服務無法訪問

```bash
# 查看日誌
docker logs dify-wiki --tail 100
docker logs dify-next-frontend --tail 100

# 重啟服務
cd /Users/andycyw/dify/docker
docker-compose restart wiki dify-next-frontend
```

### 問題: Wiki.js 模組未載入

```bash
# 檢查模組文件
ls -la /Users/andycyw/dify/wiki/config/auth-integration.js

# 查看 Wiki.js 日誌
docker logs dify-wiki 2>&1 | grep -i "auth"
```

---

## 📚 詳細文檔

完整文檔請參考:
- [WIKI_AUTH_INTEGRATION.md](../dify-next-frontend/WIKI_AUTH_INTEGRATION.md)

---

## 🎯 登入測試

### 使用現有管理員帳號

如果您已經有 Wiki.js 管理員帳號:

1. Email: `andycy.wu@tpv-tech.com` (或您的管理員 email)
2. 密碼: (您的 Wiki.js 密碼)

### 創建新測試用戶

在 Wiki.js 管理界面:

1. 訪問 http://localhost:3000
2. 登入管理員帳號
3. 前往 "Administration" > "Users"
4. 點擊 "New User"
5. 填寫信息並保存
6. 使用新帳號登入 dify-next-frontend

---

## 🔐 權限說明

| Wiki.js 用戶組      | dify-next-frontend 角色 |
|--------------------|------------------------|
| `administrators`   | `admin`                |
| `Administrators`   | `admin`                |
| 其他任何組          | `user`                 |

---

## 📞 支援

如有問題:

1. 運行測試腳本: `./scripts/test-wiki-auth-integration.sh`
2. 查看容器日誌
3. 檢查環境變數配置
4. 參考完整文檔

---

**版本**: 1.0.0  
**更新**: 2025-10-15
