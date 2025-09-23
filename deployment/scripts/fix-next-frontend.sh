#!/bin/bash

# Dify Next Frontend 快速修復和測試腳本

set -e

# 顏色設置
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${GREEN}=== Dify Next Frontend 快速修復腳本 ===${NC}"
echo ""

# 進入 next frontend 目錄
cd dify-next-frontend || {
    echo -e "${RED}錯誤：找不到 dify-next-frontend 目錄${NC}"
    exit 1
}

echo -e "${YELLOW}步驟 1: 檢查和修復常見問題...${NC}"

# 1. 檢查和修復 .babelrc.js
echo -e "${BLUE}檢查 .babelrc.js...${NC}"
if [ -d ".babelrc.js" ]; then
    echo -e "${YELLOW}發現 .babelrc.js 是目錄，正在刪除...${NC}"
    rm -rf .babelrc.js
    echo -e "${GREEN}✓ 已刪除錯誤的目錄${NC}"
elif [ -f ".babelrc.js" ]; then
    echo -e "${YELLOW}Found .babelrc.js 檔案，建議移除以使用 Next.js 15 的 SWC...${NC}"
    mv .babelrc.js .babelrc.js.backup
    echo -e "${GREEN}✓ .babelrc.js 已備份並移除，使用 SWC${NC}"
else
    echo -e "${GREEN}✓ 沒有 .babelrc.js，使用 Next.js 15 的 SWC${NC}"
fi

# 2. 檢查 package.json
echo -e "${BLUE}檢查 package.json...${NC}"
if [ ! -f "package.json" ]; then
    echo -e "${RED}✗ 找不到 package.json${NC}"
    exit 1
else
    echo -e "${GREEN}✓ package.json 存在${NC}"
fi

# 3. 檢查和安裝依賴
echo -e "${BLUE}檢查依賴安裝...${NC}"
if [ ! -d "node_modules" ] || [ ! -f "package-lock.json" ]; then
    echo -e "${YELLOW}安裝依賴...${NC}"
    npm install
    echo -e "${GREEN}✓ 依賴安裝完成${NC}"
else
    echo -e "${GREEN}✓ 依賴已安裝${NC}"
fi

# 4. 檢查和修復 Dockerfile
echo -e "${BLUE}檢查 Dockerfile...${NC}"
if [ ! -f "Dockerfile" ]; then
    echo -e "${RED}✗ 找不到 Dockerfile${NC}"
    exit 1
else
    echo -e "${GREEN}✓ Dockerfile 存在${NC}"
    
    # 檢查和修復常見的 Dockerfile 問題
    if grep -q "/app/src/lib/locales" Dockerfile; then
        echo -e "${YELLOW}修復 Dockerfile 中的 locales 路徑...${NC}"
        sed -i.bak 's|/app/src/lib/locales|/app/locales|g' Dockerfile
        echo -e "${GREEN}✓ 已修復 locales 路徑${NC}"
    fi
    
    if grep -q "ENV NEXT_TELEMETRY_DISABLED 1" Dockerfile; then
        echo -e "${YELLOW}修復 ENV 格式...${NC}"
        sed -i.bak 's|ENV NEXT_TELEMETRY_DISABLED 1|ENV NEXT_TELEMETRY_DISABLED=1|g' Dockerfile
        echo -e "${GREEN}✓ 已修復 ENV 格式${NC}"
    fi
fi

# 5. 清理 Next.js 緩存
echo -e "${BLUE}清理 Next.js 緩存...${NC}"
rm -rf .next
echo -e "${GREEN}✓ 緩存已清理${NC}"

# 6. 測試本地構建
echo -e "${YELLOW}步驟 2: 測試本地構建...${NC}"
echo -e "${BLUE}嘗試本地構建 (這可能需要幾分鐘)...${NC}"

if npm run build; then
    echo -e "${GREEN}✅ 本地構建成功！${NC}"
    LOCAL_BUILD_SUCCESS=true
else
    echo -e "${RED}❌ 本地構建失敗${NC}"
    LOCAL_BUILD_SUCCESS=false
fi

echo ""
echo -e "${YELLOW}步驟 3: 檢查 Docker 構建環境...${NC}"

# 檢查 Docker 是否運行
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}✗ Docker 沒有運行${NC}"
    echo "請啟動 Docker Desktop 然後重試"
    DOCKER_AVAILABLE=false
else
    echo -e "${GREEN}✓ Docker 正在運行${NC}"
    DOCKER_AVAILABLE=true
fi

echo ""
echo -e "${YELLOW}步驟 4: 檢查 Dockerfile...${NC}"

# 檢查 Dockerfile
if [ ! -f "Dockerfile" ]; then
    echo -e "${RED}✗ 找不到 Dockerfile${NC}"
    exit 1
fi

# 檢查 Dockerfile 內容
if grep -q "COPY \. \." Dockerfile; then
    echo -e "${GREEN}✓ Dockerfile 複製指令正確${NC}"
else
    echo -e "${YELLOW}⚠ Dockerfile 可能需要調整${NC}"
fi

echo ""
echo -e "${GREEN}=== 修復完成！ ===${NC}"
echo ""

if [ "$LOCAL_BUILD_SUCCESS" = true ]; then
    echo -e "${GREEN}✅ 本地構建成功${NC}"
    
    if [ "$DOCKER_AVAILABLE" = true ]; then
        echo -e "${GREEN}✅ Docker 環境就緒${NC}"
        echo ""
        echo -e "${YELLOW}建議的下一步:${NC}"
        echo "1. AWS 專用單平台構建測試:"
        echo "   cd .."
        echo "   ./build-aws-images.sh your-registry"
        echo ""
        echo "2. 如果單平台成功，再嘗試多平台:"
        echo "   ./build-push-images.sh your-registry --multiplatform"
    else
        echo -e "${YELLOW}⚠ Docker 未運行，請啟動 Docker 後再進行容器構建${NC}"
    fi
else
    echo -e "${RED}❌ 本地構建失敗，需要解決以下問題:${NC}"
    echo ""
    echo -e "${YELLOW}常見解決方案:${NC}"
    echo "1. 檢查 Node.js 版本 (建議 18.x):"
    echo "   node --version"
    echo ""
    echo "2. 清理並重新安裝依賴:"
    echo "   rm -rf node_modules package-lock.json"
    echo "   npm install"
    echo ""
    echo "3. 移除 Babel 配置，使用 Next.js 15 的 SWC:"
    echo "   rm -f .babelrc.js"
    echo "   npm run build"
    echo ""
    echo "4. 檢查 TypeScript 錯誤:"
    echo "   npm run type-check"
    echo ""
    echo "5. 檢查 ESLint 錯誤:"
    echo "   npm run lint"
fi

echo ""
echo -e "${YELLOW}除錯資訊:${NC}"
echo "Node.js 版本: $(node --version)"
echo "NPM 版本: $(npm --version)"
echo "當前目錄: $(pwd)"
echo "檔案結構:"
ls -la | head -10
