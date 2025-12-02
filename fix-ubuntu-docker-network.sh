#!/bin/bash
#
# Ubuntu Docker Network Fix Script
# 修復 Docker 網路衝突問題的長期解決方案
#
# 問題描述：
# Docker 的 bridge 網路可能與系統網路配置衝突，導致網卡問題
# 常見錯誤：port already allocated, network conflicts
#
# 使用方法：
# sudo ./fix-ubuntu-docker-network.sh
#

set -e

echo "=== Ubuntu Docker 網路修復腳本 ==="
echo ""

# 檢查是否為 root
if [ "$EUID" -ne 0 ]; then
    echo "❌ 請使用 sudo 執行此腳本"
    exit 1
fi

# 1. 備份現有配置
echo "📦 備份現有 Docker 配置..."
BACKUP_DIR="/etc/docker/backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

if [ -f /etc/docker/daemon.json ]; then
    cp /etc/docker/daemon.json "$BACKUP_DIR/"
    echo "✓ 已備份 daemon.json 到 $BACKUP_DIR"
fi

# 2. 停止 Docker 服務
echo ""
echo "🛑 停止 Docker 服務..."
systemctl stop docker.socket || true
systemctl stop docker || true

# 3. 清理現有的 Docker 網路
echo ""
echo "🧹 清理 Docker 網路..."
ip link delete docker0 2>/dev/null || true
iptables -t nat -F 2>/dev/null || true
iptables -t filter -F 2>/dev/null || true

# 4. 建立優化的 daemon.json
echo ""
echo "⚙️  配置 Docker daemon.json..."
cat > /etc/docker/daemon.json << 'EOF'
{
  "registry-mirrors": [
    "https://docker.mirrors.ustc.edu.cn",
    "https://hub-mirror.c.163.com",
    "https://mirror.baidubce.com"
  ],
  "max-concurrent-downloads": 10,
  "max-concurrent-uploads": 5,
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "default-address-pools": [
    {
      "base": "172.80.0.0/16",
      "size": 24
    }
  ],
  "bip": "172.80.0.1/24",
  "fixed-cidr": "172.80.0.0/24",
  "dns": ["8.8.8.8", "8.8.4.4"],
  "dns-search": [],
  "storage-driver": "overlay2",
  "userland-proxy": false,
  "live-restore": true,
  "ipv6": false
}
EOF

echo "✓ daemon.json 已更新"

# 5. 重新載入 systemd 配置
echo ""
echo "🔄 重新載入 systemd..."
systemctl daemon-reload

# 6. 啟動 Docker
echo ""
echo "▶️  啟動 Docker 服務..."
systemctl start docker

# 7. 等待 Docker 就緒
echo ""
echo "⏳ 等待 Docker 就緒..."
sleep 5

# 8. 驗證 Docker 狀態
echo ""
echo "✅ 驗證 Docker 狀態..."
systemctl status docker --no-pager | head -10

echo ""
echo "📊 Docker 網路配置："
docker network ls

echo ""
echo "🌐 Docker bridge 資訊："
ip addr show docker0 2>/dev/null || echo "docker0 尚未建立（正常，會在第一個容器啟動時建立）"

echo ""
echo "=== 修復完成 ==="
echo ""
echo "建議的後續步驟："
echo "1. 測試 Docker: docker run --rm hello-world"
echo "2. 如果問題持續，請檢查系統網路配置"
echo "3. 備份檔案位置: $BACKUP_DIR"
echo ""
