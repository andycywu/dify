#!/bin/bash
# EC2 Docker 構建修復腳本

echo "🔧 修復 EC2 環境 Docker 構建問題..."

echo "📋 檢查當前環境..."
echo "當前網絡狀態:"
ip route show

echo ""
echo "DNS 配置:"
cat /etc/resolv.conf

echo ""
echo "🌐 測試網絡連接..."
echo "測試基礎連接:"
ping -c 3 8.8.8.8

echo "測試 Debian 倉庫:"
curl -I http://deb.debian.org/debian/ --connect-timeout 10

echo ""
echo "🔧 應用修復..."

# 1. 設置更可靠的 DNS
echo "1. 設置 DNS..."
sudo tee /etc/docker/daemon.json > /dev/null <<EOF
{
  "dns": ["8.8.8.8", "8.8.4.4", "1.1.1.1"],
  "registry-mirrors": ["https://docker.mirrors.ustc.edu.cn"]
}
EOF

# 2. 重啟 Docker
echo "2. 重啟 Docker 服務..."
sudo systemctl restart docker

# 3. 清理構建緩存
echo "3. 清理 Docker 構建緩存..."
docker builder prune -f

# 4. 設置構建參數
echo "4. 設置構建環境變數..."
export DOCKER_BUILDKIT=1
export BUILDX_NO_DEFAULT_ATTESTATIONS=1

echo ""
echo "✅ 修復完成！"
echo ""
echo "🚀 建議的構建命令:"
echo "docker buildx build --platform linux/amd64 \\"
echo "  --build-arg BUILDKIT_INLINE_CACHE=1 \\"
echo "  --network=host \\"
echo "  -t andywu719/dify-api:latest \\"
echo "  -f api/Dockerfile \\"
echo "  --push \\"
echo "  api/"

echo ""
echo "或者使用本地構建（不推送）:"
echo "docker build --network=host -t andywu719/dify-api:latest api/"
