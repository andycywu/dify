# Tilt.dev 快速參考

## 🚀 快速啟動

```bash
# 一鍵安裝並啟動（推薦新手）
./tilt-up.sh --install-deps

# 使用不同配置模式
./tilt-up.sh --profile minimal    # 僅核心服務
./tilt-up.sh --profile default    # 包含向量存儲（預設）
./tilt-up.sh --profile full       # 所有服務
```

## 📊 服務端點

| 服務 | URL | 用途 |
|------|-----|------|
| Tilt 儀表板 | http://localhost:10350 | 管理界面 |
| Dify API | http://localhost:5001 | 後端 API |
| Dify Web | http://localhost:3000 | Web 界面 |
| Next Frontend | http://localhost:3001 | 新前端 |
| Wiki.js | http://localhost:3002 | 文檔系統 |t
| pgAdmin | http://localhost:5050 | 數據庫管理 |
| Redis Commander | http://localhost:8081 | Redis 管理 |

## 🛠️ 常用命令

```bash
# 基本操作
tilt up                    # 啟動所有服務
tilt down                  # 停止所有服務
tilt up api worker         # 只啟動指定服務

# 日誌查看
tilt logs api             # 查看 API 日誌
tilt logs --follow worker # 實時跟蹤 Worker 日誌

# 服務管理
tilt trigger api          # 手動重建 API
tilt disable web          # 停用 Web 服務
tilt enable web           # 啟用 Web 服務

# 資源查看
tilt get all              # 列出所有資源
tilt describe api         # 查看 API 詳細信息
```

## 🔧 調試技巧

```bash
# 啟用調試模式（修改 tilt.env）
TILT_ENABLE_DEBUG=true

# 查看容器狀態
kubectl get pods
kubectl describe pod <pod-name>

# 進入容器
kubectl exec -it <pod-name> -- /bin/bash

# 查看實時日誌
kubectl logs -f deployment/api
```

## 🧹 清理環境

```bash
# 基本清理
./tilt-down.sh

# 深度清理
./tilt-down.sh --clean-cluster --remove-data

# 完全卸載
./tilt-down.sh --all
```

## ⚡ 效能優化

```bash
# 選擇性啟動服務
tilt up db redis api worker

# 調整資源限制（編輯 Tiltfile）
k8s_resource('api', cpu_limit='500m', memory_limit='512Mi')

# 啟用 Docker BuildKit
export DOCKER_BUILDKIT=1
```

## 📋 服務配置

### 模式對比

| 模式 | 服務數量 | 記憶體需求 | 適用場景 |
|------|----------|------------|----------|
| minimal | 4 | ~2GB | API 開發 |
| default | 7 | ~4GB | 完整開發 |
| full | 12+ | ~8GB | 系統測試 |

### 環境變數（tilt.env）

```bash
# 基本配置
TILT_PROFILE=default
TILT_LIVE_RELOAD=true

# 數據庫
DB_PASSWORD=difyai123456
REDIS_PASSWORD=difyai123456

# 調試
LOG_LEVEL=INFO
FLASK_DEBUG=false
```

## 🚨 故障排除

| 問題 | 解決方案 |
|------|----------|
| 端口衝突 | 修改 `tilt.env` 中的端口配置 |
| 記憶體不足 | 使用 `minimal` 模式或增加 Docker 記憶體 |
| 服務無法啟動 | 檢查 `tilt logs <service>` |
| 文件同步失敗 | 重啟 Tilt：`tilt down && tilt up` |
| 權限問題 | `chmod -R 755 api/ web/` |

## 📚 資源連結

- [完整指南](./TILT_GUIDE.md)
- [Tilt 官方文檔](https://docs.tilt.dev/)
- [Dify 項目文檔](https://docs.dify.ai/)

---
💡 **提示**: 使用 Tilt 儀表板 (http://localhost:10350) 可以更直觀地管理所有服務！