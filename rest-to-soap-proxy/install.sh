#!/bin/bash
set -x
echo "=== Installing dependencies ==="
npm install
echo "=== Chrome will be installed at runtime ==="
echo "=== Puppeteer version ==="
npx puppeteer --version || echo "Puppeteer not found"
