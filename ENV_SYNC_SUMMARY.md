# 环境配置文件同步总结

## 当前环境配置状态

### 核心配置项（所有环境共享）
```
SECRET_KEY=sk-9f73s3ljTXVcMT3Blb3ljTqtsKiGHXVcMT3BlbkFJLK7U
NEXTAUTH_SECRET=KSrmLtXxPgLedlTmgB8tHEHFxbZKcTQMAoM5cchx6X0=
NEXT_PUBLIC_DEFAULT_ADMIN_USERNAME=admin
NEXT_PUBLIC_DEFAULT_ADMIN_PASSWORD=dify12345
NEXT_PUBLIC_DIFY_API_KEY=app-PxzkiLjnjcU2w2ARj5qeflQq
NEXT_PUBLIC_ENABLE_CHAT_CITATION_AND_SUGGESTED_QUESTIONS=true
DATABASE_URL="file:./dev.db"
```

### 环境特定配置

#### 1. `.env.development` (本地开发)
```
NODE_ENV=development
PORT=3001
NEXTAUTH_URL=http://localhost:3001
API_URL=http://localhost
NEXT_PUBLIC_DIFY_API_BASE_URL=http://localhost/v1
APP_API_URL=http://api:5001
APP_WEB_URL=http://localhost:3000
FILES_URL=http://api:5001/files
NEXT_PUBLIC_API_URL=http://api:5001
NEXT_PUBLIC_AUTH_URL=http://api:5001/auth
```

#### 2. `.env.production` & `.env.docker` (生产/Docker)
```
NODE_ENV=production
PORT=3000
NEXTAUTH_URL=http://frontend.localhost:80
API_URL=http://frontend.localhost:5001
NEXT_PUBLIC_DIFY_API_BASE_URL=http://localhost/v1
```

#### 3. `.env.aws` (AWS 部署)
- 基础配置同 production
- 包含 AWS 部署注释说明
- 需要在部署时更新域名

## AWS 部署时需要更新的配置项

```bash
# 替换为实际的 AWS 域名
NEXT_PUBLIC_DIFY_API_BASE_URL=https://your-aws-domain.com/v1
NEXTAUTH_URL=https://your-aws-frontend-domain.com
API_URL=https://your-aws-api-domain.com:5001
```

## 同步状态 ✅

- [x] `.env.production` - 已同步
- [x] `.env.docker` - 已同步 
- [x] `.env.development` - 已同步
- [x] `.env.aws` - 已创建（用于 AWS 部署）

## 部署建议

1. **本地开发**: 使用 `.env.development`
2. **Docker 本地**: 使用 `.env.docker`
3. **生产环境**: 使用 `.env.production`
4. **AWS 部署**: 使用 `.env.aws` 并更新域名配置

所有核心配置已保持一致，环境特定的配置已正确分离。
