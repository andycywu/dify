#!/bin/bash

# 快速更新脚本 - 修复 Cookie 管理问题

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "=========================================="
echo "🔄 更新 Urtracker Proxy (修复 Cookie 问题)"
echo "=========================================="

CONTAINER_NAME="urtracker-proxy"
IMAGE_NAME="urtracker-proxy"

# 1. 检查项目目录
echo -e "\n${YELLOW}[1/5]${NC} 检查项目目录..."
cd ~/dify/rest-to-soap-proxy || exit 1
echo -e "${GREEN}✓ 当前目录: $(pwd)${NC}"

# 2. 检查更新的文件
echo -e "\n${YELLOW}[2/5]${NC} 检查更新的文件..."
if [ -f src/clients/https-client.js ]; then
    echo -e "${GREEN}✓ https-client.js 存在${NC}"
    
    # 检查是否包含新的代码
    if grep -q "允許重定向以獲取認證 Cookie" src/clients/https-client.js; then
        echo -e "${GREEN}✓ 代码已更新（包含 Cookie 修复）${NC}"
    else
        echo -e "${RED}✗ 代码未更新，请先同步最新代码${NC}"
        echo "运行: scp -r c:/Users/andycy.wu/dify/rest-to-soap-proxy/src obmid@172.27.197.100:~/dify/rest-to-soap-proxy/"
        exit 1
    fi
else
    echo -e "${RED}✗ https-client.js 不存在${NC}"
    exit 1
fi

# 3. 停止旧容器
echo -e "\n${YELLOW}[3/5]${NC} 停止旧容器..."
if docker ps | grep -q $CONTAINER_NAME; then
    docker stop $CONTAINER_NAME
    docker rm $CONTAINER_NAME
    echo -e "${GREEN}✓ 旧容器已停止${NC}"
else
    echo -e "${GREEN}✓ 无运行中的容器${NC}"
fi

# 4. 重新构建镜像
echo -e "\n${YELLOW}[4/5]${NC} 重新构建 Docker 镜像..."
docker build -t $IMAGE_NAME:latest . --no-cache

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ 镜像构建失败${NC}"
    exit 1
fi
echo -e "${GREEN}✓ 镜像构建成功${NC}"

# 5. 启动新容器
echo -e "\n${YELLOW}[5/5]${NC} 启动新容器..."
docker run -d \
  --name $CONTAINER_NAME \
  -p 5001:5001 \
  --env-file .env \
  --restart unless-stopped \
  $IMAGE_NAME:latest

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ 容器启动失败${NC}"
    exit 1
fi

echo -e "${GREEN}✓ 容器启动成功${NC}"

# 等待服务启动
echo -e "\n等待服务启动..."
sleep 5

# 测试服务
echo -e "\n=========================================="
echo -e "${GREEN}✅ 更新完成！${NC}"
echo "=========================================="

echo -e "\n🧪 测试新功能..."

# 测试健康检查
echo -e "\n1. 健康检查:"
curl -s http://localhost:5001/health | head -n 5

# 测试登入（会显示更详细的 Cookie 信息）
echo -e "\n\n2. 测试登入（查看 Cookie 收集）:"
echo "执行登入测试..."

# 显示容器日志（查看 Cookie 详情）
echo -e "\n📋 查看登入日志（最后 30 行）:"
docker logs --tail 30 $CONTAINER_NAME

echo -e "\n=========================================="
echo "🎯 下一步测试:"
echo "=========================================="
echo "1. 登入并查看 Cookie:"
echo "   curl -X POST http://localhost:5001/api/https/login \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"username\":\"andycy.wu@tpv-tech.com\",\"password\":\"XrnkE\$F4S.kAuyV1\"}'"
echo ""
echo "2. 查看日志中的 Cookie 类型:"
echo "   docker logs urtracker-proxy 2>&1 | grep -A 5 'Cookie 類型'"
echo ""
echo "3. 测试下载:"
echo "   curl -O http://localhost:5001/api/https/download-by-name/TV"
echo ""
echo "4. 检查文件类型:"
echo "   file TV"
echo "=========================================="
