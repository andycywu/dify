#!/bin/bash

# Test script to verify dify-next-frontend fixes

echo "=== Rebuilding and testing dify-next-frontend ==="

# Stop current containers
echo "Stopping containers..."
docker-compose down

# Rebuild the frontend image
echo "Rebuilding dify-next-frontend image..."
docker-compose build dify-next-frontend

# Start services
echo "Starting services..."
docker-compose up -d

# Wait a moment for services to start
echo "Waiting for services to initialize..."
sleep 10

# Check logs
echo "=== Checking dify-next-frontend logs ==="
docker-compose logs dify-next-frontend

echo "=== Test completed ==="
echo "If you see Prisma errors above, please check the configuration."
echo "If the service starts successfully, the fix is working."
