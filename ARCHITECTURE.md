# Dify Enhanced Architecture

## 項目概述

本項目基於 **Dify 1.8** 版本進行 fork，並在此基礎上擴展了多個前端和代理服務，形成一個完整的 AI 應用開發與文檔管理平台。

### 核心組件
- **Dify Core**: 原始的 LLM 應用開發平台，提供 AI 工作流、RAG 管道、模型管理等功能
- **dify-next-frontend**: 自定義 Next.js 前端，提供無品牌化的聊天界面和知識庫管理
- **rest-to-soap-proxy**: REST-to-SOAP 代理服務，用於與舊式 SOAP 系統整合
- **Wiki.js**: 文檔管理平台，整合 Dify AI 聊天機器人，提供智能知識庫

### 技術架構

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              用戶界面層 (User Interfaces)                        │
├─────────────────┬─────────────────┬─────────────────┬───────────────────────────┤
│ 原版 Dify Web   │ Dify Next       │ Wiki.js + AI    │ REST-to-SOAP Proxy        │
│ (localhost:80)  │ Frontend        │ (localhost:3002)│ (localhost:5100)         │
│                 │ (localhost:3001)│                 │                           │
└─────────────────┴─────────────────┴─────────────────┴───────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              API 服務層 (API Services)                          │
├─────────────────┬─────────────────┬─────────────────┬───────────────────────────┤
│ Dify API        │ Plugin Daemon   │ Worker          │ REST-to-SOAP Proxy API    │
│ (localhost:5001)│ (localhost:5002)│                 │ (內部轉換 SOAP)           │
├─────────────────┼─────────────────┼─────────────────┼───────────────────────────┤
│ Ollama AI       │                 │                 │                           │
│ (localhost:11434)│                 │                 │                           │
└─────────────────┴─────────────────┴─────────────────┴───────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              數據存儲層 (Data Storage)                          │
├─────────────────┬─────────────────┬─────────────────┬───────────────────────────┤
│ PostgreSQL      │ Redis           │ 向量數據庫       │ 文件存儲                  │
│ (dify + wiki)   │ (緩存+隊列)      │ (Milvus/OpenSearch)│ (上傳文件)               │
└─────────────────┴─────────────────┴─────────────────┴───────────────────────────┘
```

## 本地 Docker 運行

### 環境準備
1. 安裝 Docker 和 Docker Compose
2. 克隆項目：`git clone <repository-url>`
3. 進入項目目錄：`cd dify`

### 快速啟動
```bash
# 進入 Docker 目錄
cd docker

# 啟動所有服務
docker-compose up -d

# 檢查服務狀態
docker-compose ps
```

### 服務訪問
- **原版 Dify Web**: http://localhost/ (port 80)
- **Dify Next Frontend**: http://localhost:3001 (從 Docker 啟動)
- **Wiki.js 文檔**: http://localhost:3002
- **Dify API**: http://localhost:5001 (內部)
- **REST-to-SOAP Proxy**: http://localhost:5100
- **Ollama API**: http://localhost:11434

### 初次配置
1. 訪問 http://localhost/ 設置 Dify 管理員帳戶
2. 訪問 http://localhost:3002 設置 Wiki.js（使用 PostgreSQL: db:5432, user: postgres, pass: difyai123456）
3. 在 `docker/.env` 中設置 `DIFY_API_KEY` 以啟用 AI 聊天功能

## 部署腳本說明

所有部署腳本已整理至 `deployment/scripts/` 目錄，按部署環境分類：

### 本地開發腳本
- `quick-setup.sh`: 本地快速設置
- `rebuild-frontend.sh`: 重建前端服務
- `check-wiki-integration.sh`: 檢查整合狀態

### AWS/EC2 部署腳本
- `deploy-ec2.sh`: EC2 一鍵部署
- `setup-ec2-docker.sh`: EC2 Docker 環境設置
- `transfer-and-deploy.sh`: 代碼傳輸與部署

### Ubuntu 伺服器腳本
- `BLR-ubuntu.md`: Ubuntu 伺服器配置指南（在 `docs/` 中）

### 修復腳本
- `fix-prisma-complete.sh`: Prisma 數據庫修復
- `fix-docker-deployment.sh`: Docker 部署修復
- `ultimate-localhost-fix.sh`: 本地主機修復

### 使用方式
```bash
# 從項目根目錄運行腳本
./deployment/scripts/<script-name>.sh
```

## 功能特性

### AI 能力
- 多模型支持（OpenAI, Anthropic, 本地模型等）
- RAG 知識庫與向量搜索
- 工作流編排與插件系統
- 智能文檔處理

### 前端體驗
- 響應式設計，支持多設備
- 實時聊天界面
- 文件上傳與多模態處理
- 統一認證與權限管理

### 企業級功能
- 多租戶架構
- 監控與日誌
- 安全配置（防火牆、加密）
- 可擴展架構

## 故障排除

### 服務啟動問題
```bash
cd docker
docker-compose logs <service-name>
```

### 數據庫連接
```bash
docker-compose exec db pg_isready
```

### 更多幫助
- 查看 `docs/` 目錄中的詳細指南
- 運行 `deployment/scripts/check-wiki-integration.sh` 進行診斷

---

本項目保持與原始 Dify 架構的兼容性，僅在 fork 基礎上新增前端應用，方便維護與升級。
