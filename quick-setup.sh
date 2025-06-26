#!/bin/bash

# Dify 快速部署腳本
# 這個腳本會引導您完成整個部署設置過程

set -e

# 顏色設置
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Dify 快速部署設置 ===${NC}"
echo ""

# 檢查依賴
echo -e "${BLUE}檢查依賴...${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${RED}錯誤: Docker 未安裝${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}錯誤: Docker Compose 未安裝${NC}"
    exit 1
fi

echo -e "${GREEN}✓ 依賴檢查完成${NC}"
echo ""

# 獲取 registry 資訊
echo -e "${YELLOW}請選擇您的 Docker Registry:${NC}"
echo "1) Docker Hub (例如: your-username)"
echo "2) AWS ECR (例如: 123456789012.dkr.ecr.us-west-2.amazonaws.com)"
echo "3) GitHub Container Registry (例如: ghcr.io/your-username)"
echo "4) 其他"

read -p "請選擇 (1-4): " registry_choice

case $registry_choice in
    1)
        read -p "請輸入您的 Docker Hub 用戶名: " username
        REGISTRY_NAME="$username"
        ;;
    2)
        read -p "請輸入您的 AWS ECR URI: " ecr_uri
        REGISTRY_NAME="$ecr_uri"
        ;;
    3)
        read -p "請輸入您的 GitHub 用戶名: " github_username
        REGISTRY_NAME="ghcr.io/$github_username"
        ;;
    4)
        read -p "請輸入您的 Registry 名稱: " custom_registry
        REGISTRY_NAME="$custom_registry"
        ;;
    *)
        echo -e "${RED}無效選擇${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${BLUE}您選擇的 Registry: ${REGISTRY_NAME}${NC}"
echo ""

# 更新配置
echo -e "${YELLOW}步驟 1: 更新配置文件${NC}"
echo "DOCKER_REGISTRY=$REGISTRY_NAME" > .env.docker
echo "IMAGE_TAG=latest" >> .env.docker
echo "BUILD_NO_CACHE=false" >> .env.docker

./update-registry.sh "$REGISTRY_NAME"
echo -e "${GREEN}✓ 配置更新完成${NC}"
echo ""

# 詢問是否登入 registry
echo -e "${YELLOW}步驟 2: Registry 登入${NC}"
read -p "是否需要登入到 Registry? (y/n): " login_choice

if [[ $login_choice =~ ^[Yy]$ ]]; then
    case $registry_choice in
        1)
            echo "正在登入 Docker Hub..."
            docker login
            ;;
        2)
            echo "請手動執行 AWS ECR 登入命令:"
            echo "aws ecr get-login-password --region your-region | docker login --username AWS --password-stdin $REGISTRY_NAME"
            ;;
        3)
            echo "請手動執行 GitHub 登入命令:"
            echo "echo \$GITHUB_TOKEN | docker login ghcr.io -u your-username --password-stdin"
            ;;
        *)
            echo "請手動登入到您的 Registry"
            ;;
    esac
fi

echo ""

# 構建和推送
echo -e "${YELLOW}步驟 3: 構建和推送 Images${NC}"
read -p "是否現在構建和推送所有 images? (y/n): " build_choice

if [[ $build_choice =~ ^[Yy]$ ]]; then
    echo -e "${BLUE}開始構建和推送...${NC}"
    ./build-push-images.sh "$REGISTRY_NAME"
    echo -e "${GREEN}✓ Images 構建和推送完成${NC}"
else
    echo -e "${YELLOW}您可以稍後執行: ./build-push-images.sh ${REGISTRY_NAME}${NC}"
fi

echo ""

# 完成
echo -e "${GREEN}=== 設置完成！ ===${NC}"
echo ""
echo -e "${YELLOW}接下來的步驟:${NC}"
echo "1. 提交變更到 Git:"
echo "   git add ."
echo "   git commit -m 'Setup custom Docker images for deployment'"
echo "   git push origin main"
echo ""
echo "2. 在 AWS EC2 或其他服務器上部署:"
echo "   git clone your-repository.git"
echo "   cd dify/docker"
echo "   docker-compose pull"
echo "   docker-compose up -d"
echo ""
echo -e "${YELLOW}可用的命令:${NC}"
echo "- ./build-push-images.sh $REGISTRY_NAME  # 重新構建和推送"
echo "- make build-push-all-custom CUSTOM_REGISTRY=$REGISTRY_NAME  # 使用 Makefile"
echo "- ./update-registry.sh new-registry-name  # 更換 registry"
echo ""
echo -e "${BLUE}查看完整文檔: DEPLOYMENT_GUIDE.md${NC}"
