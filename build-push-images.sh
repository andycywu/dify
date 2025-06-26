#!/bin/bash

# Dify 自定義 Images 構建和推送腳本
# 使用方法: ./build-push-images.sh [registry-name]

set -e

# 載入環境變數配置（如果存在）
if [ -f ".env.docker" ]; then
    source .env.docker
fi

# 設置預設的 registry 名稱
DEFAULT_REGISTRY="${DOCKER_REGISTRY:-your-registry}"
REGISTRY="${1:-$DEFAULT_REGISTRY}"
TAG="${IMAGE_TAG:-latest}"

# 顏色設置
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Dify 自定義 Images 構建和推送腳本 ===${NC}"
echo -e "${YELLOW}Registry: ${REGISTRY}${NC}"
echo -e "${YELLOW}Tag: ${TAG}${NC}"
echo ""

# 檢查 Docker 是否運行
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}錯誤: Docker 沒有運行，請啟動 Docker${NC}"
    exit 1
fi

# 構建函數
build_image() {
    local service=$1
    local dockerfile_path=$2
    local image_name="${REGISTRY}/dify-${service}:${TAG}"
    
    echo -e "${GREEN}構建 ${service} image...${NC}"
    if docker build -t "${image_name}" "${dockerfile_path}"; then
        echo -e "${GREEN}✓ ${service} image 構建成功${NC}"
        return 0
    else
        echo -e "${RED}✗ ${service} image 構建失敗${NC}"
        return 1
    fi
}

# 推送函數
push_image() {
    local service=$1
    local image_name="${REGISTRY}/dify-${service}:${TAG}"
    
    echo -e "${GREEN}推送 ${service} image...${NC}"
    if docker push "${image_name}"; then
        echo -e "${GREEN}✓ ${service} image 推送成功${NC}"
        return 0
    else
        echo -e "${RED}✗ ${service} image 推送失敗${NC}"
        return 1
    fi
}

# 構建所有 images
echo -e "${YELLOW}步驟 1: 構建所有 images${NC}"

# 構建 API image（包含您的修改）
build_image "api" "./api" || exit 1

# 構建 Next.js frontend image
build_image "next-frontend" "./dify-next-frontend" || exit 1

# 構建 REST to SOAP proxy image
build_image "rest-to-soap-proxy" "./rest-to-soap-proxy" || exit 1

echo ""
echo -e "${YELLOW}步驟 2: 推送所有 images 到 registry${NC}"

# 推送所有 images
push_image "api" || exit 1
push_image "next-frontend" || exit 1
push_image "rest-to-soap-proxy" || exit 1

echo ""
echo -e "${GREEN}=== 所有 images 構建和推送完成！ ===${NC}"
echo ""
echo -e "${YELLOW}下一步:${NC}"
echo "1. 更新 docker/docker-compose.yaml 中的 image 名稱"
echo "2. 提交變更到 Git: git add . && git commit -m 'Update to use custom images'"
echo "3. 在 AWS EC2 上部署: docker-compose pull && docker-compose up -d"
echo ""
echo -e "${YELLOW}可用的 images:${NC}"
echo "- ${REGISTRY}/dify-api:${TAG}"
echo "- ${REGISTRY}/dify-next-frontend:${TAG}"
echo "- ${REGISTRY}/dify-rest-to-soap-proxy:${TAG}"
