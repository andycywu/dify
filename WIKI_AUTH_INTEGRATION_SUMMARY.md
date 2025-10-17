# Wiki.js 與 dify-next-frontend 認證整合 - 完成總結

## 🎉 整合完成!

已成功創建 **Wiki.js 統一認證中心** 方案,實現 dify-next-frontend 和 Wiki.js 的帳號統一管理。

---

## 📦 已創建的文件

### 核心組件

1. **`/wiki/config/auth-integration.js`**
   - Wiki.js GraphQL 認證擴展模組
   - 提供完整的用戶管理 API (登入、創建、更新、刪除等)
   - 支持 JWT token 驗證

2. **`/dify-next-frontend/lib/wiki-auth-adapter.ts`**
   - NextAuth 與 Wiki.js 的適配器
   - 封裝用戶操作函數
   - 處理用戶組到角色的映射

3. **`/dify-next-frontend/pages/api/auth/[...nextauth].ts`**
   - 已更新為使用 Wiki.js 認證
   - 集成 wiki-auth-adapter
   - 保存用戶組信息到 session

### 配置文件

4. **`/dify-next-frontend/prisma/schema-postgresql.prisma`**
   - PostgreSQL 版本的 Prisma schema
   - 映射 Wiki.js users、groups、userGroups 表
   - 添加 dify 專屬表 (dify_user_usage, dify_general)

5. **`/dify-next-frontend/.env.wiki-integration`**
   - 環境變數範本
   - PostgreSQL 連接配置
   - JWT 和 NextAuth 配置

6. **`/docker/docker-compose.wiki-auth.yml`**
   - Docker Compose override 配置
   - 整合環境變數設定
   - 掛載認證模組

### 部署腳本

7. **`/scripts/deploy-wiki-auth-integration.sh`** ⭐
   - **一鍵自動部署腳本**
   - 檢查先決條件
   - 創建數據庫表
   - 配置所有組件
   - 重啟服務

8. **`/dify-next-frontend/migrate-to-wiki-auth.sh`**
   - 數據庫遷移腳本
   - SQLite → PostgreSQL
   - 備份現有數據

9. **`/scripts/test-wiki-auth-integration.sh`** ⭐
   - **自動化測試腳本**
   - 12 項完整測試
   - 驗證整合成功

### 文檔

10. **`/dify-next-frontend/WIKI_AUTH_INTEGRATION.md`**
    - 完整技術文檔
    - 架構設計說明
    - API 參考
    - 故障排除指南

11. **`/QUICKSTART_WIKI_AUTH.md`** ⭐
    - **快速入門指南**
    - 3 步驟完成整合
    - 常見問題解答

---

## 🚀 現在可以開始部署!

### 快速部署 (推薦)

```bash
cd /Users/andycyw/dify
./scripts/deploy-wiki-auth-integration.sh
```

### 驗證整合

```bash
./scripts/test-wiki-auth-integration.sh
```

### 測試登入

1. Wiki.js: http://localhost:3000
2. dify-next-frontend: http://localhost:3001

---

## ✨ 功能特性

### ✅ 已實現

- **統一用戶數據庫**: 單一 PostgreSQL 數據庫存儲所有用戶
- **共享用戶表**: dify-next-frontend 直接使用 Wiki.js users 表
- **用戶組權限**: 基於 Wiki.js 用戶組判斷 dify 角色
- **密碼加密**: bcrypt 加密,兩邊一致
- **JWT 認證**: NextAuth.js 生成 JWT token
- **Session 管理**: 7 天有效期
- **GraphQL API**: Wiki.js 提供完整用戶管理 API
- **自動部署**: 一鍵部署腳本
- **自動測試**: 12 項測試驗證

### 🔄 用戶操作流程

```
用戶輸入帳密
     ↓
dify-next-frontend (NextAuth)
     ↓
wiki-auth-adapter.ts (驗證)
     ↓
PostgreSQL (users 表)
     ↓
返回用戶信息 + 用戶組
     ↓
生成 JWT session
     ↓
用戶登入成功
```

### 🔐 權限映射

| Wiki.js 用戶組     | dify 角色  | 說明           |
|-------------------|-----------|----------------|
| administrators    | admin     | 完整管理權限    |
| Administrators    | admin     | 完整管理權限    |
| EE, ME_LCM, PWR, SW, PJM | user | 普通用戶權限 |
| Guests            | user      | 訪客權限        |

---

## 📊 數據庫結構

### 共享表 (Wiki.js 原生)

```
users (id, email, name, password, isActive, ...)
  ↓ 多對多
userGroups (id, userId, groupId)
  ↓ 多對多
groups (id, name, permissions, ...)
```

### dify 專屬表

```
dify_user_usage (id, userId, date, tokenUsage, billing)
dify_general (id, key, value)
```

---

## 🎯 下一步建議

### 立即可做

1. **執行部署腳本**: `./scripts/deploy-wiki-auth-integration.sh`
2. **運行測試**: `./scripts/test-wiki-auth-integration.sh`
3. **測試登入**: 使用 Wiki.js 帳號登入 dify-next-frontend

### 後續增強 (可選)

1. **完善權限控制**: 
   - 在 dify-next-frontend 中根據用戶組實現更細緻的權限
   - 添加頁面級別的訪問控制

2. **用戶管理界面**:
   - 在 dify-next-frontend 添加用戶管理頁面
   - 直接調用 Wiki.js GraphQL API 管理用戶

3. **OAuth2/OIDC**:
   - 未來可將 Wiki.js 配置為 OAuth2 Provider
   - 支持更多第三方服務整合

4. **審計日誌**:
   - 記錄所有登入、登出操作
   - 追蹤用戶行為

5. **密碼策略**:
   - 強制密碼複雜度
   - 定期修改密碼提醒
   - 多因素認證 (2FA)

---

## 📚 相關文檔鏈接

- [完整技術文檔](./dify-next-frontend/WIKI_AUTH_INTEGRATION.md)
- [快速入門指南](./QUICKSTART_WIKI_AUTH.md)
- [部署腳本](./scripts/deploy-wiki-auth-integration.sh)
- [測試腳本](./scripts/test-wiki-auth-integration.sh)

---

## 🔧 技術細節

### 認證流程

1. 用戶在 dify-next-frontend 輸入帳密
2. NextAuth CredentialsProvider 調用 `verifyUserCredentials()`
3. wiki-auth-adapter 查詢 PostgreSQL users 表
4. bcrypt 驗證密碼
5. 查詢用戶組 (userGroups + groups)
6. 判斷角色 (administrators → admin, 其他 → user)
7. 生成 JWT token (包含 userId, email, role, groups)
8. 返回 session 給前端
9. 前端保存 session,後續請求攜帶 JWT

### 安全性

- ✅ 密碼使用 bcrypt 加密 (10 rounds)
- ✅ JWT token 7 天過期
- ✅ Session 只包含必要信息 (不含密碼)
- ✅ 數據庫使用參數化查詢 (防 SQL 注入)
- ✅ HTTPS 傳輸 (生產環境建議)

### 性能優化

- 使用 Prisma ORM 提供查詢優化
- 用戶組信息緩存在 JWT token 中
- PostgreSQL 索引優化 (userId, email)
- 連接池管理

---

## 🐛 故障排除快速參考

| 問題 | 檢查 | 解決 |
|-----|------|-----|
| 無法連接數據庫 | `docker ps \| grep postgres` | `docker-compose up -d db` |
| Prisma 錯誤 | 檢查 schema.prisma | `npx prisma generate` |
| 登入失敗 | 檢查 Wiki.js 用戶 | 確認密碼正確 |
| 服務無響應 | 查看容器日誌 | `docker-compose restart` |

詳細故障排除請參考: [WIKI_AUTH_INTEGRATION.md](./dify-next-frontend/WIKI_AUTH_INTEGRATION.md#故障排除)

---

## 📞 需要幫助?

1. 查看快速入門: [QUICKSTART_WIKI_AUTH.md](./QUICKSTART_WIKI_AUTH.md)
2. 運行測試腳本: `./scripts/test-wiki-auth-integration.sh`
3. 查看容器日誌: `docker logs dify-wiki` 或 `docker logs dify-next-frontend`
4. 參考完整文檔: [WIKI_AUTH_INTEGRATION.md](./dify-next-frontend/WIKI_AUTH_INTEGRATION.md)

---

## ✅ 整合檢查清單

在部署前確認:

- [ ] PostgreSQL 容器運行中
- [ ] Wiki.js 已初始化
- [ ] 至少有一個 Wiki.js 用戶 (非 Guest)
- [ ] Node.js 和 npm 已安裝
- [ ] Docker 和 docker-compose 可用

部署後驗證:

- [ ] 執行測試腳本全部通過
- [ ] 可以訪問 http://localhost:3000
- [ ] 可以訪問 http://localhost:3001
- [ ] 使用 Wiki.js 帳號登入 dify-next-frontend 成功
- [ ] 用戶信息顯示正確
- [ ] 用戶組權限映射正確

---

**🎊 恭喜! Wiki.js 認證整合方案已準備完成!**

**下一步**: 執行 `./scripts/deploy-wiki-auth-integration.sh` 開始部署!

---

**版本**: 1.0.0  
**完成日期**: 2025-10-15  
**作者**: GitHub Copilot  
**狀態**: ✅ 準備就緒
