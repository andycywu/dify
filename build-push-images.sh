#!/bin/bash

# Dify 自定義 Images 構建和推送腳本
# 使用方法: ./build-push-images.sh [registry-name] [--multiplatform]

set -e

# 載入環境變數配置（如果存在）
if [ -f ".env.docker" ]; then
    source .env.docker
fi

# 解析參數
MULTIPLATFORM=false
for arg in "$@"; do
    case $arg in
        --multiplatform)
            MULTIPLATFORM=true
            shift
            ;;
        *)
            if [ -z "$REGISTRY" ]; then
                REGISTRY="$arg"
            fi
            ;;
    esac
done

# 設置預設的 registry 名稱
DEFAULT_REGISTRY="${DOCKER_REGISTRY:-your-registry}"
REGISTRY="${REGISTRY:-$DEFAULT_REGISTRY}"
TAG="${IMAGE_TAG:-latest}"

# 設置構建平台
if [ "$MULTIPLATFORM" = true ]; then
    PLATFORMS="linux/amd64,linux/arm64"
    BUILD_TYPE="多平台"
    echo -e "${YELLOW}⚠️  注意：多平台構建需要更長時間，特別是對於 Node.js 應用${NC}"
    echo -e "${YELLOW}⚠️  如果只需要在 AWS EC2 (AMD64) 上部署，建議使用單平台構建${NC}"
else
    PLATFORMS="linux/amd64"  # EC2 使用的平台
    BUILD_TYPE="單平台"
fi

# 顏色設置
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Dify 自定義 Images 構建和推送腳本 ===${NC}"
echo -e "${YELLOW}Registry: ${REGISTRY}${NC}"
echo -e "${YELLOW}Tag: ${TAG}${NC}"
echo -e "${YELLOW}構建類型: ${BUILD_TYPE}${NC}"
echo -e "${YELLOW}平台: ${PLATFORMS}${NC}"
echo ""

# 檢查 Docker 是否運行
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}錯誤: Docker 沒有運行，請啟動 Docker${NC}"
    exit 1
fi

# 檢查多平台構建支援
if [ "$MULTIPLATFORM" = true ]; then
    echo -e "${BLUE}檢查多平台構建支援...${NC}"
    if ! docker buildx version > /dev/null 2>&1; then
        echo -e "${YELLOW}安裝並設置 Docker buildx...${NC}"
        docker buildx create --use --name multiarch || true
        docker buildx use multiarch
    else
        # 確保使用支援多平台的 builder
        if ! docker buildx ls | grep -q "multiarch"; then
            docker buildx create --use --name multiarch
        else
            docker buildx use multiarch
        fi
    fi
    echo -e "${GREEN}✓ 多平台構建環境已準備就緒${NC}"
fi

# 檢查 Registry 名稱
if [ "$REGISTRY" = "your-registry" ]; then
    echo -e "${RED}錯誤: 請設置實際的 Registry 名稱${NC}"
    echo "使用方法: $0 your-dockerhub-username"
    echo "或編輯 .env.docker 文件設置 DOCKER_REGISTRY"
    exit 1
fi

# 詢問是否登入
echo -e "${BLUE}檢查 Docker Registry 登入狀態...${NC}"
read -p "您是否已經登入到 ${REGISTRY}? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}請先登入 Docker Registry:${NC}"
    echo "Docker Hub: docker login"
    echo "AWS ECR: aws ecr get-login-password --region your-region | docker login --username AWS --password-stdin your-account.dkr.ecr.region.amazonaws.com"
    echo "GitHub: echo \$GITHUB_TOKEN | docker login ghcr.io -u your-username --password-stdin"
    exit 1
fi

# 構建和推送函數
build_and_push() {
    local service=$1
    local context=$2
    
    # 設置 image 名稱（rest-to-soap-proxy 不加 dify- 前綴）
    local image_name
    echo -e "${BLUE}Debug: service = ${service}${NC}"  # 調試信息
    
    if [ "$service" = "rest-to-soap-proxy" ]; then
        image_name="${REGISTRY}/${service}:${TAG}"
        echo -e "${BLUE}使用原始名稱: ${image_name}${NC}"
    else
        image_name="${REGISTRY}/dify-${service}:${TAG}"
        echo -e "${BLUE}使用 dify- 前綴: ${image_name}${NC}"
    fi
    
    echo -e "\n${BLUE}=== 處理 ${service} ===${NC}"
    
    # 檢查 Dockerfile 是否存在
    if [ ! -f "${context}/Dockerfile" ]; then
        echo -e "${RED}✗ 找不到 ${context}/Dockerfile${NC}"
        return 1
    fi
    
    # 特殊檢查 next-frontend 的常見問題
    if [ "$service" = "next-frontend" ]; then
        echo -e "${YELLOW}檢查 Next.js 前端構建環境...${NC}"
        
        # 檢查是否有錯誤的 .babelrc.js 目錄
        if [ -d "${context}/.babelrc.js" ]; then
            echo -e "${YELLOW}發現錯誤的 .babelrc.js 目錄，正在刪除...${NC}"
            rm -rf "${context}/.babelrc.js"
        fi
        
        # 如果有 .babelrc.js 檔案，建議移除以使用 SWC
        if [ -f "${context}/.babelrc.js" ]; then
            echo -e "${YELLOW}建議移除 .babelrc.js 以使用 Next.js 15 的 SWC...${NC}"
            mv "${context}/.babelrc.js" "${context}/.babelrc.js.backup"
            echo -e "${GREEN}✓ .babelrc.js 已備份，使用 SWC 構建${NC}"
        fi
        
        # 檢查和修復 Dockerfile 問題
        if [ -f "${context}/Dockerfile" ]; then
            # 修復 locales 路徑
            if grep -q "/app/src/lib/locales" "${context}/Dockerfile"; then
                echo -e "${YELLOW}修復 Dockerfile 中的 locales 路徑...${NC}"
                sed -i.bak 's|/app/src/lib/locales|/app/locales|g' "${context}/Dockerfile"
                echo -e "${GREEN}✓ 已修復 locales 路徑${NC}"
            fi
            
            # 修復 ENV 格式
            if grep -q "ENV NEXT_TELEMETRY_DISABLED 1" "${context}/Dockerfile"; then
                echo -e "${YELLOW}修復 ENV 格式...${NC}"
                sed -i.bak 's|ENV NEXT_TELEMETRY_DISABLED 1|ENV NEXT_TELEMETRY_DISABLED=1|g' "${context}/Dockerfile"
                echo -e "${GREEN}✓ 已修復 ENV 格式${NC}"
            fi
        fi
        
        # 檢查 package.json 是否存在
        if [ ! -f "${context}/package.json" ]; then
            echo -e "${RED}✗ 找不到 package.json${NC}"
            return 1
        fi
    fi
    
    echo -e "${YELLOW}Image: ${image_name}${NC}"
    echo -e "${YELLOW}平台: ${PLATFORMS}${NC}"
    
    # 根據構建類型選擇方法
    if [ "$MULTIPLATFORM" = true ]; then
        # 多平台構建
        echo -e "${YELLOW}使用 buildx 進行多平台構建...${NC}"
        local build_args="--platform ${PLATFORMS}"
        if [ "${BUILD_NO_CACHE}" = "true" ]; then
            build_args="${build_args} --no-cache"
        fi
        
        if docker buildx build ${build_args} -t "${image_name}" --push "${context}"; then
            echo -e "${GREEN}✓ ${service} 多平台構建和推送成功${NC}"
        else
            echo -e "${RED}✗ ${service} 多平台構建失敗${NC}"
            
            # 提供建議
            if [ "$service" = "next-frontend" ]; then
                echo -e "${YELLOW}建議:${NC}"
                echo "1. 檢查 .babelrc.js 檔案是否正確"
                echo "2. 嘗試先在本地運行 'npm run build' 確認無誤"
                echo "3. 考慮使用單平台構建 (不加 --multiplatform 參數)"
                echo "4. 檢查 Node.js 版本兼容性"
            fi
            return 1
        fi
    else
        # 單平台構建
        echo -e "${YELLOW}構建 ${image_name}...${NC}"
        local build_args=""
        if [ "${BUILD_NO_CACHE}" = "true" ]; then
            build_args="--no-cache"
        fi
        
        if docker build ${build_args} -t "${image_name}" "${context}"; then
            echo -e "${GREEN}✓ ${service} 構建成功${NC}"
        else
            echo -e "${RED}✗ ${service} 構建失敗${NC}"
            
            # 提供建議
            if [ "$service" = "next-frontend" ]; then
                echo -e "${YELLOW}建議:${NC}"
                echo "1. 檢查 .babelrc.js 檔案是否正確"
                echo "2. 嘗試先在本地運行 'npm run build' 確認無誤"
                echo "3. 檢查 package.json 和 package-lock.json"
                echo "4. 檢查 Node.js 版本兼容性"
            fi
            return 1
        fi
        
        # 推送
        echo -e "${YELLOW}推送 ${image_name}...${NC}"
        if docker push "${image_name}"; then
            echo -e "${GREEN}✓ ${service} 推送成功${NC}"
        else
            echo -e "${RED}✗ ${service} 推送失敗${NC}"
            return 1
        fi
    fi
    
    echo -e "${GREEN}✅ ${service} 完成 - ${image_name}${NC}"
}

# 構建所有 images
echo -e "\n${YELLOW}步驟 1: 構建和推送所有自定義 images (${BUILD_TYPE})${NC}"

# 檢查服務目錄是否存在
services_to_build=()
if [ -d "./api" ]; then
    services_to_build+=("api:./api")
else
    echo -e "${RED}警告: ./api 目錄不存在${NC}"
fi

if [ -d "./dify-next-frontend" ]; then
    services_to_build+=("next-frontend:./dify-next-frontend")
else
    echo -e "${YELLOW}注意: ./dify-next-frontend 目錄不存在，跳過${NC}"
fi

if [ -d "./rest-to-soap-proxy" ]; then
    services_to_build+=("rest-to-soap-proxy:./rest-to-soap-proxy")
else
    echo -e "${YELLOW}注意: ./rest-to-soap-proxy 目錄不存在，跳過${NC}"
fi

if [ ${#services_to_build[@]} -eq 0 ]; then
    echo -e "${RED}錯誤: 沒有找到任何可構建的服務${NC}"
    exit 1
fi

# 構建和推送所有服務
failed_services=()
for service_info in "${services_to_build[@]}"; do
    IFS=':' read -r service_name service_path <<< "$service_info"
    if ! build_and_push "$service_name" "$service_path"; then
        failed_services+=("$service_name")
    fi
done

echo ""
if [ ${#failed_services[@]} -eq 0 ]; then
    echo -e "${GREEN}🎉 所有 images 構建和推送完成！${NC}"
    echo -e "${BLUE}構建類型: ${BUILD_TYPE}${NC}"
    echo -e "${BLUE}支援平台: ${PLATFORMS}${NC}"
else
    echo -e "${RED}❌ 以下服務失敗: ${failed_services[*]}${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}=== 構建和推送完成！ ===${NC}"
echo ""
echo -e "${YELLOW}下一步:${NC}"
echo "1. 更新 docker-compose.yaml 中的 registry 名稱："
echo "   ./update-registry.sh ${REGISTRY}"
echo ""
echo "2. 提交變更到 Git："
echo "   git add ."
echo "   git commit -m 'Update to use custom Docker images'"
echo "   git push origin main"
echo ""
echo "3. 在 AWS EC2 上部署："
echo "   git pull origin main"
echo "   cd docker"
echo "   docker-compose pull"
echo "   docker-compose up -d"
echo ""
echo -e "${YELLOW}構建的 images:${NC}"
for service_info in "${services_to_build[@]}"; do
    IFS=':' read -r service_name service_path <<< "$service_info"
    if [ "$service_name" = "rest-to-soap-proxy" ]; then
        echo "- ${REGISTRY}/${service_name}:${TAG}"
    else
        echo "- ${REGISTRY}/dify-${service_name}:${TAG}"
    fi
done
