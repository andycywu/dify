# EC2 部署流程記錄

## 📝 修復總結
日期：2025年7月18日
問題：dify-next-frontend 的 localhost 硬編碼問題 + API Key 認證問題

### 🔧 已修復的文件
1. **環境設定文件**：
   - `/dify-next-frontend/.env.production` - 修改 DIFY API URL 和 API Key
   - `/dify-next-frontend/.env.development` - 同步修改
   - `/dify-next-frontend/.env.docker` - 同步修改
   - `/dify-next-frontend/.env.aws` - 確認正確設定

2. **程式碼文件**：
   - `/dify-next-frontend/hooks/useChatSettings.ts` - 修改 fallback 預設值

### 🎯 關鍵修改內容
```bash
# 所有 .env 文件中的修改
NEXT_PUBLIC_DIFY_API_BASE_URL=http://54.169.166.197/v1  # 從 localhost 改為 EC2 IP
NEXT_PUBLIC_DIFY_API_KEY=app-ldXAyD3A91tXzB6Kkd8hlyP2   # 使用正確的 API Key
```

```typescript
// useChatSettings.ts 中的修改
const defaultSettings: ChatSettings = {
  // ...其他設定
  apiKey: process.env.NEXT_PUBLIC_DIFY_API_KEY || 'app-ldXAyD3A91tXzB6Kkd8hlyP2',
  apiBaseUrl: process.env.NEXT_PUBLIC_DIFY_API_BASE_URL || 'http://54.169.166.197/v1',
};
```

## 🚀 本地部署到 EC2 完整流程

### 步驟 1：本地構建和測試
```bash
# 1. 進入前端目錄
cd /Users/andycyw/dify/dify-next-frontend

# 2. 清理並重新構建（重要：使用生產環境）
rm -rf .next && NODE_ENV=production npm run build

# 3. 檢查構建結果是否正確
find .next -name "*test-agentic*.js" -exec grep -o "54\.169\.166\.197" {} \;
find .next -name "*test-agentic*.js" -exec grep -o "app-ldXAyD3A91tXzB6Kkd8hlyP2" {} \;
```

### 步驟 2：構建和推送 Docker 映像
```bash
# 1. 回到專案根目錄
cd /Users/andycyw/dify

# 2. 構建 Docker 映像並推送到 registry
./build-aws-images.sh andywu719
```

### 步驟 3：Git 版本控制
```bash
# 1. 提交修改到 Git
git add .
git commit -m "修復 dify-next-frontend localhost 硬編碼和 API Key 問題

- 修改所有 .env 文件中的 DIFY API URL 從 localhost 改為 EC2 IP
- 更新正確的 API Key: app-ldXAyD3A91tXzB6Kkd8hlyP2  
- 修改 useChatSettings.ts 中的 fallback 預設值
- 確保生產環境構建使用正確配置"

git push origin main
```

### 步驟 4：EC2 部署
```bash
# 1. SSH 到 EC2 (如果需要)
ssh -i tpv-dify-key.pem ec2-user@54.169.166.197

# 2. 拉取最新代碼並重新部署容器
cd /home/ec2-user/dify
git pull origin main
docker-compose up -d dify-next-frontend
```

## ⚠️ 重要注意事項

### 必須在本地執行的操作
1. **構建步驟**：`rm -rf .next && NODE_ENV=production npm run build`
   - 原因：Next.js 在構建時會將環境變數編譯到 JavaScript bundle 中
   - 必須在本地完成才能確保正確的配置被編譯進去

2. **Docker 映像構建**：`./build-aws-images.sh andywu719`
   - 原因：需要包含最新的構建結果
   - 推送到 registry 讓 EC2 可以拉取

### 驗證部署成功
1. **API 連接測試**：
   ```bash
   curl -H "Authorization: Bearer app-ldXAyD3A91tXzB6Kkd8hlyP2" \
        "http://54.169.166.197/v1/conversations?user=test-user"
   ```
   應該返回 JSON 而不是 401 錯誤

2. **瀏覽器檢查**：
   - 開啟瀏覽器 DevTools Network 選項卡
   - 訪問前端頁面，確認 API 請求指向 `http://54.169.166.197/v1/` 而非 localhost

## 📋 故障排除清單

如果部署後仍有問題：

1. **檢查編譯結果**：
   ```bash
   # 檢查是否包含正確的 API URL
   grep -r "54.169.166.197" dify-next-frontend/.next/
   
   # 檢查是否包含正確的 API Key  
   grep -r "app-ldXAyD3A91tXzB6Kkd8hlyP2" dify-next-frontend/.next/
   ```

2. **檢查環境文件一致性**：
   ```bash
   grep "NEXT_PUBLIC_DIFY" dify-next-frontend/.env*
   ```

3. **清理瀏覽器快取**：
   - 在瀏覽器中按 Ctrl+Shift+R (或 Cmd+Shift+R) 強制重新載入
   - 清空 localStorage：在 DevTools Console 執行 `localStorage.clear()`

## 🎯 快速部署腳本
見 `quick-deploy-to-ec2.sh`
