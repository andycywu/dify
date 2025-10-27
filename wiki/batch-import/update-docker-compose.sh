#!/bin/bash

echo "📝 更新 Docker Compose 配置以包含批量導入服務..."

# 備份原始 docker-compose 文件
cp /Users/andycyw/dify/docker/docker-compose.yaml /Users/andycyw/dify/docker/docker-compose.yaml.backup

# 添加批量導入服務到 docker-compose.yaml
cat >> /Users/andycyw/dify/docker/docker-compose.yaml << 'COMPOSE_EOF'

  wiki-batch-importer:
    build:
      context: ../wiki/batch-import
      dockerfile: Dockerfile
    ports:
      - "5050:5050"
    environment:
      - PORT=5050
      - WIKI_DB_HOST=db
      - WIKI_DB_PORT=5432
      - WIKI_DB_NAME=wiki
      - WIKI_DB_USER=wiki_app
      - WIKI_DB_PASSWORD=wiki_pass
    volumes:
      - ../wiki/batch-import/uploads:/app/uploads
    depends_on:
      - db
      - wiki
    restart: unless-stopped
    networks:
      - default
COMPOSE_EOF

echo "✅ Docker Compose 配置已更新"
