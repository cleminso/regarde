#!/bin/bash
set -e

# =============================================================================
# API Server VM Bootstrap Script
# =============================================================================
# This script sets up a fresh Ubuntu VM with all required dependencies
# Usage: ./packages/api.regarde.dev/deploy/scripts/bootstrap-vm.sh
#
# Requirements:
# - Fresh Ubuntu 20.04+ VM
# - Non-root user with sudo access
# - Domain pointing to VM IP (api.regarde.dev)
# =============================================================================

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
DEPLOY_DIR="$(dirname "$SCRIPT_DIR")"
PROJECT_ROOT="$(dirname "$DEPLOY_DIR")"

# Load logging library
source "$SCRIPT_DIR/logger.sh"

# Script header
log_header "API Server Bootstrap" "Setting up fresh Ubuntu VM with required dependencies"

log_info "Script location: $SCRIPT_DIR"
log_info "Deploy directory: $DEPLOY_DIR"
log_info "Project root: $PROJECT_ROOT"

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   log_error "Don't run this script as root!"
   exit 1
fi

log_section "System Update"
log_step "Updating system packages"
sudo apt update && sudo apt upgrade -y
log_success "System packages updated"

log_section "Dependencies Installation"
log_step "Installing system dependencies"
sudo apt install -y \
    curl \
    git \
    nginx \
    certbot \
    python3-certbot-nginx \
    jq \
    htop \
    unzip
log_success "System dependencies installed"

log_step "Installing Node.js and PNPM"
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
    log_status_ok "Node.js" "installed"
else
    log_status_ok "Node.js" "already available"
fi

if ! command -v pnpm &> /dev/null; then
    npm install -g pnpm
    log_status_ok "PNPM" "installed"
else
    log_status_ok "PNPM" "already available"
fi

log_step "Installing Bun"
if ! command -v bun &> /dev/null; then
    curl -fsSL https://bun.sh/install | bash
    echo 'export PATH="$HOME/.bun/bin:$PATH"' >> ~/.bashrc
    export PATH="$HOME/.bun/bin:$PATH"
    log_status_ok "Bun" "installed"
else
    log_status_ok "Bun" "already available"
fi

log_section "Project Setup"
log_step "Installing project dependencies"
cd "$PROJECT_ROOT"
pnpm install
log_success "Project dependencies installed"

log_step "Setting up environment configuration"
if [ ! -f .env ]; then
    if [ -f "$DEPLOY_DIR/config/.env.template" ]; then
        cp "$DEPLOY_DIR/config/.env.template" .env
        log_success "Environment template copied to .env"
        log_warning "Please edit .env file with your actual values!"
        log_info "Edit command: nano .env"
    else
        log_warning "No .env template found. Please create .env file manually."
    fi
else
    log_status_ok "Environment file" "already exists"
fi

log_section "Bootstrap Complete"
log_complete "Bootstrap completed successfully!"
echo ""
log_info "Next steps:"
log_info "1. Edit the .env file with your actual values:"
log_info "   nano .env"
echo ""
log_info "2. Run the deployment script to complete setup:"
log_info "   ./deploy/scripts/deploy-production.sh"
echo ""
log_info "The deployment script will handle:"
log_info "• Nginx configuration"
log_info "• SSL certificate setup"
log_info "• Systemd service creation"
log_info "• Application deployment"
echo ""
log_warning "Make sure to configure your .env file before running deployment!"
