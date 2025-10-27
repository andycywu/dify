# 快速參考卡 - Wiki.js 批量導入系統

## 🚀 快速啟動

```bash
# 啟動服務
cd /Users/andycyw/dify/docker
docker-compose up -d wiki-batch-importer

# 訪問 Web 界面
open http://localhost:5050/

# 查看日誌
docker logs -f wiki-batch-importer
```

## 🌐 重要 URL

| 服務 | URL |
|------|-----|
| **Web 管理界面** | http://localhost:5050/ |
| **Wiki.js** | http://localhost:3000/ |
| **API 基礎路徑** | http://localhost:5050/api/wiki/ |

## 📋 API 端點速查

### 批量導入

```bash
# 掃描目錄
curl -X POST http://localhost:5050/api/wiki/scan-directory \
  -H "Content-Type: application/json" \
  -d '{"sourcePath": "/app/smb/EE"}'

# 批量導入（保留結構）
curl -X POST http://localhost:5050/api/wiki/batch-directory-import \
  -H "Content-Type: application/json" \
  -d '{
    "sourcePath": "/app/smb/EE",
    "targetFolder": "/smb/EE",
    "preserveStructure": "true"
  }'
```

### SMB 同步

```bash
# 單次同步
curl -X POST http://localhost:5050/api/wiki/smb-sync \
  -H "Content-Type: application/json" \
  -d '{
    "group": "EE",
    "smbPath": "/app/smb/EE",
    "targetFolder": "/smb/EE",
    "mode": "once"
  }'

# 連續監控
curl -X POST http://localhost:5050/api/wiki/smb-sync \
  -H "Content-Type: application/json" \
  -d '{
    "group": "EE",
    "smbPath": "/app/smb/EE",
    "mode": "continuous",
    "scanInterval": 300
  }'

# 查詢狀態
curl http://localhost:5050/api/wiki/smb-status
curl http://localhost:5050/api/wiki/smb-status?group=EE
```

### 配置管理

```bash
# 獲取配置
curl http://localhost:5050/api/smb-configs

# 保存配置
curl -X POST http://localhost:5050/api/smb-configs \
  -H "Content-Type: application/json" \
  -d '{
    "group": "EE",
    "smbPath": "/app/smb/EE",
    "targetPath": "/smb/EE",
    "scanInterval": 300,
    "autoSync": true
  }'
```

## 📁 目錄結構

```
/Users/andycyw/dify/wiki/batch-import/
├── batch_import_server.py    # Flask 服務器
├── smb_sync_service.py        # SMB 同步服務
├── static/
│   ├── css/style.css          # 樣式文件
│   └── js/app.js              # 前端邏輯
├── templates/
│   └── index.html             # 主頁面
├── test_data/                 # 測試數據
├── data/                      # 狀態和配置文件
│   ├── sync_state_*.json      # 同步狀態
│   └── smb_configs.json       # SMB 配置
└── *.md                       # 文檔文件
```

## 🔧 常用命令

```bash
# 重新構建服務
docker-compose build wiki-batch-importer

# 重啟服務
docker-compose restart wiki-batch-importer

# 查看日誌
docker logs wiki-batch-importer --tail 50

# 進入容器
docker exec -it wiki-batch-importer bash

# 查看容器內文件
docker exec wiki-batch-importer ls -la /app/

# 測試 API
curl http://localhost:5050/api/wiki/supported-formats
```

## 👥 支持的群組

| 群組 | SMB 路徑 | Wiki 路徑 |
|------|----------|-----------|
| **Administrators** | `/app/smb/Administrators` | `/smb/Administrators` |
| **Guests** | `/app/smb/Guests` | `/smb/Guests` |
| **EE** | `/app/smb/EE` | `/smb/EE` |
| **ME_LCM** | `/app/smb/ME_LCM` | `/smb/ME_LCM` |
| **PWR** | `/app/smb/PWR` | `/smb/PWR` |
| **SW** | `/app/smb/SW` | `/smb/SW` |
| **PJM** | `/app/smb/PJM` | `/smb/PJM` |

## 📄 支持的文件格式

| 格式 | 擴展名 | 說明 |
|------|--------|------|
| **PDF** | .pdf | PDF 文檔 |
| **Word** | .docx, .doc | Word 文檔 |
| **Excel** | .xlsx, .xls | Excel 電子表格 |
| **PowerPoint** | .pptx, .ppt | PowerPoint 簡報 |
| **Markdown** | .md | Markdown 文件 |
| **純文本** | .txt | 純文字文件 |
| **CSV** | .csv | CSV 表格文件 |

## 🐛 故障排查

### 服務無法啟動

```bash
# 檢查容器狀態
docker ps -a | grep wiki-batch-importer

# 查看完整日誌
docker logs wiki-batch-importer

# 檢查端口占用
lsof -i :5050
```

### SMB 連接失敗

```bash
# 檢查 SMB 掛載
docker exec wiki-batch-importer ls -la /app/smb/

# 測試連接
docker exec wiki-batch-importer test -d /app/smb/EE && echo "存在" || echo "不存在"

# 檢查權限
docker exec wiki-batch-importer ls -la /app/smb/EE/
```

### API 返回 404

```bash
# 確認服務運行
curl http://localhost:5050/api/wiki/supported-formats

# 檢查路由
docker exec wiki-batch-importer grep -n "@app.route" /app/batch_import_server.py
```

### 導入失敗

```bash
# 檢查文件是否存在
docker exec wiki-batch-importer ls -la /app/test_data/

# 手動測試掃描
curl -X POST http://localhost:5050/api/wiki/scan-directory \
  -H "Content-Type: application/json" \
  -d '{"sourcePath": "/app/test_data"}' | jq

# 查看 Wiki.js 日誌
docker logs dify-wiki --tail 50
```

## 📚 文檔索引

| 文檔 | 用途 |
|------|------|
| `QUICKSTART.md` | 3 步快速開始 |
| `WEB_INTERFACE_GUIDE.md` | Web 界面使用 |
| `SMB_SYNC_SETUP.md` | SMB 配置指南 |
| `DEVELOPMENT_PROGRESS.md` | 開發進度總覽 |
| `FEATURE_SUMMARY.md` | 功能詳細說明 |
| `SOLUTION_GUIDE.md` | 技術解決方案 |
| `TEST_REPORT.md` | 測試報告 |

## 🎯 下一步計劃

1. ⏰ **定時任務調度** (預計 1-2 天)
2. 📧 **監控和通知** (預計 2-3 天)
3. 🔒 **安全和性能** (預計 2-3 天)
4. 🚀 **內網部署** (預計 1 天)

## 💡 實用技巧

### 快速測試批量導入

```bash
# 創建測試文件
mkdir -p /tmp/test_import
echo "# Test Page" > /tmp/test_import/test.md

# 複製到容器
docker cp /tmp/test_import wiki-batch-importer:/app/

# 測試導入
curl -X POST http://localhost:5050/api/wiki/batch-directory-import \
  -H "Content-Type: application/json" \
  -d '{
    "sourcePath": "/app/test_import",
    "targetFolder": "/test",
    "preserveStructure": "true"
  }' | jq
```

### 查看 Wiki.js 頁面狀態

```bash
# 進入數據庫
docker exec -it docker-db-1 psql -U postgres -d wiki

# 查詢頁面
SELECT id, path, title, LENGTH(render) as render_size 
FROM pages 
ORDER BY id DESC 
LIMIT 10;
```

### 批量啟動所有組的監控

```bash
# 使用提供的腳本
cd /Users/andycyw/dify/wiki/batch-import
./start_smb_monitoring.sh
```

---

**版本**: v1.0  
**最後更新**: 2025-01-15  
**維護**: Andy Wu
