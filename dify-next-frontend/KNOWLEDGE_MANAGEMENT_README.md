# 知識庫管理功能 / Knowledge Base Management

## 概述 / Overview

這個功能為具有admin/superadmin權限的用戶提供了完整的Dify知識庫管理界面，包括：

This feature provides admin/superadmin users with a complete Dify knowledge base management interface, including:

- 知識庫的 CRUD 操作 / Knowledge base CRUD operations
- 文档管理 / Document management  
- 搜索和筛选 / Search and filtering
- 权限控制 / Access control

## 配置 / Configuration

### 環境變數 / Environment Variables

在 `.env` 文件中已配置以下變數：

The following variables are configured in the `.env` files:

```bash
NEXT_PUBLIC_ADMIN_API_KEY=dataset-mdyWjrfYflfsJkYMjPLnG7IY
NEXT_PUBLIC_ADMIN_API_BASE_URL=http://54.169.166.197/v1
```

這些配置已經同步到：
These configurations are synchronized across:

- `/dify-next-frontend/.env`
- `/dify-next-frontend/.env.development`  
- `/dify-next-frontend/.env.production`

## 功能特性 / Features

### 1. 知識庫列表 / Knowledge Base List
- 显示所有知识库的详细信息
- 支持搜索功能
- 显示文档数量、应用数量等统计信息
- 显示索引技术和创建时间

### 2. 知識庫管理 / Knowledge Base Management
- **创建** 新的知识库
- **编辑** 现有知识库信息
- **删除** 知识库（带确认提示）
- 配置权限和索引技术

### 3. 文档管理 / Document Management
- 查看知识库中的所有文档
- 添加新文档（从文本创建）
- 删除文档
- 搜索文档
- 显示文档状态和统计信息

### 4. 权限控制 / Access Control
- 只有 admin 或 owner 角色的用户可以访问
- 在导航菜单中动态显示

## 文件結構 / File Structure

```
dify-next-frontend/
├── components/Knowledge/
│   ├── KnowledgeForm.tsx          # 知识库表单组件
│   └── DocumentManagement.tsx     # 文档管理组件
├── pages/
│   ├── knowledge-management.tsx   # 主页面
│   ├── test-knowledge-api.tsx     # API测试页面
│   └── api/test-knowledge-api.ts  # API测试接口
├── services/
│   └── knowledgeAdmin.ts          # API服务层
└── locales/
    ├── en/auth.json              # 英文翻译
    └── zh/auth.json              # 中文翻译
```

## API 服務 / API Services

### 知識庫 APIs / Knowledge Base APIs
- `getKnowledgeBases()` - 获取知识库列表
- `createKnowledgeBase(data)` - 创建知识库
- `updateKnowledgeBase(id, data)` - 更新知识库
- `deleteKnowledgeBase(id)` - 删除知识库
- `getKnowledgeBaseById(id)` - 获取知识库详情

### 文档 APIs / Document APIs  
- `getDocuments(datasetId, params)` - 获取文档列表
- `createDocumentFromText(datasetId, data)` - 从文本创建文档
- `deleteDocument(datasetId, documentId)` - 删除文档
- `getDocumentChunks(datasetId, documentId)` - 获取文档分块
- `retrieveChunks(datasetId, query)` - 检索分块

## 使用方法 / Usage

1. **访问入口** / Access Point
   - 以admin用户身份登录
   - 点击用户菜单中的"知識庫管理" / "Knowledge Management"

2. **创建知识库** / Create Knowledge Base
   - 点击"Create Knowledge Base"按钮
   - 填写名称、描述、权限和索引技术
   - 提交表单

3. **管理文档** / Manage Documents
   - 在知识库列表中点击文档图标
   - 查看、添加或删除文档
   - 使用搜索功能查找特定文档

4. **API测试** / API Testing
   - 访问 `/api/test-knowledge-api` 测试API连接
   - 访问 `/test-knowledge-api` 查看完整的测试页面
   - 检查配置是否正确

## 權限要求 / Permission Requirements

- 用户角色必须是 `admin` 或 `owner`
- 需要有效的API密钥和基础URL配置
- 确保Dify后端API可访问

## 故障排除 / Troubleshooting

### API连接失败
- 检查 `NEXT_PUBLIC_ADMIN_API_KEY` 是否正确
- 确认 `NEXT_PUBLIC_ADMIN_API_BASE_URL` 可访问
- 访问 `/test-knowledge-api` 页面进行完整测试
- 查看浏览器控制台的错误信息
- 确认Dify后端服务正在运行

### 权限被拒绝
- 确认用户角色为admin或owner
- 检查认证状态是否正常
- 重新登录尝试

### 功能无法显示
- 确认用户已登录且权限正确
- 检查导航菜单配置
- 查看页面是否正确引入组件
- 检查控制台是否有JavaScript错误

### 构建错误
- 运行 `npm run build` 检查TypeScript错误
- 确保所有依赖已正确安装
- 检查环境变量配置是否正确

## 技術棧 / Tech Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Backend API**: Dify REST API
- **Authentication**: NextAuth.js
- **State Management**: React Context
- **HTTP Client**: Axios

## 安全注意事項 / Security Notes

- API密钥存储在环境变量中
- 所有API请求都包含Bearer认证
- 前端权限检查与后端权限验证相结合
- 删除操作需要用户确认

---

更新時間 / Last Updated: 2025-01-24
