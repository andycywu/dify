#!/bin/bash

echo "🔍 EC2 容器健康狀態全面檢查"
echo "================================"

# 1. 檢查所有容器狀態
echo "📋 1. 容器運行狀態："
docker-compose ps

echo -e "\n🔍 2. 詳細健康檢查："

# 2. 檢查每個關鍵服務
services=("db" "redis" "api" "worker" "dify-next-frontend" "nginx" "web" "sandbox" "weaviate")

for service in "${services[@]}"; do
    echo "----------------------------------------"
    echo "🔎 檢查服務: $service"
    
    # 檢查容器是否運行
    if docker-compose ps $service | grep -q "Up"; then
        echo "✅ $service: 容器正在運行"
        
        # 檢查健康狀態
        health_status=$(docker-compose ps $service | awk 'NR==3 {print $6}' | grep -o "(.*)")
        if [[ "$health_status" == *"healthy"* ]]; then
            echo "💚 $service: 健康狀態良好"
        elif [[ "$health_status" == *"starting"* ]]; then
            echo "🟡 $service: 健康檢查啟動中..."
        elif [[ "$health_status" == *"unhealthy"* ]]; then
            echo "🔴 $service: 健康檢查失敗"
        else
            echo "ℹ️  $service: 無健康檢查配置"
        fi
        
        # 檢查日誌中是否有錯誤
        echo "📋 最新日誌 (最後5行):"
        docker-compose logs --tail=5 $service 2>/dev/null | tail -5
        
    else
        echo "❌ $service: 容器未運行"
        echo "📋 檢查日誌:"
        docker-compose logs --tail=10 $service 2>/dev/null
    fi
done

echo -e "\n🌐 3. 端口連接測試："

# 3. 測試關鍵端口
echo "測試 API (5001)..."
if curl -f http://localhost:5001/health >/dev/null 2>&1; then
    echo "✅ API端口 5001: 可訪問"
else
    echo "❌ API端口 5001: 無法訪問"
fi

echo "測試 Frontend (3000)..."
if curl -f http://localhost:3000/api/health >/dev/null 2>&1; then
    echo "✅ Frontend端口 3000: 可訪問"
else
    echo "❌ Frontend端口 3000: 無法訪問"
fi

echo "測試 Nginx (80)..."
if curl -f http://localhost:80 >/dev/null 2>&1; then
    echo "✅ Nginx端口 80: 可訪問"
else
    echo "❌ Nginx端口 80: 無法訪問"
fi

echo "測試 REST-to-SOAP Proxy (5100)..."
if curl -f http://localhost:5100 >/dev/null 2>&1; then
    echo "✅ REST-to-SOAP Proxy端口 5100: 可訪問"
else
    echo "❌ REST-to-SOAP Proxy端口 5100: 無法訪問"
fi

# 4. 檢查資源使用情況
echo -e "\n💾 4. 資源使用情況："
echo "Docker 容器資源使用:"
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}" 2>/dev/null || echo "無法獲取資源統計"

# 5. 檢查磁盤空間
echo -e "\n💿 5. 磁盤空間："
df -h | grep -E "(Filesystem|/dev/)"

# 6. 檢查網絡連接
echo -e "\n🌐 6. 網絡狀態："
echo "活躍網絡連接:"
netstat -ln | grep -E ":(80|443|3000|5001|5100|6379|5432)" | head -10

# 7. 總結
echo -e "\n📊 7. 健康狀態總結："
echo "================================"

# 統計運行中的容器
running_containers=$(docker-compose ps | grep -c "Up")
total_containers=$(docker-compose ps | grep -c "docker-")

echo "📈 運行中容器: $running_containers/$total_containers"

# 檢查是否有失敗的容器
if docker-compose ps | grep -q "Exit\|Restarting"; then
    echo "⚠️  發現異常容器，請檢查日誌"
    docker-compose ps | grep -E "Exit|Restarting"
else
    echo "✅ 所有配置的容器都在正常運行"
fi

echo -e "\n🎯 建議："
echo "- 如果 dify-next-frontend 仍在啟動中，請等待幾分鐘"
echo "- 如果發現錯誤，使用 'docker-compose logs [service-name]' 查看詳細日誌"
echo "- 可以通過 'curl http://localhost:3000' 測試前端是否可訪問"

echo -e "\n✅ 檢查完成！"
