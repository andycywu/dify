#!/bin/bash

echo "🚀 Setting up Dify Next Frontend development environment..."

# Install dependencies using pnpm for faster installs and disk efficiency
echo "📦 Installing dependencies with pnpm..."
if command -v pnpm >/dev/null 2>&1; then
    pnpm install --frozen-lockfile || pnpm install
else
    echo "pnpm not found, installing pnpm globally..."
    npm install -g pnpm
    pnpm install
fi

# Copy environment file if it doesn't exist
if [ ! -f .env.local ]; then
    if [ -f .env.docker ]; then
        echo "📄 Copying .env.docker to .env.local..."
        cp .env.docker .env.local
    elif [ -f .env.example ]; then
        echo "📄 Copying .env.example to .env.local..."
        cp .env.example .env.local
    else
        echo "⚠️  No environment file found. Creating basic .env.local..."
        cat > .env.local << EOF
NODE_ENV=development
PORT=3000
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_DIFY_API_BASE_URL=http://localhost:3001/api/dify
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=dev-nextauth-secret-key-change-in-production
JWT_SECRET=dify-wiki-integration-dev-secret
SECRET_KEY=dev-secret-key-change-in-production
EOF
    fi
fi

# Set up git hooks if they exist
if [ -d ".git" ]; then
    echo "🔧 Setting up git configuration..."
    git config --global --add safe.directory /app
fi

echo "✅ Post-create setup completed!"
echo ""
echo "🎯 Quick start commands:"
echo "  pnpm run dev     - Start development server"
echo "  pnpm run build   - Build for production"
echo "  pnpm run lint    - Run ESLint"
echo ""