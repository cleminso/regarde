#!/bin/bash
set -e

echo "🚀 Starting production deployment with backup..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() { echo -e "${GREEN}✅ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
DEPLOY_DIR="$(dirname "$SCRIPT_DIR")"
PROJECT_ROOT="$(dirname "$DEPLOY_DIR")"

# Configuration
BACKUP_DIR="$HOME/api-backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="nickname-registry_$TIMESTAMP"
BACKUP_PATH="$BACKUP_DIR/$BACKUP_NAME"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Store current directory
ORIGINAL_DIR=$(pwd)
cd "$PROJECT_ROOT"

print_info "📂 Project directory: $PROJECT_ROOT"
print_info "💾 Backup directory: $BACKUP_DIR"
print_info "🏷️  Backup name: $BACKUP_NAME"

# Function to create backup
create_backup() {
    print_status "📦 Creating backup of current version..."

    # Create backup with git info
    mkdir -p "$BACKUP_PATH"

    # Copy source code
    cp -r src/ "$BACKUP_PATH/"
    cp package.json "$BACKUP_PATH/"
    cp tsconfig.json "$BACKUP_PATH/"

    # Copy environment if exists
    if [ -f .env ]; then
        cp .env "$BACKUP_PATH/"
    fi

    # Store git information
    echo "Git commit: $(git rev-parse HEAD)" > "$BACKUP_PATH/backup_info.txt"
    echo "Git branch: $(git branch --show-current)" >> "$BACKUP_PATH/backup_info.txt"
    echo "Backup date: $(date)" >> "$BACKUP_PATH/backup_info.txt"
    echo "Backup by: $(whoami)" >> "$BACKUP_PATH/backup_info.txt"

    print_status "💾 Backup created: $BACKUP_PATH"
}

# Function to restore from backup
restore_backup() {
    print_error "🔄 Restoring from backup: $BACKUP_NAME"

    # Stop service
    sudo systemctl stop nickname-registry

    # Restore files
    cp -r "$BACKUP_PATH/src/" ./
    cp "$BACKUP_PATH/package.json" ./
    cp "$BACKUP_PATH/tsconfig.json" ./

    if [ -f "$BACKUP_PATH/.env" ]; then
        cp "$BACKUP_PATH/.env" ./
    fi

    # Reinstall dependencies from backup
    pnpm install

    # Restart service
    sudo systemctl start nickname-registry

    print_warning "🔄 Restored from backup. Service restarted with previous version."
}

# Function to cleanup old backups (keep last 5)
cleanup_backups() {
    print_info "🧹 Cleaning up old backups (keeping last 5)..."
    cd "$BACKUP_DIR"
    ls -t | tail -n +6 | xargs -r rm -rf
    print_status "🧹 Backup cleanup completed"
}

# Trap to restore on error
trap 'restore_backup; exit 1' ERR

# Check if service is running
SERVICE_STATUS=$(sudo systemctl is-active nickname-registry || echo "inactive")
if [ "$SERVICE_STATUS" != "active" ]; then
    print_warning "Service is not currently running"
fi

# Step 1: Create backup
create_backup

# Step 2: Update code
print_status "📥 Pulling latest code..."
if ! git pull; then
    print_error "Git pull failed!"
    exit 1
fi

# Step 3: Install dependencies
print_status "📦 Installing dependencies..."
if ! pnpm install; then
    print_error "Dependencies installation failed!"
    exit 1
fi

# Step 4: Build schemas
print_status "🔨 Building schemas..."
if ! pnpm build:schema; then
    print_error "Schema build failed!"
    exit 1
fi

# Step 5: Test configuration
print_status "🧪 Validating configuration..."
if [ ! -f .env ]; then
    print_error ".env file missing!"
    exit 1
fi

# Step 6: Restart service (minimal downtime)
print_status "🔄 Restarting service..."
if ! sudo systemctl restart nickname-registry; then
    print_error "Service restart failed!"
    exit 1
fi

# Step 7: Wait for service to stabilize (longer wait)
print_status "⏱️  Waiting for service to stabilize..."
sleep 15

# Step 8: Health checks with better error handling
print_status "🔍 Checking service status..."
if ! sudo systemctl is-active nickname-registry --quiet; then
    print_error "Service is not active!"
    sudo systemctl status nickname-registry --no-pager
    exit 1
fi

print_status "🏥 Testing health endpoint (local backend)..."
for i in {1..15}; do
    if curl -s --max-time 5 http://localhost:3000/health > /dev/null; then
        print_status "Local health check passed!"
        break
    fi
    if [ $i -eq 15 ]; then
        print_error "Local health check failed after 15 attempts!"
        print_error "Service may not be fully started yet"
        exit 1
    fi
    print_warning "Local health check attempt $i failed, retrying in 2 seconds..."
    sleep 2
done

print_status "🌐 Testing health endpoint (through nginx)..."
for i in {1..20}; do
    HEALTH_RESPONSE=$(curl -s --max-time 10 https://api.regarde.dev/health)
    if echo "$HEALTH_RESPONSE" | jq -e '.status == "healthy"' > /dev/null 2>&1; then
        print_status "Nginx health check passed!"
        WORKER_ID=$(echo "$HEALTH_RESPONSE" | jq -r '.workerId')
        print_info "🔍 Worker ID: $WORKER_ID"
        break
    elif echo "$HEALTH_RESPONSE" | grep -q '"status":"healthy"'; then
        print_status "Nginx health check passed (fallback check)!"
        break
    fi
    if [ $i -eq 20 ]; then
        print_error "Nginx health check failed after 20 attempts!"
        print_error "Backend is ready but nginx connection has issues"
        print_error "Last response: $HEALTH_RESPONSE"
        print_warning "Deployment completed but nginx connection has issues"
        break
    fi
    print_warning "Nginx health check attempt $i failed, retrying in 3 seconds..."
    sleep 3
done

# Disable trap (deployment successful)
trap - ERR

# Step 9: Cleanup and report
cleanup_backups

# Make sure we're in the project directory for git commands
cd "$PROJECT_ROOT"
NEW_COMMIT=$(git rev-parse HEAD)

print_status "🎉 Deployment completed successfully!"
print_status "📸 New commit: $NEW_COMMIT"
print_status "💾 Backup available at: $BACKUP_PATH"
print_status "🌐 API is available at: https://api.regarde.dev"

# Return to original directory
cd "$ORIGINAL_DIR"
