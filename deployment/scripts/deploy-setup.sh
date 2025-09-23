#!/bin/bash

# Dify 一鍵部署腳本
# 完整的從構建到部署的自動化流程

set -e

# 顏色設置
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${GREEN}=== Dify 一鍵部署設置 ===${NC}"
echo ""

# 參數檢查
REGISTRY="$1"
if [ -z "$REGISTRY" ]; then
    echo -e "${YELLOW}請提供您的 Docker Registry 名稱:${NC}"
    echo "用法: $0 <registry-name>"
    echo ""
    echo "範例:"
    echo "  $0 myusername                    # Docker Hub"
    echo "  $0 123456789012.dkr.ecr.us-west-2.amazonaws.com  # AWS ECR"
    echo "  $0 ghcr.io/myusername           # GitHub Container Registry"
    exit 1
fi

echo -e "${BLUE}使用 Registry: ${REGISTRY}${NC}"
echo ""

# 步驟 1: 更新環境配置
echo -e "${YELLOW}步驟 1: 更新環境配置${NC}"
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s/DOCKER_REGISTRY=.*/DOCKER_REGISTRY=${REGISTRY}/" .env.docker
else
    # Linux
    sed -i "s/DOCKER_REGISTRY=.*/DOCKER_REGISTRY=${REGISTRY}/" .env.docker
fi
echo -e "${GREEN}✓ 環境配置已更新${NC}"

# 步驟 2: 構建和推送 Docker images
echo -e "\n${YELLOW}步驟 2: 構建和推送 Docker images${NC}"

# 檢查是否支援多平台構建
echo -e "${BLUE}檢查多平台構建支援...${NC}"
if ! docker buildx version > /dev/null 2>&1; then
    echo -e "${YELLOW}設置 Docker buildx 多平台構建...${NC}"
    docker buildx create --use --name multiarch || true
    docker buildx use multiarch
else
    echo -e "${GREEN}✓ Docker buildx 已準備就緒${NC}"
fi

# 詢問是否使用多平台構建
echo -e "${BLUE}構建選項:${NC}"
echo "1) 多平台構建 (linux/amd64,linux/arm64) - 推薦用於生產環境"
echo "2) 單一平台構建 (當前平台) - 快速構建"
read -p "請選擇構建方式 (1/2): " build_choice

if [ "$build_choice" = "1" ]; then
    echo -e "${YELLOW}使用多平台構建...${NC}"
    if ./build-push-images.sh "$REGISTRY" --multiplatform; then
        echo -e "${GREEN}✓ 多平台 Images 構建和推送成功${NC}"
    else
        echo -e "${RED}✗ 多平台構建失敗，嘗試單平台構建...${NC}"
        if ./build-push-images.sh "$REGISTRY"; then
            echo -e "${GREEN}✓ 單平台 Images 構建和推送成功${NC}"
        else
            echo -e "${RED}✗ Images 構建失敗${NC}"
            exit 1
        fi
    fi
else
    echo -e "${YELLOW}使用單平台構建...${NC}"
    if ./build-push-images.sh "$REGISTRY"; then
        echo -e "${GREEN}✓ Images 構建和推送成功${NC}"
    else
        echo -e "${RED}✗ Images 構建或推送失敗${NC}"
        exit 1
    fi
fi

# 步驟 3: 更新 docker-compose.yaml
echo -e "\n${YELLOW}步驟 3: 更新 docker-compose.yaml${NC}"
if ./update-registry.sh "$REGISTRY"; then
    echo -e "${GREEN}✓ docker-compose.yaml 已更新${NC}"
else
    echo -e "${RED}✗ 更新 docker-compose.yaml 失敗${NC}"
    exit 1
fi

# 步驟 4: Git 提交
echo -e "\n${YELLOW}步驟 4: 提交變更到 Git${NC}"
read -p "是否要提交變更到 Git? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    git add .
    git commit -m "Setup Docker images for deployment

- Built custom images for dify-api, dify-next-frontend, rest-to-soap-proxy
- Updated docker-compose.yaml to use images from ${REGISTRY}
- Ready for production deployment on EC2

Images:
- ${REGISTRY}/dify-api:latest
- ${REGISTRY}/dify-next-frontend:latest (if exists)
- ${REGISTRY}/rest-to-soap-proxy:latest (if exists)"
    
    read -p "是否要推送到遠端倉庫? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git push origin main
        echo -e "${GREEN}✓ 變更已推送到遠端倉庫${NC}"
    fi
else
    echo -e "${YELLOW}跳過 Git 提交${NC}"
fi

# 完成訊息
echo ""
echo -e "${GREEN}🎉 部署準備完成！${NC}"
echo ""
echo -e "${YELLOW}在 AWS EC2 上部署的步驟:${NC}"
echo ""
echo "1. 確保 EC2 已安裝 Docker 和 Docker Compose:"
echo "   sudo yum update -y"
echo "   sudo yum install -y docker"
echo "   sudo systemctl start docker"
echo "   sudo usermod -a -G docker ec2-user"
echo "   # 重新登入或執行: newgrp docker"
echo ""
echo "2. 登入 Docker Hub (重要):"
echo "   docker login"
echo "   # 輸入用戶名: ${REGISTRY}"
echo "   # 輸入密碼或 access token"
echo ""
echo "3. 克隆或更新代碼:"
echo "   git clone https://github.com/andycywu/dify.git"
echo "   # 或者如果已存在: cd dify && git pull origin main"
echo ""
echo "4. 部署應用:"
echo "   cd dify/docker"
echo "   docker-compose pull  # 現在支援 AMD64 平台"
echo "   docker-compose up -d"
echo ""
echo "5. 檢查服務狀態:"
echo "   docker-compose ps"
echo "   docker-compose logs -f"
echo ""
echo -e "${BLUE}您的 Dify 應用將可以通過 EC2 的公共 IP 訪問！${NC}"
