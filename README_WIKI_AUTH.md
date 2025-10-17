# Wiki.js 認證整合 - README

## 🎯 專案目標

將 **dify-next-frontend** 和 **Wiki.js** 整合到統一的認證系統,實現:
- ✅ 單一用戶數據庫 (PostgreSQL)
- ✅ 統一的帳號管理
- ✅ 基於用戶組的權限控制
- ✅ 單點登入體驗

---

## 📋 快速開始

### 3 步驟完成整合

#### 1️⃣ 執行自動部署

```bash
cd /Users/andycyw/dify
./scripts/deploy-wiki-auth-integration.sh
```

#### 2️⃣ 運行測試驗證

```bash
./scripts/test-wiki-auth-integration.sh
```

#### 3️⃣ 測試登入

- **Wiki.js**: http://localhost:3000
- **dify-next-frontend**: http://localhost:3001

使用 Wiki.js 帳號登入兩個系統。

---

## 📁 項目結構

```
dify/
├── wiki/config/
│   └── auth-integration.js              ⭐ Wiki.js 認證 GraphQL API
│
├── dify-next-frontend/
│   ├── lib/wiki-auth-adapter.ts         ⭐ NextAuth 適配器
│   ├── pages/api/auth/[...nextauth].ts  ⭐ NextAuth 配置
│   ├── prisma/schema-postgresql.prisma  ⭐ PostgreSQL Schema
│   ├── .env.wiki-integration            ⭐ 環境變數範本
│   └── WIKI_AUTH_INTEGRATION.md         📚 完整技術文檔
│
├── docker/
│   └── docker-compose.wiki-auth.yml     ⭐ Docker Compose 配置
│
├── scripts/
│   ├── deploy-wiki-auth-integration.sh  🚀 自動部署腳本
│   └── test-wiki-auth-integration.sh    ✅ 自動測試腳本
│
├── QUICKSTART_WIKI_AUTH.md              📖 快速入門指南
├── WIKI_AUTH_INTEGRATION_SUMMARY.md     📝 完成總結
└── ARCHITECTURE_WIKI_AUTH.md            🏗️ 架構圖文檔
```

⭐ 新增文件 | 📚 文檔 | 🚀 腳本

---

## 🏗️ 系統架構

```
用戶
 ↓
dify-next-frontend (NextAuth.js)
 ↓
wiki-auth-adapter.ts
 ↓
PostgreSQL (Wiki.js 數據庫)
 ├─ users (共享)
 ├─ groups (共享)
 ├─ userGroups (共享)
 └─ dify_user_usage (專屬)
```

詳細架構請參考: [ARCHITECTURE_WIKI_AUTH.md](./ARCHITECTURE_WIKI_AUTH.md)

---

## 🔐 權限映射

| Wiki.js 用戶組      | dify-next-frontend 角色 | 權限                  |
|--------------------|------------------------|----------------------|
| `administrators`   | `admin`                | 完整管理權限          |
| `Administrators`   | `admin`                | 完整管理權限          |
| EE, ME_LCM, PWR... | `user`                 | 普通用戶權限          |
| `Guests`           | `user`                 | 訪客權限 (默認)       |

---

## 📚 文檔導航

| 文檔 | 說明 | 推薦度 |
|-----|------|--------|
| [QUICKSTART_WIKI_AUTH.md](./QUICKSTART_WIKI_AUTH.md) | 快速入門指南 | ⭐⭐⭐⭐⭐ |
| [WIKI_AUTH_INTEGRATION_SUMMARY.md](./WIKI_AUTH_INTEGRATION_SUMMARY.md) | 完成總結 | ⭐⭐⭐⭐⭐ |
| [ARCHITECTURE_WIKI_AUTH.md](./ARCHITECTURE_WIKI_AUTH.md) | 架構圖文檔 | ⭐⭐⭐⭐ |
| [dify-next-frontend/WIKI_AUTH_INTEGRATION.md](./dify-next-frontend/WIKI_AUTH_INTEGRATION.md) | 完整技術文檔 | ⭐⭐⭐⭐⭐ |

---

## 🧪 測試清單

部署後運行測試腳本會檢查:

- [x] PostgreSQL 數據庫連接
- [x] Wiki.js users 表存在
- [x] dify 專屬表創建
- [x] 容器運行狀態
- [x] HTTP 服務響應
- [x] Prisma 配置正確
- [x] 環境變數配置
- [x] 認證模組文件
- [x] 適配器文件
- [x] 用戶組表

**執行**: `./scripts/test-wiki-auth-integration.sh`

---

## 🔧 常見問題

### Q: 如何查看現有 Wiki.js 用戶?

```bash
docker exec -i docker-db-1 psql -U postgres -d wiki -c \
  'SELECT id, email, name FROM users WHERE "isSystem" = false;'
```

### Q: 登入失敗怎麼辦?

1. 確認 Wiki.js 用戶存在且啟用
2. 檢查密碼是否正確
3. 查看容器日誌: `docker logs dify-next-frontend --tail 50`

### Q: 如何重新部署?

```bash
./scripts/deploy-wiki-auth-integration.sh --force
```

### Q: 如何查看詳細日誌?

```bash
# Wiki.js 日誌
docker logs dify-wiki -f

# dify-next-frontend 日誌
docker logs dify-next-frontend -f

# PostgreSQL 日誌
docker logs docker-db-1 -f
```

---

## 📞 技術支援

### 故障排除流程

1. **運行測試腳本**
   ```bash
   ./scripts/test-wiki-auth-integration.sh
   ```

2. **查看容器狀態**
   ```bash
   docker-compose ps
   ```

3. **檢查日誌**
   ```bash
   docker logs dify-wiki --tail 100
   docker logs dify-next-frontend --tail 100
   ```

4. **參考文檔**
   - [故障排除指南](./dify-next-frontend/WIKI_AUTH_INTEGRATION.md#故障排除)

---

## 🎓 相關技術

### 使用的技術棧

- **認證**: NextAuth.js, JWT, bcrypt
- **數據庫**: PostgreSQL, Prisma ORM
- **後端**: Wiki.js (Node.js), Flask (Python)
- **前端**: Next.js, React
- **容器化**: Docker, Docker Compose

### GraphQL API

Wiki.js 提供完整的認證 GraphQL API:

```graphql
mutation {
  authLogin(email: "user@example.com", password: "password") {
    success
    token
    user {
      id
      email
      name
      groups {
        id
        name
      }
    }
  }
}
```

完整 API 參考: [WIKI_AUTH_INTEGRATION.md](./dify-next-frontend/WIKI_AUTH_INTEGRATION.md#wiki-js-graphql-認證-api)

---

## 🚀 進階使用

### 自定義權限映射

編輯 `dify-next-frontend/lib/wiki-auth-adapter.ts`:

```typescript
export function getUserRole(groups: Array<{ id: number; name: string }>): string {
  // 自定義角色判斷邏輯
  if (groups.some(g => g.name === 'administrators')) {
    return 'admin'
  }
  if (groups.some(g => g.name === 'PowerUsers')) {
    return 'power_user'  // 新增角色
  }
  return 'user'
}
```

### 添加用戶管理界面

在 dify-next-frontend 中可以直接調用 Prisma 或 GraphQL API:

```typescript
import { prisma } from '@/lib/prisma'

// 獲取所有用戶
const users = await prisma.user.findMany({
  include: { userGroups: { include: { group: true } } }
})

// 創建新用戶
await prisma.user.create({
  data: {
    email: 'newuser@example.com',
    password: await bcrypt.hash('password', 10),
    name: 'New User',
    // ...
  }
})
```

---

## 📈 未來規劃

- [ ] OAuth2/OIDC 支持
- [ ] 多因素認證 (2FA)
- [ ] LDAP/AD 整合
- [ ] 單點登出 (SLO)
- [ ] 審計日誌
- [ ] 密碼策略配置
- [ ] 用戶自助註冊

---

## 🤝 貢獻

歡迎提交 Issue 和 Pull Request!

---

## 📄 授權

本專案遵循與主專案相同的授權協議。

---

## 📊 版本信息

- **版本**: 1.0.0
- **發布日期**: 2025-10-15
- **狀態**: ✅ 準備就緒
- **作者**: GitHub Copilot

---

## 🎉 快速鏈接

- [快速開始](./QUICKSTART_WIKI_AUTH.md) - 3 步驟完成整合
- [完整文檔](./dify-next-frontend/WIKI_AUTH_INTEGRATION.md) - 技術細節
- [架構圖](./ARCHITECTURE_WIKI_AUTH.md) - 系統架構
- [部署腳本](./scripts/deploy-wiki-auth-integration.sh) - 自動部署
- [測試腳本](./scripts/test-wiki-auth-integration.sh) - 自動測試

---

**🚀 現在就開始**: `./scripts/deploy-wiki-auth-integration.sh`
