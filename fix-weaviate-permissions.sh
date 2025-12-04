#!/bin/bash

# ==============================================================================
# Weaviate Permission Fix Script for Ubuntu
# ==============================================================================

set -e

# Color definitions
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Starting Weaviate Permission Fix ===${NC}"

# Check if running with sudo
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}Please run this script with sudo or as root${NC}"
  exit 1
fi

# Define the path to the weaviate volume
WEAVIATE_VOL_DIR="./docker/volumes/weaviate"

# Check if the directory exists
if [ ! -d "$WEAVIATE_VOL_DIR" ]; then
    echo -e "${YELLOW}Directory $WEAVIATE_VOL_DIR does not exist. Creating it...${NC}"
    mkdir -p "$WEAVIATE_VOL_DIR"
fi

# Fix permissions
# Weaviate container typically runs as UID 1000.
# If the directory is owned by root, Weaviate cannot write to it.
echo -e "${YELLOW}Setting ownership of $WEAVIATE_VOL_DIR to 1000:1000...${NC}"
chown -R 1000:1000 "$WEAVIATE_VOL_DIR"

# Also set read/write permissions just in case
echo -e "${YELLOW}Setting permissions to 775...${NC}"
chmod -R 775 "$WEAVIATE_VOL_DIR"

echo -e "${GREEN}=== Permission Fix Complete ===${NC}"
echo -e "You can now try restarting the containers with:"
echo -e "cd docker && docker compose down && docker compose up -d"
