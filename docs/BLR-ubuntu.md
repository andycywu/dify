# BLR Ubuntu 部署筆記

## 伺服器基本資訊

- OS：Ubuntu 22.04.5 LTS（inblrlxdt020）
- IP：172.27.221.51（流量經過 Firewall）
- 使用者：`obmid`
- 密碼：`obmid@123`（建議首次登入後立刻更改）
- SSH 已開放；帳號已加入 sudo 群組

```bash
# 產生 SSH 金鑰（Enter 接受預設路徑）
ssh-keygen -t ed25519 -C "obmid-mac"

# 推送公鑰（若無 ssh-copy-id 請改用下一段 one-liner）
ssh-copy-id obmid@172.27.221.51

# 無 ssh-copy-id 時改用手動方式
cat ~/.ssh/id_ed25519.pub | ssh obmid@172.27.221.51 'mkdir -p ~/.ssh && chmod 700 ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys'

# 登入
ssh obmid@172.27.221.51
```

## 專案環境變數總覽

在 `docker/.env.example` 新增了以下參數，請依照環境複製為 `docker/.env` 並調整：

| 變數 | 說明 | 預設值 |
| --- | --- | --- |
| `CUSTOM_FRONTEND_BASE_PATH` | 自製前端經由 Nginx 的掛載路徑（必須以 `/` 開頭，且不能是 `/`） | `/custom` |
| `CUSTOM_FRONTEND_DOMAIN` | 自製前端的虛擬主機名稱 | `frontend.localhost` |
| `CUSTOM_FRONTEND_PORT` | 自製前端容器內部啟動 port | `3000` |
| `DIFY_NEXT_FRONTEND_PORT` | 自製前端對外映射 port | `3001` |
| `CUSTOM_FRONTEND_EXTERNAL_ORIGIN` | 用於 NextAuth、OAuth 的公開網址 | `http://localhost` |
| `DIFY_PUBLIC_API_ORIGIN` | 瀏覽器端呼叫 Dify API 的網址 | `http://localhost/api/v1` |
| `DIFY_INTERNAL_API_ORIGIN` | 自製前端容器內部呼叫 API 的網址 | `http://api:5001` |
| `REST_TO_SOAP_PROXY_PORT` | REST to SOAP proxy 的對外 port | `5100` |
| `WIKI_DB_USER` / `WIKI_DB_PASSWORD` | Wiki.js 專用資料庫帳密 | `wiki_app` / `wiki_pass` |

> **提醒**：`CUSTOM_FRONTEND_BASE_PATH` 不能設定為 `/`，若需要獨立網域請改設定 `CUSTOM_FRONTEND_DOMAIN` 並在 Nginx 上加對應 DNS。

## 本地 Docker 開發流程

1. 複製環境設定

   ```bash
   cp docker/.env.example docker/.env
   cp dify-next-frontend/.env.docker dify-next-frontend/.env.local
   ```

   視需求調整 `docker/.env` 中的域名、Base Path 與 API Key。

2. 更新本機 hosts（提供自製前端虛擬網域）：

   ```bash
   sudo -- sh -c 'echo "127.0.0.1 frontend.localhost" >> /etc/hosts'
   ```

3. 啟動服務：

   ```bash
   cd docker
   docker compose up -d
   ```

4. 驗證路由：

   - `http://localhost` → 官方 Dify 介面
   - `http://localhost/custom` → 自製 Next.js 前端
   - `http://localhost/custom/api/health` → Next.js 健康檢查（可自建路由）
   - `http://localhost/api/v1/...` → Dify API（由 Nginx 反向代理到 `api:5001`）
   - `http://localhost:5100` → REST to SOAP proxy
   - `http://localhost:3002` → Wiki.js

5. 停止服務：

   ```bash
   docker compose down
   ```

## BLR 伺服器部署步驟

1. 將 `.env`、`.env.local` 等環境檔安全複製至伺服器（避免包含密碼的檔案進入版本控制）。
2. 伺服器上更新 `/etc/hosts`（僅內網使用）：

   ```bash
   sudo -- sh -c 'echo "127.0.0.1 frontend.localhost" >> /etc/hosts'
   ```

   如需提供給內網使用者，請在企業 DNS 中建立對應 CNAME。
3. 於 `/home/obmid/dify/docker` 內執行 `docker compose up -d`。
4. 驗證服務：

   - `https://<blr-domain>/` → 官方 Dify
   - `https://<blr-domain>/custom` 或 `https://frontend.<blr-domain>/` → 自製前端
   - `https://<blr-domain>/api/v1/...` → Dify API
   - `https://<blr-domain>:5100` → REST to SOAP proxy
   - `https://<blr-domain>:3002` → Wiki.js

5. 設定系統服務（可選）：將 `docker compose up -d` 加入 systemd 或 crontab 以便重啟後自動拉起。

## Nginx 端路由說明

- `/api`, `/v1`, `/files`, `/console/api` → `api:5001`
- `${CUSTOM_FRONTEND_BASE_PATH}` → `dify-next-frontend:${CUSTOM_FRONTEND_PORT}`
- 其他根路徑 → 官方 `web:3000`
- `/e/` → `plugin_daemon`

修改 Base Path 時記得同時調整：

1. `docker/.env` 中的 `CUSTOM_FRONTEND_BASE_PATH`
2. `dify-next-frontend/.env.docker`（或部署用環境檔）的 `NEXT_PUBLIC_BASE_PATH`、`NEXT_PUBLIC_API_URL`、`NEXTAUTH_URL`
3. 若採用獨立網域，請更新 `CUSTOM_FRONTEND_DOMAIN` 並在 DNS/Nginx 中加入對應設定。

## 資料庫與 Wiki.js

- `wiki-db-init` 會在 `db` 就緒後建立 `wiki` database、`wiki_app` 角色並授權。
- 調整 `WIKI_DB_USER`、`WIKI_DB_PASSWORD` 後需刪除 `docker/volumes/db/data` 內既有資料或手動變更 Postgres 角色密碼。

## 營運建議

- 為確保 Dify 與自製前端共榮，建議每次升級官方 Dify 版本後執行 `docker compose config` 確認模板未被覆寫。
- 針對 BLR 伺服器，可利用 `Makefile` 中的 `make docker-login`、`make docker-up`（若已自訂）簡化部署流程。
- 若需要 HTTPS，將 `CUSTOM_FRONTEND_DOMAIN` 對應的證書放入 `docker/nginx/ssl`，並開啟 `NGINX_HTTPS_ENABLED=true`。

---

> 更新時間：2025-10-01
