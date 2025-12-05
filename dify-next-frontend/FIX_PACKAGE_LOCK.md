# 修復 package-lock.json 同步問題

## 🚨 問題原因

Docker 建置失敗的錯誤訊息:
```
npm ci can only install packages when your package.json and package-lock.json are in sync
Missing: @types/formidable@3.4.6 from lock file
Missing: cheerio@1.1.0 from lock file
Missing: csv-parse@5.6.0 from lock file
... (等 9 個新套件)
```

**原因**: `package.json` 已更新加入前處理系統需要的套件,但 `package-lock.json` 尚未同步更新。

---

## ✅ 解決方案

### 方法 1: 在 Ubuntu 上更新 package-lock.json (推薦)

在 Ubuntu 伺服器上執行:

```bash
# 1. 進入專案目錄
cd ~/dify/dify-next-frontend

# 2. 更新 package-lock.json (這會安裝所有新套件並更新 lock 檔)
npm install

# 3. 確認 package-lock.json 已更新
git diff package-lock.json | head -20

# 4. 回到 docker 目錄重新建置
cd ~/dify/docker

# 5. 重新建置 Docker 映像檔
docker compose build --no-cache dify-next-frontend

# 6. 啟動容器
docker compose up -d dify-next-frontend

# 7. 查看日誌
docker compose logs -f dify-next-frontend
```

---

### 方法 2: 使用一鍵修復腳本

建立並執行此腳本:

```bash
# 建立修復腳本
cat > ~/dify/fix-package-lock.sh << 'EOF'
#!/bin/bash
set -e

echo "🔧 修復 package-lock.json 同步問題..."
echo ""

# 1. 進入專案目錄
cd ~/dify/dify-next-frontend
echo "📂 當前目錄: $(pwd)"

# 2. 備份舊的 package-lock.json (如果存在)
if [ -f package-lock.json ]; then
  echo "💾 備份 package-lock.json..."
  cp package-lock.json package-lock.json.backup
fi

# 3. 更新 package-lock.json
echo "📦 執行 npm install 更新 lock 檔..."
npm install

# 4. 顯示新增的套件
echo ""
echo "✅ 新增的前處理系統套件:"
npm list --depth=0 | grep -E "(pdf-parse|mammoth|xlsx|csv-parse|cheerio|formidable|gray-matter|node-html-markdown)"

# 5. 回到 docker 目錄
cd ~/dify/docker
echo ""
echo "🐳 開始重新建置 Docker 映像檔..."

# 6. 重新建置
docker compose build --no-cache dify-next-frontend

# 7. 啟動容器
echo ""
echo "▶️  啟動容器..."
docker compose up -d dify-next-frontend

# 8. 顯示狀態
echo ""
echo "✅ 修復完成!"
echo ""
echo "📊 容器狀態:"
docker compose ps dify-next-frontend

echo ""
echo "📝 即時日誌 (按 Ctrl+C 退出):"
docker compose logs -f dify-next-frontend
EOF

# 給予執行權限
chmod +x ~/dify/fix-package-lock.sh

# 執行修復
~/dify/fix-package-lock.sh
```

---

### 方法 3: 刪除 node_modules 重新安裝 (徹底清理)

如果方法 1 仍有問題:

```bash
cd ~/dify/dify-next-frontend

# 刪除舊的依賴
rm -rf node_modules package-lock.json

# 重新安裝
npm install

# 回到 docker 目錄重建
cd ~/dify/docker
docker compose build --no-cache dify-next-frontend
docker compose up -d dify-next-frontend
```

---

## 🔍 驗證步驟

### 1. 確認 package-lock.json 已包含新套件

```bash
cd ~/dify/dify-next-frontend

# 檢查是否包含前處理系統套件
grep -E "(pdf-parse|mammoth|xlsx|formidable)" package-lock.json | head -10
```

**預期輸出**:
```json
    "node_modules/pdf-parse": {
      "version": "1.1.4",
    "node_modules/mammoth": {
      "version": "1.11.0",
```

### 2. 確認 Docker 建置成功

建置過程中應該看到:

```
[deps 6/6] RUN npm ci
✓ 安裝 pdf-parse, mammoth, xlsx...
[builder 5/5] RUN npm run build
✓ Next.js 建置完成
Successfully built abc123def456
```

### 3. 測試前處理 API

```bash
# 建立測試檔案
echo "# 測試文件

這是測試內容" > /tmp/test.md

# 測試 API
curl -X POST http://localhost:3001/api/documents/preprocess \
  -F "file=@/tmp/test.md" \
  -H "Accept: application/json" \
  | jq .
```

**預期回應**:
```json
{
  "success": true,
  "markdown": "# 測試文件\n\n這是測試內容\n\n---",
  "chunks": [...]
}
```

---

## ⚠️ 注意事項

### Node.js 版本警告

你可能會看到這個警告:
```
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE   package: 'undici@7.16.0',
npm warn EBADENGINE   required: { node: '>=20.18.1' },
npm warn EBADENGINE   current: { node: 'v18.20.8', npm: '10.8.2' }
}
```

**這不影響功能**,因為:
- Dockerfile 使用 `node:18-slim` 基礎映像檔
- `undici@7.16.0` 是 `cheerio` 的相依套件,在 Node 18 上仍可正常運作
- 只是版本建議警告,不是錯誤

如果想消除警告,可以修改 Dockerfile:
```dockerfile
# 將第 1 行改為
FROM node:20-slim AS deps
```

但這需要測試整個應用程式在 Node 20 的相容性。

---

## 🐛 常見問題排查

### 問題 1: npm install 失敗 - "EACCES: permission denied"

**解決方案**:
```bash
# 檢查目錄權限
ls -la ~/dify/dify-next-frontend/

# 如果是權限問題,修改擁有者
sudo chown -R $USER:$USER ~/dify/dify-next-frontend/

# 再次執行
npm install
```

### 問題 2: npm install 很慢或超時

**解決方案**:
```bash
# 使用淘寶 npm 鏡像 (中國大陸)
npm config set registry https://registry.npmmirror.com

# 或使用 cnpm
npm install -g cnpm --registry=https://registry.npmmirror.com
cnpm install

# 恢復官方源
npm config set registry https://registry.npmjs.org/
```

### 問題 3: Docker 建置失敗 - "no space left on device"

**解決方案**:
```bash
# 清理 Docker 暫存
docker system prune -a --volumes -f

# 檢查磁碟空間
df -h
```

### 問題 4: package.json 與本地安裝的版本不一致

**解決方案**:
```bash
# 強制使用 package.json 中的版本
rm -rf node_modules package-lock.json
npm install --force

# 或使用 npm ci (在已有正確 lock 檔後)
npm ci
```

---

## 📊 執行時間預估

| 步驟 | 預計時間 |
|------|----------|
| `npm install` (更新 lock 檔) | 2-5 分鐘 |
| `docker compose build` (重建映像檔) | 5-10 分鐘 |
| `docker compose up` (啟動容器) | 10-20 秒 |
| **總計** | **約 8-15 分鐘** |

---

## ✅ 成功標準

執行完成後,你應該看到:

1. **package-lock.json 已更新**
   ```bash
   ls -lh ~/dify/dify-next-frontend/package-lock.json
   # 檔案大小應該比之前大 (新增了 9 個套件的依賴樹)
   ```

2. **Docker 建置成功**
   ```
   Successfully built abc123def456
   Successfully tagged dify-next-frontend:latest
   ```

3. **容器正常運行**
   ```bash
   docker compose ps dify-next-frontend
   # STATE 顯示 "Up"
   ```

4. **日誌無錯誤**
   ```
   dify-next-frontend_1  | ✓ Ready in 1234ms
   dify-next-frontend_1  | Listening on http://0.0.0.0:3000
   ```

---

## 🚀 快速修復 (一行指令)

如果你趕時間,直接執行:

```bash
cd ~/dify/dify-next-frontend && npm install && cd ~/dify/docker && docker compose build --no-cache dify-next-frontend && docker compose up -d dify-next-frontend && docker compose logs -f dify-next-frontend
```

---

**最後更新**: 2025-12-05  
**錯誤代碼**: EUSAGE - package.json/package-lock.json 不同步  
**解決方案**: 執行 `npm install` 更新 lock 檔後重新建置 Docker
