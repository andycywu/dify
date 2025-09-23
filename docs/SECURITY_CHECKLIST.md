# 🔒 Dify 項目安全檢查清單

## ✅ 已完成的安全措施

- [x] `.gitignore` 已正確配置，排除所有 `.env` 文件
- [x] Git 歷史中無敏感 `.env` 文件洩露
- [x] 提供了 `.env.example` 模板文件
- [x] 已有安全移除敏感文件的歷史記錄

## 🔍 定期檢查項目

### 1. 環境變量文件檢查
```bash
# 檢查是否有新的 .env 文件
find . -name ".env*" -type f | grep -v example | grep -v template

# 檢查 Git 狀態
git status | grep -i env
```

### 2. 敏感信息掃描
```bash
# 使用 git-secrets 工具掃描
git secrets --scan

# 檢查是否有硬編碼的密鑰
grep -r -i "password\|secret\|key\|token" --include="*.py" --include="*.js" --include="*.ts" . | grep -v example | head -10
```

### 3. Docker 安全檢查
```bash
# 檢查 Docker 文件中的環境變量
grep -r "ENV\|ARG" docker/ | grep -v example
```

## 🚨 風險監控

### 高風險文件類型
- `.env`
- `.env.local`
- `.env.production`
- `config.json`
- `secrets.yaml`
- `credentials.json`

### 敏感信息模式
- API 密鑰: `api[_-]?key`
- 數據庫密碼: `db[_-]?pass|database[_-]?password`
- JWT 秘鑰: `jwt[_-]?secret`
- AWS 憑證: `aws[_-]?access|aws[_-]?secret`

## 🛠️ 安全工具建議

1. **pre-commit hooks**
```bash
pip install pre-commit
pre-commit install
```

2. **git-secrets**
```bash
brew install git-secrets
git secrets --register-aws
git secrets --install
```

3. **GitGuardian**
- 已在項目中配置
- 定期檢查掃描結果

## 📋 應急響應

如果發現敏感信息洩露：

1. **立即移除**
```bash
git filter-repo --path 敏感文件路徑 --invert-paths
```

2. **更換所有密鑰**
3. **通知相關團隊**
4. **記錄事件**

## 🔄 定期任務

- [ ] 每週檢查一次新的環境變量文件
- [ ] 每月運行一次敏感信息掃描
- [ ] 每季度審查 .gitignore 配置
- [ ] 年度安全審計

---
最後更新：2025年8月4日
