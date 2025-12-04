# Ubuntu Server Weaviate 故障排除指南

如果在 Ubuntu Server 上遇到 Weaviate 無法啟動的問題，但在 MacOS 上正常，通常是由於以下幾個原因造成的。請按照以下步驟進行檢查和修復。

## 1. 同步環境變數配置 (.env)

MacOS 和 Ubuntu 的環境變數配置應該保持一致。

- **檢查步驟**:
  1. 在 MacOS 上，檢查 `docker/.env` 文件。
  2. 確保該文件已複製到 Ubuntu Server 的相同位置 (`dify/docker/.env`)。
  3. 特別注意 `VECTOR_STORE` 是否設置為 `weaviate`。
  4. 檢查 `WEAVIATE_API_KEY` 等密鑰是否一致。

## 2. 修復數據卷權限 (最常見原因)

**問題原因**:
在 Linux (Ubuntu) 上，Docker 掛載的宿主機目錄權限必須與容器內運行的用戶 ID (UID) 匹配。Weaviate 容器通常以 UID 1000 運行，但 Docker 自動創建的掛載目錄通常屬於 `root`，導致 Weaviate 無法寫入數據而啟動失敗。MacOS 的 Docker Desktop 會自動處理這個權限映射，所以不會報錯。

**解決方案**:
我們提供了一個修復腳本，請在 Ubuntu Server 上執行：

```bash
# 1. 賦予腳本執行權限
chmod +x fix-weaviate-permissions.sh

# 2. 執行修復腳本 (需要 sudo)
sudo ./fix-weaviate-permissions.sh

# 3. 重啟容器
cd docker
docker compose down
docker compose up -d
```

## 3. 檢查 CPU AVX 指令集支持

**問題原因**:
Weaviate (以及許多向量數據庫如 Milvus, TensorFlow 等) 需要 CPU 支持 **AVX** 指令集。如果您的 Ubuntu Server 是較舊的 CPU 或者某些虛擬化環境 (VPS) 未透傳 CPU 指令集，Weaviate 會在啟動時崩潰並報錯 `SIGILL` (Illegal Instruction)。

**檢查方法**:
在 Ubuntu Server 上運行：
```bash
grep avx /proc/cpuinfo
```
如果沒有輸出，說明 CPU 不支持 AVX，您需要：
- 更換支持 AVX 的服務器。
- 或者在虛擬機設置中開啟 "Copy host CPU configuration" (透傳宿主機 CPU)。

## 4. 檢查內存限制

Weaviate 啟動時需要一定的內存。如果服務器內存不足 (例如只有 1GB 或 2GB 且運行了多個容器)，可能會被 OOM Killer 殺死。

**檢查方法**:
```bash
# 查看系統內存
free -h

# 查看 Docker 容器狀態和日誌
docker ps -a | grep weaviate
docker logs docker-weaviate-1
```

## 5. 端口衝突

確保 Ubuntu Server 上的 8080 端口沒有被其他服務佔用。

```bash
sudo lsof -i :8080
```
如果被佔用，可以在 `docker/docker-compose.yaml` 中修改映射端口，例如改為 `8081:8080`。

---

### 總結操作步驟

1. 將 MacOS 上的 `docker/.env` 上傳覆蓋 Ubuntu 上的 `docker/.env`。
2. 在 Ubuntu 上執行 `sudo ./fix-weaviate-permissions.sh`。
3. 重啟 Docker 容器。
