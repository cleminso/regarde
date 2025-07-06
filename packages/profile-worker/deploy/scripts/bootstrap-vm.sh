#!/bin/bash
set -e

echo "🚀 Setting up Nickname Registry VM from scratch..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() { echo -e "${GREEN}✅ $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
DEPLOY_DIR="$(dirname "$SCRIPT_DIR")"
PROJECT_ROOT="$(dirname "$DEPLOY_DIR")"

print_info "🔧 Script location: $SCRIPT_DIR"
print_info "🔧 Deploy directory: $DEPLOY_DIR"
print_info "🔧 Project root: $PROJECT_ROOT"

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "Don't run this script as root!"
   exit 1
fi

print_status "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

print_status "🔧 Installing dependencies..."
sudo apt install -y \
    curl \
    git \
    nginx \
    certbot \
    python3-certbot-nginx \
    jq \
    htop \
    unzip

print_status "📦 Installing Node.js and PNPM..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
fi

if ! command -v pnpm &> /dev/null; then
    npm install -g pnpm
fi

print_status "🔧 Installing Bun..."
if ! command -v bun &> /dev/null; then
    curl -fsSL https://bun.sh/install | bash
    echo 'export PATH="$HOME/.bun/bin:$PATH"' >> ~/.bashrc
    export PATH="$HOME/.bun/bin:$PATH"
fi

print_status "📦 Installing project dependencies..."
cd "$PROJECT_ROOT"
pnpm install

print_status "🔧 Setting up environment variables..."
if [ ! -f .env ]; then
    if [ -f "$DEPLOY_DIR/config/.env.template" ]; then
        cp "$DEPLOY_DIR/config/.env.template" .env
        print_warning "Please edit .env file with your actual values!"
        print_warning "nano $PROJECT_ROOT/.env"
    else
        print_warning "No .env template found. Please create .env file manually."
    fi
fi

print_status "🌐 Configuring nginx..."
sudo cp "$DEPLOY_DIR/config/nginx.conf" /etc/nginx/sites-available/api.jazz.dev
sudo ln -sf /etc/nginx/sites-available/api.jazz.dev /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl restart nginx

print_status "🔐 Setting up SSL certificate..."
read -p "Enter your email for SSL certificate: " email
sudo certbot --nginx -d api.jazz.dev --non-interactive --agree-tos --email "$email"

print_status "🔧 Creating systemd service..."
# Replace placeholders in service template
sed "s|{{USER}}|$(whoami)|g; s|{{PROJECT_ROOT}}|$PROJECT_ROOT|g; s|{{BUN_PATH}}|$HOME/.bun/bin|g" \
    "$DEPLOY_DIR/config/systemd.service" | sudo tee /etc/systemd/system/nickname-registry.service > /dev/null

sudo systemctl daemon-reload
sudo systemctl enable nickname-registry
sudo systemctl start nickname-registry

print_status "📜 Setting up management scripts..."
cp "$DEPLOY_DIR/scripts/deploy-production.sh" ~/
cp "$DEPLOY_DIR/scripts/rollback.sh" ~/
cp "$DEPLOY_DIR/scripts/manage-backups.sh" ~/
chmod +x ~/*.sh

print_status "📜 Management scripts are now available in your home directory:"
print_info "• ~/deploy-production.sh - Deploy new versions"
print_info "• ~/rollback.sh - Rollback to previous version"
print_info "• ~/manage-backups.sh - Manage backups"
print_info ""
print_info "💡 You can run these from anywhere on the system!"

print_status "🔍 Final verification..."
sleep 15
if curl -s https://api.jazz.dev/health > /dev/null; then
    print_status "🎉 Setup completed successfully!"
    print_status "🌐 API is available at: https://api.jazz.dev"
    print_info ""
    print_info "🚀 Your VM is ready for production!"
    print_info "📋 Common next steps:"
    print_info "• Edit .env if needed: nano .env"
    print_info "• Deploy updates: ./deploy-production.sh"
    print_info "• Check status: sudo systemctl status nickname-registry"
    print_info "• View logs: sudo journalctl -u nickname-registry -f"
else
    print_warning "Setup completed but API health check failed"
    print_warning "Check logs: sudo journalctl -u nickname-registry -f"
    print_info ""
    print_info "📋 Troubleshooting steps:"
    print_info "• Check service: sudo systemctl status nickname-registry"
    print_info "• Check logs: sudo journalctl -u nickname-registry -f"
    print_info "• Verify .env: nano .env"
    print_info "• Restart service: sudo systemctl restart nickname-registry"
fi
