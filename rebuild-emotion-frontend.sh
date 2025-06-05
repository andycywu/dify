#!/bin/bash

echo "Updating Dockerfile to use emotion styling..."
cd /Users/andycyw/dify
mv /Users/andycyw/dify/dify-next-frontend/Dockerfile.new /Users/andycyw/dify/dify-next-frontend/Dockerfile

echo "Creating .babelrc.js with minimal configuration..."
cat > /Users/andycyw/dify/dify-next-frontend/.babelrc.js << 'EOL'
module.exports = {
  presets: ['next/babel']
}
EOL

echo "Rebuilding Docker container..."
cd /Users/andycyw/dify
docker-compose -f docker/docker-compose.yaml down dify-next-frontend
docker-compose -f docker/docker-compose.yaml build dify-next-frontend
docker-compose -f docker/docker-compose.yaml up -d dify-next-frontend

echo "Setup complete! The frontend should now be accessible with proper styling."
