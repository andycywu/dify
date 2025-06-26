#!/bin/bash

# 更新 docker-compose.yaml 和環境配置中的 registry 名稱
# 使用方法: ./update-registry.sh [your-registry-name]

set -e

REGISTRY_NAME="$1"

if [ -z "$REGISTRY_NAME" ]; then
    echo "使用方法: ./update-registry.sh [your-registry-name]"
    echo "例如: ./update-registry.sh your-dockerhub-username"
    echo "或: ./update-registry.sh your-account.dkr.ecr.region.amazonaws.com"
    exit 1
fi

echo "更新 Registry 配置為: $REGISTRY_NAME"

# 更新 .env.docker 文件
echo "更新 .env.docker 文件..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s|DOCKER_REGISTRY=.*|DOCKER_REGISTRY=${REGISTRY_NAME}|g" .env.docker
else
    # Linux
    sed -i "s|DOCKER_REGISTRY=.*|DOCKER_REGISTRY=${REGISTRY_NAME}|g" .env.docker
fi

# 更新 docker-compose.yaml 中的預設值
COMPOSE_FILE="docker/docker-compose.yaml"
echo "更新 $COMPOSE_FILE 中的預設 registry 名稱..."

if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s|your-registry|$REGISTRY_NAME|g" "$COMPOSE_FILE"
else
    # Linux
    sed -i "s|your-registry|$REGISTRY_NAME|g" "$COMPOSE_FILE"
fi

echo "✓ 已更新完成！"
echo ""
echo "更新的 images 預設值:"
echo "- $REGISTRY_NAME/dify-api:latest"
echo "- $REGISTRY_NAME/dify-next-frontend:latest" 
echo "- $REGISTRY_NAME/rest-to-soap-proxy:latest"
echo ""
echo "環境變數也已更新，Docker Compose 將使用這些設定。"
