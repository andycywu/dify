# Ollama 本地管理設置指南

## 🎯 為什麼使用本地 Ollama

1. **更好的性能**：直接 GPU 訪問，無 Docker 開銷
2. **跨平台一致性**：避免不同 OS 的 Docker GPU 配置差異
3. **簡化管理**：模型下載、更新更方便
4. **更靈活**：可以獨立於 Dify 管理模型

## 📋 設置步驟

### 1. 安裝本地 Ollama

```bash
# macOS
brew install ollama

# Linux
curl -fsSL https://ollama.ai/install.sh | sh

# Windows
# 下載並安裝 Ollama for Windows
```

### 2. 啟動 Ollama 服務

```bash
# 啟動 Ollama 服務（通常自動啟動）
ollama serve

# 檢查狀態
ollama ps
```

### 3. 下載所需模型

```bash
# 下載基本模型
ollama pull llama3.2:latest
ollama pull gemma3:1b

# 檢查已安裝模型
ollama list
```

### 4. 配置 Dify 連接

在 Dify Web 界面中：

1. 進入 **設置** > **模型提供商**
2. 添加 **Ollama** 提供商
3. 設置連接地址（任選其一）：
   - **推薦**: `http://host.docker.internal:11434`
   - **備選**: `http://192.168.50.175:11434` (您的主機 IP)

**注意**：由於 Dify 運行在 Docker 容器中，而 Ollama 運行在主機上，需要使用特殊的地址來訪問主機服務。

### 5. 驗證連接

```bash
# 測試 Ollama API
curl http://localhost:11434/api/tags

# 應該返回已安裝的模型列表
```

## 🛠️ 常用 Ollama 命令

```bash
# 查看運行中的模型
ollama ps

# 查看所有模型
ollama list

# 下載新模型
ollama pull <model_name>

# 移除模型
ollama rm <model_name>

# 運行模型測試
ollama run llama3.2:latest "Hello, how are you?"

# 停止模型
ollama stop <model_name>
```

## 🔧 故障排除

### 端口衝突
如果 11434 端口被占用：
```bash
# 查看端口使用
lsof -i :11434

# 停止 Ollama
killall ollama

# 重新啟動
ollama serve
```

### Docker 網路連接
如果 Dify 無法連接到本地 Ollama：
- 確保使用 `host.docker.internal:11434`
- 或在 docker-compose.yaml 中添加 `network_mode: host`

### 模型載入慢
```bash
# 預加載常用模型
ollama run llama3.2:latest ""
ollama run gemma3:1b ""
```

## 📊 當前配置狀態

- ✅ Ollama Docker 服務已禁用
- ✅ 本地 Ollama 運行在端口 11434
- ✅ 已安裝模型：llama3.2:latest, gemma3:1b, deepseek-r1:8b
- ✅ Dify 可以連接到 `host.docker.internal:11434`

## 🚀 建議的生產配置

1. **自動啟動**：設置 Ollama 為系統服務
2. **模型管理**：定期更新模型
3. **監控**：監控 GPU 使用和記憶體
4. **備份**：備份重要的自定義模型

這種配置方式更適合長期維護和跨平台部署！