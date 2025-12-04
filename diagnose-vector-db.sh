#!/bin/bash

# =============================================================================
# Dify Vector Database 診斷腳本
# 用於診斷 Weaviate 向量資料庫連接問題
# =============================================================================

echo "🔍 開始診斷 Dify Vector Database 連接問題..."
echo "================================================"
echo ""

# 1. 檢查 Tilt 狀態
echo "📊 1. 檢查 Tilt 資源狀態"
echo "------------------------"
tilt get all
echo ""

# 2. 檢查 Weaviate Pod 狀態
echo "🗄️  2. 檢查 Weaviate Pod 狀態"
echo "------------------------"
kubectl get pods -A | grep weaviate
echo ""

# 3. 檢查 Weaviate 服務狀態
echo "🌐 3. 檢查 Weaviate Service"
echo "------------------------"
kubectl get svc -A | grep weaviate
echo ""

# 4. 查看 Weaviate 日誌
echo "📝 4. 查看 Weaviate 最近日誌"
echo "------------------------"
kubectl logs -l app=weaviate --tail=50 --all-namespaces
echo ""

# 5. 查看 API 服務日誌（向量資料庫相關錯誤）
echo "📝 5. 查看 API 服務日誌（向量資料庫相關）"
echo "------------------------"
kubectl logs -l app=api --tail=50 --all-namespaces | grep -i "vector\|weaviate\|connection" || echo "未發現向量資料庫相關錯誤"
echo ""

# 6. 檢查環境變數配置
echo "⚙️  6. 檢查環境變數配置"
echo "------------------------"
echo "VECTOR_STORE 配置:"
grep "VECTOR_STORE" tilt.env docker/.env 2>/dev/null || echo "未找到配置"
echo ""
echo "WEAVIATE_ENDPOINT 配置:"
grep "WEAVIATE_ENDPOINT" tilt.env docker/.env 2>/dev/null || echo "未找到配置"
echo ""

# 7. 測試 Weaviate 連接
echo "🔌 7. 測試 Weaviate 連接"
echo "------------------------"
# Port forward Weaviate
kubectl port-forward svc/weaviate 8080:8080 &
PF_PID=$!
sleep 3

echo "測試 Weaviate REST API..."
curl -s http://localhost:8080/v1/.well-known/ready || echo "❌ Weaviate 連接失敗"
echo ""

curl -s http://localhost:8080/v1/meta || echo "❌ 無法獲取 Weaviate meta 信息"
echo ""

# 清理 port-forward
kill $PF_PID 2>/dev/null

# 8. 檢查 Weaviate 持久化數據
echo "💾 8. 檢查 Weaviate 數據卷"
echo "------------------------"
kubectl get pvc -A | grep weaviate || echo "未找到 PVC"
echo ""

# 9. 提供修復建議
echo ""
echo "================================================"
echo "🔧 常見問題和修復建議"
echo "================================================"
echo ""
echo "問題 1: Weaviate Pod 未運行"
echo "  解決方案:"
echo "    tilt trigger weaviate"
echo "    # 或重啟整個環境"
echo "    tilt down && tilt up"
echo ""
echo "問題 2: 向量資料庫配置錯誤"
echo "  檢查 docker/.env 中的配置:"
echo "    VECTOR_STORE=weaviate"
echo "    WEAVIATE_ENDPOINT=http://weaviate:8080"
echo "    WEAVIATE_API_KEY=WVF5YThaHlkYwhGUSmCRgsX3tD5ngdN8pkih"
echo ""
echo "問題 3: Weaviate 服務未就緒"
echo "  等待服務啟動完成:"
echo "    kubectl wait --for=condition=ready pod -l app=weaviate --timeout=300s"
echo ""
echo "問題 4: 網路連接問題"
echo "  檢查 Kubernetes 網路:"
echo "    kubectl get networkpolicies -A"
echo "    kubectl describe svc weaviate"
echo ""
echo "問題 5: 資料損壞"
echo "  重置 Weaviate 數據:"
echo "    tilt down"
echo "    kubectl delete pvc -l app=weaviate"
echo "    tilt up"
echo ""
echo "================================================"
echo "✅ 診斷完成"
echo "================================================"
