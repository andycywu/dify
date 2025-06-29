# AWS EC2 安全組設定指南

本文件說明在 AWS EC2 上部署 Dify 時所需的安全組設定。

## 必要的端口設定

### 入站規則 (Inbound Rules)

| 類型 | 協議 | 端口範圍 | 來源 | 說明 |
|------|------|----------|------|------|
| SSH | TCP | 22 | 您的 IP/0.0.0.0/0 | SSH 遠程連接 |
| HTTP | TCP | 80 | 0.0.0.0/0 | HTTP 網頁訪問 |
| HTTPS | TCP | 443 | 0.0.0.0/0 | HTTPS 網頁訪問（生產環境必須） |

### 出站規則 (Outbound Rules)
- 保持預設的 All Traffic 規則，允許所有出站流量

## AWS CLI 設定方式

如果您使用 AWS CLI，可以使用以下命令：

```bash
# 創建安全組
aws ec2 create-security-group \
    --group-name dify-security-group \
    --description "Security group for Dify application"

# 添加 SSH 規則（請替換成您的 IP）
aws ec2 authorize-security-group-ingress \
    --group-name dify-security-group \
    --protocol tcp \
    --port 22 \
    --cidr 您的IP/32

# 添加 HTTP 規則
aws ec2 authorize-security-group-ingress \
    --group-name dify-security-group \
    --protocol tcp \
    --port 80 \
    --cidr 0.0.0.0/0

# 添加 HTTPS 規則
aws ec2 authorize-security-group-ingress \
    --group-name dify-security-group \
    --protocol tcp \
    --port 443 \
    --cidr 0.0.0.0/0
```

## 安全性建議

### 1. SSH 訪問限制
- 建議將 SSH (22 端口) 的來源限制為您的 IP 地址
- 使用密鑰對認證，禁用密碼認證

### 2. HTTPS 強制
- 生產環境應該強制使用 HTTPS
- 配置 SSL 證書（建議使用 Let's Encrypt）

### 3. 網路訪問控制
- 如果只需要特定 IP 範圍訪問，可以限制 HTTP/HTTPS 的來源
- 考慮使用 VPC 和私有子網

## 域名設定

如果使用自定義域名：

1. **DNS 設定**
   ```
   A Record: yourdomain.com → EC2 公共 IP
   CNAME: www.yourdomain.com → yourdomain.com
   ```

2. **SSL 證書**
   - 使用 Let's Encrypt (免費)
   - 或使用 AWS Certificate Manager

## 防火牆檢查命令

在 EC2 實例上檢查端口是否開放：

```bash
# 檢查端口監聽狀態
sudo netstat -tlnp | grep -E ':80|:443|:22'

# 檢查防火牆狀態 (如果使用 ufw)
sudo ufw status

# 檢查 iptables 規則
sudo iptables -L
```

## 常見問題排除

### 1. 無法訪問網站
- 檢查安全組是否開放 80/443 端口
- 檢查 EC2 實例是否在運行
- 檢查 Docker 容器是否正常啟動

### 2. SSL 證書問題
- 確保域名已正確指向 EC2 IP
- 檢查 Let's Encrypt 證書申請日誌
- 確保 443 端口已開放

### 3. 服務無法啟動
- 檢查 Docker 和 Docker Compose 是否正確安裝
- 檢查 .env 文件配置是否正確
- 查看 Docker 容器日誌：`docker-compose logs -f`

## 監控和維護

### 1. 服務監控
```bash
# 檢查容器狀態
docker-compose ps

# 查看服務日誌
docker-compose logs -f

# 檢查系統資源
htop
df -h
```

### 2. 定期維護
- 定期更新系統和 Docker
- 監控磁盤空間使用
- 備份重要數據和配置

### 3. 性能優化
- 根據負載調整 EC2 實例類型
- 配置適當的 Docker 資源限制
- 使用 CloudWatch 監控性能指標
