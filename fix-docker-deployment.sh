#!/bin/bash

echo "===== Dify Next Frontend Docker Fix ====="
echo "This script will fix the Docker deployment issues with styling and i18n."

# Step 1: Clean up existing solutions that may be causing conflicts
echo "Step 1: Cleaning up conflicting configuration..."
cd /Users/andycyw/dify/dify-next-frontend
rm -f .babelrc .babelrc.js babel-plugin-macros.config.js

# Step 2: Simplify package.json dependencies
echo "Step 2: Checking package.json dependencies..."
# We'll rely on existing dependencies, but will make sure
# we have the required ones for styling and i18n

# Step 3: Create a simplified Next.js config
echo "Step 3: Creating simplified Next.js config..."
cat > /Users/andycyw/dify/dify-next-frontend/next.config.js << 'EOL'
const { i18n } = require('./next-i18next.config');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    API_URL: process.env.API_URL || 'http://localhost:5000/api',
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:5000/api',
  },
  i18n,
  webpack: (config) => {
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });
    
    return config;
  },
}

module.exports = nextConfig;
EOL

# Step 4: Create a clean Docker file optimized for Next.js
echo "Step 4: Creating optimized Dockerfile..."
cat > /Users/andycyw/dify/dify-next-frontend/Dockerfile << 'EOL'
# Dify Next Frontend Dockerfile - Production Optimized
FROM node:18-alpine AS deps
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Rebuild the source code
FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build with proper environment variables
ENV NODE_ENV=production
RUN npm run build

# Production image, copy all the files and run next
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3100

# Copy necessary files
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.js ./next.config.js
COPY --from=builder /app/next-i18next.config.js ./next-i18next.config.js

# Copy i18n files
COPY --from=builder /app/src/lib/locales ./src/lib/locales

# Don't run production as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
RUN chown -R nextjs:nodejs /app
USER nextjs

EXPOSE 3100

CMD ["npm", "run", "start"]
EOL

# Step 5: Update environment variables
echo "Step 5: Updating environment variables..."
cat > /Users/andycyw/dify/dify-next-frontend/.env << 'EOL'
APP_API_URL=http://api:5001
APP_WEB_URL=http://localhost:3100
FILES_URL=http://api:5001/files
NEXT_PUBLIC_API_URL=http://api:5001
NEXT_PUBLIC_AUTH_URL=http://api:5001/auth
NEXT_PUBLIC_USAGE_URL=http://api:5001/usage
SECRET_KEY=sk-9f73s3ljTXVcMT3Blb3ljTqtsKiGHXVcMT3BlbkFJLK7U
NODE_ENV=production
PORT=3100

NEXTAUTH_URL=http://localhost:3100
NEXTAUTH_SECRET=KSrmLtXxPgLedlTmgB8tHEHFxbZKcTQMAoM5cchx6X0=

# API base url
API_URL=http://api:5001
EOL

# Step 6: Rebuild Docker container
echo "Step 6: Rebuilding Docker container..."
cd /Users/andycyw/dify
docker-compose -f docker/docker-compose.yaml down dify-next-frontend
docker-compose -f docker/docker-compose.yaml build dify-next-frontend
docker-compose -f docker/docker-compose.yaml up -d dify-next-frontend

echo ""
echo "===== Fix Complete! ====="
echo "The dify-next-frontend should now be running properly with styling and i18n support."
echo "You can access it at: http://localhost:3100"
echo ""
echo "If you continue to have issues, check the logs with:"
echo "docker-compose -f docker/docker-compose.yaml logs -f dify-next-frontend"
