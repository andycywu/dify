# URTracker 手動下載測試腳本

$ErrorActionPreference = "Stop"

# 配置
$baseUrl = "https://fwtrack.tpv-tech.com"
$username = "andycy.wu"
$password = "XrnkE$F4S.kAuyV1"
$projectId = 2561

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "URTracker 手動下載測試" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# 步驟 1: 登入
Write-Host "`n[1/3] 登入 URTracker..." -ForegroundColor Yellow
$loginUrl = "$baseUrl/Accounts/login.aspx"
$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession

try {
    $loginPage = Invoke-WebRequest -Uri $loginUrl -SessionVariable session -UseBasicParsing
    
    $viewState = ($loginPage.Content | Select-String -Pattern 'id="__VIEWSTATE" value="([^"]+)"').Matches[0].Groups[1].Value
    $viewStateGen = ($loginPage.Content | Select-String -Pattern 'id="__VIEWSTATEGENERATOR" value="([^"]+)"').Matches[0].Groups[1].Value
    
    Write-Host "  ViewState 長度: $($viewState.Length)" -ForegroundColor Gray
    
    $loginBody = @{
        '__VIEWSTATE' = $viewState
        '__VIEWSTATEGENERATOR' = $viewStateGen
        'txtEmail' = $username
        'txtPassword' = $password
        'btnLogin' = '登  录'
    }
    
    $loginResponse = Invoke-WebRequest -Uri $loginUrl -Method POST -Body $loginBody -WebSession $session -MaximumRedirection 5 -UseBasicParsing
    
    # 檢查 cookies
    $cookies = $session.Cookies.GetCookies($baseUrl)
    $urTracker = $cookies | Where-Object { $_.Name -eq '.URTracker' }
    
    Write-Host "  獲取到的 Cookies: $($cookies.Name -join ', ')" -ForegroundColor Gray
    
    if ($urTracker) {
        Write-Host "  ✓ 成功獲取 .URTracker cookie" -ForegroundColor Green
    } else {
        Write-Host "  ✗ 未獲取到 .URTracker cookie" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "  ✗ 登入失敗: $_" -ForegroundColor Red
    exit 1
}

# 步驟 2: 訪問導出頁面
Write-Host "`n[2/3] 訪問導出頁面..." -ForegroundColor Yellow
$exportUrl = "$baseUrl/pts/ProblemListExport.aspx?project=$projectId&FilterType=1&procName=State_1&Title=%u8ddf%u8e64%u4e2d%u7684%u4e8b%u52d9"

try {
    $exportPage = Invoke-WebRequest -Uri $exportUrl -WebSession $session -UseBasicParsing
    
    $exportViewState = ($exportPage.Content | Select-String -Pattern 'id="__VIEWSTATE" value="([^"]+)"').Matches[0].Groups[1].Value
    $exportViewStateGen = ($exportPage.Content | Select-String -Pattern 'id="__VIEWSTATEGENERATOR" value="([^"]+)"').Matches[0].Groups[1].Value
    
    # 嘗試提取 __EVENTVALIDATION
    $eventValidationMatch = ($exportPage.Content | Select-String -Pattern 'id="__EVENTVALIDATION" value="([^"]+)"')
    $exportEventValidation = if ($eventValidationMatch) { $eventValidationMatch.Matches[0].Groups[1].Value } else { '' }
    
    Write-Host "  ✓ ViewState 長度: $($exportViewState.Length)" -ForegroundColor Green
    if ($exportEventValidation) {
        Write-Host "  ✓ EventValidation 長度: $($exportEventValidation.Length)" -ForegroundColor Green
    } else {
        Write-Host "  ! 未找到 EventValidation (可能不需要)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ✗ 訪問失敗: $_" -ForegroundColor Red
    exit 1
}

# 步驟 3: 下載
Write-Host "`n[3/3] 下載 Excel 文件..." -ForegroundColor Yellow

$exportBody = @{
    'ctl00_ScriptManager1_HiddenField' = ''
    '__EVENTTARGET' = ''
    '__EVENTARGUMENT' = ''
    '__LASTFOCUS' = ''
    '__VIEWSTATE' = $exportViewState
    '__VIEWSTATEGENERATOR' = $exportViewStateGen
    'ctl00$Siteheader1$txtProblemID' = ''
    'ctl00$CP1$ExportType' = 'rdoList'
}

if ($exportEventValidation) {
    $exportBody['__EVENTVALIDATION'] = $exportEventValidation
}

# 添加所有欄位 (0-23)
for ($i = 0; $i -le 23; $i++) {
    $exportBody["ctl00`$CP1`$cblFields`$$i"] = 'on'
}

$exportBody['ctl00$CP1$rblFormat'] = 'xls'
$exportBody['ctl00$CP1$btnExport'] = '導出'
$exportBody['ctl00$CP1$txtSaveTitle'] = ''
$exportBody['ctl00$CP1$txtSaveDescription'] = ''

Write-Host "  POST 欄位數量: $($exportBody.Count)" -ForegroundColor Gray

try {
    $downloadResponse = Invoke-WebRequest -Uri $exportUrl -Method POST -Body $exportBody -WebSession $session -UseBasicParsing
    
    $outputFile = "MNT-Data_$(Get-Date -Format 'yyyy-MM-dd_HHmmss').xls"
    [System.IO.File]::WriteAllBytes($outputFile, $downloadResponse.Content)
    
    $fileSize = (Get-Item $outputFile).Length
    Write-Host "  文件大小: $([Math]::Round($fileSize / 1KB, 2)) KB" -ForegroundColor Gray
    Write-Host "  Content-Type: $($downloadResponse.Headers['Content-Type'])" -ForegroundColor Gray
    
    # 檢查文件類型
    $fileContent = Get-Content $outputFile -Encoding UTF8 -TotalCount 1 -Raw
    if ($fileContent -match '<html|<!DOCTYPE') {
        Write-Host "  ✗ 下載失敗：返回的是 HTML 頁面" -ForegroundColor Red
        Write-Host "`n  HTML 內容預覽:" -ForegroundColor Yellow
        Get-Content $outputFile -Encoding UTF8 -Head 15 | ForEach-Object { Write-Host "    $_" -ForegroundColor Gray }
        exit 1
    } elseif ($fileSize -gt 15000) {
        Write-Host "  ✓ Excel 文件下載成功" -ForegroundColor Green
        Write-Host "  文件名: $outputFile" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ 文件大小異常 (< 15KB)，可能不是有效的 Excel" -ForegroundColor Yellow
        Write-Host "`n  文件內容預覽:" -ForegroundColor Yellow
        Get-Content $outputFile -Encoding UTF8 -Head 10 | ForEach-Object { Write-Host "    $_" -ForegroundColor Gray }
        exit 1
    }
} catch {
    Write-Host "  ✗ 下載失敗: $_" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "  HTTP Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    }
    exit 1
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "✅ 測試完成！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
