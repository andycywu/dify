# Ubuntu Docker 網路問題修復指南

## 問題描述

在 Ubuntu 上運行 Docker 時可能遇到以下網路問題：
- `port is already allocated` - 埠號已被佔用
- `failed to set up container networking` - 容器網路設定失敗
- 網卡衝突導致無法啟動容器

## 根本原因

1. **Docker bridge 網路衝突**：Docker 預設的 `172.17.0.0/16` 網段可能與現有網路衝突
2. **埠號衝突**：多個服務嘗試綁定同一個埠號
3. **iptables 規則殘留**：之前的 Docker 網路規則未清理

## 長期解決方案

### 方案一：使用自動修復腳本（推薦）

```bash
# 1. 下載腳本
cd ~/dify
chmod +x fix-ubuntu-docker-network.sh

# 2. 執行修復
sudo ./fix-ubuntu-docker-network.sh

# 3. 驗證修復結果
docker run --rm hello-world
```

### 方案二：手動配置

#### 1. 建立/編輯 Docker daemon 配置

```bash
sudo nano /etc/docker/daemon.json
```

添加以下內容：

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
  "userland-proxy": false,
  "live-restore": true
}
```

#### 2. 重啟 Docker

```bash
sudo systemctl daemon-reload
sudo systemctl restart docker
```

#### 3. 清理舊的網路

```bash
# 停止所有容器
docker stop $(docker ps -aq)

# 刪除所有網路（除了預設的）
docker network prune -f

# 重建 docker0
sudo ip link delete docker0
sudo systemctl restart docker
```

## 配置說明

| 配置項 | 說明 | 預設值 | 建議值 |
|--------|------|--------|--------|
| `bip` | Docker bridge IP | 172.17.0.1/16 | 172.80.0.1/24 |
| `default-address-pools` | 容器網路範圍 | 172.17-31.x.x | 172.80.0.0/16 |
| `userland-proxy` | 使用者空間代理 | true | false (效能更好) |
| `live-restore` | 容器存活還原 | false | true (Docker 重啟時保持容器運行) |

## 埠號衝突處理

### 檢查埠號佔用

```bash
# 檢查特定埠號
sudo lsof -i :80
sudo netstat -tulpn | grep :80

# 檢查所有監聽的埠號
sudo netstat -tulpn | grep LISTEN
```

### 解決埠號衝突

**選項 A：停止衝突的服務**

```bash
# 停止 nginx
sudo systemctl stop nginx
sudo systemctl disable nginx

# 停止 apache
sudo systemctl stop apache2
sudo systemctl disable apache2
```

**選項 B：修改 Docker Compose 埠號映射**

編輯 `docker/docker-compose.yaml`：

```yaml
services:
  nginx:
    ports:
      - "8080:80"  # 將外部埠改為 8080
      - "8443:443"
```

## 驗證與測試

```bash
# 1. 檢查 Docker 狀態
sudo systemctl status docker

# 2. 檢查網路配置
docker network ls
ip addr show docker0

# 3. 測試容器啟動
docker run --rm hello-world

# 4. 測試埠號綁定
docker run --rm -p 8080:80 nginx:alpine
```

## 常見問題

### Q1: 修復後仍然有埠號衝突？

```bash
# 重新檢查佔用埠號的程序
sudo lsof -i :80
# 終止該程序
sudo kill -9 <PID>
```

### Q2: docker0 網卡消失？

```bash
# Docker 會在第一個容器啟動時自動建立 docker0
# 如果需要手動建立：
sudo systemctl restart docker
docker run --rm hello-world
```

### Q3: 需要使用不同的網段？

修改 `daemon.json` 中的 `bip` 和 `default-address-pools`：

```json
{
  "bip": "172.90.0.1/24",
  "default-address-pools": [
    {
      "base": "172.90.0.0/16",
      "size": 24
    }
  ]
}
```

## 預防措施

1. **定期清理**：定期清理未使用的網路和容器
   ```bash
   docker system prune -a
   ```

2. **使用 Docker Compose**：使用 compose 管理多容器應用，避免手動網路配置

3. **監控資源**：監控埠號使用情況
   ```bash
   # 安裝 netstat
   sudo apt install net-tools
   ```

4. **文檔化配置**：記錄自訂的網路配置，方便團隊協作

## 自動化修復（開機自動執行）

如果需要在系統重啟後自動修復：

```bash
# 建立 systemd 服務
sudo nano /etc/systemd/system/docker-network-fix.service
```

內容：

```ini
[Unit]
Description=Docker Network Fix
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
ExecStart=/usr/bin/docker network prune -f
RemainAfterExit=yes

[Install]
WantedBy=multi-user.target
```

啟用服務：

```bash
sudo systemctl enable docker-network-fix.service
sudo systemctl start docker-network-fix.service
```

## 參考資料

- [Docker daemon configuration](https://docs.docker.com/engine/reference/commandline/dockerd/#daemon-configuration-file)
- [Docker networking overview](https://docs.docker.com/network/)
- [Troubleshoot networking issues](https://docs.docker.com/config/containers/container-networking/)

## 更新日誌

- 2025-12-02: 初始版本，添加自動修復腳本和完整文檔
