#!/bin/bash

# EC2 Docker 環境設置腳本
# 適用於 Amazon Linux 2

set -e

echo "=== 設置 EC2 Docker 環境 ==="

# 更新系統
echo "更新系統套件..."
sudo yum update -y

# 安裝 Docker
echo "安裝 Docker..."
sudo yum install -y docker

# 啟動 Docker 服務
echo "啟動 Docker 服務..."
sudo systemctl start docker
sudo systemctl enable docker

# 將 ec2-user 添加到 docker 群組
echo "設置 Docker 權限..."
sudo usermod -a -G docker ec2-user

# 安裝 Docker Compose
echo "安裝 Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 創建軟連結（如果需要）
sudo ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose

# 驗證安裝
echo "驗證安裝..."
docker --version
docker-compose --version

echo ""
echo "=== 設置完成！ ==="
echo ""
echo "重要: 請登出並重新登入 EC2，或執行以下命令："
echo "newgrp docker"
echo ""
echo "然後您就可以不使用 sudo 執行 Docker 命令了。"
