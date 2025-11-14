#!/bin/bash

# Dify Tilt.dev Development Environment Cleanup Script
# This script helps you clean up Tilt.dev resources and optionally uninstall tools

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
CLEAN_CLUSTER=false
UNINSTALL_TOOLS=false
REMOVE_DATA=false

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to show usage
show_usage() {
    cat << EOF
Usage: $0 [OPTIONS]

Options:
    -c, --clean-cluster       Delete the kind cluster
    -u, --uninstall-tools     Uninstall Tilt, kubectl, and kind
    -d, --remove-data         Remove all persistent data
    -a, --all                 Perform complete cleanup (all options above)
    -h, --help               Show this help message

Examples:
    $0                       # Stop Tilt only
    $0 -c                    # Stop Tilt and delete cluster
    $0 -a                    # Complete cleanup and uninstall
    $0 --clean-cluster       # Delete cluster only

EOF
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to stop Tilt
stop_tilt() {
    print_status "Stopping Tilt..."
    
    if command_exists tilt; then
        if pgrep -f "tilt up" > /dev/null; then
            print_status "Tilt is running, stopping..."
            pkill -f "tilt up" || true
            sleep 2
        fi
        
        # Try tilt down if Tiltfile exists
        if [ -f "Tiltfile" ]; then
            tilt down || true
        fi
        
        print_success "Tilt stopped"
    else
        print_warning "Tilt not found"
    fi
}

# Function to clean up kind cluster
clean_cluster() {
    print_status "Cleaning up kind cluster..."
    
    if command_exists kind; then
        # Check if cluster exists
        if kind get clusters | grep -q "dify-dev"; then
            print_status "Deleting kind cluster 'dify-dev'..."
            kind delete cluster --name dify-dev
            print_success "Kind cluster deleted"
        else
            print_warning "Kind cluster 'dify-dev' not found"
        fi
    else
        print_warning "kind not found"
    fi
}

# Function to remove persistent data
remove_data() {
    print_status "Removing persistent data..."
    
    # Remove Docker volumes
    if command_exists docker; then
        print_status "Removing Docker volumes..."
        docker volume ls -q | grep -E "(dify|postgres|redis|weaviate)" | xargs -r docker volume rm || true
    fi
    
    # Remove local data directories
    local data_dirs=(
        "./docker/volumes"
        "./tilt_data"
        "/tmp/dify-postgres-data"
        "/tmp/dify-redis-data"
        "./kind-config.yaml"
        "./tilt_config.json"
    )
    
    for dir in "${data_dirs[@]}"; do
        if [ -d "$dir" ] || [ -f "$dir" ]; then
            print_status "Removing $dir..."
            rm -rf "$dir"
        fi
    done
    
    print_success "Persistent data removed"
}

# Function to uninstall tools
uninstall_tools() {
    print_warning "⚠️  This will uninstall Tilt, kubectl, and kind from your system"
    read -p "Are you sure you want to continue? (y/N): " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_status "Skipping tool uninstallation"
        return
    fi
    
    print_status "Uninstalling development tools..."
    
    # Uninstall based on OS
    if [[ "$OSTYPE" == "darwin"* ]]; then
        if command_exists brew; then
            print_status "Uninstalling via Homebrew..."
            brew uninstall tilt || true
            brew uninstall kubectl || true  
            brew uninstall kind || true
        else
            print_status "Removing binaries manually..."
            sudo rm -f /usr/local/bin/tilt
            sudo rm -f /usr/local/bin/kubectl
            sudo rm -f /usr/local/bin/kind
        fi
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        print_status "Removing binaries..."
        sudo rm -f /usr/local/bin/tilt
        sudo rm -f /usr/local/bin/kubectl
        sudo rm -f /usr/local/bin/kind
    else
        print_warning "Unsupported OS for automatic uninstall. Please remove tools manually"
        return
    fi
    
    print_success "Tools uninstalled"
}

# Function to clean up Docker resources
cleanup_docker() {
    print_status "Cleaning up Docker resources..."
    
    if command_exists docker; then
        # Stop and remove Dify containers
        print_status "Stopping Dify containers..."
        docker ps -q --filter "label=app=dify" | xargs -r docker stop || true
        docker ps -aq --filter "label=app=dify" | xargs -r docker rm || true
        
        # Remove Dify images (optional)
        read -p "Remove Dify Docker images? This will require rebuilding next time (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            docker images -q --filter "reference=dify-*" | xargs -r docker rmi || true
            docker images -q --filter "reference=langgenius/dify-*" | xargs -r docker rmi || true
        fi
        
        # Clean up unused resources
        print_status "Cleaning up unused Docker resources..."
        docker system prune -f || true
        
        print_success "Docker cleanup completed"
    else
        print_warning "Docker not found"
    fi
}

# Function to show cleanup summary
show_summary() {
    cat << EOF

${GREEN}🧹 Cleanup Summary${NC}

${BLUE}What was cleaned up:${NC}
✅ Tilt processes stopped
EOF

    if [ "$CLEAN_CLUSTER" = true ]; then
        echo "✅ Kind cluster deleted"
    fi
    
    if [ "$REMOVE_DATA" = true ]; then
        echo "✅ Persistent data removed"
        echo "✅ Docker resources cleaned"
    fi
    
    if [ "$UNINSTALL_TOOLS" = true ]; then
        echo "✅ Development tools uninstalled"
    fi

    cat << EOF

${YELLOW}Next steps:${NC}
- To restart development: ./tilt-up.sh
- To reinstall tools: ./tilt-up.sh --install-deps
- To check Docker usage: docker system df

${BLUE}Need help?${NC} See TILT_GUIDE.md for more information.

EOF
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -c|--clean-cluster)
            CLEAN_CLUSTER=true
            shift
            ;;
        -u|--uninstall-tools)
            UNINSTALL_TOOLS=true
            shift
            ;;
        -d|--remove-data)
            REMOVE_DATA=true
            shift
            ;;
        -a|--all)
            CLEAN_CLUSTER=true
            UNINSTALL_TOOLS=true
            REMOVE_DATA=true
            shift
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Main execution
main() {
    print_status "🧹 Starting Dify Tilt.dev Environment Cleanup"
    
    # Always stop Tilt first
    stop_tilt
    
    # Clean up Docker resources if removing data
    if [ "$REMOVE_DATA" = true ]; then
        cleanup_docker
    fi
    
    # Clean cluster if requested
    if [ "$CLEAN_CLUSTER" = true ]; then
        clean_cluster
    fi
    
    # Remove data if requested
    if [ "$REMOVE_DATA" = true ]; then
        remove_data
    fi
    
    # Uninstall tools if requested
    if [ "$UNINSTALL_TOOLS" = true ]; then
        uninstall_tools
    fi
    
    # Show summary
    show_summary
    
    print_success "Cleanup completed successfully! ✨"
}

# Run main function
main