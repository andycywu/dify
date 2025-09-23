# Docker 構建網絡問題快速解決指南

## 問題描述
在構建 `andywu719/dify-api:latest` 時遇到網絡連接錯誤：
```
Could not connect to debian.map.fastlydns.net:80
Unable to connect to deb.debian.org:http
```

## 快速解決方案

### 方案 1: 立即嘗試（最簡單）
```bash
# 重啟 Docker 並清理緩存
docker system prune -f
docker builder prune -f

# 使用網絡主機模式構建
docker build --network=host -t andywu719/dify-api:latest api/
```

### 方案 2: 修復 Dockerfile（推薦）
```bash
# 運行修復腳本
chmod +x fix-dockerfile-network.sh
./fix-dockerfile-network.sh

# 按照提示應用修復，然後重新構建
```

### 方案 3: 跳過構建，使用現有映像
如果構建持續失敗，您可以：
```bash
# 拉取官方映像（如果存在）
docker pull langgenius/dify-api:latest
docker tag langgenius/dify-api:latest andywu719/dify-api:latest

# 或者暫時使用不同的映像
```

### 方案 4: 系統級修復
```bash
# 運行診斷腳本
chmod +x diagnose-docker-build.sh
./diagnose-docker-build.sh

# 根據診斷結果應用相應修復
```

## macOS 特殊解決方案

如果您使用 macOS Docker Desktop：

1. **重啟 Docker Desktop**
2. **設置 DNS**：
   - 打開 Docker Desktop
   - 前往 Settings → Resources → Network
   - 設置 DNS 為：`8.8.8.8`, `8.8.4.4`
3. **增加資源分配**：
   - Settings → Resources
   - 增加 Memory 到至少 4GB
   - 增加 CPU 到至少 2 核心

## EC2 特殊解決方案

如果您在 EC2 上構建：

```bash
# 運行 EC2 專用修復
chmod +x ec2-fix-docker-build.sh
./ec2-fix-docker-build.sh
```

## 臨時繞過方案

如果所有方案都失敗，可以暫時跳過 API 構建：

1. **使用預構建映像**：修改 `docker-compose.yaml` 中的映像名稱
2. **本地開發模式**：直接運行 Python API 而不使用 Docker
3. **分步構建**：先構建基礎映像，再構建應用映像

## 檢查清單

構建前請確認：
- [ ] Docker 服務正在運行
- [ ] 網絡連接正常（可以訪問 google.com）
- [ ] 沒有代理或防火牆阻止
- [ ] Docker 有足夠的磁盤空間
- [ ] 系統時間正確（影響 SSL 證書驗證）

## 成功構建後

一旦 API 映像構建成功，您就可以：
```bash
# 返回到 docker 目錄
cd docker

# 重新啟動所有服務
docker compose down
docker compose up -d

# 檢查服務狀態
docker compose ps
```

## 獲取幫助

如果問題持續存在：
1. 運行完整診斷：`./diagnose-docker-build.sh`
2. 檢查 Docker 日誌：`docker logs <container-id>`
3. 嘗試在不同網絡環境下構建
4. 考慮使用雲端構建服務

## 問題總結

您遇到的主要問題是 `dify-next-frontend` 構建失敗，錯誤信息顯示：
```
Error: Cannot find module '/app/.babelrc.js'
```

**根本原因**：`.babelrc.js` 被誤創建為目錄而不是檔案。

## 已修復的問題

### 1. ✅ 修復了 .babelrc.js 檔案
- 刪除了錯誤的 `.babelrc.js` 目錄
- 創建了正確的 `.babelrc.js` 檔案，包含適當的 Babel 配置

### 2. ✅ 改進了 Dockerfile
- 優化了 Node.js 依賴安裝
- 禁用了 Next.js 遙測以加快構建
- 改進了錯誤處理

### 3. ✅ 增強了構建腳本
- 添加了錯誤檢測和修復建議
- 提供了單平台和多平台構建選項
- 改進了用戶體驗和錯誤信息

## 新增的腳本工具

### 1. `fix-next-frontend.sh`
**用途**：快速修復和測試 Next.js 前端常見問題
```bash
./fix-next-frontend.sh
```

**功能**：
- 自動檢測和修復 `.babelrc.js` 問題
- 檢查依賴安裝
- 清理 Next.js 緩存
- 本地構建測試
- 提供詳細的除錯信息

### 2. `build-aws-images.sh`
**用途**：AWS EC2 專用的快速單平台構建
```bash
./build-aws-images.sh your-dockerhub-username
```

**優勢**：
- 僅構建 AMD64 平台（AWS EC2 使用）
- 構建速度快（避免多平台構建的時間開銷）
- 智能檢測可構建的服務
- 提供詳細的進度和錯誤處理

### 3. 改進後的 `build-push-images.sh`
**新功能**：
- 自動檢測和修復常見問題
- 提供更好的錯誤信息和建議
- 支援單平台和多平台選擇

## 建議的使用流程

### 方案 A：快速 AWS 部署（推薦）
```bash
# 1. 修復前端問題（如果需要）
./fix-next-frontend.sh

# 2. 快速構建 AWS 專用 images
./build-aws-images.sh your-dockerhub-username

# 3. 更新 docker-compose 配置
./update-registry.sh your-dockerhub-username

# 4. 提交和部署
git add .
git commit -m "Update Docker images for AWS deployment"
git push origin main

# 5. 在 AWS EC2 上部署
./deploy-ec2.sh
```

### 方案 B：多平台構建（如果需要支援 ARM64）
```bash
# 1. 修復前端問題
./fix-next-frontend.sh

# 2. 單平台測試構建
./build-push-images.sh your-dockerhub-username

# 3. 如果成功，再進行多平台構建
./build-push-images.sh your-dockerhub-username --multiplatform
```

## 性能優化建議

### 1. 構建時間優化
- **單平台構建**：對於 AWS EC2，只需要 AMD64，構建時間可減少 50-70%
- **本地測試**：先運行 `fix-next-frontend.sh` 確保本地構建無誤
- **緩存利用**：Docker 構建會利用層緩存

### 2. 多平台構建注意事項
- **時間成本**：多平台構建時間是單平台的 2-3 倍
- **資源需求**：需要更多 CPU 和記憶體
- **必要性**：僅在需要支援 ARM64 (如 Apple Silicon Mac) 時使用

### 3. 錯誤處理
- **Next.js 構建**：最常見的問題是缺少配置檔案或依賴問題
- **網路問題**：構建過程中需要穩定的網路連接下載依賴
- **權限問題**：確保 Docker 有適當的權限

## 常見問題排除

### Q: 構建仍然失敗怎麼辦？
A: 按順序嘗試：
1. 運行 `./fix-next-frontend.sh`
2. 檢查本地 Node.js 版本（建議 18.x）
3. 清理 Docker 緩存：`docker system prune -a`
4. 嘗試單平台構建

### Q: 推送到 Registry 失敗？
A: 檢查：
1. Docker 登入狀態：`docker login`
2. Registry 名稱是否正確
3. 網路連接是否穩定

### Q: AWS EC2 上拉取 image 失敗？
A: 確認：
1. EC2 有網路訪問權限
2. docker-compose.yaml 中的 registry 名稱正確
3. 執行 `docker login` 在 EC2 上

## 檔案結構確認

構建成功後，您應該有：
```
✅ .babelrc.js (檔案，非目錄)
✅ package.json
✅ package-lock.json
✅ Dockerfile
✅ next.config.js
```

## 下一步

現在所有問題都已修復，您可以：
1. 先嘗試 AWS 專用快速構建：`./build-aws-images.sh your-registry`
2. 如果成功，更新部署配置並推送到 EC2
3. 如果需要多平台支援，再使用完整的構建腳本
