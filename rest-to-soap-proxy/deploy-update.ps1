# 自動部署更新到服務器
$server = "172.27.197.100"
$user = "obmid"
$password = "obmid@123"
$remotePath = "~/dify/rest-to-soap-proxy"

Write-Host "🚀 開始部署更新..." -ForegroundColor Cyan

# 1. 上傳修改的文件
Write-Host "`n[1/4] 上傳 https-client.js..." -ForegroundColor Yellow
$localFile = "c:\Users\andycy.wu\dify\rest-to-soap-proxy\src\clients\https-client.js"
$remoteFile = "${user}@${server}:${remotePath}/src/clients/"

# 使用 plink 自動輸入密碼的方式（需要先手動接受host key）
# 或使用 WinSCP / PSCP
& scp -o StrictHostKeyChecking=no $localFile $remoteFile

# 2. 重建Docker鏡像
Write-Host "`n[2/4] 重建 Docker 鏡像..." -ForegroundColor Yellow
$buildCmd = "cd $remotePath && docker build -t urtracker-proxy:latest ."
& ssh "${user}@${server}" $buildCmd

# 3. 重啟容器
Write-Host "`n[3/4] 重啟容器..." -ForegroundColor Yellow
$restartCmd = @"
cd $remotePath && \
docker stop urtracker-proxy && \
docker rm urtracker-proxy && \
docker run -d --name urtracker-proxy -p 5001:5001 --env-file .env urtracker-proxy:latest
"@
& ssh "${user}@${server}" $restartCmd

# 4. 檢查狀態
Write-Host "`n[4/4] 檢查容器狀態..." -ForegroundColor Yellow
& ssh "${user}@${server}" "docker ps | grep urtracker"

Write-Host "`n✅ 部署完成！" -ForegroundColor Green
Write-Host "測試命令: curl -X POST http://172.27.197.100:5001/api/https/login -H 'Content-Type: application/json' -d '{\"username\":\"USER\",\"password\":\"PASS\"}'" -ForegroundColor Gray
