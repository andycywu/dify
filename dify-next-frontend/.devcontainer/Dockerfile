FROM node:18-bullseye

# Install additional dependencies for development
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends \
        git \
        openssh-client \
        less \
        iproute2 \
        procps \
        curl \
        apt-transport-https \
        gnupg2 \
        lsb-release \
    && apt-get clean -y && rm -rf /var/lib/apt/lists/*

# Install compatible global packages for Node.js 18
RUN npm install -g npm@10 pnpm@latest

# Set working directory
WORKDIR /app

# Create a non-root user
ARG USERNAME=node
ARG USER_UID=1000
ARG USER_GID=$USER_UID

# Configure user
RUN groupmod --gid $USER_GID node \
    && usermod --uid $USER_UID --gid $USER_GID node \
    && mkdir -p /home/node/.vscode-server /home/node/.vscode-server-insiders \
    && chown -R node:node /home/node /app

USER node
