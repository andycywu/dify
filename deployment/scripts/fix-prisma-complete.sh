#!/bin/bash
# 修復 Dify Next Frontend Prisma 問題的綜合腳本
# Author: GitHub Copilot
# Date: 2025-06-29

set -e

echo "🔧 開始修復 Dify Next Frontend Prisma 問題..."

# 切換到正確目錄
cd "$(dirname "$0")/dify-next-frontend"

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 檢查 Prisma schema
echo -e "${YELLOW}📋 檢查 Prisma schema...${NC}"
if [ ! -f "prisma/schema.prisma" ]; then
    echo -e "${RED}❌ 找不到 prisma/schema.prisma${NC}"
    exit 1
fi

# 確保 binaryTargets 正確設定
echo -e "${YELLOW}⚙️  更新 Prisma binaryTargets...${NC}"
if ! grep -q "linux-musl-arm64-openssl-3.0.x" prisma/schema.prisma; then
    echo -e "${YELLOW}⚠️  Adding missing binaryTargets...${NC}"
    sed -i.bak 's/generator client {/generator client {\
  provider = "prisma-client-js"\
  binaryTargets = ["native", "linux-musl-arm64-openssl-3.0.x"]/' prisma/schema.prisma
fi

# 清理舊的 Prisma 客戶端
echo -e "${YELLOW}🧹 清理舊的 Prisma 客戶端...${NC}"
rm -rf node_modules/.prisma node_modules/@prisma/client .next

# 重新安裝依賴
echo -e "${YELLOW}📦 重新安裝依賴...${NC}"
if [ -f "package-lock.json" ]; then
    npm ci
else
    npm install
fi

# 重新生成 Prisma 客戶端
echo -e "${YELLOW}🔄 重新生成 Prisma 客戶端...${NC}"
npx prisma generate

# 檢查是否存在多平台構建器
echo -e "${YELLOW}🏗️  檢查 Docker buildx...${NC}"
if ! docker buildx version >/dev/null 2>&1; then
    echo -e "${RED}❌ Docker buildx 不可用，請升級 Docker${NC}"
    exit 1
fi

# 建立多平台構建器（如果不存在）
if ! docker buildx ls | grep -q "multiplatform"; then
    echo -e "${YELLOW}🔨 建立多平台構建器...${NC}"
    docker buildx create --name multiplatform --use
fi

echo -e "${GREEN}✅ Prisma 修復完成！${NC}"

# 選擇性：詢問是否要重新建構 Docker 映像
read -p "是否要重新建構 Docker 映像？ (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}🐳 建構多平台 Docker 映像...${NC}"
    
    # 切換到根目錄運行建構腳本
    cd ..
    
    # 設定環境變數
    export REGISTRY=${REGISTRY:-"your-registry.com"}
    export VERSION=${VERSION:-"latest"}
    
    # 運行建構腳本
    if [ -f "build-push-images.sh" ]; then
        ./build-push-images.sh
    else
        echo -e "${YELLOW}⚠️  找不到 build-push-images.sh，手動建構...${NC}"
        docker buildx build \
            --platform linux/amd64,linux/arm64 \
            --tag "${REGISTRY}/dify-next-frontend:${VERSION}" \
            --push \
            ./dify-next-frontend
    fi
fi

echo -e "${GREEN}🎉 所有操作完成！${NC}"
echo -e "${GREEN}💡 提示：將來可以直接運行 ./fix-prisma-complete.sh 來修復類似問題${NC}"
