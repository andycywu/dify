#!/bin/bash

# 快速部署到 EC2 腳本
# 用法: ./quick-deploy-to-ec2.sh [commit-message]

set -e  # 遇到錯誤時退出

# 顏色輸出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 開始 dify-next-frontend 部署到 EC2${NC}"

# 檢查是否在正確的目錄
if [ ! -d "dify-next-frontend" ]; then
    echo -e "${RED}❌ 錯誤：請在 dify 專案根目錄執行此腳本${NC}"
    exit 1
fi

# 設定提交訊息
COMMIT_MSG=${1:-"更新 dify-next-frontend 配置和構建"}

echo -e "${YELLOW}📁 步驟 1/4: 清理並重新構建前端${NC}"
cd dify-next-frontend

# 確保使用正確的環境設定
cp .env.aws .env

# 清理並重新構建
echo "清理舊的構建文件..."
rm -rf .next
rm -rf node_modules/.cache

echo "執行生產環境構建..."
NODE_ENV=production npm run build

# 驗證構建結果
echo "驗證構建結果..."
if find .next -name "*.js" -exec grep -l "54\.169\.166\.197" {} \; | grep -q .; then
    echo -e "${GREEN}✅ 構建包含正確的 EC2 IP${NC}"
else
    echo -e "${RED}❌ 警告：構建可能未包含正確的 EC2 IP${NC}"
fi

if find .next -name "*.js" -exec grep -l "app-ldXAyD3A91tXzB6Kkd8hlyP2" {} \; | grep -q .; then
    echo -e "${GREEN}✅ 構建包含正確的 API Key${NC}"
else
    echo -e "${RED}❌ 警告：構建可能未包含正確的 API Key${NC}"
fi

cd ..

echo -e "${YELLOW}📦 步驟 2/4: 構建並推送 Docker 映像${NC}"
if [ -f "./build-aws-images.sh" ]; then
    ./build-aws-images.sh andywu719
    echo -e "${GREEN}✅ Docker 映像構建並推送成功${NC}"
else
    echo -e "${RED}❌ 找不到 build-aws-images.sh 腳本${NC}"
    exit 1
fi

echo -e "${YELLOW}📝 步驟 3/4: 提交到 Git${NC}"
git add .
git commit -m "$COMMIT_MSG

詳細修改：
- 更新 dify-next-frontend 配置
- 修復 localhost 硬編碼問題  
- 使用正確的 EC2 IP: 54.169.166.197
- 使用正確的 API Key: app-ldXAyD3A91tXzB6Kkd8hlyP2
- 重新構建生產環境版本"

git push origin main
echo -e "${GREEN}✅ 代碼已推送到 Git${NC}"

echo -e "${YELLOW}🚀 步驟 4/4: 提供 EC2 部署指令${NC}"
echo -e "${GREEN}請在 EC2 上執行以下指令：${NC}"
echo ""
echo -e "${YELLOW}ssh -i tpv-dify-key.pem ec2-user@54.169.166.197${NC}"
echo -e "${YELLOW}cd /home/ec2-user/dify${NC}"
echo -e "${YELLOW}git pull origin main${NC}"
echo -e "${YELLOW}docker-compose up -d dify-next-frontend${NC}"
echo ""

echo -e "${GREEN}✅ 本地部署準備完成！${NC}"
echo -e "${GREEN}🌐 部署後請訪問: http://54.169.166.197:8080${NC}"

# 提供驗證指令
echo ""
echo -e "${YELLOW}🔍 驗證部署成功：${NC}"
echo "1. API 連接測試："
echo "   curl -H \"Authorization: Bearer app-ldXAyD3A91tXzB6Kkd8hlyP2\" \"http://54.169.166.197/v1/conversations?user=test-user\""
echo ""
echo "2. 在瀏覽器 DevTools Network 選項卡中確認 API 請求指向正確的 EC2 IP"

echo -e "${GREEN}🎉 部署腳本執行完成！${NC}"
