#!/bin/bash
# 修復 API Dockerfile 網絡問題腳本

echo "🔧 修復 API Dockerfile 網絡連接問題..."

# 備份原始 Dockerfile
cp /Users/andycyw/dify/api/Dockerfile /Users/andycyw/dify/api/Dockerfile.backup
echo "✅ 已備份原始 Dockerfile"

# 創建修復版本的 Dockerfile
cat > /Users/andycyw/dify/api/Dockerfile.fixed << 'EOF'
FROM python:3.12-slim-bookworm as base

WORKDIR /app/api

# Install uv for fast package management
RUN pip install --no-cache-dir uv==0.6.14

# Build stage for packages
FROM base as packages

# Install build dependencies with network fixes
RUN apt-get update \
    && apt-get install -y --no-install-recommends gcc g++ libc6-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy project files
COPY pyproject.toml uv.lock ./

# Install Python dependencies
RUN UV_HTTP_TIMEOUT=120 uv sync --locked

# Production stage
FROM base as production

LABEL maintainer="contact@dify.ai"

# Set user and working directory
WORKDIR /app/api

# Configure build environment
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONIOENCODING=utf-8

# Set Python encoding
ENV LANG=C.UTF-8

# Expose port
EXPOSE 5001

# Set timezone
ENV TZ=UTC

# Install runtime dependencies with network fixes and retry mechanism
RUN echo 'Acquire::http::Timeout "120";' > /etc/apt/apt.conf.d/99timeout \
    && echo 'Acquire::https::Timeout "120";' >> /etc/apt/apt.conf.d/99timeout \
    && echo 'Acquire::Retries "3";' >> /etc/apt/apt.conf.d/99timeout \
    && (apt-get update || apt-get update || apt-get update) \
    && apt-get install -y --no-install-recommends --fix-missing \
        curl nodejs libgmp-dev libmpfr-dev libmpc-dev \
        expat libldap-2.5-0 perl libsqlite3-0 zlib1g \
        media-types libmagic1 \
    || (echo "Primary installation failed, trying essential packages only..." \
        && apt-get install -y --no-install-recommends curl nodejs libmagic1) \
    && apt-get autoremove -y \
    && rm -rf /var/lib/apt/lists/* \
    && rm -f /etc/apt/apt.conf.d/99timeout

# Copy Python environment and packages
ENV VIRTUAL_ENV=/app/api/.venv
COPY --from=packages ${VIRTUAL_ENV} ${VIRTUAL_ENV}
ENV PATH="${VIRTUAL_ENV}/bin:${PATH}"

# Copy source code
COPY . .

# Create directory for logs
RUN mkdir -p /app/logs

# Create a non-root user for security
RUN groupadd -r appuser && useradd -r -g appuser appuser
RUN chown -R appuser:appuser /app
USER appuser

# Add health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5001/health || exit 1

# Default command
CMD ["python", "-m", "gunicorn", "--bind", "0.0.0.0:5001", "--worker-class", "gevent", "--worker-connections", "1000", "--workers", "1", "--timeout", "200", "app:app"]
EOF

echo "✅ 已創建修復版本的 Dockerfile"

# 詢問是否應用修復
read -p "是否應用修復版本的 Dockerfile？(y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    cp /Users/andycyw/dify/api/Dockerfile.fixed /Users/andycyw/dify/api/Dockerfile
    echo "✅ 已應用修復版本"
    echo ""
    echo "🚀 現在可以嘗試重新構建:"
    echo "docker build --network=host -t andywu719/dify-api:latest api/"
    echo ""
    echo "或者使用更寬鬆的構建選項:"
    echo "docker build --network=host --build-arg BUILDKIT_INLINE_CACHE=1 -t andywu719/dify-api:latest api/"
else
    echo "⏸️  修復版本已保存為 Dockerfile.fixed，您可以稍後手動應用"
fi

echo ""
echo "📋 如果仍然遇到問題，請嘗試:"
echo "1. 檢查網絡連接：ping 8.8.8.8"
echo "2. 重啟 Docker 服務"
echo "3. 清理 Docker 緩存：docker system prune -f"
echo "4. 使用 VPN 或代理"
echo ""
echo "恢復原始 Dockerfile 的命令:"
echo "cp /Users/andycyw/dify/api/Dockerfile.backup /Users/andycyw/dify/api/Dockerfile"
