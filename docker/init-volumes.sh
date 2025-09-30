#!/bin/bash
# Initialize Docker volumes directory structure
# This script should be run before starting Docker containers

set -e

echo "🔧 Initializing Docker volumes directory structure..."

# Create dify-next-frontend data directory
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
echo "✅ Volume directories initialized successfully!"
echo ""
echo "📊 Volume structure:"
ls -la volumes/ 2>/dev/null || echo "⚠️  No volumes directory found"

echo ""
echo "ℹ️  Next steps:"
echo "   1. Run: docker-compose up -d"
echo "   2. Check logs: docker-compose logs -f dify-next-frontend"
echo "   3. Access frontend: http://localhost:3001"
echo "   4. Login with: admin@example.com / dify12345"
