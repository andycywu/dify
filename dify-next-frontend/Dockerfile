# Dify Next Frontend Dockerfile - Production Optimized with PostgreSQL
FROM node:20-slim AS deps
WORKDIR /app

# Install dependencies for Prisma
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
COPY prisma ./prisma
RUN \
  if [ -f package-lock.json ]; then \
    npm ci || (echo "npm ci failed, falling back to npm install" && npm install); \
  else \
    echo "Lockfile not found, running npm install" && npm install; \
  fi

# Rebuild the source code only if deps change
FROM node:20-slim AS builder
WORKDIR /app

# Install dependencies for Prisma
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 支援 build-arg 指定要複製哪個 .env 檔案，預設為 .env.docker
ARG ENV_FILE=.env.docker
COPY ${ENV_FILE} .env

# Next.js collects completely anonymous telemetry regarding usage.
# This information is used to shape Next.js' roadmap and prioritize features.
# You can learn more, including how to opt-out if you'd not like to participate in this anonymous program, by visiting the following URL:
# https://nextjs.org/telemetry
ENV NEXT_TELEMETRY_DISABLED=1

# Generate Prisma client for the target platform
ENV PRISMA_CLI_QUERY_ENGINE_TYPE=binary
ENV PRISMA_CLIENT_ENGINE_TYPE=binary

# Set a default DATABASE_URL for Prisma generate (only used for schema validation)
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"

# Skip Prisma generate at build time due to binary compatibility issues
# Will generate at runtime with proper environment

# Build the application
ENV NODE_ENV=production
RUN npm run build

# 安裝 @types/node 型別定義
RUN npm install --save-dev @types/node

# Production image, copy all the files and run next

FROM node:20-slim AS runner
WORKDIR /app

# Install dependencies for Prisma
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# 在基底映像中安裝 curl 和 Docker CLI
RUN apt-get update && \
    apt-get install -y curl ca-certificates && \
    install -m 0755 -d /etc/apt/keyrings && \
    curl -fsSL https://download.docker.com/linux/debian/gpg -o /etc/apt/keyrings/docker.asc && \
    chmod a+r /etc/apt/keyrings/docker.asc && \
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/debian bookworm stable" > /etc/apt/sources.list.d/docker.list && \
    apt-get update && \
    apt-get install -y docker-ce-cli && \
    rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV PORT=3100

# 支援 build-arg 指定要複製哪個 .env 檔案，預設為 .env.docker
ARG ENV_FILE=.env.docker
COPY ${ENV_FILE} .env

# Copy package.json for reference only
COPY package.json package-lock.json* ./

# Copy node_modules from builder (to include @prisma/client)
COPY --from=builder /app/node_modules ./node_modules

# Copy necessary files
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/.env .env
COPY --from=builder /app/next.config.js ./next.config.js
COPY --from=builder /app/next-i18next.config.js ./next-i18next.config.js
COPY --from=builder /app/prisma ./prisma

# Copy i18n files (fix path)
COPY --from=builder /app/locales ./locales
COPY --from=builder /app/lib ./lib
COPY --from=builder /app/pages ./pages
COPY --from=builder /app/scripts ./scripts

# Don't run production as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy custom entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# 在切換用戶之前完成所有需要 root 權限的操作
RUN mkdir -p /app/data && \
    chown -R nextjs:nodejs /app && \
    chmod 755 /app

# 現在才切換到非 root 用戶
USER nextjs

EXPOSE 3100

# Use custom entrypoint that handles Prisma generation
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
