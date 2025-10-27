#!/bin/bash

# 啟動所有組的 SMB 同步監控

echo "========================================"
echo "啟動 SMB 多組同步監控"
echo "========================================"
echo ""

API_BASE="http://localhost:5050/api/wiki"

# 定義所有組及其配置
declare -A GROUPS=(
  ["Administrators"]="/app/smb/Administrators"
  ["Guests"]="/app/smb/Guests"
  ["EE"]="/app/smb/EE"
  ["ME_LCM"]="/app/smb/ME_LCM"
  ["PWR"]="/app/smb/PWR"
  ["SW"]="/app/smb/SW"
  ["PJM"]="/app/smb/PJM"
)

# 掃描間隔（秒）
SCAN_INTERVAL=300

# 1. 檢查服務狀態
echo "1️⃣ 檢查批量導入服務狀態..."
SERVICE_STATUS=$(curl -s "$API_BASE/supported-formats")

if [ $? -eq 0 ]; then
    echo "✅ 服務運行正常"
else
    echo "❌ 服務未運行，請先啟動服務"
    exit 1
fi
echo ""

# 2. 檢查 SMB 掛載
echo "2️⃣ 檢查 SMB 目錄..."
for GROUP in "${!GROUPS[@]}"; do
    SMB_PATH="${GROUPS[$GROUP]}"
    
    # 在 Docker 容器中檢查路徑
    docker exec wiki-batch-importer test -d "$SMB_PATH" 2>/dev/null
    
    if [ $? -eq 0 ]; then
        FILE_COUNT=$(docker exec wiki-batch-importer find "$SMB_PATH" -type f 2>/dev/null | wc -l)
        echo "   ✅ $GROUP: $SMB_PATH ($FILE_COUNT 個文件)"
    else
        echo "   ⚠️ $GROUP: $SMB_PATH 不存在或未掛載"
    fi
done
echo ""

# 3. 為每個組啟動同步監控
echo "3️⃣ 啟動各組同步監控..."
echo ""

SUCCESS_COUNT=0
FAILED_COUNT=0

for GROUP in "${!GROUPS[@]}"; do
    SMB_PATH="${GROUPS[$GROUP]}"
    
    echo "📂 $GROUP:"
    echo "   路徑: $SMB_PATH"
    echo "   目標: /smb/$GROUP"
    echo "   間隔: ${SCAN_INTERVAL}s"
    
    RESPONSE=$(curl -s -X POST "$API_BASE/smb-sync" \
      -H "Content-Type: application/json" \
      -d "{
        \"group\": \"$GROUP\",
        \"smbPath\": \"$SMB_PATH\",
        \"targetFolder\": \"/smb/$GROUP\",
        \"mode\": \"continuous\",
        \"scanInterval\": $SCAN_INTERVAL
      }")
    
    SUCCESS=$(echo "$RESPONSE" | jq -r '.success // false')
    
    if [ "$SUCCESS" == "true" ]; then
        echo "   ✅ 監控已啟動"
        ((SUCCESS_COUNT++))
    else
        ERROR=$(echo "$RESPONSE" | jq -r '.error // "未知錯誤"')
        echo "   ❌ 啟動失敗: $ERROR"
        ((FAILED_COUNT++))
    fi
    
    echo ""
done

# 4. 顯示摘要
echo "========================================"
echo "啟動摘要"
echo "========================================"
echo ""
echo "總計組數: ${#GROUPS[@]}"
echo "成功啟動: $SUCCESS_COUNT"
echo "啟動失敗: $FAILED_COUNT"
echo ""

# 5. 查詢當前狀態
echo "4️⃣ 查詢同步狀態..."
sleep 2

STATUS_RESPONSE=$(curl -s "$API_BASE/smb-status")
echo "$STATUS_RESPONSE" | jq '.'
echo ""

# 6. 使用說明
echo "========================================"
echo "後續操作"
echo "========================================"
echo ""
echo "📋 查詢所有組狀態:"
echo "   curl http://localhost:5050/api/wiki/smb-status | jq"
echo ""
echo "📋 查詢特定組狀態:"
echo "   curl http://localhost:5050/api/wiki/smb-status?group=EE | jq"
echo ""
echo "📋 查看實時日誌:"
echo "   docker logs -f wiki-batch-importer | grep \"📂\\|📤\\|✅\\|❌\""
echo ""
echo "📋 手動觸發同步:"
echo "   curl -X POST http://localhost:5050/api/wiki/smb-sync \\"
echo "     -H \"Content-Type: application/json\" \\"
echo "     -d '{\"group\": \"EE\", \"smbPath\": \"/app/smb/EE\", \"mode\": \"once\"}'"
echo ""
echo "📋 訪問 Wiki.js 查看結果:"
echo "   http://localhost:3000/wiki/smb/EE"
echo "   http://localhost:3000/wiki/smb/ME_LCM"
echo ""
echo "⚠️ 注意: 連續監控在後台運行，每 ${SCAN_INTERVAL} 秒掃描一次"
echo "⚠️ 重啟容器後需要重新啟動監控"
