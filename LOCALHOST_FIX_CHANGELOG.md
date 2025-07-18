# 修改記錄：dify-next-frontend localhost 硬編碼修復

**日期**：2025年7月18日  
**問題**：瀏覽器向 localhost 發送 API 請求而非 EC2 IP  
**狀態**：✅ 已解決

## 🔍 問題分析

### 原始問題
- 瀏覽器發送請求到 `http://localhost/v1/` 而非 `http://54.169.166.197/v1/`
- API 認證失敗 (401 UNAUTHORIZED)

### 根本原因
1. **編譯時硬編碼**：Next.js 在構建時將環境變數編譯到 JavaScript bundle 中
2. **多個環境文件衝突**：`.env.production`、`.env.development` 包含舊的 localhost 配置
3. **Fallback 值錯誤**：`useChatSettings.ts` 中的預設值指向 localhost
4. **API Key 不正確**：使用了錯誤的 API Key

## 📝 修改詳情

### 文件修改列表

#### 1. 環境設定文件
```bash
# 文件：dify-next-frontend/.env.production
- NEXT_PUBLIC_DIFY_API_BASE_URL=http://localhost/v1
- NEXT_PUBLIC_DIFY_API_KEY=app-PxzkiLjnjcU2w2ARj5qeflQq
+ NEXT_PUBLIC_DIFY_API_BASE_URL=http://54.169.166.197/v1
+ NEXT_PUBLIC_DIFY_API_KEY=app-ldXAyD3A91tXzB6Kkd8hlyP2

# 文件：dify-next-frontend/.env.development  
- NEXT_PUBLIC_DIFY_API_BASE_URL=http://localhost/v1
- NEXT_PUBLIC_DIFY_API_KEY=app-PxzkiLjnjcU2w2ARj5qeflQq
+ NEXT_PUBLIC_DIFY_API_BASE_URL=http://54.169.166.197/v1
+ NEXT_PUBLIC_DIFY_API_KEY=app-ldXAyD3A91tXzB6Kkd8hlyP2

# 文件：dify-next-frontend/.env.docker
- NEXT_PUBLIC_DIFY_API_KEY=app-PxzkiLjnjcU2w2ARj5qeflQq
+ NEXT_PUBLIC_DIFY_API_KEY=app-ldXAyD3A91tXzB6Kkd8hlyP2
```

#### 2. 程式碼文件
```typescript
// 文件：dify-next-frontend/hooks/useChatSettings.ts
const defaultSettings: ChatSettings = {
  enableVoice: false,
  enableHistory: true,
  primaryColor: '#3B82F6',
  customLogo: '/images/TPV-icon.png',
  avatarSrc: '/images/assistant-avatar.png',
- apiKey: process.env.NEXT_PUBLIC_DIFY_API_KEY || '',
- apiBaseUrl: process.env.NEXT_PUBLIC_DIFY_API_BASE_URL || '',
+ apiKey: process.env.NEXT_PUBLIC_DIFY_API_KEY || 'app-ldXAyD3A91tXzB6Kkd8hlyP2',
+ apiBaseUrl: process.env.NEXT_PUBLIC_DIFY_API_BASE_URL || 'http://54.169.166.197/v1',
};
```

## ✅ 驗證結果

### 編譯後文件檢查
```bash
# 檢查編譯後的文件包含正確的配置
$ find .next -name "*test-agentic*.js" -exec grep -o "54\.169\.166\.197" {} \;
54.169.166.197
54.169.166.197

$ find .next -name "*test-agentic*.js" -exec grep -o "app-ldXAyD3A91tXzB6Kkd8hlyP2" {} \;
app-ldXAyD3A91tXzB6Kkd8hlyP2
app-ldXAyD3A91tXzB6Kkd8hlyP2
```

### API 連接測試
```bash
# 使用正確的 API Key 測試
$ curl -H "Authorization: Bearer app-ldXAyD3A91tXzB6Kkd8hlyP2" \
       "http://54.169.166.197/v1/conversations?user=test-user"
{
    "limit": 20,
    "has_more": false,
    "data": []
}
```

### 瀏覽器行為
- ✅ 瀏覽器現在向 `http://54.169.166.197/v1/` 發送請求
- ✅ API 認證成功，不再出現 401 錯誤
- ✅ 前端功能正常運作

## 🚀 部署流程

### 關鍵步驟
1. **本地重新構建**：`rm -rf .next && NODE_ENV=production npm run build`
2. **Docker 映像更新**：`./build-aws-images.sh andywu719`
3. **推送到 Git**：提交所有修改
4. **EC2 部署**：`docker-compose up -d dify-next-frontend`

### 為什麼必須在本地構建
- Next.js 在構建時將 `NEXT_PUBLIC_*` 環境變數直接編譯到 JavaScript bundle 中
- 這些值在運行時無法修改，必須在構建時確定
- 因此環境變數的修改必須伴隨重新構建

## 📚 學習心得

### 重要概念
1. **Next.js 環境變數編譯機制**：`NEXT_PUBLIC_*` 變數會在構建時被編譯到靜態文件中
2. **環境文件優先序**：`.env.production` > `.env` > fallback values
3. **Docker 多階段構建**：需要確保 `.env` 文件在正確的階段被複製

### 故障排除技巧
1. **檢查編譯結果**：直接在 `.next` 目錄中搜尋字符串確認配置
2. **瀏覽器 DevTools**：Network 選項卡可以清楚看到實際的 API 請求
3. **API 測試**：使用 curl 直接測試 API 連接和認證

## 🔧 工具和腳本

創建了以下輔助工具：
- `EC2_DEPLOYMENT_GUIDE.md`：完整的部署指南
- `quick-deploy-to-ec2.sh`：自動化部署腳本

使用方式：
```bash
# 快速部署
./quick-deploy-to-ec2.sh "修復描述"

# 或使用預設提交訊息
./quick-deploy-to-ec2.sh
```
