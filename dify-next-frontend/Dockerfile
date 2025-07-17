# Dify Next Frontend Dockerfile - Production Optimized
FROM node:18-alpine AS deps
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
COPY prisma ./prisma
COPY prisma/dev.db ./prisma/dev.db
RUN \
  if [ -f package-lock.json ]; then npm ci; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Rebuild the source code only if deps change
FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 支援 build-arg 指定要複製哪個 .env 檔案，預設為 .env.aws
ARG ENV_FILE=.env.aws
COPY ${ENV_FILE} .env

# Next.js collects completely anonymous telemetry regarding usage.
# This information is used to shape Next.js' roadmap and prioritize features.
# You can learn more, including how to opt-out if you'd not like to participate in this anonymous program, by visiting the following URL:
# https://nextjs.org/telemetry
ENV NEXT_TELEMETRY_DISABLED=1

# Generate Prisma client for the target platform
RUN npx prisma generate

# Ensure dev.db exists (create if missing)
RUN if [ ! -f prisma/dev.db ]; then \
      echo "dev.db not found, creating initial database..."; \
      npx prisma db push; \
    fi

# Build the application
ENV NODE_ENV=production
RUN npm run build

# Production image, copy all the files and run next

FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3100

# 支援 build-arg 指定要複製哪個 .env 檔案，預設為 .env.aws
ARG ENV_FILE=.env.aws
COPY ${ENV_FILE} .env

# Copy package.json for reference only
COPY package.json package-lock.json* ./

# Copy node_modules from builder (to include @prisma/client)
COPY --from=builder /app/node_modules ./node_modules

# Copy necessary files
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/next.config.js ./next.config.js
COPY --from=builder /app/next-i18next.config.js ./next-i18next.config.js
COPY --from=builder /app/prisma ./prisma

# Copy i18n files (fix path)
COPY --from=builder /app/locales ./locales
COPY --from=builder /app/lib ./lib

# Copy database file to working directory
COPY --from=builder /app/prisma/dev.db ./dev.db

# Don't run production as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 在切換用戶之前完成所有需要 root 權限的操作
RUN mkdir -p /app/data && \
    chown -R nextjs:nodejs /app && \
    chmod 755 /app && \
    chmod 755 /app/prisma && \
    chmod 666 /app/dev.db && \
    if [ ! -f /app/dev.db ]; then \
      touch /app/dev.db && chown nextjs:nodejs /app/dev.db && chmod 666 /app/dev.db; \
    fi

# 重新生成 Prisma Client 以確保在正確的 runtime 環境下生成
RUN npx prisma generate && \
    chown -R nextjs:nodejs /app/node_modules/.prisma

# 現在才切換到非 root 用戶
USER nextjs

EXPOSE 3100

CMD ["npm", "run", "start"]
