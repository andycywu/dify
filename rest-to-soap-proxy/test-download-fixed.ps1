# URTracker Download Test Script
# This script tests the complete download flow: Login -> Export Page -> Download

$ErrorActionPreference = "Stop"

# Configuration
$baseUrl = "https://fwtrack.tpv-tech.com/"
$loginUrl = "$baseUrl/Login.aspx"
$exportUrl = "$baseUrl/ExportData.aspx?type=urtracker"

# 從環境變數讀取或提示輸入
$username = $env:URTRACKER_USERNAME
$password = $env:URTRACKER_PASSWORD

if (-not $username -or -not $password) {
    Write-Host "請設定環境變數 URTRACKER_USERNAME 和 URTRACKER_PASSWORD" -ForegroundColor Red
    exit 1
}

$outputFile = "MNT-Test-Export.xls"

Write-Host "`n=== Step 1: Login to get .URTracker cookie ===" -ForegroundColor Cyan

try {
    # Configure TLS and certificate validation
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12 -bor [System.Net.SecurityProtocolType]::Tls11 -bor [System.Net.SecurityProtocolType]::Tls
    [System.Net.ServicePointManager]::ServerCertificateValidationCallback = {$true}

    # Get login page first to extract ViewState
    Write-Host "Getting login page..."
    $loginPage = Invoke-WebRequest -Uri $loginUrl -SessionVariable session -UseBasicParsing

    # Extract ViewState and EventValidation
    $viewState = if ($loginPage.Content -match 'id="__VIEWSTATE" value="([^"]+)"') { $matches[1] } else { "" }
    $viewStateGen = if ($loginPage.Content -match 'id="__VIEWSTATEGENERATOR" value="([^"]+)"') { $matches[1] } else { "" }
    $eventValidation = if ($loginPage.Content -match 'id="__EVENTVALIDATION" value="([^"]+)"') { $matches[1] } else { "" }

    Write-Host "  ViewState length: $($viewState.Length)"

    # Build login POST body
    $loginBody = @{
        '__VIEWSTATE' = $viewState
        '__VIEWSTATEGENERATOR' = $viewStateGen
        '__EVENTVALIDATION' = $eventValidation
        'ctl00$CP1$txtUserName' = $username
        'ctl00$CP1$txtPassword' = $password
        'ctl00$CP1$btnLogin' = 'Login'
    }

    # POST login
    Write-Host "Posting login..."
    $loginResponse = Invoke-WebRequest -Uri $loginUrl -Method POST -Body $loginBody -WebSession $session -MaximumRedirection 0 -ErrorAction SilentlyContinue

    # Check for .URTracker cookie
    $cookies = $session.Cookies.GetCookies($baseUrl)
    Write-Host "  Cookies received: $($cookies.Name -join ', ')"

    $urTracker = $cookies | Where-Object { $_.Name -eq '.URTracker' }
    if ($urTracker) {
        Write-Host "  SUCCESS: Got .URTracker cookie!" -ForegroundColor Green
        Write-Host "  .URTracker = $($urTracker.Value.Substring(0, [Math]::Min(50, $urTracker.Value.Length)))..."
    } else {
        Write-Host "  WARNING: No .URTracker cookie found!" -ForegroundColor Yellow
    }

} catch {
    Write-Host "  ERROR: Login failed - $_" -ForegroundColor Red
    exit 1
}

Write-Host "`n=== Step 2: Visit Export Page to get ViewState ===" -ForegroundColor Cyan

try {
    Write-Host "Getting export page..."
    $exportPage = Invoke-WebRequest -Uri $exportUrl -WebSession $session -UseBasicParsing

    # Extract ViewState from export page
    $exportViewState = if ($exportPage.Content -match 'id="__VIEWSTATE" value="([^"]+)"') { $matches[1] } else { "" }
    $exportViewStateGen = if ($exportPage.Content -match 'id="__VIEWSTATEGENERATOR" value="([^"]+)"') { $matches[1] } else { "" }
    $exportEventValidation = if ($exportPage.Content -match 'id="__EVENTVALIDATION" value="([^"]+)"') { $matches[1] } else { "" }

    Write-Host "  ViewState length: $($exportViewState.Length)"

    if ($exportViewState.Length -lt 1000) {
        Write-Host "  WARNING: ViewState too short, might be login page!" -ForegroundColor Yellow
    } else {
        Write-Host "  SUCCESS: Got export page ViewState" -ForegroundColor Green
    }

} catch {
    Write-Host "  ERROR: Failed to get export page - $_" -ForegroundColor Red
    exit 1
}

Write-Host "`n=== Step 3: Download Excel File ===" -ForegroundColor Cyan

try {
    Write-Host "Building POST body..."

    # Build complete POST body matching browser
    $exportBody = @{
        '__EVENTTARGET' = ''
        '__EVENTARGUMENT' = ''
        '__VIEWSTATE' = $exportViewState
        '__VIEWSTATEGENERATOR' = $exportViewStateGen
        '__EVENTVALIDATION' = $exportEventValidation
        'ctl00$CP1$cblFields$0' = 'on'
        'ctl00$CP1$cblFields$1' = 'on'
        'ctl00$CP1$cblFields$2' = 'on'
        'ctl00$CP1$cblFields$3' = 'on'
        'ctl00$CP1$cblFields$4' = 'on'
        'ctl00$CP1$cblFields$5' = 'on'
        'ctl00$CP1$cblFields$6' = 'on'
        'ctl00$CP1$cblFields$7' = 'on'
        'ctl00$CP1$cblFields$8' = 'on'
        'ctl00$CP1$cblFields$9' = 'on'
        'ctl00$CP1$cblFields$10' = 'on'
        'ctl00$CP1$cblFields$11' = 'on'
        'ctl00$CP1$cblFields$12' = 'on'
        'ctl00$CP1$cblFields$13' = 'on'
        'ctl00$CP1$cblFields$14' = 'on'
        'ctl00$CP1$cblFields$15' = 'on'
        'ctl00$CP1$cblFields$16' = 'on'
        'ctl00$CP1$cblFields$17' = 'on'
        'ctl00$CP1$cblFields$18' = 'on'
        'ctl00$CP1$cblFields$19' = 'on'
        'ctl00$CP1$cblFields$20' = 'on'
        'ctl00$CP1$cblFields$21' = 'on'
        'ctl00$CP1$cblFields$22' = 'on'
        'ctl00$CP1$cblFields$23' = 'on'
        'ctl00$CP1$ddlProjects' = '2561'
        'ctl00$CP1$btnExport' = '%u8ddf%u8e64'
    }

    Write-Host "Posting download request..."
    $downloadResponse = Invoke-WebRequest -Uri $exportUrl -Method POST -Body $exportBody -WebSession $session -UseBasicParsing

    # Save file
    [System.IO.File]::WriteAllBytes($outputFile, $downloadResponse.Content)

    # Check file
    $fileSize = (Get-Item $outputFile).Length
    Write-Host "  File saved: $outputFile ($fileSize bytes)"

    # Check if it's HTML or Excel
    $contentStart = [System.Text.Encoding]::UTF8.GetString($downloadResponse.Content[0..100])
    if ($contentStart -match '<!DOCTYPE|<html') {
        Write-Host "  ERROR: Downloaded HTML instead of Excel!" -ForegroundColor Red
        Write-Host "  First 200 chars:" -ForegroundColor Yellow
        Write-Host "  $($contentStart.Substring(0, [Math]::Min(200, $contentStart.Length)))"
    } elseif ($fileSize -gt 15000) {
        Write-Host "  SUCCESS: Excel file downloaded successfully!" -ForegroundColor Green
    } else {
        Write-Host "  WARNING: File size too small ($fileSize bytes)" -ForegroundColor Yellow
    }

} catch {
    Write-Host "  ERROR: Download failed - $_" -ForegroundColor Red
    exit 1
}

Write-Host "`n=== Test Complete ===" -ForegroundColor Cyan
