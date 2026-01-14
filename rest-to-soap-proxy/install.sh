#!/bin/bash
set -x
echo "=== Installing dependencies ==="
npm install
echo "=== Installing Chrome ==="
npx puppeteer browsers install chrome
echo "=== Chrome installation result ==="
ls -la /root/.cache/puppeteer/chrome/ || echo "Chrome cache not found"
echo "=== Puppeteer version ==="
npx puppeteer --version || echo "Puppeteer not found"
