#!/bin/bash
set -e

# =============================================================================
# Profile Worker Backup Management Tool
# =============================================================================
# This script manages backups created by the deployment script
# Usage: ./packages/api.regarde.bio/deploy/scripts/manage-backups.sh [command]
#
# Commands: list, clean, size, info <backup-name>
# =============================================================================

# Get script directory and load configuration
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
DEPLOY_DIR="$(dirname "$SCRIPT_DIR")"
PROJECT_ROOT="$(dirname "$DEPLOY_DIR")"

# Load logging library
source "$SCRIPT_DIR/logger.sh"

# Script header
log_header "Profile Worker Backup Management" "Manage deployment backups"

# Change to project directory and load config
cd "$PROJECT_ROOT"

if [ -f .env ]; then
    set -a
    source .env
    set +a
fi

# Set defaults
SERVICE_NAME=${SERVICE_NAME:-"nickname-registry"}
BACKUP_DIR_NAME=${BACKUP_DIR_NAME:-"api-backups"}

BACKUP_DIR="$HOME/$BACKUP_DIR_NAME"

# Check if backup directory exists
if [ ! -d "$BACKUP_DIR" ]; then
    log_error "Backup directory not found: $BACKUP_DIR"
    log_info "Run a deployment first to create backups"
    exit 1
fi

case "$1" in
    "list")
        log_section "Available Backups"
        cd "$BACKUP_DIR"

        if [ -z "$(ls -A . 2>/dev/null)" ]; then
            log_info "No backups found"
            exit 0
        fi

        for backup in "${SERVICE_NAME}_"*; do
            if [ -d "$backup" ]; then
                log_status_ok "Backup" "$backup"
                if [ -f "$backup/backup_info.txt" ]; then
                    while read -r line; do
                        log_debug "  $line"
                    done < "$backup/backup_info.txt"
                else
                    log_debug "  No backup info available"
                fi

                # Show backup size
                backup_size=$(du -sh "$backup" 2>/dev/null | cut -f1)
                log_debug "  Size: $backup_size"
                echo ""
            fi
        done
        ;;
    "clean")
        log_section "Backup Cleanup"
        log_step "Cleaning old backups (keeping last 5)"
        cd "$BACKUP_DIR"

        backup_count=$(ls -1 | wc -l)
        if [ "$backup_count" -le 5 ]; then
            log_info "Only $backup_count backups found, nothing to clean"
            exit 0
        fi

        log_info "Current backups:"
        ls -lt | head -10
        echo ""

        old_backups=$(ls -t | tail -n +6)
        if [ -n "$old_backups" ]; then
            log_step "Removing old backups"
            echo "$old_backups" | while read -r backup; do
                log_debug "Removing: $backup"
                rm -rf "$backup"
            done
            log_success "Cleanup completed"
        else
            log_info "No old backups to remove"
        fi
        ;;
    "size")
        log_section "Backup Directory Analysis"

        # Total size
        total_size=$(du -sh "$BACKUP_DIR" 2>/dev/null | cut -f1)
        log_status_ok "Total backup size" "$total_size"

        # Count backups
        backup_count=$(ls -1 "$BACKUP_DIR" 2>/dev/null | wc -l)
        log_status_ok "Number of backups" "$backup_count"

        # Show individual sizes
        echo ""
        log_info "Individual backup sizes:"
        cd "$BACKUP_DIR"
        for backup in "${SERVICE_NAME}_"*; do
            if [ -d "$backup" ]; then
                backup_size=$(du -sh "$backup" 2>/dev/null | cut -f1)
                log_debug "$backup: $backup_size"
            fi
        done

        # Show disk usage
        echo ""
        log_info "Disk usage of home directory:"
        df -h "$HOME" | tail -1 | awk '{print "  Used: " $3 "/" $2 " (" $5 ")"}'
        ;;
    "info")
        if [ -z "$2" ]; then
            log_error "Usage: $0 info <backup-name>"
            log_info "Example: $0 info ${SERVICE_NAME}_20250705_151357"
            exit 1
        fi

        backup_name="$2"
        backup_path="$BACKUP_DIR/$backup_name"

        if [ ! -d "$backup_path" ]; then
            log_error "Backup not found: $backup_name"
            exit 1
        fi

        log_section "Backup Information: $backup_name"

        # Show backup info
        if [ -f "$backup_path/backup_info.txt" ]; then
            log_info "Backup details:"
            while read -r line; do
                log_debug "$line"
            done < "$backup_path/backup_info.txt"
        fi

        # Show backup contents
        echo ""
        log_info "Backup contents:"
        ls -la "$backup_path" | while read -r line; do
            log_debug "$line"
        done

        # Show backup size
        backup_size=$(du -sh "$backup_path" 2>/dev/null | cut -f1)
        echo ""
        log_status_ok "Backup size" "$backup_size"
        ;;
    *)
        log_section "Backup Management Tool"
        echo "Usage: $0 [command]"
        echo ""
        log_info "Commands:"
        log_info "  list       - Show available backups with details"
        log_info "  clean      - Remove old backups (keep last 5)"
        log_info "  size       - Show backup directory size and usage"
        log_info "  info <name> - Show detailed info about a specific backup"
        echo ""
        log_info "Examples:"
        log_info "  $0 list"
        log_info "  $0 clean"
        log_info "  $0 size"
        log_info "  $0 info ${SERVICE_NAME}_20250705_151357"
        ;;
esac
