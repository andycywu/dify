# Ubuntu Docker 網路與 WLAN 衝突問題診斷與解決方案

## 問題描述

### 症狀
- Ubuntu 系統的 WLAN 無線網路連線失敗
- 系統網路設定正常，但無法透過無線網路上網
- 問題在安裝/啟動 Docker 後出現

### 根本原因

**Docker 預設網段與 WLAN 網段衝突**

Docker 使用以下預設網段：
- 預設 bridge 網路：`172.17.0.0/16`
- 預設 address pool：`172.17-31.0.0/16`

常見的企業/家用 WLAN 可能使用的網段：
- `172.16.0.0/12`（包含 172.16.x.x ~ 172.31.x.x）
- `192.168.0.0/16`
- `10.0.0.0/8`

**衝突情境範例：**

```
系統 WLAN：      172.27.197.0/24  (你的無線網路)
Docker 預設：    172.17.0.0/16    (與 WLAN 同一大網段)
                 172.17-31.0.0/16 (address pools 包含 172.27.x.x)

結果：路由表衝突，系統無法正確路由 WLAN 封包
```

## 當時的解決方法

### 1. 網路衝突診斷

```bash
# 檢查系統網路配置
ip addr show
ip route show

# 輸出範例（問題狀態）：
# wlan0: 172.27.197.100/24  ← 你的 WLAN
# docker0: 172.17.0.1/16    ← Docker bridge
# 
# 路由表顯示 172.16.0.0/12 指向 docker0，
# 導致 172.27.x.x 的封包被錯誤路由到 Docker
```

### 2. 修復方案

**將 Docker 網段改為不與 WLAN 衝突的範圍**

修改 `/etc/docker/daemon.json`：

```json
{
  "default-address-pools": [
    {
      "base": "172.80.0.0/16",
      "size": 24
    }
  ],
  "bip": "172.80.0.1/24",
  "fixed-cidr": "172.80.0.0/24"
}
```

**選擇 172.80.0.0/16 的原因：**
- ✅ 不在常見 WLAN 範圍（172.16-31.x.x）
- ✅ 仍在私有 IP 範圍內
- ✅ 不與常見企業網路衝突

### 3. 套用修復

```bash
# 1. 停止 Docker
sudo systemctl stop docker

# 2. 刪除舊的 Docker 網路
sudo ip link delete docker0

# 3. 清理 iptables
sudo iptables -t nat -F
sudo iptables -t filter -F

# 4. 重新啟動 Docker
sudo systemctl start docker

# 5. 驗證新網段
ip addr show docker0
# 應顯示：inet 172.80.0.1/24

# 6. 測試 WLAN 連線
ping 8.8.8.8
curl https://google.com
```

## 網段衝突檢測方法

### 快速檢測腳本

```bash
#!/bin/bash
# 檢測當前系統網路與 Docker 是否衝突

echo "=== 系統網路配置 ==="
ip addr show | grep -E "inet.*scope global"

echo ""
echo "=== Docker 網路配置 ==="
if [ -f /etc/docker/daemon.json ]; then
    grep -E "bip|base" /etc/docker/daemon.json
fi

docker network inspect bridge | grep Subnet || echo "Docker 未運行"

echo ""
echo "=== 路由表 ==="
ip route show | grep -E "172\.|192\.168\.|10\."

echo ""
echo "=== 可能的衝突檢查 ==="
WLAN_SUBNET=$(ip addr show | grep "inet.*wlan" | awk '{print $2}')
DOCKER_SUBNET=$(docker network inspect bridge 2>/dev/null | grep -oP '"Subnet": "\K[^"]+' || echo "N/A")

echo "WLAN 網段: $WLAN_SUBNET"
echo "Docker 網段: $DOCKER_SUBNET"

if [[ "$WLAN_SUBNET" =~ ^172\.(1[6-9]|2[0-9]|3[0-1])\. ]] && [[ "$DOCKER_SUBNET" =~ ^172\. ]]; then
    echo "⚠️  警告：檢測到可能的網段衝突！"
else
    echo "✓ 未檢測到明顯衝突"
fi
```

## 預防措施

### 1. 建立配置檔案模板

在 Git repository 中加入 `docker/daemon.json.example`：

```json
{
  "registry-mirrors": [
    "https://docker.mirrors.ustc.edu.cn",
    "https://hub-mirror.c.163.com"
  ],
  "default-address-pools": [
    {
      "base": "172.80.0.0/16",
      "size": 24
    }
  ],
  "bip": "172.80.0.1/24",
  "fixed-cidr": "172.80.0.0/24",
  "dns": ["8.8.8.8", "8.8.4.4"],
  "storage-driver": "overlay2",
  "userland-proxy": false,
  "live-restore": true
}
```

### 2. 在 README 中記錄

在專案 README 添加：

```markdown
## Ubuntu 部署注意事項

⚠️ **重要：Docker 網路配置**

如果你的 WLAN 使用 172.16-31.x.x 網段，請在安裝 Docker 後執行：

bash
sudo cp docker/daemon.json.example /etc/docker/daemon.json
sudo systemctl restart docker


這將避免 Docker 網路與 WLAN 衝突。
```

### 3. 自動檢測與修復腳本

更新 `fix-ubuntu-docker-network.sh` 加入自動檢測：

```bash
# 檢測 WLAN 網段
WLAN_SUBNET=$(ip addr show | grep "inet.*wlan" | awk '{print $2}' | cut -d'/' -f1)

if [[ "$WLAN_SUBNET" =~ ^172\. ]]; then
    echo "檢測到 WLAN 使用 172.x.x.x 網段"
    echo "將 Docker 配置為使用 172.80.0.0/16 以避免衝突"
    DOCKER_BASE="172.80.0.0/16"
    DOCKER_BIP="172.80.0.1/24"
else
    echo "WLAN 不在 172.x 網段，使用標準配置"
    DOCKER_BASE="172.18.0.0/16"
    DOCKER_BIP="172.18.0.1/24"
fi
```

## 驗證清單

部署後請檢查以下項目：

- [ ] WLAN 可以正常連線
  ```bash
  ping 8.8.8.8
  ```

- [ ] Docker 網路正常運作
  ```bash
  docker run --rm alpine ping -c 3 8.8.8.8
  ```

- [ ] 路由表正確
  ```bash
  ip route show
  # 確認 WLAN 和 Docker 有各自獨立的路由
  ```

- [ ] 容器可以訪問外網
  ```bash
  docker run --rm alpine wget -O- https://google.com
  ```

## 故障排除

### 問題：修復後 WLAN 仍無法連線

```bash
# 1. 重置網路管理器
sudo systemctl restart NetworkManager

# 2. 重新連線 WLAN
nmcli device disconnect wlan0
nmcli device connect wlan0

# 3. 檢查路由優先級
ip route show
# 確保 WLAN 路由在 Docker 之前
```

### 問題：Docker 容器無法訪問網路

```bash
# 1. 檢查 IP 轉發
sysctl net.ipv4.ip_forward
# 應該返回 1

# 2. 啟用 IP 轉發
sudo sysctl -w net.ipv4.ip_forward=1
echo "net.ipv4.ip_forward=1" | sudo tee -a /etc/sysctl.conf

# 3. 重新載入 iptables 規則
sudo systemctl restart docker
```

## 參考資料

- [Docker 網路配置文檔](https://docs.docker.com/network/)
- [RFC 1918 - 私有 IP 位址範圍](https://tools.ietf.org/html/rfc1918)
- Linux 路由表管理

## 更新記錄

- 2025-12-02: 初始版本，記錄 WLAN 衝突問題與解決方案
- 問題發現：Ubuntu 伺服器 WLAN 172.27.197.100/24 與 Docker 預設網段衝突
- 解決方案：將 Docker 網段改為 172.80.0.0/16
