#!/bin/bash

echo "🔄 Manual API Rollback Tool"

# Colors
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

BACKUP_DIR="$HOME/api-backups"

# Check if backup directory exists
if [ ! -d "$BACKUP_DIR" ]; then
    print_error "Backup directory not found: $BACKUP_DIR"
    print_info "Run a deployment first to create backups"
    exit 1
fi

# Check if there are any backups
cd "$BACKUP_DIR"
if [ -z "$(ls -A . 2>/dev/null)" ]; then
    print_error "No backups found in $BACKUP_DIR"
    print_info "Run a deployment first to create backups"
    exit 1
fi

# List available backups
print_status "📋 Available backups:"
echo ""
backup_list=()
counter=1

for backup in $(ls -t nickname-registry_*); do
    if [ -d "$backup" ]; then
        backup_list+=("$backup")
        echo "[$counter] $backup"

        if [ -f "$backup/backup_info.txt" ]; then
            while read -r line; do
                print_info "    $line"
            done < "$backup/backup_info.txt"
        fi

        # Show backup size
        backup_size=$(du -sh "$backup" 2>/dev/null | cut -f1)
        print_info "    Size: $backup_size"
        echo ""

        ((counter++))
    fi
done

if [ ${#backup_list[@]} -eq 0 ]; then
    print_error "No valid backups found"
    exit 1
fi

# Get user choice
echo "Available options:"
echo "  latest - Use the most recent backup"
echo "  [number] - Select backup by number"
echo "  [name] - Enter full backup name"
echo "  cancel - Cancel rollback"
echo ""
read -p "Enter your choice: " BACKUP_CHOICE

case "$BACKUP_CHOICE" in
    "latest")
        BACKUP_TO_RESTORE="${backup_list[0]}"
        ;;
    "cancel")
        print_warning "Rollback cancelled"
        exit 0
        ;;
    [0-9]*)
        if [ "$BACKUP_CHOICE" -ge 1 ] && [ "$BACKUP_CHOICE" -le ${#backup_list[@]} ]; then
            BACKUP_TO_RESTORE="${backup_list[$((BACKUP_CHOICE-1))]}"
        else
            print_error "Invalid selection: $BACKUP_CHOICE"
            exit 1
        fi
        ;;
    *)
        BACKUP_TO_RESTORE="$BACKUP_CHOICE"
        ;;
esac

# Validate backup exists
if [ ! -d "$BACKUP_DIR/$BACKUP_TO_RESTORE" ]; then
    print_error "Backup not found: $BACKUP_TO_RESTORE"
    exit 1
fi

# Show backup details
print_warning "About to restore from backup: $BACKUP_TO_RESTORE"
echo ""
if [ -f "$BACKUP_DIR/$BACKUP_TO_RESTORE/backup_info.txt" ]; then
    cat "$BACKUP_DIR/$BACKUP_TO_RESTORE/backup_info.txt"
else
    print_warning "No backup information available"
fi

echo ""
print_warning "⚠️  This will:"
print_warning "  • Stop the current service"
print_warning "  • Replace current code with backup version"
print_warning "  • Reinstall dependencies"
print_warning "  • Restart the service"
echo ""
read -p "Are you sure you want to continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    print_warning "Rollback cancelled"
    exit 0
fi

print_status "🔄 Starting rollback process..."

# Stop service
print_status "⏹️  Stopping service..."
sudo systemctl stop nickname-registry

# Navigate to project directory
cd "$PROJECT_ROOT"

# Create a pre-rollback backup
print_status "📦 Creating pre-rollback backup..."
PRE_ROLLBACK_DIR="$BACKUP_DIR/pre-rollback-$(date +%Y%m%d_%H%M%S)"
mkdir -p "$PRE_ROLLBACK_DIR"
cp -r src/ "$PRE_ROLLBACK_DIR/" 2>/dev/null || true
cp package.json "$PRE_ROLLBACK_DIR/" 2>/dev/null || true
cp tsconfig.json "$PRE_ROLLBACK_DIR/" 2>/dev/null || true
cp .env "$PRE_ROLLBACK_DIR/" 2>/dev/null || true
echo "Pre-rollback backup created at: $(date)" > "$PRE_ROLLBACK_DIR/backup_info.txt"

# Restore files
print_status "📂 Restoring files from backup..."
if [ -d "$BACKUP_DIR/$BACKUP_TO_RESTORE/src" ]; then
    rm -rf src/
    cp -r "$BACKUP_DIR/$BACKUP_TO_RESTORE/src/" ./
fi

if [ -f "$BACKUP_DIR/$BACKUP_TO_RESTORE/package.json" ]; then
    cp "$BACKUP_DIR/$BACKUP_TO_RESTORE/package.json" ./
fi

if [ -f "$BACKUP_DIR/$BACKUP_TO_RESTORE/tsconfig.json" ]; then
    cp "$BACKUP_DIR/$BACKUP_TO_RESTORE/tsconfig.json" ./
fi

if [ -f "$BACKUP_DIR/$BACKUP_TO_RESTORE/.env" ]; then
    cp "$BACKUP_DIR/$BACKUP_TO_RESTORE/.env" ./
fi

# Reinstall dependencies
print_status "📦 Installing dependencies..."
pnpm install

# Build schemas
print_status "🔨 Building schemas..."
pnpm build:schema

# Start service
print_status "▶️  Starting service..."
sudo systemctl start nickname-registry

# Wait for service to stabilize
print_status "⏱️  Waiting for service to stabilize..."
sleep 10

# Check service status
print_status "🔍 Checking service status..."
if sudo systemctl is-active nickname-registry --quiet; then
    print_status "✅ Service is running"
else
    print_error "❌ Service failed to start"
    print_error "Check logs: sudo journalctl -u nickname-registry -f"
    exit 1
fi

# Test health endpoint
print_status "🏥 Testing health endpoint..."
sleep 5
for i in {1..10}; do
    if curl -s --max-time 5 https://api.jazz.dev/health > /dev/null; then
        print_status "🎉 Rollback completed successfully!"
        print_status "🌐 API is available at: https://api.jazz.dev"
        print_info "📁 Pre-rollback backup saved at: $PRE_ROLLBACK_DIR"
        break
    fi
    if [ $i -eq 10 ]; then
        print_error "❌ Health check failed after rollback!"
        print_error "Check logs: sudo journalctl -u nickname-registry -f"
        exit 1
    fi
    print_warning "Health check attempt $i failed, retrying in 2 seconds..."
    sleep 2
done

# Show final status
print_status "📊 Final status:"
sudo systemctl status nickname-registry --no-pager --lines=3
