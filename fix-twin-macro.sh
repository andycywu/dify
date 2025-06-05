#!/bin/bash

echo "Installing twin.macro and dependencies..."
cd /Users/andycyw/dify/dify-next-frontend
npm install --save twin.macro styled-components
npm install --save-dev @types/styled-components babel-plugin-macros @babel/plugin-syntax-typescript @babel/preset-typescript

echo "Copying new Dockerfile to replace the current one..."
mv Dockerfile.new Dockerfile

echo "Rebuilding Docker container..."
cd /Users/andycyw/dify
docker-compose -f docker/docker-compose.yaml down dify-next-frontend
docker-compose -f docker/docker-compose.yaml build dify-next-frontend
docker-compose -f docker/docker-compose.yaml up -d dify-next-frontend

echo "Twin.macro setup complete! The frontend container has been rebuilt."
