#!/bin/bash

# 更新 docker-compose.yaml 中的 registry 名稱
# 使用方法: ./update-registry.sh [your-registry-name]

set -e

REGISTRY_NAME="$1"

if [ -z "$REGISTRY_NAME" ]; then
    echo "使用方法: ./update-registry.sh [your-registry-name]"
    echo "例如: ./update-registry.sh your-dockerhub-username"
    echo "或: ./update-registry.sh your-account.dkr.ecr.region.amazonaws.com"
    exit 1
fi

COMPOSE_FILE="docker/docker-compose.yaml"

echo "更新 $COMPOSE_FILE 中的 registry 名稱為: $REGISTRY_NAME"

# 使用 sed 替換所有的 your-registry 為實際的 registry 名稱
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s|your-registry|$REGISTRY_NAME|g" "$COMPOSE_FILE"
else
    # Linux
    sed -i "s|your-registry|$REGISTRY_NAME|g" "$COMPOSE_FILE"
fi

echo "✓ 已更新完成！"
echo ""
echo "更新的 images:"
echo "- $REGISTRY_NAME/dify-api:latest"
echo "- $REGISTRY_NAME/dify-next-frontend:latest" 
echo "- $REGISTRY_NAME/rest-to-soap-proxy:latest"
