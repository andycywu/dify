# 測試新功能：不同 projectID 和 issue 狀態過濾

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "測試 REST to SOAP Proxy 新功能" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:5100"

# 測試 1: 下載 MNT 專案的 Open issues
Write-Host "1. 下載 MNT (2561) - Open Issues" -ForegroundColor Yellow
curl.exe -X GET "$baseUrl/api/https/download/2561?name=MNT&state=open" -OJ
Write-Host ""

# 測試 2: 下載 MNT 專案的 Closed issues
Write-Host "2. 下載 MNT (2561) - Closed Issues" -ForegroundColor Yellow
curl.exe -X GET "$baseUrl/api/https/download/2561?name=MNT&state=closed" -OJ
Write-Host ""

# 測試 3: 下載 MNT 專案的 All issues (預設)
Write-Host "3. 下載 MNT (2561) - All Issues" -ForegroundColor Yellow
curl.exe -X GET "$baseUrl/api/https/download/2561?name=MNT&state=all" -OJ
Write-Host ""

# 測試 4: 下載 TV 專案 (2558) 的 Open issues
Write-Host "4. 下載 TV (2558) - Open Issues" -ForegroundColor Yellow
curl.exe -X GET "$baseUrl/api/https/download/2558?name=TV&state=open" -OJ
Write-Host ""

# 測試 5: 使用 download-by-name API with state 參數
Write-Host "5. 使用專案代號下載 PD - Closed Issues" -ForegroundColor Yellow
curl.exe -X GET "$baseUrl/api/https/download-by-name/PD?state=closed" -OJ
Write-Host ""

# 測試 6: 下載 AVA 專案的 All issues
Write-Host "6. 下載 AVA (2337) - All Issues" -ForegroundColor Yellow
curl.exe -X GET "$baseUrl/api/https/download/2337?name=AVA&state=all" -OJ
Write-Host ""

Write-Host "=====================================" -ForegroundColor Green
Write-Host "測試完成！請檢查下載的文件" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
