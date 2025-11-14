#!/bin/bash

# Dify Tilt.dev Development Environment Setup Script
# This script helps you get started with Tilt.dev for Dify development

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
PROFILE="default"
INSTALL_TILT=false
INSTALL_KUBECTL=false
INSTALL_KIND=false

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
    -p, --profile PROFILE     Development profile (minimal|default|full) [default: default]
    -i, --install-deps        Install Tilt, kubectl, and kind if missing
    -t, --install-tilt        Install Tilt only
    -k, --install-kubectl     Install kubectl only
    --install-kind           Install kind only
    -h, --help               Show this help message

Profiles:
    minimal     Core services only (API, DB, Redis)
    default     Core services + vector store (Weaviate)
    full        All services including Wiki, Plugin Daemon

Examples:
    $0                       # Start with default profile
    $0 -p full              # Start with full profile
    $0 -i -p minimal        # Install dependencies and start with minimal profile
    $0 --install-tilt       # Only install Tilt

EOF
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to install Tilt
install_tilt() {
    print_status "Installing Tilt..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        if command_exists brew; then
            brew install tilt-dev/tap/tilt
        else
            curl -fsSL https://raw.githubusercontent.com/tilt-dev/tilt/master/scripts/install.sh | bash
        fi
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        curl -fsSL https://raw.githubusercontent.com/tilt-dev/tilt/master/scripts/install.sh | bash
    else
        print_error "Unsupported operating system. Please install Tilt manually: https://docs.tilt.dev/install.html"
        exit 1
    fi
    print_success "Tilt installed successfully"
}

# Function to install kubectl
install_kubectl() {
    print_status "Installing kubectl..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        if command_exists brew; then
            brew install kubectl
        else
            curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/darwin/amd64/kubectl"
            chmod +x kubectl
            sudo mv kubectl /usr/local/bin/
        fi
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
        chmod +x kubectl
        sudo mv kubectl /usr/local/bin/
    else
        print_error "Unsupported operating system. Please install kubectl manually: https://kubernetes.io/docs/tasks/tools/"
        exit 1
    fi
    print_success "kubectl installed successfully"
}

# Function to install kind
install_kind() {
    print_status "Installing kind..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        if command_exists brew; then
            brew install kind
        else
            # For Intel Macs
            [ $(uname -m) = x86_64 ] && curl -Lo ./kind https://kind.sigs.k8s.io/dl/v0.20.0/kind-darwin-amd64
            # For M1 / ARM Macs
            [ $(uname -m) = arm64 ] && curl -Lo ./kind https://kind.sigs.k8s.io/dl/v0.20.0/kind-darwin-arm64
            chmod +x ./kind
            sudo mv ./kind /usr/local/bin/kind
        fi
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        curl -Lo ./kind https://kind.sigs.k8s.io/dl/v0.20.0/kind-linux-amd64
        chmod +x ./kind
        sudo mv ./kind /usr/local/bin/kind
    else
        print_error "Unsupported operating system. Please install kind manually: https://kind.sigs.k8s.io/docs/user/quick-start/"
        exit 1
    fi
    print_success "kind installed successfully"
}

# Function to check dependencies
check_dependencies() {
    print_status "Checking dependencies..."
    
    local missing_deps=()
    
    if ! command_exists tilt; then
        missing_deps+=("tilt")
        if [ "$INSTALL_TILT" = true ] || [ "$INSTALL_DEPS" = true ]; then
            install_tilt
        fi
    fi
    
    if ! command_exists kubectl; then
        missing_deps+=("kubectl")
        if [ "$INSTALL_KUBECTL" = true ] || [ "$INSTALL_DEPS" = true ]; then
            install_kubectl
        fi
    fi
    
    if ! command_exists kind; then
        missing_deps+=("kind")
        if [ "$INSTALL_KIND" = true ] || [ "$INSTALL_DEPS" = true ]; then
            install_kind
        fi
    fi
    
    if ! command_exists docker; then
        missing_deps+=("docker")
        print_error "Docker is required but not installed. Please install Docker Desktop: https://www.docker.com/products/docker-desktop"
        exit 1
    fi
    
    # Check if any dependencies are still missing
    local still_missing=()
    for dep in "${missing_deps[@]}"; do
        if ! command_exists "$dep"; then
            still_missing+=("$dep")
        fi
    done
    
    if [ ${#still_missing[@]} -ne 0 ]; then
        print_error "Missing dependencies: ${still_missing[*]}"
        print_error "Please install them manually or use the --install-deps flag"
        exit 1
    fi
    
    print_success "All dependencies are available"
}

# Function to setup kind cluster
setup_kind_cluster() {
    print_status "Setting up kind cluster for Dify..."
    
    # Check if cluster already exists
    if kind get clusters | grep -q "dify-dev"; then
        print_status "Kind cluster 'dify-dev' already exists"
        kubectl cluster-info --context kind-dify-dev
        return
    fi
    
    # Create kind cluster configuration
    cat << EOF > kind-config.yaml
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
nodes:
- role: control-plane
  kubeadmConfigPatches:
  - |
    kind: InitConfiguration
    nodeRegistration:
      kubeletExtraArgs:
        node-labels: "ingress-ready=true"
  extraPortMappings:
  - containerPort: 80
    hostPort: 80
    protocol: TCP
  - containerPort: 443
    hostPort: 443
    protocol: TCP
EOF
    
    # Create the cluster
    kind create cluster --name dify-dev --config kind-config.yaml
    
    # Set kubectl context
    kubectl cluster-info --context kind-dify-dev
    
    # Clean up
    rm kind-config.yaml
    
    print_success "Kind cluster 'dify-dev' created successfully"
}

# Function to start Tilt
start_tilt() {
    print_status "Starting Tilt with profile: $PROFILE"
    
    # Create tilt_config.json based on profile
    cat << EOF > tilt_config.json
{
  "profile": "$PROFILE",
  "enable_debug": false,
  "live_reload": true
}
EOF
    
    # Load environment variables
    if [ -f "tilt.env" ]; then
        export $(grep -v '^#' tilt.env | xargs)
    fi
    
    # Start Tilt
    print_status "Launching Tilt dashboard..."
    print_status "You can access the dashboard at: http://localhost:10350"
    
    tilt up
}

# Function to show post-startup information
show_info() {
    cat << EOF

${GREEN}🚀 Dify Development Environment Started Successfully!${NC}

${BLUE}📊 Tilt Dashboard:${NC} http://localhost:10350
${BLUE}🔗 API Server:${NC} http://localhost:5001
${BLUE}🌐 Web Interface:${NC} http://localhost:3000
${BLUE}🆕 Next Frontend:${NC} http://localhost:3001

EOF

    if [ "$PROFILE" = "full" ]; then
        cat << EOF
${BLUE}📚 Wiki.js:${NC} http://localhost:3002
${BLUE}🔌 Plugin Daemon:${NC} http://localhost:5002

EOF
    fi

    cat << EOF
${YELLOW}📋 Available Commands:${NC}
  tilt up                    # Start all services
  tilt down                  # Stop all services
  tilt logs <service>        # View service logs
  tilt trigger <resource>    # Manually trigger resource update

${YELLOW}🔧 Development Tips:${NC}
  - Edit files in ./api or ./web for live reload
  - Use the Tilt dashboard to monitor service status
  - Check service logs in the dashboard for troubleshooting

${YELLOW}🛑 To Stop:${NC}
  Press Ctrl+C or run: tilt down

EOF
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -p|--profile)
            PROFILE="$2"
            shift 2
            ;;
        -i|--install-deps)
            INSTALL_DEPS=true
            INSTALL_TILT=true
            INSTALL_KUBECTL=true
            INSTALL_KIND=true
            shift
            ;;
        -t|--install-tilt)
            INSTALL_TILT=true
            shift
            ;;
        -k|--install-kubectl)
            INSTALL_KUBECTL=true
            shift
            ;;
        --install-kind)
            INSTALL_KIND=true
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

# Validate profile
if [[ ! "$PROFILE" =~ ^(minimal|default|full)$ ]]; then
    print_error "Invalid profile: $PROFILE. Must be one of: minimal, default, full"
    exit 1
fi

# Main execution
main() {
    print_status "🚀 Starting Dify Development Environment with Tilt.dev"
    print_status "Profile: $PROFILE"
    
    # Check and install dependencies
    check_dependencies
    
    # Setup kind cluster
    setup_kind_cluster
    
    # Start Tilt
    start_tilt
    
    # Show information
    show_info
}

# Run main function
main