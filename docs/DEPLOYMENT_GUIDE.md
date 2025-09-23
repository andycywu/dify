# Dify 自定義 Images 部署指南

## 概述

此指南將幫助您將 Dify 從本地 build 模式轉換為使用預構建 images 的模式，適合在 AWS EC2 或其他雲端環境部署。

## 準備工作

### 1. 設置 Docker Registry

選擇以下其中一種 registry：

#### Docker Hub
```bash
# 登入 Docker Hub
docker login
```

#### AWS ECR
```bash
# 創建 ECR repository
aws ecr create-repository --repository-name dify-api
aws ecr create-repository --repository-name dify-next-frontend  
aws ecr create-repository --repository-name rest-to-soap-proxy

# 登入 ECR
aws ecr get-login-password --region your-region | docker login --username AWS --password-stdin your-account.dkr.ecr.your-region.amazonaws.com
```

#### GitHub Container Registry
```bash
# 使用 Personal Access Token 登入
echo $GITHUB_TOKEN | docker login ghcr.io -u your-username --password-stdin
```

### 2. 配置環境變數

編輯 `.env.docker` 檔案：

```bash
# Docker Hub 範例
DOCKER_REGISTRY=your-dockerhub-username

# AWS ECR 範例  
DOCKER_REGISTRY=123456789012.dkr.ecr.us-west-2.amazonaws.com

# GitHub Container Registry 範例
DOCKER_REGISTRY=ghcr.io/your-username
```

## 部署步驟

### 步驟 1: 更新 Registry 名稱

```bash
# 更新 docker-compose.yaml 中的 registry 名稱
./update-registry.sh your-actual-registry-name
```

### 步驟 2: 構建和推送 Images

```bash
# 構建並推送所有自定義 images
./build-push-images.sh

# 或者指定特定的 registry
./build-push-images.sh your-registry-name
```

### 步驟 3: 驗證 Images

```bash
# 檢查本地 images
docker images | grep your-registry

# 測試拉取 images
docker pull your-registry/dify-api:latest
docker pull your-registry/dify-next-frontend:latest  
docker pull your-registry/rest-to-soap-proxy:latest
```

### 步驟 4: 提交變更到 Git

```bash
git add .
git commit -m "Update to use custom Docker images for deployment"
git push origin main
```

## AWS EC2 部署

### 1. 在 EC2 上準備環境

```bash
# 安裝 Docker 和 Docker Compose
sudo yum update -y
sudo yum install -y docker
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -a -G docker ec2-user

# 安裝 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/1.29.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2. 部署應用

```bash
# 克隆代碼
git clone your-repository.git
cd dify

# 登入到您的 registry（如果需要）
docker login

# 拉取最新 images
cd docker
docker-compose pull

# 啟動服務
docker-compose up -d

# 檢查服務狀態
docker-compose ps
```

### 3. 監控和維護

```bash
# 查看日誌
docker-compose logs -f

# 重啟特定服務
docker-compose restart api

# 更新服務
docker-compose pull
docker-compose up -d
```

## 故障排除

### 常見問題

1. **Image 拉取失敗**
   - 檢查 registry 憑證是否正確
   - 確認 image 名稱和標籤正確
   - 檢查網路連接

2. **服務啟動失敗**
   - 檢查環境變數配置
   - 查看容器日誌：`docker-compose logs service-name`
   - 確認端口沒有衝突

3. **權限問題**
   - 確保 Docker 服務已啟動
   - 檢查用戶是否在 docker 群組中

### 有用的命令

```bash
# 清理舊的 images
docker system prune -a

# 查看容器資源使用情況
docker stats

# 進入容器調試
docker-compose exec api bash

# 重新構建特定服務
docker-compose build --no-cache api
```

## 自動化

您可以設置 CI/CD 流水線來自動化這個過程：

1. 當代碼推送到主分支時自動構建 images
2. 推送 images 到 registry
3. 觸發 EC2 上的部署更新

範例 GitHub Actions 工作流程見 `.github/workflows/deploy.yml`（需要另外創建）。
