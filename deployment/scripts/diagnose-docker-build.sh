#!/bin/bash
# Docker 構建網絡問題診斷和修復腳本

echo "🔍 Docker 構建網絡問題診斷開始..."
echo "================================="

# 檢查操作系統
if [[ "$OSTYPE" == "darwin"* ]]; then
    OS="macOS"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="Linux"
else
    OS="Unknown"
fi

echo "檢測到操作系統: $OS"

echo ""
echo "📋 網絡診斷..."

# 1. 基礎網絡連接測試
echo "1. 測試基礎網絡連接:"
ping -c 3 8.8.8.8 > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ 基礎網絡連接正常"
else
    echo "❌ 基礎網絡連接失敗"
    echo "請檢查您的網絡連接"
fi

# 2. DNS 解析測試
echo "2. 測試 DNS 解析:"
nslookup deb.debian.org > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ DNS 解析正常"
else
    echo "❌ DNS 解析失敗"
fi

# 3. HTTP 連接測試
echo "3. 測試 Debian 倉庫連接:"
curl -I http://deb.debian.org/debian/ --connect-timeout 10 > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Debian 倉庫可訪問"
else
    echo "❌ 無法訪問 Debian 倉庫"
fi

# 4. Docker 狀態檢查
echo "4. 檢查 Docker 狀態:"
docker info > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Docker 服務正常"
else
    echo "❌ Docker 服務異常"
fi

echo ""
echo "🔧 開始修復..."

# 修復方案 1: 清理 Docker 緩存
echo "方案 1: 清理 Docker 構建緩存..."
docker builder prune -f
docker system prune -f

# 修復方案 2: 根據操作系統應用不同的修復
if [ "$OS" = "macOS" ]; then
    echo "方案 2: macOS Docker Desktop 修復..."
    echo "請手動重啟 Docker Desktop 並設置 DNS:"
    echo "Docker Desktop → Settings → Resources → Network"
    echo "設置 DNS 為: 8.8.8.8, 8.8.4.4"
    
elif [ "$OS" = "Linux" ]; then
    echo "方案 2: Linux Docker 服務修復..."
    
    # 創建或更新 Docker daemon 配置
    sudo mkdir -p /etc/docker
    sudo tee /etc/../docker/daemon.json > /dev/null <<EOF
{
  "dns": ["8.8.8.8", "8.8.4.4", "1.1.1.1"],
  "registry-mirrors": [
    "https://docker.mirrors.ustc.edu.cn",
    "https://hub-mirror.c.163.com"
  ],
  "max-concurrent-downloads": 10,
  "max-concurrent-uploads": 5
}
EOF
    
    # 重啟 Docker 服務
    sudo systemctl daemon-reload
    sudo systemctl restart docker
    
    echo "✅ Docker 服務配置已更新並重啟"
fi

# 修復方案 3: 設置構建環境變數
echo "方案 3: 設置構建環境變數..."
export DOCKER_BUILDKIT=1
export BUILDKIT_INLINE_CACHE=1

echo ""
echo "✅ 修復完成！"
echo ""
echo "🚀 建議的構建方法:"
echo ""
echo "方法 1 - 使用網絡主機模式 (推薦):"
echo "docker build --network=host -t andywu719/dify-api:latest api/"
echo ""
echo "方法 2 - 使用 buildx 多平台構建:"
echo "docker buildx create --use --name multiarch --driver docker-container"
echo "docker buildx build --platform linux/amd64 --network=host -t andywu719/dify-api:latest api/"
echo ""
echo "方法 3 - 使用代理構建 (如果有代理):"
echo "docker build --build-arg HTTP_PROXY=http://proxy:port --build-arg HTTPS_PROXY=http://proxy:port -t andywu719/dify-api:latest api/"
echo ""
echo "方法 4 - 跳過問題套件 (臨時解決方案):"
echo "修改 Dockerfile，在 apt-get 命令中添加 --fix-missing 參數"

echo ""
echo "💡 其他建議:"
echo "1. 檢查防火牆設置"
echo "2. 確認網絡代理配置"
echo "3. 嘗試在不同時間構建（避開網絡高峰期）"
echo "4. 考慮使用本地鏡像或離線構建"

echo ""
echo "================================="
echo "🔍 診斷完成"
