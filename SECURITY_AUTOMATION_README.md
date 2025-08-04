# 🔒 Dify 安全自動化 CI/CD

本項目使用 GitHub Actions 實現全面的安全自動化檢查和響應。

## 🚀 自動化工作流程

### 1. 📅 每日安全檢查 (`daily-security-check.yml`)
- **觸發時機**: 每天 UTC 00:00，推送到 main 分支，PR 到 main 分支
- **檢查內容**:
  - 敏感文件掃描 (.env, 密鑰文件等)
  - Git 歷史安全檢查
  - Docker 配置安全檢查
  - 硬編碼密鑰檢測

### 2. 📦 每週 VS Code 擴展檢查 (`weekly-vscode-security.yml`)
- **觸發時機**: 每週日 UTC 02:00
- **檢查內容**:
  - VS Code 工作區配置安全
  - 擴展產生的敏感文件
  - 緩存目錄安全性

### 3. 🛡️ 每月安全審計 (`monthly-security-audit.yml`)
- **觸發時機**: 每月1號 UTC 06:00
- **檢查內容**:
  - 深度 Git 歷史掃描 (TruffleHog)
  - 依賴安全檢查 (Python Safety, npm audit)
  - 密鑰和憑證洩露檢查
  - 文件權限檢查
  - 基礎設施配置安全

### 4. 🚫 PR 安全閘門 (`pr-security-gate.yml`)
- **觸發時機**: 每次 PR 和推送到 main/develop 分支
- **檢查內容**:
  - 阻止敏感文件提交
  - 敏感內容掃描
  - .gitignore 合規檢查

### 5. 🚨 安全事件響應 (`security-incident-response.yml`)
- **觸發時機**: 安全相關 Issue 創建，手動觸發
- **響應行動**:
  - 自動執行緊急清理腳本
  - 生成事件響應報告
  - 發送通知

## 🛠️ 本地安全工具

### 安全檢查腳本
```bash
# 每日安全檢查
./security-check.sh

# 緊急安全清理
./emergency-security-cleanup.sh
```

### 手動觸發 GitHub Actions
1. 進入項目的 GitHub 頁面
2. 點擊 "Actions" 標籤
3. 選擇要運行的工作流程
4. 點擊 "Run workflow"

## 📋 安全檢查清單

### 開發者日常檢查
- [ ] 提交前運行 `./security-check.sh`
- [ ] 確保 .env 文件不被提交
- [ ] 檢查 VS Code 擴展設置
- [ ] 定期清理敏感的臨時文件

### 項目維護者檢查
- [ ] 每週檢查 Actions 執行結果
- [ ] 月度安全審計報告審閱
- [ ] 安全工具版本更新
- [ ] 團隊安全培訓

## 🚨 安全事件處理

### 發現敏感信息洩露時
1. **立即響應**:
   ```bash
   ./emergency-security-cleanup.sh
   ```

2. **GitHub 上手動觸發**: Security Incident Response workflow

3. **評估影響**: 檢查洩露的密鑰類型和時間範圍

4. **修復行動**: 更換密鑰，清理 Git 歷史，通知團隊

## ⚙️ 配置說明

### 環境變量 (可選)
在 GitHub Secrets 中配置以下變量以增強功能：
- `SECURITY_NOTIFICATION_EMAIL`: 安全通知郵箱
- `SLACK_WEBHOOK_URL`: Slack 通知 Webhook

### VS Code 安全設定
在 `.vscode/settings.json` 中添加：
```json
{
  "history.excludes": [
    "**/.env*",
    "**/secrets/**",
    "**/credentials/**",
    "**/*.key",
    "**/*.pem"
  ],
  "files.watcherExclude": {
    "**/.env*": true,
    "**/secrets/**": true
  }
}
```

## 📊 監控和報告

### 查看 Actions 執行狀態
- GitHub 項目頁面 → Actions 標籤
- 各個工作流程的執行歷史和日誌

### 安全報告位置
- 每日檢查: Action 日誌中
- 週報: `vscode-security-report.md`
- 月報: `monthly-security-audit-report.md`
- 事件報告: `security-incident-report.md`

## 🔧 故障排除

### Actions 執行失敗
1. 檢查 Action 日誌中的錯誤信息
2. 運行對應的本地腳本進行調試
3. 檢查權限和依賴安裝

### 誤報問題
1. 檢查是否為測試數據被標記為敏感信息
2. 更新檢測規則排除特定文件或模式
3. 在文件中添加註釋說明

## 📞 支援

如遇到安全相關問題：
1. 立即運行緊急清理腳本
2. 在 GitHub 創建安全相關 Issue (會自動觸發響應)
3. 聯繫項目維護者

---

**最後更新**: 2025年8月4日  
**維護者**: Dify Security Team
