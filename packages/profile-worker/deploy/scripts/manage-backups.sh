#!/bin/bash

echo "📦 Backup Management Tool"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() { echo -e "${GREEN}✅ $1${NC}"; }
print_info() { echo -e "${YELLOW}ℹ️  $1${NC}"; }
print_detail() { echo -e "${BLUE}  $1${NC}"; }

BACKUP_DIR="$HOME/api-backups"

# Check if backup directory exists
if [ ! -d "$BACKUP_DIR" ]; then
    echo "❌ Backup directory not found: $BACKUP_DIR"
    echo "💡 Run a deployment first to create backups"
    exit 1
fi

case "$1" in
    "list")
        print_status "📋 Available backups:"
        echo ""
        cd "$BACKUP_DIR"

        if [ -z "$(ls -A . 2>/dev/null)" ]; then
            print_info "No backups found"
            exit 0
        fi

        for backup in nickname-registry_*; do
            if [ -d "$backup" ]; then
                echo "📁 $backup"
                if [ -f "$backup/backup_info.txt" ]; then
                    while read -r line; do
                        print_detail "$line"
                    done < "$backup/backup_info.txt"
                else
                    print_detail "No backup info available"
                fi

                # Show backup size
                backup_size=$(du -sh "$backup" 2>/dev/null | cut -f1)
                print_detail "Size: $backup_size"
                echo ""
            fi
        done
        ;;
    "clean")
        print_status "🧹 Cleaning old backups (keeping last 5)..."
        cd "$BACKUP_DIR"

        backup_count=$(ls -1 | wc -l)
        if [ "$backup_count" -le 5 ]; then
            print_info "Only $backup_count backups found, nothing to clean"
            exit 0
        fi

        echo "Current backups:"
        ls -lt | head -10
        echo ""

        old_backups=$(ls -t | tail -n +6)
        if [ -n "$old_backups" ]; then
            echo "Removing old backups:"
            echo "$old_backups" | while read -r backup; do
                echo "  🗑️  $backup"
                rm -rf "$backup"
            done
            print_status "Cleanup completed"
        else
            print_info "No old backups to remove"
        fi
        ;;
    "size")
        print_status "💾 Backup directory analysis:"
        echo ""

        # Total size
        total_size=$(du -sh "$BACKUP_DIR" 2>/dev/null | cut -f1)
        print_info "Total backup size: $total_size"

        # Count backups
        backup_count=$(ls -1 "$BACKUP_DIR" 2>/dev/null | wc -l)
        print_info "Number of backups: $backup_count"

        # Show individual sizes
        echo ""
        print_info "Individual backup sizes:"
        cd "$BACKUP_DIR"
        for backup in nickname-registry_*; do
            if [ -d "$backup" ]; then
                backup_size=$(du -sh "$backup" 2>/dev/null | cut -f1)
                print_detail "$backup: $backup_size"
            fi
        done

        # Show disk usage
        echo ""
        print_info "Disk usage of home directory:"
        df -h "$HOME" | tail -1 | awk '{print "  Used: " $3 "/" $2 " (" $5 ")"}'
        ;;
    "info")
        if [ -z "$2" ]; then
            echo "Usage: $0 info <backup-name>"
            echo "Example: $0 info nickname-registry_20250705_151357"
            exit 1
        fi

        backup_name="$2"
        backup_path="$BACKUP_DIR/$backup_name"

        if [ ! -d "$backup_path" ]; then
            echo "❌ Backup not found: $backup_name"
            exit 1
        fi

        print_status "📋 Backup information: $backup_name"
        echo ""

        # Show backup info
        if [ -f "$backup_path/backup_info.txt" ]; then
            print_info "Backup details:"
            while read -r line; do
                print_detail "$line"
            done < "$backup_path/backup_info.txt"
        fi

        # Show backup contents
        echo ""
        print_info "Backup contents:"
        ls -la "$backup_path" | while read -r line; do
            print_detail "$line"
        done

        # Show backup size
        backup_size=$(du -sh "$backup_path" 2>/dev/null | cut -f1)
        echo ""
        print_info "Backup size: $backup_size"
        ;;
    *)
        echo "📦 Backup Management Tool"
        echo ""
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  list       - Show available backups with details"
        echo "  clean      - Remove old backups (keep last 5)"
        echo "  size       - Show backup directory size and usage"
        echo "  info <name> - Show detailed info about a specific backup"
        echo ""
        echo "Examples:"
        echo "  $0 list"
        echo "  $0 clean"
        echo "  $0 size"
        echo "  $0 info nickname-registry_20250705_151357"
        ;;
esac
