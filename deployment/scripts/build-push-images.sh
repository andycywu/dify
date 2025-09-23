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
AWS_MODE=false
for arg in "$@"; do
    case $arg in
        --multiplatform)
            MULTIPLATFORM=true
            ;;
        --aws)
            AWS_MODE=true
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
if [ "$AWS_MODE" = true ]; then
    PLATFORMS="linux/amd64"
    BUILD_TYPE="AWS EC2 專用單平台"
    echo -e "${YELLOW}⚠️  AWS EC2 模式：僅構建 linux/amd64 單平台映像，適用於 EC2 部署。${NC}"
    echo -e "${YELLOW}⚠️  若需多平台請勿加 --aws 參數。${NC}"
    MULTIPLATFORM=false
elif [ "$MULTIPLATFORM" = true ]; then
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
    # next-frontend 根據環境自動帶 build-arg ENV_FILE
    local env_file_arg=""
    if [ "$service" = "next-frontend" ]; then
        if [ "$AWS_MODE" = true ]; then
            env_file_arg="--build-arg ENV_FILE=.env.aws"
        else
            env_file_arg="--build-arg ENV_FILE=.env.docker"
        fi
    fi

    if [ "$MULTIPLATFORM" = true ]; then
        # 多平台構建
        echo -e "${YELLOW}使用 buildx 進行多平台構建...${NC}"
        local build_args="--platform ${PLATFORMS} ${env_file_arg}"
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
        local build_args="${env_file_arg}"
        if [ "${BUILD_NO_CACHE}" = "true" ]; then
            build_args="${build_args} --no-cache"
        fi
        # 單平台構建時自動加大 UV_HTTP_TIMEOUT，解決 uv sync 下載超時問題
        if grep -q 'uv sync' "${context}/Dockerfile"; then
            echo -e "${YELLOW}自動加大 UV_HTTP_TIMEOUT=120 以避免 uv sync 超時...${NC}"
            cp "${context}/Dockerfile" "${context}/Dockerfile.bak.timeout"
            sed -i.bak 's|RUN uv sync|RUN UV_HTTP_TIMEOUT=120 uv sync|g' "${context}/Dockerfile"
        fi
        if docker build ${build_args} -t "${image_name}" "${context}"; then
            echo -e "${GREEN}✓ ${service} 構建成功${NC}"
        else
            echo -e "${RED}✗ ${service} 構建失敗${NC}"
            # 還原 Dockerfile
            if [ -f "${context}/Dockerfile.bak.timeout" ]; then
                mv "${context}/Dockerfile.bak.timeout" "${context}/Dockerfile"
            fi
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
        # 還原 Dockerfile
        if [ -f "${context}/Dockerfile.bak.timeout" ]; then
            mv "${context}/Dockerfile.bak.timeout" "${context}/Dockerfile"
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

# 合併 AWS 服務選擇與 next-frontend 快速檢查
echo -e "\n${YELLOW}步驟 1: 檢查可構建的服務...${NC}"
services_to_build=()
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
for idx in "${!services_to_build[@]}"; do
    IFS=':' read -r service_name service_path <<< "${services_to_build[$idx]}"
    echo "$((idx+1)). $service_name ($service_path)"
done

echo ""
echo -e "${YELLOW}請輸入要構建的服務編號（用逗號分隔，直接 Enter 則全部）：${NC}"
read -p "> " selected

if [ -n "$selected" ]; then
    IFS=',' read -ra selected_arr <<< "$selected"
    selected_services=()
    for sel in "${selected_arr[@]}"; do
        sel_idx=$((sel-1))
        if [ $sel_idx -ge 0 ] && [ $sel_idx -lt ${#services_to_build[@]} ]; then
            selected_services+=("${services_to_build[$sel_idx]}")
        fi
    done
    services_to_build=("${selected_services[@]}")
fi

echo ""
if [ ${#services_to_build[@]} -eq 0 ]; then
    echo -e "${RED}未選擇任何服務，已取消${NC}"
    exit 0
fi

echo -e "${YELLOW}最終將構建:${NC}"
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

# 構建和推送所有服務
failed_services=()
successful_services=()

echo ""
echo -e "${YELLOW}開始構建...${NC}"
for service_info in "${services_to_build[@]}"; do
    IFS=':' read -r service_name service_path <<< "$service_info"
    if build_and_push "$service_name" "$service_path"; then
        successful_services+=("$service_name")
    else
        failed_services+=("$service_name")
        # AWS 模式下詢問是否繼續
        if [ "$AWS_MODE" = true ]; then
            echo ""
            read -p "${service_name} 構建失敗，是否繼續構建其他服務？(y/n): " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                break
            fi
        fi
    fi
done

echo ""
echo -e "${GREEN}=== 構建和推送完成！ ===${NC}"
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
    echo "   git pull && cd ../docker && docker-compose pull && docker-compose up -d"
fi
