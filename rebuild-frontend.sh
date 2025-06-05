#!/bin/bash
# Script to rebuild the Docker image with the updated configuration

cd /Users/andycyw/dify

echo "Building dify-next-frontend Docker image..."
cd /Users/andycyw/dify/dify-next-frontend
docker build -t dify-next-frontend .

echo "Restarting services..."
cd /Users/andycyw/dify/docker
docker-compose down dify-next-frontend
docker-compose up -d dify-next-frontend

echo "Build complete! The frontend should now be accessible with proper styling."
