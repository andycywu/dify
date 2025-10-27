#!/bin/sh
set -e

echo "🚀 Starting dify-next-frontend container..."

# Generate Prisma client at runtime with binary engine
echo "🔧 Generating Prisma client with binary engine..."
PRISMA_CLI_QUERY_ENGINE_TYPE=binary PRISMA_CLIENT_ENGINE_TYPE=binary npx prisma generate --schema=./prisma/schema.prisma || {
    echo "⚠️ Prisma generate with binary engine failed, trying library engine..."
    PRISMA_CLI_QUERY_ENGINE_TYPE=library PRISMA_CLIENT_ENGINE_TYPE=library npx prisma generate --schema=./prisma/schema.prisma || {
        echo "❌ Both binary and library engines failed, but continuing startup..."
    }
}

# Run Prisma migration to ensure DB schema is up-to-date (optional)
echo "📊 Running database migrations..."
npx prisma migrate deploy || {
    echo "⚠️ Database migration failed, but continuing startup..."
}

echo "✅ Container initialization complete"

# Start Next.js app
echo "🌐 Starting Next.js application..."
npm run start
