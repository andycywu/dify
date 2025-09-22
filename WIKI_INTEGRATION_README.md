# Dify + Wiki.js 整合方案

## 概述

這個整合方案將 Wiki.js 作為第三個前端添加到您現有的 Dify 架構中，提供完整的文檔管理功能，並內建 Dify AI 聊天機器人。

## 架構說明

### 前端界面
- **localhost:80** - Dify 原始前端 (通過 Nginx)
- **localhost:3001** - Dify Next.js 前端 (需要單獨啟動)
- **localhost:3002** - Wiki.js 文檔管理 + AI 聊天機器人

### 後端服務
- **localhost:5001** - Dify API (共享)
- **PostgreSQL** - 共享數據庫 (dify + wiki 數據庫)
- **Redis** - 共享緩存

## 部署步驟

### 1. 自動部署（推薦）

```bash
# 執行一鍵部署腳本
./setup-wiki.sh
```

### 2. 手動部署

```bash
# 1. 進入 docker 目錄
cd docker

# 2. 啟動所有服務
docker-compose up -d

# 3. 檢查服務狀態
docker-compose ps

# 4. 查看日誌
docker-compose logs -f wiki
```

## 初次配置

### Wiki.js 設置

1. 訪問 http://localhost:3002
2. 創建管理員帳戶
3. 選擇 PostgreSQL 數據庫
4. 數據庫配置：
   - 主機: `db`
   - 端口: `5432`
   - 數據庫: `wiki`
   - 用戶名: `postgres`
   - 密碼: `difyai123456`

### Dify API Key 配置

1. 編輯 `docker/.env` 文件
2. 設置 `DIFY_API_KEY=your_actual_api_key`
3. 重啟 Wiki.js 服務：
   ```bash
   cd docker && docker-compose restart wiki
   ```

## 功能特性

### ✨ Wiki.js 核心功能
- 📝 Markdown 編輯器
- 🔍 全文搜索
- 👥 用戶管理和權限控制
- 🎨 自定義主題
- 📊 分析和統計
- 🔐 多種認證方式

### 🤖 Dify AI 整合功能
- 💬 浮動 AI 聊天機器人
- 📎 多模態文件上傳 (圖片、音頻、視頻)
- 🔄 對話歷史記錄
- 🌐 前端切換器
- 📱 響應式設計
- 🎯 智能問答

### 🔗 跨前端功能
- 🚀 一鍵切換不同前端界面
- 🔐 統一的用戶認證
- 📊 共享的 API 後端
- 💾 統一的數據存儲

## 使用指南

### AI 聊天機器人使用

1. 點擊右下角的 AI 助手按鈕
2. 輸入問題或上傳文件
3. 支持拖拽上傳圖片
4. 可以進行連續對話

### 前端切換

1. 在 AI 聊天窗口頭部點擊菜單按鈕
2. 選擇要切換的前端界面
3. 新窗口打開對應的界面

### 文檔管理

1. 使用 Wiki.js 的標準功能創建和編輯頁面
2. 利用 AI 助手協助內容創作
3. 通過搜索功能快速找到相關內容

## 故障排除

### 服務無法啟動

```bash
# 檢查 Docker 容器狀態
docker-compose ps

# 查看詳細日誌
docker-compose logs wiki
docker-compose logs api
docker-compose logs db
```

### AI 聊天機器人無法使用

1. 檢查 DIFY_API_KEY 是否正確設置
2. 確認 Dify API 服務正常運行
3. 檢查網絡連接

```bash
# 測試 API 連接
curl http://localhost:5001/health

# 重啟 Wiki.js 服務
docker-compose restart wiki
```

### 數據庫連接問題

```bash
# 檢查數據庫狀態
docker-compose exec db pg_isready

# 連接到數據庫
docker-compose exec db psql -U postgres

# 檢查 wiki 數據庫是否存在
\l
```

## 維護和更新

### 備份數據

```bash
# 備份 PostgreSQL 數據
docker-compose exec db pg_dump -U postgres dify > backup_dify.sql
docker-compose exec db pg_dump -U postgres wiki > backup_wiki.sql

# 備份 Wiki.js 內容
docker-compose exec wiki tar -czf /tmp/wiki-backup.tar.gz /wiki/data
docker cp $(docker-compose ps -q wiki):/tmp/wiki-backup.tar.gz ./
```

### 更新服務

```bash
# 更新 Docker 鏡像
docker-compose pull

# 重新啟動服務
docker-compose up -d

# 清理舊鏡像
docker image prune
```

### 日誌管理

```bash
# 查看實時日誌
docker-compose logs -f

# 清理日誌
docker-compose down
docker system prune -f
docker-compose up -d
```

## 自定義配置

### 修改端口

編輯 `docker/.env` 文件：

```env
WIKI_PORT=3002  # Wiki.js 端口
EXPOSE_NGINX_PORT=80  # Nginx 端口
```

### 自定義 AI 聊天機器人

編輯 `wiki/themes/dify-integration/components/DifyChatbot.vue`：

- 修改樣式和顏色
- 調整功能和行為
- 添加新的交互功能

### 添加自定義主題

在 `wiki/themes/` 目錄下創建新的主題文件夾，參考 `dify-integration` 主題的結構。

## 技術架構

```
┌─────────────────────────────────────────────────────────┐
│                     用戶界面層                           │
├──────────────┬──────────────┬──────────────────────────┤
│ Dify 原始前端 │ Dify Next前端 │ Wiki.js + AI 聊天機器人    │
│ (Port 80)    │ (Port 3001)  │ (Port 3002)              │
└──────────────┴──────────────┴──────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────┐
│                   API 服務層                            │
├─────────────────────────────┬───────────────────────────┤
│ Dify API Server            │ Wiki.js API               │
│ (Port 5001)                │ (內建)                     │
└─────────────────────────────┴───────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────┐
│                   數據存儲層                            │
├──────────────┬──────────────┬───────────────────────────┤
│ PostgreSQL   │ Redis        │ 文件存儲                   │
│ (dify+wiki)  │ (緩存+隊列)   │ (上傳文件)                 │
└──────────────┴──────────────┴───────────────────────────┘
```

## 支持和幫助

- 📖 [Wiki.js 官方文檔](https://docs.requarks.io)
- 🚀 [Dify 官方文檔](https://docs.dify.ai)
- 🐛 問題反饋: 請在項目 GitHub 頁面提交 Issue
- 💬 社區討論: 加入相關的技術社群

---

**享受您的智能文檔管理體驗！** 🎉


Please find the OS version, IP address, user name, and password. This username has been added to the sudo file.
 
OS version :
 
root@inblrlxdt020:~# cat /etc/os-release
PRETTY_NAME="Ubuntu 22.04.5 LTS"
 
IP address: 172.27.221.51
 
Login name : obmid
 
This server traffic is going via the Firewall.
 
For this server, SSH is allowed.
 
The password will be sent to you in a separate email.
 
Thank you,
 
Regards,
Lakshma0n

Username: obmid
Password: obmid@123

# 產生金鑰（按 Enter 接受預設路徑）
ssh-keygen -t ed25519 -C "obmid-mac"

# 上傳公鑰（若系統沒有 ssh-copy-id，可用下一段 one-liner）
ssh-copy-id obmid@172.27.221.51

# 若沒有 ssh-copy-id，使用：
cat ~/.ssh/id_ed25519.pub | ssh obmid@172.27.221.51 'mkdir -p ~/.ssh && chmod 700 ~/.shh && cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys'

# 若你已經有 ~/.ssh/id_ed25519.pub 可直接用：
ssh-copy-id obmid@172.27.221.51

# 若沒有 ssh-copy-id 或想手動：
scp ~/.ssh/id_ed25519.pub obmid@172.27.221.51:/tmp/obmid.pub
ssh obmid@172.27.221.51 'sudo bash -lc "cat /tmp/obmid.pub >> /home/obmid/.ssh/authorized_keys && chown obmid:obmid /home/obmid/.ssh/authorized_keys && chmod 600 /home/obmid/.ssh/authorized_keys && rm -f /tmp/obmid.pub"'


ssh obmid@172.27.221.51
