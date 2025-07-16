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

# 確保 DATABASE_URL 指向正確的路徑
ENV DATABASE_URL="file:./prisma/dev.db"

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

# Don't run production as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Ensure prisma directory and dev.db have correct permissions
RUN chown -R nextjs:nodejs /app
RUN chmod 755 /app/prisma
RUN if [ -f /app/prisma/dev.db ]; then chmod 644 /app/prisma/dev.db; fi

USER nextjs

EXPOSE 3100

CMD ["npm", "run", "start"]
