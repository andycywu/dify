#!/bin/bash

# =============================================================================
# Weaviate 快速啟動腳本
# =============================================================================

set -e

echo "🔍 檢查 Weaviate 狀態並啟動..."
echo "================================================"
echo ""

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 1. 檢查是否存在 docker-compose 文件
if [ ! -f "weaviate-standalone-docker-compose.yaml" ]; then
    echo -e "${RED}✗${NC} 找不到 weaviate-standalone-docker-compose.yaml"
    echo "請確認文件已上傳到當前目錄"
    exit 1
fi

# 2. 檢查 Docker
echo "1️⃣  檢查 Docker..."
if ! docker ps &> /dev/null; then
    echo -e "${RED}✗${NC} Docker 服務未運行或無權限"
    echo "請執行: sudo systemctl start docker"
    echo "或將當前用戶加入 docker 組: sudo usermod -aG docker $USER"
    exit 1
fi
echo -e "${GREEN}✓${NC} Docker 正常運行"
echo ""

# 3. 檢查現有容器
echo "2️⃣  檢查現有 Weaviate 容器..."
if docker ps -a | grep -q "dify-weaviate"; then
    echo -e "${YELLOW}⚠${NC}  發現現有容器，正在清理..."
    docker stop dify-weaviate 2>/dev/null || true
    docker rm dify-weaviate 2>/dev/null || true
    echo -e "${GREEN}✓${NC} 清理完成"
else
    echo -e "${BLUE}ℹ${NC}  沒有發現現有容器"
fi
echo ""

# 4. 創建數據目錄
echo "3️⃣  準備數據目錄..."
mkdir -p volumes/weaviate
chmod -R 755 volumes/weaviate
echo -e "${GREEN}✓${NC} 數據目錄: $(pwd)/volumes/weaviate"
echo ""

# 5. 檢查端口
echo "4️⃣  檢查端口 8080..."
if netstat -tlnp 2>/dev/null | grep -q ":8080 " || ss -tlnp 2>/dev/null | grep -q ":8080 "; then
    echo -e "${RED}✗${NC} 端口 8080 已被佔用"
    echo "正在使用端口 8080 的進程:"
    sudo netstat -tlnp | grep :8080 || sudo ss -tlnp | grep :8080
    echo ""
    echo "請停止佔用端口的服務或修改 docker-compose 文件中的端口映射"
    exit 1
fi
echo -e "${GREEN}✓${NC} 端口 8080 可用"
echo ""

# 6. 啟動 Weaviate
echo "5️⃣  啟動 Weaviate..."
if command -v docker-compose &> /dev/null; then
    docker-compose -f weaviate-standalone-docker-compose.yaml up -d
elif docker compose version &> /dev/null 2>&1; then
    docker compose -f weaviate-standalone-docker-compose.yaml up -d
else
    echo -e "${RED}✗${NC} 找不到 docker-compose 命令"
    echo "請安裝: sudo apt install docker-compose"
    exit 1
fi
echo ""

# 7. 查看容器狀態
echo "6️⃣  查看容器狀態..."
sleep 3
docker ps | grep weaviate || echo -e "${RED}✗${NC} 容器未啟動"
echo ""

# 8. 等待服務就緒
echo "7️⃣  等待 Weaviate 啟動 (最多等待 60 秒)..."
RETRY=0
MAX_RETRY=20
while [ $RETRY -lt $MAX_RETRY ]; do
    if docker ps | grep -q "dify-weaviate"; then
        if curl -s -f http://localhost:8080/v1/.well-known/ready > /dev/null 2>&1; then
            echo ""
            echo -e "${GREEN}✓${NC} Weaviate 已成功啟動！"
            break
        fi
    else
        echo ""
        echo -e "${RED}✗${NC} 容器已停止，查看錯誤日誌:"
        docker logs dify-weaviate --tail 50
        exit 1
    fi
    RETRY=$((RETRY+1))
    echo -n "."
    sleep 3
done
echo ""

if [ $RETRY -eq $MAX_RETRY ]; then
    echo -e "${RED}✗${NC} Weaviate 啟動超時"
    echo ""
    echo "查看日誌:"
    docker logs dify-weaviate --tail 50
    exit 1
fi
echo ""

# 9. 驗證服務
echo "8️⃣  驗證服務..."
echo ""
echo -e "${BLUE}Weaviate 版本:${NC}"
curl -s http://localhost:8080/v1/meta | grep -o '"version":"[^"]*"' || echo "無法獲取版本"
echo ""
echo ""

# 10. 顯示信息
echo "================================================"
echo -e "${GREEN}✅ Weaviate 部署成功！${NC}"
echo "================================================"
echo ""
echo -e "${BLUE}📋 服務信息:${NC}"
echo "  容器名稱: dify-weaviate"
echo "  端點: http://localhost:8080"
echo "  API Key: WVF5YThaHlkYwhGUSmCRgsX3tD5ngdN8pkih"
echo ""
echo -e "${BLUE}🔧 常用命令:${NC}"
echo "  查看日誌: docker logs dify-weaviate -f"
echo "  查看狀態: docker ps | grep weaviate"
echo "  重啟服務: docker restart dify-weaviate"
echo "  停止服務: docker stop dify-weaviate"
echo ""
echo -e "${BLUE}🧪 測試連接:${NC}"
echo "  curl http://localhost:8080/v1/meta"
echo ""
echo -e "${BLUE}⚙️  下一步:${NC}"
echo "  1. 檢查 docker/.env 配置"
echo "  2. 重啟 Dify 服務連接 Weaviate"
echo ""
