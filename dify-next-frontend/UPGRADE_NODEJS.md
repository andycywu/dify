# 升級 Ubuntu Node.js 到 18.x 版本

## 🚨 問題診斷

你的 Ubuntu 系統 Node.js 版本過舊:
```
當前版本: Node.js v12.22.9 (npm 8.5.1)
專案需求: Node.js >= 18.18.0
```

**錯誤原因**:
1. Node.js 12 不支援新的 JavaScript 語法 (如 `??=` 運算符)
2. Prisma 6.x 需要 Node.js 18+
3. Next.js 15.x 需要 Node.js 18.18+
4. 前處理系統套件 (cheerio, undici) 需要 Node.js 20+

---

## ✅ 升級步驟

### 方法 1: 使用 NodeSource 官方倉庫 (推薦)

在 Ubuntu 伺服器執行:

```bash
# 1. 移除舊版 Node.js
sudo apt-get remove -y nodejs npm

# 2. 下載 Node.js 18.x 安裝腳本
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

# 3. 安裝 Node.js 18.x
sudo apt-get install -y nodejs

# 4. 驗證版本
node --version  # 應該顯示 v18.x.x
npm --version   # 應該顯示 10.x.x

# 5. 清理舊的 npm 快取
npm cache clean --force

# 6. 更新 npm 到最新版本
sudo npm install -g npm@latest
```

### 方法 2: 使用 nvm (Node Version Manager)

適合需要管理多個 Node.js 版本的情況:

```bash
# 1. 安裝 nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash

# 2. 重新載入 shell 設定
source ~/.bashrc

# 3. 安裝 Node.js 18
nvm install 18

# 4. 設定為預設版本
nvm use 18
nvm alias default 18

# 5. 驗證版本
node --version  # 應該顯示 v18.x.x
npm --version   # 應該顯示 10.x.x
```

---

## 🔄 升級完成後的部署流程

```bash
# 1. 進入專案目錄
cd ~/dify/dify-next-frontend

# 2. 清理舊的 node_modules (重要!)
rm -rf node_modules package-lock.json

# 3. 重新安裝依賴 (使用新的 Node.js 18)
npm install

# 4. 驗證安裝成功
npm list --depth=0 | grep -E "(pdf-parse|mammoth|xlsx|prisma|next)"

# 5. 回到 docker 目錄
cd ~/dify/docker

# 6. 重新建置 Docker 映像檔
docker compose build --no-cache dify-next-frontend

# 7. 啟動容器
docker compose up -d dify-next-frontend

# 8. 查看日誌
docker compose logs -f dify-next-frontend
```

---

## 🎯 一鍵升級腳本

建立並執行此腳本:

```bash
# 建立升級腳本
cat > ~/upgrade-nodejs-and-deploy.sh << 'EOF'
#!/bin/bash
set -e

echo "🚀 Node.js 升級與前處理系統部署腳本"
echo "======================================"
echo ""

# 檢查當前 Node.js 版本
CURRENT_NODE_VERSION=$(node --version 2>/dev/null || echo "未安裝")
echo "📊 當前 Node.js 版本: $CURRENT_NODE_VERSION"
echo ""

# 升級 Node.js
echo "📦 [1/7] 移除舊版 Node.js..."
sudo apt-get remove -y nodejs npm 2>/dev/null || true

echo "📥 [2/7] 下載 Node.js 18.x 安裝腳本..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

echo "⬇️  [3/7] 安裝 Node.js 18.x..."
sudo apt-get install -y nodejs

echo "✅ [4/7] 驗證新版本..."
NEW_NODE_VERSION=$(node --version)
NEW_NPM_VERSION=$(npm --version)
echo "   Node.js: $NEW_NODE_VERSION"
echo "   npm: $NEW_NPM_VERSION"
echo ""

# 更新專案依賴
echo "🔧 [5/7] 更新專案依賴..."
cd ~/dify/dify-next-frontend

# 清理舊依賴
rm -rf node_modules package-lock.json
echo "   ✓ 已清理舊的 node_modules"

# 重新安裝
npm install
echo "   ✓ 依賴安裝完成"
echo ""

# 驗證關鍵套件
echo "📋 已安裝的前處理系統套件:"
npm list --depth=0 | grep -E "(pdf-parse|mammoth|xlsx|formidable|cheerio|csv-parse|gray-matter|node-html-markdown)" || true
echo ""

# 重建 Docker
echo "🐳 [6/7] 重新建置 Docker 映像檔..."
cd ~/dify/docker
docker compose build --no-cache dify-next-frontend

echo "▶️  [7/7] 啟動容器..."
docker compose up -d dify-next-frontend

echo ""
echo "✅ 升級與部署完成!"
echo ""
echo "📊 容器狀態:"
docker compose ps dify-next-frontend

echo ""
echo "📝 查看即時日誌:"
echo "   docker compose logs -f dify-next-frontend"
echo ""
echo "🧪 測試前處理 API:"
echo "   curl -X POST http://localhost:3001/api/documents/preprocess -F 'file=@test.md'"
EOF

# 給予執行權限
chmod +x ~/upgrade-nodejs-and-deploy.sh

# 執行升級
sudo ~/upgrade-nodejs-and-deploy.sh
```

---

## 🔍 驗證升級成功

### 1. 檢查系統 Node.js 版本

```bash
node --version
# 預期輸出: v18.20.8 或更新版本

npm --version
# 預期輸出: 10.8.2 或更新版本
```

### 2. 檢查 package-lock.json 已更新

```bash
cd ~/dify/dify-next-frontend
ls -lh package-lock.json

# 檢查是否包含新套件
grep -c "pdf-parse" package-lock.json  # 應該 > 0
grep -c "mammoth" package-lock.json    # 應該 > 0
grep -c "cheerio" package-lock.json    # 應該 > 0
```

### 3. 檢查 Docker 建置成功

建置過程應該顯示:

```
[deps 6/6] RUN npm ci
✓ 安裝 pdf-parse@1.1.4
✓ 安裝 mammoth@1.11.0
✓ 安裝 xlsx@0.18.5
✓ 安裝 cheerio@1.1.2
...

[builder 5/5] RUN npm run build
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages

Successfully built abc123def456
Successfully tagged dify-next-frontend:latest
```

### 4. 檢查容器運行狀態

```bash
cd ~/dify/docker
docker compose ps dify-next-frontend
```

預期輸出:
```
NAME                         STATUS    PORTS
docker-dify-next-frontend-1  Up        0.0.0.0:3001->3000/tcp
```

### 5. 測試前處理 API

```bash
# 建立測試檔案
echo "# 測試文件

這是測試內容" > /tmp/test.md

# 測試 API
curl -X POST http://localhost:3001/api/documents/preprocess \
  -F "file=@/tmp/test.md" \
  | jq .
```

預期回應:
```json
{
  "success": true,
  "markdown": "# 測試文件\n\n這是測試內容\n\n---",
  "chunks": [
    {
      "title": "測試文件",
      "content": "這是測試內容",
      "index": 0
    }
  ],
  "metadata": {
    "fileType": "MARKDOWN",
    "fileName": "test.md"
  }
}
```

---

## ⚠️ 常見問題排查

### 問題 1: NodeSource 腳本下載失敗

**症狀**: `curl: (6) Could not resolve host`

**解決方案**:
```bash
# 檢查網路連線
ping -c 3 deb.nodesource.com

# 或使用備用方案 (手動下載)
wget https://deb.nodesource.com/setup_18.x -O /tmp/setup_18.x
sudo bash /tmp/setup_18.x
sudo apt-get install -y nodejs
```

### 問題 2: apt-get install 權限不足

**症狀**: `E: Could not open lock file`

**解決方案**:
```bash
# 確保使用 sudo
sudo apt-get update
sudo apt-get install -y nodejs

# 或切換到 root 使用者
sudo su -
apt-get install -y nodejs
exit
```

### 問題 3: npm install 在 Ubuntu 上仍然使用舊版 Node.js

**症狀**: 升級後 `node --version` 顯示 v18,但 npm install 仍報錯

**解決方案**:
```bash
# 檢查 which node
which node

# 如果顯示 /usr/bin/node,確認符號連結正確
ls -la /usr/bin/node

# 重新載入 shell 設定
source ~/.bashrc

# 或登出再登入
exit
ssh obmid@inblrlxAI001
```

### 問題 4: Docker 建置仍然失敗 - "Missing from lock file"

**原因**: Ubuntu 系統上的 package-lock.json 還沒更新

**解決方案**:
```bash
# 在 Ubuntu 上重新生成 package-lock.json
cd ~/dify/dify-next-frontend
rm -rf node_modules package-lock.json
npm install

# 確認 lock 檔已更新
ls -lh package-lock.json
# 檔案大小應該 > 1MB

# 再次建置 Docker
cd ~/dify/docker
docker compose build --no-cache dify-next-frontend
```

### 問題 5: Prisma 仍然報錯 "SyntaxError: Unexpected token"

**原因**: node_modules 中還有舊版 Prisma

**解決方案**:
```bash
cd ~/dify/dify-next-frontend

# 完全清理 Prisma
rm -rf node_modules/@prisma
rm -rf node_modules/.prisma

# 重新安裝
npm install @prisma/client@latest prisma@latest

# 重新生成 Prisma Client
npx prisma generate
```

---

## 📊 升級前後對比

| 項目 | 升級前 | 升級後 |
|------|--------|--------|
| Node.js 版本 | v12.22.9 ❌ | v18.20.8+ ✅ |
| npm 版本 | 8.5.1 | 10.8.2+ |
| 支援 `??=` 語法 | ❌ | ✅ |
| Prisma 6.x 相容 | ❌ | ✅ |
| Next.js 15.x 相容 | ❌ | ✅ |
| 前處理系統套件 | ❌ | ✅ |
| Docker 建置 | 失敗 | 成功 |

---

## ⏱️ 預計時間

| 步驟 | 時間 |
|------|------|
| 移除舊版 Node.js | 30 秒 |
| 下載與安裝 Node.js 18 | 2-5 分鐘 |
| 清理與重新安裝 npm 套件 | 3-5 分鐘 |
| Docker 重新建置 | 5-10 分鐘 |
| 容器啟動 | 10-20 秒 |
| **總計** | **約 12-20 分鐘** |

---

## ✅ 成功標準

完成後你應該看到:

1. **系統 Node.js 版本正確**
   ```bash
   $ node --version
   v18.20.8
   ```

2. **npm install 無錯誤**
   ```bash
   $ npm install
   added 1234 packages in 2m
   ```

3. **package-lock.json 包含新套件**
   ```bash
   $ grep "pdf-parse" package-lock.json
   "node_modules/pdf-parse": {
     "version": "1.1.4",
   ```

4. **Docker 建置成功**
   ```
   Successfully built abc123def456
   Successfully tagged dify-next-frontend:latest
   ```

5. **容器正常運行**
   ```bash
   $ docker compose ps dify-next-frontend
   NAME                         STATE
   docker-dify-next-frontend-1  Up
   ```

6. **前處理 API 正常回應**
   ```json
   {"success": true, "markdown": "...", "chunks": [...]}
   ```

---

## 🚀 快速升級 (一行指令)

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - && sudo apt-get install -y nodejs && cd ~/dify/dify-next-frontend && rm -rf node_modules package-lock.json && npm install && cd ~/dify/docker && docker compose build --no-cache dify-next-frontend && docker compose up -d dify-next-frontend
```

---

**最後更新**: 2025-12-05  
**問題**: Node.js v12.22.9 過舊,不支援 Prisma 6.x 與 Next.js 15.x  
**解決方案**: 升級系統 Node.js 到 18.x,重新安裝依賴並重建 Docker
