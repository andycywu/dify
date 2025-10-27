# SMB 同步設置指南

## 概述

SMB 同步服務可以自動監控 SMB 共享目錄，將新增或修改的文檔自動導入到 Wiki.js。

## 功能特性

✅ **多組支持**: 為不同部門/組配置獨立的 SMB 目錄
✅ **自動同步**: 持續監控文件變更，自動導入
✅ **狀態追蹤**: 使用 MD5 哈希追蹤文件修改
✅ **目錄結構保留**: 保持原始目錄層級在 Wiki.js 中
✅ **增量同步**: 只處理新增或修改的文件

## 架構設計

```
SMB 共享目錄              Wiki.js
├── Administrators/     -> /smb/Administrators/
│   ├── docs/          ->   ├── docs/
│   └── guides/        ->   └── guides/
├── EE/                -> /smb/EE/
└── ME_LCM/            -> /smb/ME_LCM/
```

## Docker 配置

### 1. 掛載 SMB 目錄

在 `docker-compose.yaml` 中添加 SMB 掛載：

```yaml
services:
  wiki-batch-importer:
    image: wiki-batch-importer:latest
    volumes:
      - ./batch-import:/app
      - /mnt/smb/Administrators:/app/smb/Administrators:ro
      - /mnt/smb/Guests:/app/smb/Guests:ro
      - /mnt/smb/EE:/app/smb/EE:ro
      - /mnt/smb/ME_LCM:/app/smb/ME_LCM:ro
      - /mnt/smb/PWR:/app/smb/PWR:ro
      - /mnt/smb/SW:/app/smb/SW:ro
      - /mnt/smb/PJM:/app/smb/PJM:ro
    environment:
      - WIKI_API_KEY=${WIKI_API_KEY}
      - WIKI_API_URL=http://wiki:3000/graphql
```

### 2. 在宿主機掛載 SMB

macOS 掛載 SMB:

```bash
# 創建掛載點
sudo mkdir -p /mnt/smb/Administrators
sudo mkdir -p /mnt/smb/EE
sudo mkdir -p /mnt/smb/ME_LCM
# ... 其他組

# 掛載 SMB 共享
mount_smbfs //username@server/Administrators /mnt/smb/Administrators
mount_smbfs //username@server/EE /mnt/smb/EE
# ... 其他組
```

Linux 掛載 SMB:

```bash
# 安裝 cifs-utils
sudo apt-get install cifs-utils  # Ubuntu/Debian
sudo yum install cifs-utils       # CentOS/RHEL

# 創建掛載點
sudo mkdir -p /mnt/smb/Administrators

# 掛載 SMB 共享
sudo mount -t cifs //server/Administrators /mnt/smb/Administrators \
  -o username=your_user,password=your_pass,uid=1000,gid=1000
```

### 3. 自動掛載 (fstab)

編輯 `/etc/fstab`:

```
//server/Administrators /mnt/smb/Administrators cifs credentials=/etc/samba/credentials,uid=1000,gid=1000 0 0
//server/EE /mnt/smb/EE cifs credentials=/etc/samba/credentials,uid=1000,gid=1000 0 0
```

創建憑證文件 `/etc/samba/credentials`:

```
username=your_username
password=your_password
domain=your_domain
```

設置權限:

```bash
sudo chmod 600 /etc/samba/credentials
```

## API 使用

### 1. 單次同步

同步特定組的 SMB 目錄：

```bash
curl -X POST http://localhost:5050/api/wiki/smb-sync \
  -H "Content-Type: application/json" \
  -d '{
    "group": "EE",
    "smbPath": "/app/smb/EE",
    "targetFolder": "/smb/EE",
    "mode": "once"
  }'
```

響應：

```json
{
  "success": true,
  "mode": "once",
  "group": "EE",
  "stats": {
    "scanned": 45,
    "new": 12,
    "updated": 3,
    "failed": 0
  }
}
```

### 2. 連續監控

啟動持續監控（後台運行）：

```bash
curl -X POST http://localhost:5050/api/wiki/smb-sync \
  -H "Content-Type: application/json" \
  -d '{
    "group": "ME_LCM",
    "smbPath": "/app/smb/ME_LCM",
    "targetFolder": "/smb/ME_LCM",
    "mode": "continuous",
    "scanInterval": 300
  }'
```

參數說明：
- `group`: 組名稱
- `smbPath`: SMB 掛載點路徑（容器內路徑）
- `targetFolder`: Wiki.js 目標目錄
- `mode`: `once` (單次) 或 `continuous` (持續)
- `scanInterval`: 掃描間隔（秒），默認 300

### 3. 查詢同步狀態

查詢所有組：

```bash
curl http://localhost:5050/api/wiki/smb-status
```

查詢特定組：

```bash
curl http://localhost:5050/api/wiki/smb-status?group=EE
```

響應：

```json
{
  "success": true,
  "group": "EE",
  "file_count": 128,
  "last_scan": "2024-01-20T10:30:00",
  "files": {
    "docs/guide.pdf": {
      "hash": "abc123...",
      "page_id": 45,
      "synced_at": "2024-01-20T09:15:00"
    }
  }
}
```

## 批量目錄導入

### 1. 掃描目錄

在導入前先掃描目錄：

```bash
curl -X POST http://localhost:5050/api/wiki/scan-directory \
  -H "Content-Type: application/json" \
  -d '{
    "sourcePath": "/app/smb/EE"
  }'
```

### 2. 批量導入（保留結構）

```bash
curl -X POST http://localhost:5050/api/wiki/batch-directory-import \
  -H "Content-Type: application/json" \
  -d '{
    "sourcePath": "/app/smb/EE",
    "targetFolder": "/smb/EE",
    "preserveStructure": "true"
  }'
```

### 3. 批量導入（扁平化）

```bash
curl -X POST http://localhost:5050/api/wiki/batch-directory-import \
  -H "Content-Type: application/json" \
  -d '{
    "sourcePath": "/app/smb/EE",
    "targetFolder": "/smb/EE-flat",
    "preserveStructure": "false"
  }'
```

## 多組配置示例

為所有組啟動監控的腳本：

```bash
#!/bin/bash

GROUPS=(
  "Administrators"
  "Guests"
  "EE"
  "ME_LCM"
  "PWR"
  "SW"
  "PJM"
)

for GROUP in "${GROUPS[@]}"; do
  echo "啟動 $GROUP 的同步監控..."
  
  curl -X POST http://localhost:5050/api/wiki/smb-sync \
    -H "Content-Type: application/json" \
    -d "{
      \"group\": \"$GROUP\",
      \"smbPath\": \"/app/smb/$GROUP\",
      \"targetFolder\": \"/smb/$GROUP\",
      \"mode\": \"continuous\",
      \"scanInterval\": 300
    }"
  
  echo ""
done

echo "✅ 所有組的監控已啟動"
```

## 狀態文件

同步狀態保存在 JSON 文件中：

- 位置: `/app/data/sync_state_<group>.json`
- 格式:

```json
{
  "last_scan": "2024-01-20T10:30:00",
  "files": {
    "docs/guide.pdf": {
      "hash": "abc123def456...",
      "page_id": 45,
      "synced_at": "2024-01-20T09:15:00"
    }
  }
}
```

## 日誌

查看同步日誌：

```bash
docker logs wiki-batch-importer | grep "📂\|📤\|✅\|❌"
```

日誌符號：
- 📂 掃描目錄
- 📤 同步文件
- ✅ 成功
- ❌ 錯誤

## 故障排除

### 1. SMB 掛載失敗

檢查掛載狀態：

```bash
mount | grep smb
df -h | grep smb
```

測試 SMB 連接：

```bash
smbclient -L //server/share -U username
```

### 2. 權限問題

確保 Docker 容器有讀取權限：

```bash
ls -la /mnt/smb/EE
chmod -R 755 /mnt/smb/EE  # 如果需要
```

### 3. 文件未同步

檢查狀態文件：

```bash
cat /Users/andycyw/dify/wiki/batch-import/data/sync_state_EE.json
```

手動觸發同步：

```bash
curl -X POST http://localhost:5050/api/wiki/smb-sync \
  -H "Content-Type: application/json" \
  -d '{"group": "EE", "smbPath": "/app/smb/EE", "mode": "once"}'
```

### 4. 查看容器內路徑

```bash
docker exec wiki-batch-importer ls -la /app/smb/
docker exec wiki-batch-importer ls -la /app/smb/EE/
```

## 性能優化

### 1. 調整掃描間隔

根據文件更新頻率調整 `scanInterval`:

- 頻繁更新: 60-300 秒
- 偶爾更新: 600-1800 秒
- 很少更新: 3600+ 秒

### 2. 排除大文件

在 `smb_sync_service.py` 中添加文件大小限制：

```python
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB

if file_path.stat().st_size > MAX_FILE_SIZE:
    continue
```

### 3. 使用增量同步

SMB 同步服務自動使用 MD5 哈希進行增量同步，只處理：
- 新文件
- 內容已修改的文件

未修改的文件會被跳過，提高性能。

## 安全建議

1. **只讀掛載**: 使用 `:ro` 掛載 SMB 目錄
2. **憑證保護**: 設置 `/etc/samba/credentials` 權限為 600
3. **網絡隔離**: 將 SMB 流量限制在內部網絡
4. **日誌審計**: 定期檢查同步日誌
5. **訪問控制**: 在 Wiki.js 中設置適當的頁面權限

## 下一步

1. 測試 SMB 掛載
2. 啟動單次同步驗證
3. 配置連續監控
4. 設置定時任務（可選）
5. 監控同步狀態
