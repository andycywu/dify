# REST to SOAP Proxy - 新功能說明

## 🎯 新增功能

### 1. 支援任意 Project ID
現在可以下載任何專案的數據，不限於預設的 TV、MNT、PD、AVA：

```bash
# 下載任意專案 (例如 project ID = 2561)
curl -X GET "http://localhost:5100/api/https/download/2561?name=MNT" -OJ
```

### 2. 支援不同 Issue 狀態過濾

現在可以選擇下載不同狀態的 issues：

- **open** - 只下載 Open issues
- **closed** - 只下載 Closed issues  
- **all** - 下載所有 issues (預設)

#### URL 映射

| State | procName | Title | URL |
|-------|----------|-------|-----|
| open | State_1 | Open+issues | `...&procName=State_1&Title=Open+issues` |
| closed | State_2 | Closed | `...&procName=State_2&Title=Closed` |
| all | State_3 | All+Issues | `...&procName=State_3&Title=All+Issues` |

## 📡 API 使用範例

### 方式 1: 使用 Project ID

```bash
# Open issues
curl -X GET "http://localhost:5100/api/https/download/2561?name=MNT&state=open" -OJ

# Closed issues
curl -X GET "http://localhost:5100/api/https/download/2561?state=closed" -OJ

# All issues (預設)
curl -X GET "http://localhost:5100/api/https/download/2561" -OJ
```

### 方式 2: 使用專案代號 (TV, MNT, PD, AVA)

```bash
# Open issues
curl -X GET "http://localhost:5100/api/https/download-by-name/MNT?state=open" -OJ

# Closed issues
curl -X GET "http://localhost:5100/api/https/download-by-name/TV?state=closed" -OJ

# All issues (預設)
curl -X GET "http://localhost:5100/api/https/download-by-name/AVA" -OJ
```

### 方式 3: 不同專案 ID 示例

```bash
# TV 專案 (ID: 2558)
curl -X GET "http://localhost:5100/api/https/download/2558?name=TV&state=open" -OJ

# PD 專案 (ID: 2559)
curl -X GET "http://localhost:5100/api/https/download/2559?name=PD&state=closed" -OJ

# MNT 專案 (ID: 2561)
curl -X GET "http://localhost:5100/api/https/download/2561?name=MNT&state=all" -OJ

# AVA 專案 (ID: 2337)
curl -X GET "http://localhost:5100/api/https/download/2337?name=AVA&state=open" -OJ
```

## 🧪 快速測試

執行測試腳本：

```powershell
# PowerShell
.\test-new-features.ps1
```

測試腳本會：
1. 下載 MNT 的 Open, Closed, All issues
2. 下載 TV 的 Open issues
3. 下載 PD 的 Closed issues (使用代號)
4. 下載 AVA 的 All issues

## 🔧 參數說明

### GET /api/https/download/:projectId

| 參數 | 類型 | 必填 | 說明 | 範例 |
|------|------|------|------|------|
| projectId | Path | ✅ | 專案 ID | 2561 |
| name | Query | ❌ | 專案名稱 (用於文件名) | MNT |
| state | Query | ❌ | Issue 狀態 | open, closed, all (預設: all) |

### GET /api/https/download-by-name/:projectKey

| 參數 | 類型 | 必填 | 說明 | 範例 |
|------|------|------|------|------|
| projectKey | Path | ✅ | 專案代號 | TV, MNT, PD, AVA |
| state | Query | ❌ | Issue 狀態 | open, closed, all (預設: all) |

## 💡 使用場景

### 場景 1: 只想看 Open issues
```bash
curl -X GET "http://localhost:5100/api/https/download-by-name/MNT?state=open" -OJ
```

### 場景 2: 分析已關閉的 issues
```bash
curl -X GET "http://localhost:5100/api/https/download-by-name/TV?state=closed" -OJ
```

### 場景 3: 下載自訂專案
```bash
# 假設有一個新專案 ID 是 2999
curl -X GET "http://localhost:5100/api/https/download/2999?name=NewProject&state=all" -OJ
```

## ⚠️ 錯誤處理

如果提供無效的 `state` 參數：

```json
{
  "success": false,
  "error": "無效的 state 參數",
  "message": "state 必須是: open, closed, all"
}
```

## 🔗 相關 URL

實際的 URTracker 下載 URL 格式：

```
Open issues:
https://fwtrack.tpv-tech.com/pts/ProblemListExport.aspx?project=2561&FilterType=1&procName=State_1&Title=Open+issues

Closed issues:
https://fwtrack.tpv-tech.com/pts/ProblemListExport.aspx?project=2561&FilterType=1&procName=State_2&Title=Closed

All issues:
https://fwtrack.tpv-tech.com/pts/ProblemListExport.aspx?project=2561&FilterType=1&procName=State_3&Title=All+Issues
```
