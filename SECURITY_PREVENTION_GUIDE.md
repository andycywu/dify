# 🛡️ Dify 項目安全防護指南

## 🚨 已處理的安全風險 (2025年8月4日)

### ✅ 已修復
1. **VS Code History 擴展洩露** - 刪除了 `.history/` 目錄並添加到 `.gitignore`
2. **Docker volumes 敏感文件** - 清理了 plugin 目錄中的 `.env` 文件
3. **增強 .gitignore 規則** - 添加了更完整的敏感文件過濾

### ⚠️ 需持續關注
1. **Docker Compose 配置** - 包含示例 API 密鑰（已使用環境變量）
2. **大文件監控** - Docker volumes 中的庫文件（正常）

## 🔒 日常安全實踐

### 1. 代碼提交前檢查
```bash
# 運行安全檢查
./security-check.sh

# 檢查待提交文件
git status
git diff --cached
```

### 2. VS Code 擴展安全配置

#### History 擴展設置
在 VS Code 設置中配置：
```json
{
    "history.excludes": [
        "**/.env*",
        "**/secrets/**",
        "**/credentials/**",
        "**/*.key",
        "**/*.pem"
    ]
}
```

#### GitLens 設置
```json
{
    "gitlens.gitCommands.skipConfirmations": [
        "fetch:command",
        "switch:command"
    ]
}
```

### 3. 環境變量最佳實踐

#### ✅ 正確做法
```bash
# 使用 .env.example 作為模板
cp .env.example .env
# 編輯 .env 填入實際值（不提交）

# 在 docker-compose.yaml 中使用
environment:
  - API_KEY=${API_KEY}
```

#### ❌ 錯誤做法
```bash
# 直接在配置文件中硬編碼
API_KEY=sk-1234567890abcdef

# 將 .env 文件提交到 Git
git add .env
```

### 4. 密鑰管理策略

#### 開發環境
- 使用本地 `.env` 文件
- 不同開發者使用不同測試密鑰
- 定期輪換測試密鑰

#### 生產環境
- 使用雲服務密鑰管理（AWS Secrets Manager, Azure Key Vault 等）
- 使用 Docker secrets
- 實施最小權限原則

### 5. 定期安全檢查計劃

#### 每日
- [ ] 提交前運行 `./security-check.sh`
- [ ] 檢查 VS Code 擴展產生的臨時文件

#### 每週
- [ ] 檢查新安裝的 VS Code 擴展安全性
- [ ] 審查 Docker volumes 內容
- [ ] 檢查大文件變化

#### 每月
- [ ] 輪換所有開發環境密鑰
- [ ] 審查 .gitignore 規則
- [ ] 檢查第三方依賴安全更新

#### 每季
- [ ] 全面安全審計
- [ ] 更新安全檢查腳本
- [ ] 團隊安全培訓

## 🚨 應急響應程序

### 發現敏感信息洩露時
1. **立即響應**
   ```bash
   # 運行緊急清理
   ./emergency-security-cleanup.sh
   
   # 檢查 Git 歷史
   git log --all --full-history --name-only | grep -E "\.env|secret|key"
   ```

2. **評估影響範圍**
   - 檢查哪些密鑰被洩露
   - 確認洩露時間範圍
   - 評估潛在影響

3. **修復行動**
   - 立即更換所有相關密鑰
   - 清理 Git 歷史（如需要）
   - 通知相關團隊

4. **預防復發**
   - 分析根本原因
   - 改進流程和工具
   - 加強培訓

## 🛠️ 推薦工具

### Git 安全工具
- `git-secrets` - 防止密鑰提交
- `truffleHog` - 掃描 Git 歷史中的密鑰
- `detect-secrets` - 預提交密鑰檢測

### VS Code 擴展
- GitLens - Git 歷史可視化
- SonarLint - 代碼安全檢查
- Better Comments - 標記敏感註釋

### 安裝命令
```bash
# Git 安全工具
brew install git-secrets
pip install detect-secrets
git secrets --register-aws
git secrets --install
```

## 📞 聯絡信息

如發現安全問題：
1. 立即停止相關操作
2. 運行應急響應程序
3. 記錄詳細信息
4. 通知團隊負責人

---
**最後更新**：2025年8月4日  
**下次檢查**：2025年8月11日
