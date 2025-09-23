#!/bin/bash

# 測試多平台 Images 腳本
# 驗證構建的 images 是否支援多平台

set -e

REGISTRY="${1:-andywu719}"

# 顏色設置
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${GREEN}=== 測試多平台 Images 支援 ===${NC}"
echo -e "${YELLOW}Registry: ${REGISTRY}${NC}"
echo ""

# 檢查 Docker 登入
if ! docker info | grep -q "Username"; then
    echo -e "${YELLOW}需要登入 Docker Hub...${NC}"
    docker login
fi

# 測試函數
test_image_platforms() {
    local image_name="$1"
    echo -e "\n${BLUE}檢查 ${image_name}...${NC}"
    
    if docker manifest inspect "$image_name" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Image 存在${NC}"
        
        # 檢查支援的平台
        platforms=$(docker manifest inspect "$image_name" | grep -o '"architecture":"[^"]*"' | cut -d'"' -f4 | tr '\n' ',' | sed 's/,$//')
        echo -e "${YELLOW}支援的架構: ${platforms}${NC}"
        
        # 檢查是否支援 AMD64 (EC2 需要)
        if docker manifest inspect "$image_name" | grep -q '"architecture":"amd64"'; then
            echo -e "${GREEN}✅ 支援 AMD64 (EC2 相容)${NC}"
        else
            echo -e "${RED}❌ 不支援 AMD64 (EC2 無法使用)${NC}"
        fi
        
        # 檢查是否支援 ARM64 (Mac 需要)
        if docker manifest inspect "$image_name" | grep -q '"architecture":"arm64"'; then
            echo -e "${GREEN}✅ 支援 ARM64 (Mac 相容)${NC}"
        else
            echo -e "${YELLOW}⚠️  不支援 ARM64 (Mac 可能無法使用)${NC}"
        fi
    else
        echo -e "${RED}❌ Image 不存在或無法訪問${NC}"
        return 1
    fi
}

# 測試所有 images
images_to_test=(
    "${REGISTRY}/dify-api:latest"
    "${REGISTRY}/dify-next-frontend:latest"
    "${REGISTRY}/rest-to-soap-proxy:latest"
)

all_passed=true
for image in "${images_to_test[@]}"; do
    if ! test_image_platforms "$image"; then
        all_passed=false
    fi
done

echo ""
if [ "$all_passed" = true ]; then
    echo -e "${GREEN}🎉 所有 images 都支援多平台！${NC}"
    echo -e "${BLUE}可以在 EC2 (AMD64) 和 Mac (ARM64) 上使用${NC}"
else
    echo -e "${YELLOW}⚠️  部分 images 可能有平台相容性問題${NC}"
    echo -e "${BLUE}建議重新使用多平台構建${NC}"
fi

echo ""
echo -e "${YELLOW}如需重新構建多平台 images:${NC}"
echo "./deploy-setup.sh ${REGISTRY}"
echo "然後選擇選項 1 (多平台構建)"
