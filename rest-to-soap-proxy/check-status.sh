#!/bin/bash

# 檢查和修復腳本

echo "=========================================="
echo "🔍 檢查 Urtracker Proxy 服務狀態"
echo "=========================================="

# 1. 檢查 Docker 容器
echo -e "\n1. 檢查運行中的容器..."
docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Ports}}\t{{.Status}}" | grep -E "NAME|soap|urtracker"

# 2. 檢查所有容器（包括停止的）
echo -e "\n2. 檢查所有相關容器..."
docker ps -a --format "table {{.Names}}\t{{.Image}}\t{{.Ports}}\t{{.Status}}" | grep -E "NAME|soap|urtracker"

# 3. 檢查端口佔用
echo -e "\n3. 檢查端口佔用..."
echo "5001 端口:"
sudo netstat -tlnp | grep 5001 || echo "  端口 5001 未被使用"
echo "5100 端口:"
sudo netstat -tlnp | grep 5100 || echo "  端口 5100 未被使用"

# 4. 測試服務
echo -e "\n4. 測試服務..."
echo "測試 5001 端口:"
curl -s http://localhost:5001/health 2>&1 | head -n 3 || echo "  5001 端口無法訪問"
echo -e "\n測試 5100 端口:"
curl -s http://localhost:5100/health 2>&1 | head -n 3 || echo "  5100 端口無法訪問"

# 5. 檢查 rest-to-soap-proxy 目錄
echo -e "\n5. 檢查項目目錄..."
if [ -d ~/dify/rest-to-soap-proxy ]; then
    echo "✓ 項目目錄存在: ~/dify/rest-to-soap-proxy"
    cd ~/dify/rest-to-soap-proxy
    
    echo -e "\n檢查關鍵文件:"
    ls -la index.js index-new.js index-backup.js src/clients/https-client.js 2>&1 | grep -v "cannot access"
    
    echo -e "\n檢查 package.json:"
    if [ -f package.json ]; then
        grep -E "version|main" package.json | head -n 3
    fi
else
    echo "✗ 項目目錄不存在: ~/dify/rest-to-soap-proxy"
fi

# 6. 檢查環境變數
echo -e "\n6. 檢查 .env 文件..."
if [ -f ~/dify/rest-to-soap-proxy/.env ]; then
    echo "✓ .env 文件存在"
    grep -E "^PORT=" ~/dify/rest-to-soap-proxy/.env || echo "  未設置 PORT 變數"
else
    echo "✗ .env 文件不存在"
fi

echo -e "\n=========================================="
echo "📋 診斷結果"
echo "=========================================="

# 檢查是否需要更新
if docker ps | grep -q "soap\|urtracker"; then
    CONTAINER_NAME=$(docker ps --format "{{.Names}}" | grep -E "soap|urtracker" | head -n 1)
    echo "發現運行中的容器: $CONTAINER_NAME"
    echo ""
    echo "可能的問題:"
    echo "1. 容器運行的是舊版本代碼（沒有 HTTPS API 路由）"
    echo "2. 端口配置不匹配（期望 5001，實際 5100）"
    echo ""
    echo "建議操作:"
    echo "1. 停止舊容器: docker stop $CONTAINER_NAME"
    echo "2. 進入項目目錄: cd ~/dify/rest-to-soap-proxy"
    echo "3. 重新部署: ./deploy.sh"
    echo ""
    echo "或者執行快速修復:"
    echo "  ./fix-deployment.sh"
else
    echo "未發現運行中的 Urtracker Proxy 容器"
    echo ""
    echo "建議操作:"
    echo "1. 進入項目目錄: cd ~/dify/rest-to-soap-proxy"
    echo "2. 運行部署腳本: ./deploy.sh"
fi

echo "=========================================="
