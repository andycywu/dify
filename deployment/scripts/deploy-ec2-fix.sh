#!/bin/bash

# EC2 Deployment Script for Dify Next Frontend
# 專為解決 EC2 上的 Prisma 數據庫問題而設計

set -e

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 檢查是否在正確的目錄
if [ ! -f "docker-compose.yaml" ]; then
    log_error "請在 docker 目錄中運行此腳本"
    exit 1
fi

log_info "開始修復 EC2 上的 Dify Next Frontend 數據庫問題..."

# 1. 備份當前的 override 文件
if [ -f "docker-compose.override.yml" ]; then
    log_info "備份當前的 override 文件..."
    cp docker-compose.override.yml docker-compose.override.yml.backup.$(date +%Y%m%d_%H%M%S)
fi

# 2. 使用 EC2 專用的 override 文件
log_info "使用 EC2 專用配置..."
cp docker-compose.ec2.override.yml docker-compose.override.yml

# 3. 創建必要的目錄
log_info "創建數據庫目錄..."
mkdir -p ./volumes/dify-next-frontend

# 4. 設置正確的權限
log_info "設置目錄權限..."
# 檢查是否有 sudo 權限
if command -v sudo >/dev/null 2>&1; then
    sudo chown -R 1001:1001 ./volumes/dify-next-frontend 2>/dev/null || {
        log_warn "無法使用 sudo 設置所有者，嘗試使用 chmod..."
        chmod 777 ./volumes/dify-next-frontend
    }
else
    log_warn "沒有 sudo 權限，使用 chmod 777..."
    chmod 777 ./volumes/dify-next-frontend
fi

# 5. 停止並清理現有容器
log_info "清理現有容器..."
docker-compose stop dify-next-frontend 2>/dev/null || true
docker-compose rm -f dify-next-frontend 2>/dev/null || true

# 6. 重新啟動容器
log_info "啟動容器..."
docker-compose up -d dify-next-frontend

# 7. 等待容器啟動
log_info "等待容器啟動 (60秒)..."
sleep 60

# 8. 檢查容器狀態
log_info "檢查容器狀態..."
if docker-compose ps dify-next-frontend | grep -q "Up"; then
    log_info "✅ 容器成功啟動"
else
    log_error "❌ 容器啟動失敗"
    log_info "查看容器日誌："
    docker-compose logs --tail=50 dify-next-frontend
    exit 1
fi

# 9. 檢查健康狀態
log_info "檢查應用健康狀態..."
for i in {1..10}; do
    if curl -f http://localhost:3000/api/health >/dev/null 2>&1; then
        log_info "✅ 應用健康檢查通過"
        break
    else
        if [ $i -eq 10 ]; then
            log_error "❌ 健康檢查失敗"
            log_info "查看最新日誌："
            docker-compose logs --tail=30 dify-next-frontend
        else
            log_info "健康檢查失敗，重試 $i/10..."
            sleep 10
        fi
    fi
done

# 10. 顯示最終狀態
log_info "=== 最終狀態 ==="
docker-compose ps dify-next-frontend
echo
log_info "=== 最新日誌 ==="
docker-compose logs --tail=20 dify-next-frontend

log_info "🎉 部署完成！"
log_info "💡 如需查看實時日誌，請運行: docker-compose logs -f dify-next-frontend"
log_info "🌐 應用訪問地址: http://localhost:3000"
