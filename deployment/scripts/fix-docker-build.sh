#!/bin/bash
# Docker 構建網絡問題修復腳本

echo "🔧 正在修復 Docker 構建網絡連接問題..."

echo "1. 檢查網絡連接..."
ping -c 3 8.8.8.8
if [ $? -ne 0 ]; then
    echo "❌ 基礎網絡連接有問題"
    echo "請檢查您的網絡連接"
    exit 1
fi

echo "2. 檢查 DNS 解析..."
nslookup deb.debian.org
if [ $? -ne 0 ]; then
    echo "❌ DNS 解析失敗"
    echo "嘗試使用不同的 DNS 服務器..."
fi

echo "3. 重啟 Docker 服務..."
# macOS 使用 Docker Desktop，需要重啟
echo "請重啟 Docker Desktop 應用程序"
echo "或執行以下命令（如果使用命令行版本）："
echo "sudo systemctl restart docker"

echo "4. 清理 Docker 構建緩存..."
docker builder prune -f

echo "5. 設置 Docker 使用不同的 DNS..."
echo "建議在 Docker Desktop 設置中配置 DNS："
echo "- 打開 Docker Desktop"
echo "- 前往 Settings → Resources → Network"
echo "- 設置 DNS Server 為: 8.8.8.8, 8.8.4.4"

echo "6. 嘗試使用代理或鏡像..."
echo "如果問題持續，可以嘗試:"
echo "- 設置 HTTP 代理"
echo "- 使用國內 Docker 鏡像"
echo "- 使用 VPN 連接"

echo ""
echo "✅ 修復建議完成！"
echo "請嘗試重新運行構建命令。"
