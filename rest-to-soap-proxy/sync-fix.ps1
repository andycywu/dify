# PowerShell 脚本：同步修复后的代码并更新部署
# 使用方式: .\sync-fix.ps1

param(
    [string]$RemoteHost = "172.27.197.100",
    [string]$RemoteUser = "obmid",
    [string]$RemotePath = "~/dify/rest-to-soap-proxy"
)

$ErrorActionPreference = "Stop"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "🔄 同步 Cookie 修复并重新部署" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "修复内容: HTTPS 客户端 Cookie 管理" -ForegroundColor Yellow
Write-Host "主要改进: 正确处理登入重定向和认证 Cookie" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Cyan

# 1. 同步修改的文件
Write-Host "`n[1/3] 同步修改的文件到服务器..." -ForegroundColor Yellow

$LocalPath = "c:\Users\andycy.wu\dify\rest-to-soap-proxy"

# 只同步必要的文件
$FilesToSync = @(
    "src\clients\https-client.js",
    "update-fix.sh"
)

foreach ($file in $FilesToSync) {
    $localFile = Join-Path $LocalPath $file
    $remotePath = "${RemoteUser}@${RemoteHost}:${RemotePath}/$($file.Replace('\', '/'))"
    
    if (Test-Path $localFile) {
        Write-Host "  上传: $file" -ForegroundColor Gray
        scp $localFile $remotePath
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "    ✓ 成功" -ForegroundColor Green
        } else {
            Write-Host "    ✗ 失败" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "  ✗ 文件不存在: $file" -ForegroundColor Red
        exit 1
    }
}

Write-Host "`n✓ 文件同步完成" -ForegroundColor Green

# 2. 设置脚本权限
Write-Host "`n[2/3] 设置脚本执行权限..." -ForegroundColor Yellow
ssh "${RemoteUser}@${RemoteHost}" "chmod +x ${RemotePath}/update-fix.sh"
Write-Host "✓ 权限设置完成" -ForegroundColor Green

# 3. 执行更新脚本
Write-Host "`n[3/3] 执行更新脚本..." -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Cyan

ssh -t "${RemoteUser}@${RemoteHost}" "cd ${RemotePath} && ./update-fix.sh"

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n==========================================" -ForegroundColor Cyan
    Write-Host "✅ 更新部署完成！" -ForegroundColor Green
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host "`n🎯 测试步骤:" -ForegroundColor Yellow
    Write-Host "1. 登入并观察 Cookie 收集情况:" -ForegroundColor White
    Write-Host "   ssh ${RemoteUser}@${RemoteHost}" -ForegroundColor Gray
    Write-Host "   curl -X POST http://localhost:5001/api/https/login \\" -ForegroundColor Gray
    Write-Host "     -H 'Content-Type: application/json' \\" -ForegroundColor Gray
    Write-Host "     -d '{""username"":""andycy.wu@tpv-tech.com"",""password"":""XrnkE`$F4S.kAuyV1""}'" -ForegroundColor Gray
    Write-Host "`n2. 查看日志中的 Cookie 信息:" -ForegroundColor White
    Write-Host "   docker logs urtracker-proxy | grep -A 5 'Cookie 類型'" -ForegroundColor Gray
    Write-Host "`n3. 测试下载（应该成功）:" -ForegroundColor White
    Write-Host "   curl -O http://localhost:5001/api/https/download-by-name/TV" -ForegroundColor Gray
    Write-Host "   file TV" -ForegroundColor Gray
    Write-Host "==========================================" -ForegroundColor Cyan
} else {
    Write-Host "`n❌ 更新失败！请查看上方错误信息" -ForegroundColor Red
    exit 1
}

Write-Host "`n按任意键退出..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
