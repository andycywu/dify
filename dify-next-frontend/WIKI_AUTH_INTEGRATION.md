# Wiki.js 認證整合文檔

## 📋 概述

本整合方案將 **dify-next-frontend** 和 **Wiki.js** 統一到同一個認證系統,實現:
- ✅ 單一用戶數據庫 (PostgreSQL)
- ✅ 統一的用戶管理
- ✅ 基於用戶組的權限控制
- ✅ 單點登入體驗

## 🏗️ 架構設計

```
┌─────────────────────────────────────────────────────────────┐
│                     用戶 (User)                              │
└───────────────┬──────────────────────┬──────────────────────┘
                │                      │
                ▼                      ▼
    ┌─────────────────────┐  ┌──────────────────────┐
    │ dify-next-frontend  │  │      Wiki.js         │
    │   (Next.js App)     │  │  (Wiki Platform)     │
    └──────────┬──────────┘  └──────────┬───────────┘
               │                        │
               │   NextAuth.js          │  內建認證
               │   (JWT Session)        │
               └───────┬────────────────┘
                       │
                       ▼
          ┌────────────────────────────┐
          │   PostgreSQL Database      │
          │                            │
          │  ┌──────────────────────┐  │
          │  │   users (共享)       │  │
          │  │   groups (共享)      │  │
          │  │   userGroups (共享)  │  │
          │  └──────────────────────┘  │
          │  ┌──────────────────────┐  │
          │  │   dify_user_usage    │  │ (dify 專屬)
          │  │   dify_general       │  │ (dify 專屬)
          │  └──────────────────────┘  │
          └────────────────────────────┘
```

## 📊 數據庫結構

### Wiki.js 原生表 (共享)

#### users 表
```sql
- id (int) PRIMARY KEY
- email (varchar 255) UNIQUE
- name (varchar 255)
- password (varchar 255) - bcrypt 加密
- isActive (boolean)
- isSystem (boolean)
- createdAt, updatedAt (varchar 255)
```

#### groups 表
```sql
- id (int) PRIMARY KEY
- name (varchar 255)
- permissions (json)
- pageRules (json)
```

#### userGroups 表 (多對多關聯)
```sql
- id (int) PRIMARY KEY
- userId (int) FK -> users.id
- groupId (int) FK -> groups.id
```

### dify-next-frontend 專屬表

#### dify_user_usage 表
```sql
- id (uuid) PRIMARY KEY
- userId (int) FK -> users.id
- date (timestamp)
- tokenUsage (int)
- billing (double)
```

## 🔧 整合組件

### 1. Wiki.js GraphQL 認證 API

**文件**: `/wiki/config/auth-integration.js`

提供以下 GraphQL API:

#### Queries
- `authVerifyToken(token: String!)` - 驗證 JWT token
- `authGetUser(email: String!)` - 獲取用戶信息
- `authGetAllUsers` - 獲取所有用戶

#### Mutations
- `authLogin(email, password)` - 用戶登入
- `authCreateUser(email, password, name, groups)` - 創建用戶
- `authUpdateUser(id, ...)` - 更新用戶
- `authDeleteUser(id)` - 刪除用戶
- `authChangePassword(email, oldPassword, newPassword)` - 修改密碼

### 2. dify-next-frontend 適配器

**文件**: `/dify-next-frontend/lib/wiki-auth-adapter.ts`

提供函數:
- `verifyUserCredentials(email, password)` - 驗證用戶憑證
- `getUserById(userId)` - 獲取用戶 (by ID)
- `getUserByEmail(email)` - 獲取用戶 (by Email)
- `createUser(email, password, name, groupIds)` - 創建用戶
- `updateUser(userId, updates)` - 更新用戶
- `deleteUser(userId)` - 刪除用戶
- `getUserRole(groups)` - 判斷用戶角色

### 3. NextAuth 配置

**文件**: `/dify-next-frontend/pages/api/auth/[...nextauth].ts`

使用 CredentialsProvider 連接 Wiki.js 用戶表:
- 驗證邏輯委派給 `wiki-auth-adapter`
- JWT session 保存用戶 ID、角色、用戶組
- 7 天有效期

## 🚀 部署步驟

### 前置條件

1. PostgreSQL 容器運行中
2. Wiki.js 已初始化並有管理員帳號
3. dify-next-frontend 專案存在

### 步驟 1: 配置 Wiki.js

編輯 Wiki.js 配置,啟用認證整合模組:

```bash
# 在 docker-compose.yml 中添加環境變數
environment:
  JWT_SECRET: "your-secret-key"
  JWT_EXPIRES_IN: "7d"
```

複製認證模組:
```bash
cp /path/to/auth-integration.js /wiki/config/
```

在 Wiki.js 管理界面載入模組 (或重啟容器自動載入)。

### 步驟 2: 遷移 dify-next-frontend

執行遷移腳本:

```bash
cd /Users/andycyw/dify/dify-next-frontend
chmod +x migrate-to-wiki-auth.sh
./migrate-to-wiki-auth.sh
```

腳本會:
1. ✅ 檢查 PostgreSQL 連接
2. ✅ 創建 dify 專屬表
3. ✅ 備份現有 SQLite 數據庫
4. ✅ 更新 Prisma schema
5. ✅ 生成 Prisma Client

### 步驟 3: 配置環境變數

```bash
cd /Users/andycyw/dify/dify-next-frontend
cp .env.wiki-integration .env
```

編輯 `.env`,確保:
```env
DATABASE_URL="postgresql://postgres:difyai123456@db:5432/wiki"
NEXTAUTH_SECRET="your-nextauth-secret-key"
JWT_SECRET="same-as-wiki-js-jwt-secret"
```

### 步驟 4: 重啟服務

```bash
cd /Users/andycyw/dify/docker
docker-compose restart dify-next-frontend wiki
```

### 步驟 5: 驗證整合

1. **訪問 Wiki.js** (http://localhost:3000)
   - 使用現有管理員帳號登入
   - 確認用戶信息正確

2. **訪問 dify-next-frontend** (http://localhost:3001)
   - 使用相同帳號登入
   - 應該成功登入並顯示用戶信息

3. **測試用戶管理**
   - 在 Wiki.js 創建新用戶
   - 在 dify-next-frontend 應該能用新用戶登入

## 🔒 權限映射

### Wiki.js 用戶組 → dify-next-frontend 角色

| Wiki.js Group      | dify Role  | 權限說明                        |
|-------------------|------------|--------------------------------|
| `administrators`  | `admin`    | 完整管理權限                    |
| `Administrators`  | `admin`    | 完整管理權限 (別名)             |
| 其他任何組          | `user`     | 普通用戶權限                    |
| `Guests`          | `user`     | 訪客權限 (默認組)               |

### 用戶組權限控制

在 `wiki-auth-adapter.ts` 中的 `getUserRole()` 函數控制角色映射:

```typescript
export function getUserRole(groups: Array<{ id: number; name: string }>): string {
  if (groups.some(g => g.name === 'administrators' || g.name === 'Administrators')) {
    return 'admin'
  }
  return 'user'
}
```

## 📝 使用示例

### 在 dify-next-frontend 中使用

```typescript
import { useAuth } from '@/contexts/AuthContext'

export default function MyComponent() {
  const { user, isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return <div>請先登入</div>
  }

  return (
    <div>
      <p>歡迎, {user.name}</p>
      <p>Email: {user.email}</p>
      <p>角色: {user.role}</p>
      <p>用戶組: {user.groups?.map(g => g.name).join(', ')}</p>
    </div>
  )
}
```

### 調用 Wiki.js GraphQL API (可選)

如果需要從 dify-next-frontend 直接操作用戶:

```typescript
import { GraphQLClient } from 'graphql-request'

const client = new GraphQLClient(process.env.WIKI_GRAPHQL_URL!, {
  headers: {
    Authorization: `Bearer ${process.env.WIKI_API_KEY}`
  }
})

// 創建用戶
const mutation = `
  mutation CreateUser($email: String!, $password: String!, $name: String!) {
    authCreateUser(email: $email, password: $password, name: $name) {
      success
      message
      user {
        id
        email
        name
      }
    }
  }
`

const result = await client.request(mutation, {
  email: 'newuser@example.com',
  password: 'password123',
  name: 'New User'
})
```

## 🧪 測試清單

- [ ] Wiki.js 管理員帳號可以登入 dify-next-frontend
- [ ] 在 Wiki.js 創建新用戶,該用戶可登入 dify-next-frontend
- [ ] 用戶組權限正確映射到角色
- [ ] 密碼修改在兩邊都生效
- [ ] 用戶停用後無法登入
- [ ] JWT token 正確驗證
- [ ] Session 在 7 天內有效

## 🔧 故障排除

### 問題 1: 無法連接 PostgreSQL

**症狀**: 登入時出現數據庫連接錯誤

**解決**:
```bash
# 檢查數據庫容器
docker ps | grep postgres

# 檢查連接
docker exec -i docker-db-1 psql -U postgres -c "SELECT version();"

# 確認環境變數
cat /Users/andycyw/dify/dify-next-frontend/.env | grep DATABASE_URL
```

### 問題 2: Prisma Client 錯誤

**症狀**: `PrismaClientInitializationError`

**解決**:
```bash
cd /Users/andycyw/dify/dify-next-frontend
npx prisma generate
npm run build
```

### 問題 3: 密碼驗證失敗

**症狀**: 正確密碼無法登入

**檢查**:
- Wiki.js 密碼是否使用 bcrypt 加密
- bcryptjs 版本是否一致 (建議 ^2.4.3)
- 數據庫中密碼欄位是否完整

### 問題 4: Wiki.js 模組未載入

**症狀**: GraphQL API 不存在

**解決**:
```bash
# 檢查模組文件
ls -la /Users/andycyw/dify/wiki/config/auth-integration.js

# 重啟 Wiki.js
docker-compose restart wiki

# 查看日誌
docker logs dify-wiki --tail 100 | grep "Authentication Integration"
```

## 📚 相關文件

- `/wiki/config/auth-integration.js` - Wiki.js 認證模組
- `/dify-next-frontend/lib/wiki-auth-adapter.ts` - NextAuth 適配器
- `/dify-next-frontend/pages/api/auth/[...nextauth].ts` - NextAuth 配置
- `/dify-next-frontend/prisma/schema-postgresql.prisma` - Prisma Schema
- `/dify-next-frontend/.env.wiki-integration` - 環境變數範本

## 🎯 下一步

整合完成後,您可以:

1. **統一用戶管理**: 在 Wiki.js 管理界面管理所有用戶
2. **實現 SSO**: 未來可擴展到更多服務
3. **權限細化**: 根據用戶組實現更精細的權限控制
4. **審計日誌**: 記錄所有認證和授權操作

## 📞 支援

如有問題,請檢查:
- Docker 日誌: `docker logs dify-next-frontend`
- Wiki.js 日誌: `docker logs dify-wiki`
- PostgreSQL 日誌: `docker logs docker-db-1`

---

**版本**: 1.0.0  
**更新日期**: 2025-10-15  
**作者**: GitHub Copilot
