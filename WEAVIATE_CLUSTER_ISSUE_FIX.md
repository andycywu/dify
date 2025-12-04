# Weaviate 集群初始化問題修復記錄

## 問題描述

在 Docker 環境中運行 Weaviate 1.19.x 版本時,容器持續出現以下錯誤並無法正常啟動:

```json
{
  "action":"memberlist_init",
  "bind_port":7946,
  "error":"Failed to get final advertise address: No private IP address found, and explicit IP not provided",
  "hostname":"",
  "level":"error",
  "msg":"memberlist not created"
}
{
  "action":"startup",
  "error":"create member list: Failed to get final advertise address: No private IP address found, and explicit IP not provided",
  "level":"error",
  "msg":"could not init cluster state"
}
```

## 問題根本原因

Weaviate 1.19.x 版本**默認啟用了集群功能**,即使是單節點部署也會嘗試初始化集群狀態。在 Docker 的默認橋接網路模式下,容器無法檢測到合適的私有 IP 地址來綁定集群通訊端口,導致啟動失敗並不斷重試。

## 嘗試過的方案(失敗)

以下方案都無法解決問題:

### 1. 設置 `CLUSTER_ENABLED: 'false'`
```yaml
environment:
  CLUSTER_ENABLED: 'false'
```
❌ Weaviate 1.19.x 不支持此環境變數

### 2. 設置 `CLUSTER_HOSTNAME` 
```yaml
environment:
  CLUSTER_HOSTNAME: 'node1'
  # 或
  CLUSTER_HOSTNAME: 'standalone'
```
❌ 仍然嘗試初始化集群並尋找 IP 地址

### 3. 設置 `CLUSTER_ADVERTISE_ADDR: '127.0.0.1'`
```yaml
environment:
  CLUSTER_ADVERTISE_ADDR: '127.0.0.1'
```
❌ 使用 localhost 無法正確初始化集群

### 4. 設置集群端口
```yaml
environment:
  CLUSTER_GOSSIP_BIND_PORT: '7946'
  CLUSTER_DATA_BIND_PORT: '7947'
```
❌ 端口設置正確但仍無法獲取 IP 地址

### 5. 升級版本從 1.19.0 到 1.19.6
```yaml
image: semitechnologies/weaviate:1.19.6
```
❌ 問題在整個 1.19.x 系列中都存在

### 6. 使用服務名稱作為地址
```yaml
environment:
  CLUSTER_ADVERTISE_ADDR: 'weaviate'
hostname: weaviate
```
❌ 容器仍無法解析為有效的 IP 地址

## ✅ 最終解決方案

使用 **`network_mode: host`** 讓容器直接使用主機網路堆疊:

```yaml
# docker-compose.yaml
weaviate:
  image: semitechnologies/weaviate:1.19.6
  profiles:
    - weaviate
  restart: always
  network_mode: host  # 關鍵配置!
  command:
    - --host
    - 0.0.0.0
    - --port
    - '8080'
    - --scheme
    - http
  volumes:
    - ./volumes/weaviate:/var/lib/weaviate
  environment:
    PERSISTENCE_DATA_PATH: /var/lib/weaviate
    QUERY_DEFAULTS_LIMIT: 25
    AUTHENTICATION_ANONYMOUS_ACCESS_ENABLED: false
    DEFAULT_VECTORIZER_MODULE: none
    AUTHENTICATION_APIKEY_ENABLED: true
    AUTHENTICATION_APIKEY_ALLOWED_KEYS: WVF5YThaHlkYwhGUSmCRgsX3tD5ngdN8pkih
    AUTHENTICATION_APIKEY_USERS: hello@dify.ai
    AUTHORIZATION_ADMINLIST_ENABLED: true
    AUTHORIZATION_ADMINLIST_USERS: hello@dify.ai
```

### 為什麼這個方案有效?

1. **直接訪問主機網路**: 容器可以檢測到主機的真實網路介面和 IP 地址
2. **無需端口映射**: 服務直接綁定到主機端口 8080
3. **集群功能正常初始化**: Weaviate 能夠獲取到有效的 IP 地址進行集群初始化

### 注意事項

使用 `network_mode: host` 時:
- ❌ 不能使用 `ports` 配置(會被忽略)
- ❌ 不能使用 `networks` 配置(與 host 模式衝突)
- ⚠️ 容器與其他服務的通訊需要使用 `localhost` 或主機 IP
- ⚠️ 在 Windows 和 macOS 的 Docker Desktop 中,host 模式的行為可能不同(僅 Linux 完全支持)

## 驗證成功

啟動後應該看到以下日誌(無錯誤):

```json
{"action":"startup","default_vectorizer_module":"none","level":"info","msg":"the default vectorizer modules is set to \"none\"","time":"2025-12-04T05:44:04Z"}
{"action":"startup","auto_schema_enabled":true,"level":"info","msg":"auto schema enabled setting is set to \"true\"","time":"2025-12-04T05:44:04Z"}
{"action":"grpc_startup","level":"info","msg":"grpc server listening at [::]:50051","time":"2025-12-04T05:44:04Z"}
{"action":"restapi_management","level":"info","msg":"Serving weaviate at http://[::]:8080","time":"2025-12-04T05:44:05Z"}
```

測試連接:
```bash
# 檢查 API
curl http://localhost:8080/v1/meta

# 檢查健康狀態
curl http://localhost:8080/v1/.well-known/ready
```

## 相關提交記錄

- 初始嘗試修復: `3212f51ad` - Fix Weaviate cluster configuration
- 版本升級: `9d9914a1c` - Upgrade Weaviate from 1.19.0 to 1.19.6
- **最終解決方案**: `0471cb776` - Use network_mode: host for Weaviate to fix cluster init issue

## 參考資料

- [Weaviate Environment Variables](https://weaviate.io/developers/weaviate/config-refs/env-vars)
- [Weaviate Docker Installation](https://weaviate.io/developers/weaviate/installation/docker-compose)
- [Docker network_mode: host](https://docs.docker.com/network/drivers/host/)

## 修復日期

2025-12-04

## 修復人員

GitHub Copilot + andycywu
