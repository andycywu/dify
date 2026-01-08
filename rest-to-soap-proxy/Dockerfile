# 使用包含 Puppeteer 依賴的 Node.js 20 基礎鏡像
FROM ghcr.io/puppeteer/puppeteer:22.10.0

# 將工作目錄從 /home/pptruser 切換到 /app
# pptruser 是基礎鏡像中預設的非 root 用戶
WORKDIR /app

# 將 package.json 和 package-lock.json 複製到工作目錄
# 並將所有者設置為 pptruser
COPY --chown=pptruser:pptruser package*.json ./

# 以 pptruser 的身份安裝 npm 依賴
# 基礎鏡像已包含瀏覽器，所以 npm install 會跳過下載
RUN npm install

# 將所有應用代碼複製到工作目錄
COPY --chown=pptruser:pptruser . .

# 創建下載臨時目錄並設置權限
RUN mkdir -p /app/src/clients/temp_downloads && chown -R pptruser:pptruser /app/src/clients/temp_downloads

# 暴露服務端口
EXPOSE 5001

# 設置容器啟動命令
CMD ["node", "index.js"]

