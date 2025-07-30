# GitGuardian 安全掃描整合指南

本項目已整合 GitGuardian 安全掃描，用於自動檢測代碼中的敏感信息（如 API 密鑰、密碼、證書等）。

## 🔧 設置步驟

### 1. 獲取 GitGuardian API 密鑰

1. 訪問 [GitGuardian](https://www.gitguardian.com/) 並註冊/登入帳戶
2. 進入 Dashboard → API → Personal Access Tokens
3. 創建一個新的 API Token
4. 複製生成的 API 密鑰

### 2. 在 GitHub 中設置 Secret

1. 進入 GitHub repository 設置頁面
2. 點擊 `Settings` → `Secrets and variables` → `Actions`
3. 點擊 `New repository secret`
4. 名稱設為：`GITGUARDIAN_API_KEY`
5. 值設為您的 GitGuardian API 密鑰
6. 點擊 `Add secret`

## 📋 工作流程說明

我們設置了四個 GitGuardian 工作流：

### 1. `gitguardian-security-scan.yml` - 基礎掃描
- **觸發時機**：推送到 main 分支、Pull Request、手動觸發
- **功能**：基本的秘密掃描
- **輸出**：上傳掃描結果到 artifacts

### 2. `gitguardian-advanced-scan.yml` - 高級掃描（已修復）
- **觸發時機**：推送到 main、Pull Request、每日定時掃描
- **功能**：
  - 秘密掃描
  - Infrastructure as Code (IaC) 掃描
  - SARIF 報告上傳到 GitHub Security 頁籤
  - 詳細的 PR 評論
- **修復**：文件路徑、SARIF 生成、CodeQL Action 版本
- **特色**：自動在 PR 中留言掃描結果

### 3. `gitguardian-pr-check.yml` - PR 快速檢查（已修復）
- **觸發時機**：Pull Request 開啟/更新時
- **功能**：快速掃描 PR 中的變更
- **修復**：結果處理、文件路徑
- **特色**：
  - 只掃描變更的文件
  - 即時 PR 狀態更新
  - 自動更新評論

### 4. `gitguardian-reliable.yml` - 可靠版本（新增）
- **觸發時機**：推送到 main、Pull Request、手動觸發
- **功能**：簡化但更可靠的掃描流程
- **特色**：
  - 自動檢查 API 密鑰是否存在
  - 改進的錯誤處理
  - 更好的結果報告
  - 自動生成工作流摘要

## 🔧 配置文件

### `.gitguardian.yaml`
包含 GitGuardian 的詳細配置：
- 排除的路徑和文件類型
- 忽略的匹配模式
- 掃描偏好設置

可以根據項目需求修改此文件。

## 📊 查看掃描結果

### 1. GitHub Security 頁籤
- 進入 repository → `Security` → `Code scanning`
- 查看 GitGuardian 檢測到的問題

### 2. Pull Request 評論
- 每個 PR 會自動收到掃描結果評論
- 顯示檢測到的秘密數量和詳細信息

### 3. Workflow Artifacts
- 每次掃描的詳細結果會上傳為 artifacts
- 可下載 JSON 和 SARIF 格式的報告

## ⚠️ 如果檢測到秘密

當 GitGuardian 檢測到秘密時：

1. **不要恐慌** - 停止推送更多代碼
2. **評估風險** - 確定檢測到的是否為真正的秘密
3. **立即行動**：
   - 從代碼中移除秘密
   - 使用環境變數或配置文件替代
   - 如果是真實的憑證，請立即更換/撤銷
4. **修復提交** - 推送修復後重新掃描

### 示例修復方法

**❌ 錯誤做法：**
```python
API_KEY = "sk-1234567890abcdef"
DATABASE_URL = "postgresql://user:password@localhost/db"
```

**✅ 正確做法：**
```python
import os
API_KEY = os.getenv('API_KEY')
DATABASE_URL = os.getenv('DATABASE_URL')
```

## 🚫 忽略假陽性

如果 GitGuardian 錯誤檢測了測試數據或示例代碼：

1. **方法一**：在 `.gitguardian.yaml` 中添加忽略規則
2. **方法二**：在代碼中添加忽略註釋：
   ```python
   # ggignore
   test_api_key = "fake_key_for_testing"
   ```

## 🔄 本地掃描

您也可以在本地運行 GitGuardian 掃描：

```bash
# 安裝 GitGuardian CLI
pip install ggshield

# 設置 API 密鑰
export GITGUARDIAN_API_KEY="your_api_key_here"

# 掃描當前目錄
ggshield secret scan repo .

# 掃描特定文件
ggshield secret scan path /path/to/file

# 掃描 Git 提交
ggshield secret scan commit-range HEAD~1..HEAD
```

## 📞 支援與故障排除

### 常見問題

#### 1. "Path does not exist: ./gitguardian.sarif"
**原因**：SARIF 文件生成失敗或路徑錯誤
**解決方案**：
- 使用 `gitguardian-reliable.yml` 工作流（已修復此問題）
- 檢查 GitGuardian API 密鑰是否正確設置

#### 2. "CodeQL Action v2 is now deprecated"
**原因**：使用了過時的 CodeQL Action 版本
**解決方案**：已更新到 `github/codeql-action/upload-sarif@v3`

#### 3. "No files were found with the provided path"
**原因**：掃描結果文件未生成或路徑錯誤
**解決方案**：
- 檢查 `GITGUARDIAN_API_KEY` 是否正確設置
- 使用 `gitguardian-reliable.yml` 或 `gitguardian-security-scan.yml` 工作流，具有更好的錯誤處理

#### 4. "Unexpected input(s) 'api-key', valid inputs are ['entryPoint', 'args']"
**原因**：GitGuardian Action 參數格式錯誤
**解決方案**：已修復，使用環境變數 `GITGUARDIAN_API_KEY` 而非 `with.api-key`

#### 5. GitGuardian API 限制
**症狀**：掃描失敗或部分完成
**解決方案**：
- 檢查您的 GitGuardian 帳戶額度
- 考慮升級到付費方案以獲得更多掃描額度

### 調試步驟

如果您遇到問題：

1. **檢查 GitHub Secrets**
   ```bash
   # 在 GitHub repository 中確認
   Settings → Secrets and variables → Actions → GITGUARDIAN_API_KEY
   ```

2. **查看工作流日誌**
   - 進入 Actions 頁籤
   - 點擊失敗的工作流運行
   - 展開每個步驟查看詳細日誌

3. **驗證 GitGuardian API 密鑰**
   ```bash
   # 本地測試（如果已安裝 ggshield）
   export GITGUARDIAN_API_KEY="your_api_key"
   ggshield auth login --api-key $GITGUARDIAN_API_KEY
   ```

4. **檢查 `.gitguardian.yaml` 配置**
   - 確保文件語法正確
   - 驗證忽略規則是否過於寬泛

5. **測試本地掃描**
   ```bash
   pip install ggshield
   export GITGUARDIAN_API_KEY="your_api_key"
   ggshield secret scan repo . --exit-zero
   ```

### 推薦的工作流選擇

根據不同需求選擇合適的工作流：

- **🚀 生產環境推薦**：`gitguardian-security-scan.yml`（基礎但穩定，使用 CLI）
- **⚡ 開發環境**：`gitguardian-pr-check.yml`（快速 PR 檢查）
- **🔬 完整掃描**：`gitguardian-advanced-scan.yml`（功能最全面，包含 IaC 掃描）
- **🛡️ 最可靠版本**：`gitguardian-reliable.yml`（最佳錯誤處理和報告）

**重要修復說明**：
- ✅ 所有工作流已修復 GitGuardian Action 參數問題
- ✅ 文件路徑問題已解決
- ✅ CodeQL Action 已更新到 v3
- ✅ 改進了錯誤處理和結果報告

如果您遇到問題：

1. 查看 GitHub Actions 的日誌
2. 檢查 `.gitguardian.yaml` 配置
3. 確認 `GITGUARDIAN_API_KEY` 設置正確
4. 參考 [GitGuardian 官方文檔](https://docs.gitguardian.com/)

## 🎯 最佳實踐

1. **永遠不要**將真實的憑證提交到代碼庫
2. **使用環境變數**存放敏感信息
3. **定期輪換**API 密鑰和密碼
4. **教育團隊**關於安全最佳實踐
5. **設置分支保護**要求 GitGuardian 檢查通過才能合併 PR

---

🔒 **記住：安全是每個人的責任！**
