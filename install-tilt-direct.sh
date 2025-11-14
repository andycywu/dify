#!/bin/bash

# Alternative Tilt Installation Script for macOS
# This script installs Tilt directly from GitHub releases, bypassing Homebrew

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to detect architecture
detect_arch() {
    local arch=$(uname -m)
    case $arch in
        x86_64) echo "x86_64" ;;
        arm64) echo "arm64" ;;
        *) echo "x86_64" ;; # fallback
    esac
}

# Function to install Tilt directly
install_tilt_direct() {
    print_status "Installing Tilt directly from GitHub releases..."
    
    local arch=$(detect_arch)
    local os="darwin"
    local version="v0.33.20" # Latest stable version
    
    print_status "Detected architecture: $arch"
    print_status "Downloading Tilt $version for $os-$arch..."
    
    # Create temporary directory
    local temp_dir=$(mktemp -d)
    cd "$temp_dir"
    
    # Download Tilt binary
    local download_url="https://github.com/tilt-dev/tilt/releases/download/$version/tilt.$os.$arch.tar.gz"
    
    if curl -L -f -o "tilt.tar.gz" "$download_url"; then
        print_status "Download successful, extracting..."
        tar -xzf tilt.tar.gz
        
        # Install to /usr/local/bin
        if sudo mv tilt /usr/local/bin/tilt; then
            sudo chmod +x /usr/local/bin/tilt
            print_success "Tilt installed successfully to /usr/local/bin/tilt"
        else
            print_error "Failed to install Tilt to /usr/local/bin"
            exit 1
        fi
    else
        print_error "Failed to download Tilt from $download_url"
        exit 1
    fi
    
    # Cleanup
    cd - > /dev/null
    rm -rf "$temp_dir"
    
    # Verify installation
    if command -v tilt >/dev/null 2>&1; then
        local installed_version=$(tilt version | head -1)
        print_success "Tilt installation verified: $installed_version"
    else
        print_error "Tilt installation verification failed"
        exit 1
    fi
}

# Function to install kubectl
install_kubectl_direct() {
    print_status "Installing kubectl directly..."
    
    local arch=$(detect_arch)
    local os="darwin"
    
    # Get latest stable version
    local version=$(curl -L -s https://dl.k8s.io/release/stable.txt)
    print_status "Installing kubectl $version for $os-$arch..."
    
    # Download kubectl
    local download_url="https://dl.k8s.io/release/$version/bin/$os/$arch/kubectl"
    
    if curl -L -f -o kubectl "$download_url"; then
        chmod +x kubectl
        if sudo mv kubectl /usr/local/bin/kubectl; then
            print_success "kubectl installed successfully"
        else
            print_error "Failed to install kubectl"
            exit 1
        fi
    else
        print_error "Failed to download kubectl"
        exit 1
    fi
}

# Function to install kind
install_kind_direct() {
    print_status "Installing kind directly..."
    
    local arch=$(detect_arch)
    local os="darwin"
    local version="v0.20.0"
    
    print_status "Installing kind $version for $os-$arch..."
    
    # Download kind
    local download_url="https://kind.sigs.k8s.io/dl/$version/kind-$os-$arch"
    
    if curl -L -f -o kind "$download_url"; then
        chmod +x kind
        if sudo mv kind /usr/local/bin/kind; then
            print_success "kind installed successfully"
        else
            print_error "Failed to install kind"
            exit 1
        fi
    else
        print_error "Failed to download kind"
        exit 1
    fi
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Main installation function
main() {
    print_status "🔧 Installing Tilt.dev tools directly (bypassing Homebrew)"
    
    # Check Docker
    if ! command_exists docker; then
        print_error "Docker is required but not installed. Please install Docker Desktop first."
        print_status "Download from: https://www.docker.com/products/docker-desktop"
        exit 1
    fi
    
    # Install Tilt
    if ! command_exists tilt; then
        install_tilt_direct
    else
        print_status "Tilt already installed: $(tilt version | head -1)"
    fi
    
    # Install kubectl
    if ! command_exists kubectl; then
        install_kubectl_direct
    else
        print_status "kubectl already installed: $(kubectl version --client --short 2>/dev/null || echo 'kubectl installed')"
    fi
    
    # Install kind
    if ! command_exists kind; then
        install_kind_direct
    else
        print_status "kind already installed: $(kind version)"
    fi
    
    print_success "✅ All tools installed successfully!"
    
    # Verify installations
    print_status "🔍 Verifying installations..."
    echo "Docker: $(docker --version)"
    echo "Tilt: $(tilt version | head -1)"
    echo "kubectl: $(kubectl version --client --short 2>/dev/null || kubectl version --client)"
    echo "kind: $(kind version)"
    
    print_success "🎉 Ready to use Tilt! Run './tilt-up.sh' to start development environment."
}

# Run main function
main