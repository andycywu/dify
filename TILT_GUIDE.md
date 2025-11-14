# Dify 多容器架構 - Tilt.dev 開發環境指南

本指南將幫助您使用 Tilt.dev 來管理 Dify 的複雜多容器開發環境，提供更高效的本地開發體驗。

## 🎯 為什麼使用 Tilt.dev？

Tilt.dev 相較於傳統的 Docker Compose 有以下優勢：

- **🔄 智能重建**：僅重建變更的服務，大幅提升開發效率
- **📊 統一儀表板**：所有服務狀態、日誌一目了然
- **🔥 熱重載**：代碼變更即時反映，無需重啟容器
- **📈 資源監控**：實時監控 CPU、記憶體使用情況
- **🎛️ 靈活配置**：支援多種開發模式和服務組合
- **🐛 調試友好**：更好的錯誤報告和日誌聚合

## 📋 系統需求

### 必需軟體
- **Docker Desktop**: 用於容器運行
- **kubectl**: Kubernetes 命令行工具
- **kind**: 本地 Kubernetes 集群
- **Tilt**: 開發環境管理工具

### 系統要求
- **記憶體**: 最少 8GB，推薦 16GB
- **磁盤空間**: 最少 10GB 可用空間
- **操作系統**: macOS, Linux, Windows (WSL2)

## 🚀 快速開始

### 1. 自動安裝（推薦）

使用我們提供的安裝腳本，一鍵安裝所有依賴：

```bash
# 安裝所有依賴並啟動預設配置
./tilt-up.sh --install-deps

# 或者安裝依賴並使用完整配置
./tilt-up.sh --install-deps --profile full
```

### 2. 手動安裝

#### macOS (使用 Homebrew)
```bash
# 安裝 Homebrew (如果尚未安裝)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 安裝必需工具
brew install tilt-dev/tap/tilt
brew install kubectl
brew install kind
```

#### Linux
```bash
# 安裝 Tilt
curl -fsSL https://raw.githubusercontent.com/tilt-dev/tilt/master/scripts/install.sh | bash

# 安裝 kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
chmod +x kubectl
sudo mv kubectl /usr/local/bin/

# 安裝 kind
curl -Lo ./kind https://kind.sigs.k8s.io/dl/v0.20.0/kind-linux-amd64
chmod +x ./kind
sudo mv ./kind /usr/local/bin/kind
```

#### Windows (WSL2)
```bash
# 在 WSL2 中執行 Linux 安裝步驟
# 確保 Docker Desktop 已啟用 WSL2 整合
```

### 3. 啟動開發環境

```bash
# 切換到 Dify 項目根目錄
cd /path/to/dify

# 啟動預設配置（推薦新手）
./tilt-up.sh

# 或者直接使用 Tilt
tilt up
```

## 🎛️ 配置選項

### 開發模式

#### Minimal 模式
僅包含核心服務，適合 API 開發：
```bash
./tilt-up.sh --profile minimal
```
包含服務：
- PostgreSQL 資料庫
- Redis 快取
- Dify API
- Dify Worker

#### Default 模式（預設）
包含向量存儲，適合完整功能開發：
```bash
./tilt-up.sh --profile default
```
包含服務：
- Minimal 模式所有服務
- Weaviate 向量資料庫
- Dify Web 界面
- Dify Next Frontend

#### Full 模式
包含所有服務，適合完整系統測試：
```bash
./tilt-up.sh --profile full
```
包含服務：
- Default 模式所有服務
- Wiki.js 文檔系統
- Plugin Daemon
- 開發工具（Redis Commander, pgAdmin）

### 環境配置

編輯 `tilt.env` 文件自定義配置：

```bash
# 開發模式設定
TILT_PROFILE=default
TILT_ENABLE_DEBUG=false
TILT_LIVE_RELOAD=true

# 資料庫配置
DB_PASSWORD=your_secure_password
REDIS_PASSWORD=your_redis_password

# API 配置
SECRET_KEY=your_secret_key
LOG_LEVEL=INFO
```

## 🖥️ 使用界面

### Tilt 儀表板
啟動後訪問：http://localhost:10350

儀表板功能：
- **📊 服務狀態**：實時查看所有服務運行狀態
- **📝 日誌聚合**：統一查看所有服務日誌
- **🔄 資源重建**：手動觸發服務重建
- **📈 資源監控**：CPU、記憶體使用情況
- **🎯 觸發器**：手動執行特定操作

### 服務端點

#### 預設模式端點
- **API 服務**: http://localhost:5001
- **Web 界面**: http://localhost:3000
- **Next Frontend**: http://localhost:3001
- **資料庫**: localhost:5432
- **Redis**: localhost:6379
- **Weaviate**: http://localhost:8080

#### 完整模式額外端點
- **Wiki.js**: http://localhost:3002
- **Plugin Daemon**: http://localhost:5002
- **Redis Commander**: http://localhost:8081
- **pgAdmin**: http://localhost:5050

## 🔧 開發工作流

### 1. 代碼熱重載

Tilt 會自動偵測文件變更並重建相關服務：

```bash
# 編輯 API 代碼
vim api/app.py

# Tilt 自動偵測變更並重建 API 容器
# 無需手動重啟！
```

### 2. 日誌查看

```bash
# 在 Tilt 儀表板查看實時日誌
# 或使用命令行
tilt logs api
tilt logs worker
tilt logs web
```

### 3. 服務管理

```bash
# 重建特定服務
tilt trigger api

# 停用特定服務
tilt disable api

# 啟用服務
tilt enable api

# 查看所有資源
tilt get all
```

### 4. 調試模式

啟用調試模式：
```bash
# 修改 tilt.env
TILT_ENABLE_DEBUG=true

# 重啟 Tilt
tilt down && tilt up
```

調試功能：
- **詳細日誌**：DEBUG 級別日誌輸出
- **Flask 調試**：API 服務 Flask 調試模式
- **錯誤追蹤**：更詳細的錯誤堆疊信息

## 🗄️ 資料管理

### 資料庫管理

#### 使用 pgAdmin (Full 模式)
1. 訪問：http://localhost:5050
2. 登入：admin@dify.ai / admin
3. 新增伺服器：
   - 主機：db
   - 端口：5432
   - 用戶：postgres
   - 密碼：difyai123456

#### 直接連接
```bash
# 使用 psql 連接
kubectl port-forward svc/db 5432:5432
psql -h localhost -U postgres -d dify
```

### Redis 管理

#### 使用 Redis Commander (Full 模式)
1. 訪問：http://localhost:8081
2. 直接查看 Redis 數據

#### 使用 redis-cli
```bash
# 連接到 Redis
kubectl port-forward svc/redis 6379:6379
redis-cli -h localhost -p 6379 -a difyai123456
```

## 🚨 故障排除

### 常見問題

#### 1. 端口衝突
```bash
# 檢查端口使用情況
netstat -an | grep LISTEN | grep :5001

# 修改 tilt.env 中的端口配置
EXPOSE_API_PORT=5002
```

#### 2. 記憶體不足
```bash
# 檢查 Docker 記憶體限制
docker system df
docker system prune

# 使用 minimal 模式減少資源使用
./tilt-up.sh --profile minimal
```

#### 3. 服務啟動失敗
```bash
# 查看詳細日誌
tilt logs <service-name>

# 重建服務
tilt trigger <service-name>

# 完全重啟
tilt down && tilt up
```

#### 4. 文件同步問題
```bash
# 確保文件權限正確
chmod -R 755 api/ web/

# 重啟 Tilt 以重新同步
tilt down && tilt up
```

### 效能優化

#### 1. 調整資源限制
編輯 `Tiltfile` 中的資源配置：
```python
# 調整容器資源限制
k8s_resource('api', 
    cpu_limit='1000m',
    memory_limit='1Gi'
)
```

#### 2. 啟用快取
```bash
# 啟用 Docker 構建快取
export DOCKER_BUILDKIT=1

# 使用本地快取
tilt up --stream
```

#### 3. 選擇性服務
```bash
# 只啟動需要的服務
tilt up api worker db redis
```

## 📚 進階使用

### 自定義 Tiltfile

創建 `tilt_config.local.json` 進行本地自定義：
```json
{
  "profile": "custom",
  "enable_debug": true,
  "live_reload": true,
  "custom_services": ["my-service"]
}
```

### 整合 CI/CD

```yaml
# .github/workflows/tilt-ci.yml
name: Tilt CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    - name: Install Tilt
      run: curl -fsSL https://raw.githubusercontent.com/tilt-dev/tilt/master/scripts/install.sh | bash
    - name: Start Tilt
      run: tilt ci
```

### 擴展和插件

添加自定義擴展：
```python
# 在 Tiltfile 中加載自定義擴展
load('./tilt_extensions.star', 'get_dev_extensions')

extensions = get_dev_extensions()
extensions['setup_tools']()
```

## 🎯 最佳實踐

### 1. 開發工作流
- 使用 `default` 模式進行日常開發
- 在提交前使用 `full` 模式測試
- 使用 `minimal` 模式進行 API 專門開發

### 2. 資源管理
- 定期清理 Docker 映像和容器
- 監控記憶體使用情況
- 使用適當的服務組合

### 3. 團隊協作
- 統一使用相同的 `tilt.env` 配置
- 將 Tilt 配置加入版本控制
- 定期同步依賴版本

### 4. 安全考慮
- 不要在 `tilt.env` 中使用生產密鑰
- 使用強密碼進行本地開發
- 定期更新依賴軟體

## 🔄 從 Docker Compose 遷移

### 對比 Docker Compose

| 功能 | Docker Compose | Tilt.dev |
|------|---------------|----------|
| 服務編排 | ✅ | ✅ |
| 熱重載 | ❌ | ✅ |
| 統一儀表板 | ❌ | ✅ |
| 智能重建 | ❌ | ✅ |
| 資源監控 | ❌ | ✅ |
| 多環境支援 | 🔶 | ✅ |

### 遷移步驟

1. **備份現有配置**
   ```bash
   cp docker-compose.yaml docker-compose.yaml.backup
   ```

2. **逐步測試**
   ```bash
   # 先測試 minimal 模式
   ./tilt-up.sh --profile minimal
   
   # 確認服務正正常後擴展
   ./tilt-up.sh --profile default
   ```

3. **更新開發文檔**
   - 更新 README 中的開發環境設置說明
   - 培訓團隊成員使用 Tilt

## 🆘 支援和社群

### 官方資源
- [Tilt.dev 官方文檔](https://docs.tilt.dev/)
- [Tilt GitHub](https://github.com/tilt-dev/tilt)
- [Dify GitHub](https://github.com/langgenius/dify)

### 社群支援
- [Tilt Slack 社群](https://slack.tilt.dev/)
- [Dify Discord](https://discord.gg/AheCEh3QyS)

### 故障報告
遇到問題時，請提供：
1. Tilt 版本：`tilt version`
2. 操作系統資訊
3. 錯誤日誌：`tilt logs`
4. Tiltfile 配置

---

## 📝 總結

使用 Tilt.dev 管理 Dify 多容器開發環境可以：

✅ **提升開發效率**：智能重建和熱重載  
✅ **簡化調試過程**：統一日誌和錯誤追蹤  
✅ **優化資源使用**：按需啟動服務  
✅ **改善開發體驗**：直觀的圖形界面  
✅ **支援團隊協作**：標準化開發環境  

開始您的 Tilt.dev 之旅：
```bash
./tilt-up.sh --install-deps --profile default
```

享受更高效的容器化開發體驗！ 🚀