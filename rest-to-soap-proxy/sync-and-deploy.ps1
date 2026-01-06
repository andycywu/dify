# PowerShell 腳本：同步代碼到遠端伺服器並重新部署
# 使用方式: .\sync-and-deploy.ps1

param(
    [string]$RemoteHost = "172.27.197.100",
    [string]$RemoteUser = "obmid",
    [string]$RemotePath = "~/dify/rest-to-soap-proxy"
)

$ErrorActionPreference = "Stop"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "🚀 同步並部署到遠端伺服器" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "遠端主機: $RemoteHost" -ForegroundColor Yellow
Write-Host "用戶名: $RemoteUser" -ForegroundColor Yellow
Write-Host "目標路徑: $RemotePath" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Cyan

# 檢查本地文件
Write-Host "`n[1/5] 檢查本地文件..." -ForegroundColor Yellow
$LocalPath = "c:\Users\andycy.wu\dify\rest-to-soap-proxy"

if (-not (Test-Path $LocalPath)) {
    Write-Host "❌ 本地目錄不存在: $LocalPath" -ForegroundColor Red
    exit 1
}

$RequiredFiles = @(
    "index.js",
    "index-soap.js",
    "src\clients\https-client.js",
    "src\routes\https-routes.js",
    "package.json",
    "Dockerfile"
)

foreach ($file in $RequiredFiles) {
    $filePath = Join-Path $LocalPath $file
    if (Test-Path $filePath) {
        Write-Host "  ✓ $file" -ForegroundColor Green
    } else {
        Write-Host "  ✗ $file 不存在" -ForegroundColor Red
        exit 1
    }
}

# 使用 SCP 同步文件
Write-Host "`n[2/5] 同步文件到遠端伺服器..." -ForegroundColor Yellow
Write-Host "正在上傳文件..." -ForegroundColor Gray

try {
    # 創建遠端目錄
    ssh "${RemoteUser}@${RemoteHost}" "mkdir -p $RemotePath"
    
    # 同步所有文件
    scp -r "$LocalPath\*" "${RemoteUser}@${RemoteHost}:${RemotePath}/"
    
    Write-Host "✓ 文件同步完成" -ForegroundColor Green
} catch {
    Write-Host "❌ 文件同步失敗: $_" -ForegroundColor Red
    exit 1
}

# 給腳本添加執行權限
Write-Host "`n[3/5] 設置腳本執行權限..." -ForegroundColor Yellow
ssh "${RemoteUser}@${RemoteHost}" "cd $RemotePath && chmod +x *.sh"
Write-Host "✓ 權限設置完成" -ForegroundColor Green

# 檢查遠端環境
Write-Host "`n[4/5] 檢查遠端環境..." -ForegroundColor Yellow
$dockerCheck = ssh "${RemoteUser}@${RemoteHost}" "command -v docker"
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Docker 已安裝" -ForegroundColor Green
} else {
    Write-Host "❌ Docker 未安裝" -ForegroundColor Red
    exit 1
}

# 執行修復腳本
Write-Host "`n[5/5] 執行部署修復..." -ForegroundColor Yellow
Write-Host "正在重新部署服務..." -ForegroundColor Gray
Write-Host "==========================================" -ForegroundColor Cyan

ssh -t "${RemoteUser}@${RemoteHost}" "cd $RemotePath && ./fix-deployment.sh"

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n==========================================" -ForegroundColor Cyan
    Write-Host "✅ 部署完成！" -ForegroundColor Green
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host "`n📍 訪問地址:" -ForegroundColor Yellow
    Write-Host "  http://${RemoteHost}:5001" -ForegroundColor Cyan
    Write-Host "`n🧪 測試命令:" -ForegroundColor Yellow
    Write-Host "  curl http://${RemoteHost}:5001/health" -ForegroundColor Gray
    Write-Host "  curl http://${RemoteHost}:5001/api/https/status" -ForegroundColor Gray
    Write-Host "==========================================" -ForegroundColor Cyan
} else {
    Write-Host "`n❌ 部署失敗！請查看上方日誌" -ForegroundColor Red
    exit 1
}

Write-Host "`n按任意鍵退出..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
