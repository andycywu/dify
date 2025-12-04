#!/bin/bash

# =============================================================================
# Dify Vector Database 快速修復腳本
# 自動修復常見的 Weaviate 連接問題
# =============================================================================

set -e

echo "🔧 開始修復 Dify Vector Database 連接問題..."
echo "================================================"
echo ""

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 檢查函數
check_command() {
    if command -v $1 &> /dev/null; then
        echo -e "${GREEN}✓${NC} $1 已安裝"
        return 0
    else
        echo -e "${RED}✗${NC} $1 未安裝"
        return 1
    fi
}

# 1. 檢查必要工具
echo "1️⃣  檢查必要工具..."
check_command kubectl || exit 1
check_command tilt || exit 1
echo ""

# 2. 檢查環境變數配置
echo "2️⃣  檢查環境變數配置..."
if [ ! -f "docker/.env" ]; then
    echo -e "${RED}✗${NC} docker/.env 文件不存在"
    exit 1
fi

# 檢查 VECTOR_STORE 配置
VECTOR_STORE=$(grep "^VECTOR_STORE=" docker/.env | cut -d'=' -f2)
if [ "$VECTOR_STORE" != "weaviate" ]; then
    echo -e "${YELLOW}⚠${NC}  VECTOR_STORE 設置為: $VECTOR_STORE"
    echo "   更正為 weaviate..."
    sed -i 's/^VECTOR_STORE=.*/VECTOR_STORE=weaviate/' docker/.env
    echo -e "${GREEN}✓${NC} 已更新 VECTOR_STORE=weaviate"
else
    echo -e "${GREEN}✓${NC} VECTOR_STORE 配置正確"
fi

# 檢查 WEAVIATE_ENDPOINT
WEAVIATE_ENDPOINT=$(grep "^WEAVIATE_ENDPOINT=" docker/.env | cut -d'=' -f2)
if [ "$WEAVIATE_ENDPOINT" != "http://weaviate:8080" ]; then
    echo -e "${YELLOW}⚠${NC}  WEAVIATE_ENDPOINT 設置為: $WEAVIATE_ENDPOINT"
    echo "   更正為 http://weaviate:8080..."
    sed -i 's|^WEAVIATE_ENDPOINT=.*|WEAVIATE_ENDPOINT=http://weaviate:8080|' docker/.env
    echo -e "${GREEN}✓${NC} 已更新 WEAVIATE_ENDPOINT"
else
    echo -e "${GREEN}✓${NC} WEAVIATE_ENDPOINT 配置正確"
fi
echo ""

# 3. 檢查 Tilt 配置
echo "3️⃣  檢查 Tilt 配置..."
if [ ! -f "tilt.env" ]; then
    echo -e "${YELLOW}⚠${NC}  tilt.env 文件不存在，從範例創建..."
    if [ -f "tilt.env.example" ]; then
        cp tilt.env.example tilt.env
        echo -e "${GREEN}✓${NC} 已創建 tilt.env"
    fi
fi

# 確保使用 default 或 full profile（包含 weaviate）
TILT_PROFILE=$(grep "^TILT_PROFILE=" tilt.env | cut -d'=' -f2 2>/dev/null || echo "")
if [ "$TILT_PROFILE" == "minimal" ]; then
    echo -e "${YELLOW}⚠${NC}  TILT_PROFILE 設置為 minimal，不包含 Weaviate"
    echo "   更改為 default..."
    sed -i 's/^TILT_PROFILE=.*/TILT_PROFILE=default/' tilt.env
    echo -e "${GREEN}✓${NC} 已更新 TILT_PROFILE=default"
else
    echo -e "${GREEN}✓${NC} TILT_PROFILE 配置正確: $TILT_PROFILE"
fi
echo ""

# 4. 重啟 Weaviate 服務
echo "4️⃣  重啟 Weaviate 服務..."
echo "   停止 Weaviate..."
tilt disable weaviate 2>/dev/null || true
sleep 2

echo "   啟動 Weaviate..."
tilt enable weaviate
sleep 5

echo "   等待 Weaviate 就緒..."
kubectl wait --for=condition=ready pod -l app=weaviate --timeout=180s -A 2>/dev/null || {
    echo -e "${YELLOW}⚠${NC}  Weaviate 啟動超時，繼續檢查..."
}
echo ""

# 5. 測試連接
echo "5️⃣  測試 Weaviate 連接..."
kubectl port-forward svc/weaviate 8080:8080 -n default &
PF_PID=$!
sleep 3

RETRY=0
MAX_RETRY=5
while [ $RETRY -lt $MAX_RETRY ]; do
    if curl -s -f http://localhost:8080/v1/.well-known/ready > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} Weaviate 連接成功！"
        curl -s http://localhost:8080/v1/meta | grep -o '"version":"[^"]*"' || true
        break
    else
        RETRY=$((RETRY+1))
        echo "   嘗試 $RETRY/$MAX_RETRY..."
        sleep 3
    fi
done

kill $PF_PID 2>/dev/null || true

if [ $RETRY -eq $MAX_RETRY ]; then
    echo -e "${RED}✗${NC} Weaviate 連接失敗"
    echo ""
    echo "建議："
    echo "  1. 查看 Weaviate 日誌: tilt logs weaviate"
    echo "  2. 檢查 Pod 狀態: kubectl get pods -A | grep weaviate"
    echo "  3. 完全重啟: tilt down && tilt up"
    exit 1
fi
echo ""

# 6. 重啟 API 服務以重新連接
echo "6️⃣  重啟 API 服務以重新連接向量資料庫..."
tilt trigger api
echo "   等待 API 服務重啟..."
sleep 5
echo ""

# 7. 驗證修復
echo "7️⃣  驗證修復結果..."
echo "   檢查 API 服務日誌中的向量資料庫連接..."
kubectl logs -l app=api --tail=20 -A | grep -i "weaviate\|vector" | tail -5 || echo "   未發現相關日誌"
echo ""

echo "================================================"
echo -e "${GREEN}✅ 修復完成！${NC}"
echo "================================================"
echo ""
echo "📋 後續步驟："
echo "  1. 訪問 Tilt 儀表板: http://localhost:10350"
echo "  2. 查看 API 日誌: tilt logs api"
echo "  3. 查看 Weaviate 日誌: tilt logs weaviate"
echo "  4. 測試向量搜索功能"
echo ""
echo "如果問題仍然存在，請執行診斷腳本："
echo "  ./diagnose-vector-db.sh"
echo ""
