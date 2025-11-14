# Dify Next Frontend Devcontainer 開發環境

這個 devcontainer 配置專門為 `dify-next-frontend` 項目優化，提供了即時 debug 和高效的開發體驗。

## 快速開始

### 使用 VS Code Dev Containers

1. 安裝 VS Code 與 Dev Containers 擴充套件（Remote - Containers）
2. 開啟專案資料夾：

```bash
cd /Users/andycyw/dify/dify-next-frontend
code .
```

3. 在 VS Code 命令面板（Cmd/Ctrl+Shift+P）輸入並執行「Dev Containers: Reopen in Container」
4. 等待容器建置與初始化完成（首次可能需數分鐘）

### 使用 GitHub Codespaces

如果專案在 GitHub 上，亦可用 Codespaces 開啟（參考 GitHub 設定）

## 調試 & 常用命令

- 啟動開發伺服器：

```bash
npm run dev
```

- 啟動開發伺服器（含 Node 調試埠）：

```bash
npm run dev:debug
```

- 生產建置與啟動：

```bash
npm run build
npm run start
```

- 程式碼品質：

```bash
npm run lint
npm run lint:fix
npm run type-check
```

> 調試時可以在 VS Code 的 Debug 面板選擇「Next.js: debug server-side」或「Next.js: debug client-side」。

## 已設定項目

- Forward ports: 3000 (Next.js dev), 9229 (Node debug), 5001 (Dify API)
- 建置的 Dockerfile 與初始化腳本會在容器建立後執行 `post-create.sh` 與 `post-start.sh`
- `CHOKIDAR_USEPOLLING=true` 已在 `devcontainer.json` 的 `remoteEnv` 設定以改善檔案監控在某些環境下的可靠性。

## 與 Dify API 整合

若需要本地整合 Dify API，請在主 repository 路徑啟動 API：

```bash
cd /Users/andycyw/dify
docker-compose up api -d
```

devcontainer 的啟動腳本會嘗試檢查 `http://localhost:5001/health` 的回應，若無法存取會顯示提示。

## 故障排除

- 容器建置失敗：檢查 Docker Desktop 是否啟動、磁碟空間是否足夠
- 端口衝突：修改 `devcontainer.json` 的 `forwardPorts` 或關閉使用中的服務
- 依賴問題：刪除 `node_modules` 並重新執行容器建置

## 目錄概覽

```
dify-next-frontend/
├── .devcontainer/
│   ├── devcontainer.json
│   ├── Dockerfile
│   ├── post-create.sh
│   ├── post-start.sh
│   └── README.md
└── ...
```

## 下一步建議

- 在 VS Code 容器中啟動 `npm run dev:debug`，並在 Debug 面板 attach 到 `9229`，以方便在 server-side 設置斷點。
- 若要在 host 上同時使用其它容器（例如 `api`），可保留原本的 `docker-compose` 啟動方式，或在 devcontainer 中安裝 docker CLI 以便管理容器。

祝開發順利！如要我協助把這個 devcontainer 設定套用到主專案（例如在 `/Users/andycyw/dify/.devcontainer` 中同步 important settings）或調整特定 debug 行為，請告訴我要做哪項調整。