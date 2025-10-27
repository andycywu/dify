#!/bin/bash
# 檢查 Docker 構建進度

echo "=== Docker Build Progress ==="
echo ""

# 檢查進程
if ps aux | grep -v grep | grep "docker-compose.*build" > /dev/null; then
    echo "✓ Build process is running"
    ps aux | grep -v grep | grep "docker-compose.*build" | awk '{print "  PID: " $2}'
else
    echo "✗ No build process found"
fi

echo ""
echo "=== Last 30 lines of build log ==="
tail -30 /tmp/docker-build.log 2>/dev/null || echo "Log file not found"

echo ""
echo "=== To follow the log in real-time, run: ==="
echo "tail -f /tmp/docker-build.log"
