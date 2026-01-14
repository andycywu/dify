FROM node:20

WORKDIR /app

# 安裝 Puppeteer 需要的所有系統依賴
RUN apt-get update && apt-get install -y \
    ca-certificates \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libgcc1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    lsb-release \
    wget \
    xdg-utils \
    && rm -rf /var/lib/apt/lists/*

# 設置 Puppeteer cache 目錄
ENV PUPPETEER_CACHE_DIR=/root/.cache/puppeteer

# 確保 cache 目錄存在
RUN mkdir -p /root/.cache/puppeteer

# 複製 package 文件
COPY package*.json ./


# 安裝依賴並強制安裝 puppeteer chrome，並顯示安裝結果（避免 cache 問題）
RUN npm install \
    && npx puppeteer browsers install chrome \
    && ls -l /root/.cache/puppeteer/chrome || true

# 複製應用代碼
COPY . .

# 創建臨時下載目錄
RUN mkdir -p /app/src/clients/temp_downloads && chmod 777 /app/src/clients/temp_downloads

# 暴露服務端口
EXPOSE 5001

# 設置容器啟動命令
CMD ["node", "index.js"]

