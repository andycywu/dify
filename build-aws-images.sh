#!/bin/bash

# AWS EC2 專用快速構建腳本 (僅 AMD64 平台)

set -e

# 解析參數
REGISTRY=""
for arg in "$@"; do
    if [ -z "$REGISTRY" ]; then
        REGISTRY="$arg"
    fi
done

# 設置預設的 registry 名稱
DEFAULT_REGISTRY="${DOCKER_REGISTRY:-your-registry}"
REGISTRY="${REGISTRY:-$DEFAULT_REGISTRY}"
TAG="${IMAGE_TAG:-latest}"

# 顏色設置
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${GREEN}=== AWS EC2 專用快速構建腳本 ===${NC}"
echo -e "${YELLOW}Registry: ${REGISTRY}${NC}"
echo -e "${YELLOW}Tag: ${TAG}${NC}"
echo -e "${YELLOW}平台: linux/amd64 (AWS EC2 優化)${NC}"
echo ""

# 檢查 Registry 名稱
if [ "$REGISTRY" = "your-registry" ]; then
    echo -e "${RED}錯誤: 請設置實際的 Registry 名稱${NC}"
    echo "使用方法: $0 your-dockerhub-username"
    exit 1
fi

# 檢查 Docker 是否運行
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}錯誤: Docker 沒有運行，請啟動 Docker${NC}"
    exit 1
fi

# 構建函數
build_single_platform() {
    local service=$1
    local context=$2
    
    # 設置 image 名稱
    local image_name
    if [ "$service" = "rest-to-soap-proxy" ]; then
        image_name="${REGISTRY}/${service}:${TAG}"
    else
        image_name="${REGISTRY}/dify-${service}:${TAG}"
    fi
    
    echo -e "\n${BLUE}=== 構建 ${service} (AMD64) ===${NC}"
    echo -e "${YELLOW}Image: ${image_name}${NC}"
    
    # 檢查 Dockerfile
    if [ ! -f "${context}/Dockerfile" ]; then
        echo -e "${RED}✗ 找不到 ${context}/Dockerfile${NC}"
        return 1
    fi
    
    # 構建
    echo -e "${YELLOW}構建中...${NC}"
    if docker build -t "${image_name}" "${context}"; then
        echo -e "${GREEN}✓ ${service} 構建成功${NC}"
    else
        echo -e "${RED}✗ ${service} 構建失敗${NC}"
        return 1
    fi
    
    # 推送
    echo -e "${YELLOW}推送到 Registry...${NC}"
    if docker push "${image_name}"; then
        echo -e "${GREEN}✓ ${service} 推送成功${NC}"
    else
        echo -e "${RED}✗ ${service} 推送失敗${NC}"
        return 1
    fi
    
    echo -e "${GREEN}✅ ${service} 完成 - ${image_name}${NC}"
}

# 要構建的服務
services_to_build=()

echo -e "${YELLOW}檢查可構建的服務...${NC}"

if [ -d "./api" ]; then
    services_to_build+=("api:./api")
    echo -e "${GREEN}✓ 找到 API 服務${NC}"
else
    echo -e "${YELLOW}⚠ 跳過 API 服務 (目錄不存在)${NC}"
fi

if [ -d "./dify-next-frontend" ]; then
    services_to_build+=("next-frontend:./dify-next-frontend")
    echo -e "${GREEN}✓ 找到 Next Frontend 服務${NC}"
    
    # 快速檢查 next-frontend 問題
    if [ -d "./dify-next-frontend/.babelrc.js" ]; then
        echo -e "${YELLOW}⚠ 檢測到 .babelrc.js 問題，建議先運行 ./fix-next-frontend.sh${NC}"
    fi
else
    echo -e "${YELLOW}⚠ 跳過 Next Frontend 服務 (目錄不存在)${NC}"
fi

if [ -d "./rest-to-soap-proxy" ]; then
    services_to_build+=("rest-to-soap-proxy:./rest-to-soap-proxy")
    echo -e "${GREEN}✓ 找到 REST to SOAP Proxy 服務${NC}"
else
    echo -e "${YELLOW}⚠ 跳過 REST to SOAP Proxy 服務 (目錄不存在)${NC}"
fi

if [ ${#services_to_build[@]} -eq 0 ]; then
    echo -e "${RED}錯誤: 沒有找到任何可構建的服務${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}將構建以下服務:${NC}"
for service_info in "${services_to_build[@]}"; do
    IFS=':' read -r service_name service_path <<< "$service_info"
    echo "- $service_name ($service_path)"
done

echo ""
read -p "繼續構建？(y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "已取消"
    exit 0
fi

# 構建所有服務
failed_services=()
successful_services=()

echo ""
echo -e "${YELLOW}開始構建...${NC}"

for service_info in "${services_to_build[@]}"; do
    IFS=':' read -r service_name service_path <<< "$service_info"
    if build_single_platform "$service_name" "$service_path"; then
        successful_services+=("$service_name")
    else
        failed_services+=("$service_name")
        
        # 詢問是否繼續
        echo ""
        read -p "${service_name} 構建失敗，是否繼續構建其他服務？(y/n): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            break
        fi
    fi
done

echo ""
echo -e "${GREEN}=== 構建完成！ ===${NC}"
echo ""

if [ ${#successful_services[@]} -gt 0 ]; then
    echo -e "${GREEN}✅ 成功構建的服務:${NC}"
    for service in "${successful_services[@]}"; do
        if [ "$service" = "rest-to-soap-proxy" ]; then
            echo "- ${REGISTRY}/${service}:${TAG}"
        else
            echo "- ${REGISTRY}/dify-${service}:${TAG}"
        fi
    done
    echo ""
fi

if [ ${#failed_services[@]} -gt 0 ]; then
    echo -e "${RED}❌ 失敗的服務: ${failed_services[*]}${NC}"
    echo ""
    echo -e "${YELLOW}建議:${NC}"
    for service in "${failed_services[@]}"; do
        if [ "$service" = "next-frontend" ]; then
            echo "- 對於 next-frontend，先運行: ./fix-next-frontend.sh"
        fi
    done
    echo ""
fi

if [ ${#successful_services[@]} -gt 0 ]; then
    echo -e "${YELLOW}下一步 (在 AWS EC2 上):${NC}"
    echo "1. 更新 docker-compose.yaml:"
    echo "   ./update-registry.sh ${REGISTRY}"
    echo ""
    echo "2. 部署到 EC2:"
    echo "   git add . && git commit -m 'Update Docker images' && git push"
    echo "   # 在 EC2 上："
    echo "   git pull && cd docker && docker-compose pull && docker-compose up -d"
fi
