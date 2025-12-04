#!/bin/bash

# ==============================================================================
# Dify + Wiki.js 自動化部署腳本 (Ubuntu 22.04)
# ==============================================================================

set -e

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 專案配置
REPO_URL="https://github.com/andycywu/dify.git"
PROJECT_DIR="/opt/dify"
DOCKER_COMPOSE_FILES="-f docker-compose.yaml -f docker-compose.wiki-auth.yml"

echo -e "${GREEN}=== 開始 Dify + Wiki.js 自動化部署 ===${NC}"

# 1. 檢查 Root 權限
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}請使用 sudo 或 root 權限執行此腳本${NC}"
  exit 1
fi

# 2. 系統更新與依賴安裝
echo -e "${YELLOW}正在更新系統與安裝必要套件...${NC}"
apt-get update
apt-get install -y ca-certificates curl gnupg lsb-release git

# 3. 安裝 Docker (如果尚未安裝)
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}Docker 未安裝，正在安裝 Docker...${NC}"
    mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    apt-get update
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    echo -e "${GREEN}Docker 安裝完成${NC}"
else
    echo -e "${GREEN}Docker 已安裝${NC}"
fi

# 4. 專案代碼設置
if [ -d "$PROJECT_DIR" ]; then
    echo -e "${YELLOW}專案目錄已存在，正在更新代碼...${NC}"
    cd "$PROJECT_DIR"
    git pull origin main
else
    echo -e "${YELLOW}正在複製專案代碼...${NC}"
    git clone "$REPO_URL" "$PROJECT_DIR"
    cd "$PROJECT_DIR"
fi

# 5. 環境變數配置
echo -e "${YELLOW}正在配置環境變數...${NC}"

# 檢查並建立 dify-next-frontend/.env
ENV_FILE="dify-next-frontend/.env"
ENV_DOCKER_FILE="dify-next-frontend/.env.docker"

if [ ! -f "$ENV_FILE" ]; then
    echo -e "${YELLOW}建立 .env 檔案...${NC}"
    cp "$ENV_DOCKER_FILE" "$ENV_FILE"
else
    echo -e "${GREEN}.env 檔案已存在${NC}"
fi

# 提示輸入關鍵密鑰
read_secret() {
    local var_name=$1
    local prompt_text=$2
    local current_val=$(grep "^${var_name}=" "$ENV_FILE" | cut -d'=' -f2-)

    if [ -z "$current_val" ] || [ "$current_val" == "" ]; then
        echo -e "${YELLOW}${prompt_text}${NC}"
        read -p "請輸入: " input_val
        if [ ! -z "$input_val" ]; then
            # 使用 sed 替換或新增
            if grep -q "^${var_name}=" "$ENV_FILE"; then
                sed -i "s|^${var_name}=.*|${var_name}=${input_val}|" "$ENV_FILE"
            else
                echo "${var_name}=${input_val}" >> "$ENV_FILE"
            fi
        fi
    else
        echo -e "${GREEN}${var_name} 已設定 (值: ${current_val:0:5}***)${NC}"
    fi
}

# 互動式設定密鑰
echo -e "${YELLOW}--- 密鑰設定 (按 Enter 跳過以保留原值) ---${NC}"
read_secret "DIFY_ADMIN_API_KEY" "請輸入 Dify Admin API Key (用於同步):"
read_secret "WIKI_API_KEY" "請輸入 Wiki.js API Key:"
read_secret "NEXT_PUBLIC_DIFY_API_KEY" "請輸入 Dify App API Key:"
read_secret "NEXT_PUBLIC_DIFY_DATASET_KEY" "請輸入 Dify Dataset API Key:"

# 6. 啟動服務
echo -e "${YELLOW}正在啟動服務...${NC}"
cd docker
docker compose $DOCKER_COMPOSE_FILES up -d --build dify-next-frontend
docker compose $DOCKER_COMPOSE_FILES up -d

echo -e "${GREEN}=== 部署完成 ===${NC}"
echo -e "前端訪問地址: http://<伺服器IP>:3001"
echo -e "Wiki訪問地址: http://<伺服器IP>:3002"
echo -e "API訪問地址: http://<伺服器IP>:5001"
