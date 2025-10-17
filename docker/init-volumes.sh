#!/bin/bash
# Initialize Docker volumes directory structure
# This script should be run before starting Docker containers

set -e

echo "🔧 Initializing Docker environment..."

# Step 1: Setup environment files
echo ""
echo "📝 Setting up environment files..."

if [ ! -f "../dify-next-frontend/.env.aws" ]; then
  if [ -f "../dify-next-frontend/.env.aws.example" ]; then
    echo "📋 Copying .env.aws.example to .env.aws..."
    cp "../dify-next-frontend/.env.aws.example" "../dify-next-frontend/.env.aws"
    echo "✅ Created .env.aws from example file"
    echo "⚠️  Please review and update the configuration in .env.aws if needed"
  else
    echo "❌ ERROR: .env.aws.example file not found!"
    echo "   Please create dify-next-frontend/.env.aws manually"
    exit 1
  fi
else
  echo "✅ .env.aws already exists"
fi

# Step 2: Create dify-next-frontend data directory
echo ""
echo "📁 Creating volume directories..."

FRONTEND_VOLUME_DIR="./volumes/dify-next-frontend"

if [ ! -d "$FRONTEND_VOLUME_DIR" ]; then
  echo "📁 Creating dify-next-frontend volume directory..."
  mkdir -p "$FRONTEND_VOLUME_DIR"
  chmod 755 "$FRONTEND_VOLUME_DIR"
  echo "✅ Created: $FRONTEND_VOLUME_DIR"
else
  echo "✅ Directory already exists: $FRONTEND_VOLUME_DIR"
fi

# Create other volume directories if they don't exist
VOLUME_DIRS=(
  "./volumes/app"
  "./volumes/db"
  "./volumes/redis"
  "./volumes/weaviate"
  "./volumes/sandbox"
  "./volumes/ssrf_proxy"
  "./volumes/nginx"
)

for dir in "${VOLUME_DIRS[@]}"; do
  if [ ! -d "$dir" ]; then
    echo "📁 Creating volume directory: $dir"
    mkdir -p "$dir"
  fi
done

echo ""
echo "✅ Initialization complete!"
echo ""
echo "📊 Volume structure:"
ls -la volumes/ 2>/dev/null || echo "⚠️  No volumes directory found"

echo ""
echo "ℹ️  Next steps:"
echo "   1. Review configuration in: dify-next-frontend/.env.aws"
echo "   2. Run: docker-compose build dify-next-frontend"
echo "   3. Run: docker-compose up -d"
echo "   4. Check logs: docker-compose logs -f dify-next-frontend"
echo "   5. Access frontend: http://localhost:3001"
echo "   6. Login with: admin@example.com / dify12345"
echo ""
echo "⚠️  Default credentials should be changed in production!"

