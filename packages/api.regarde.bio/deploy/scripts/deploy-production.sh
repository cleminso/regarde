#!/bin/bash
set -e

# =============================================================================
# Profile Worker Deployment Script
# =============================================================================
# Handles both regular deployments and rollbacks to specific versions
# Usage: ./deploy-production.sh [OPTIONS]
#
# Options:
#   --from-commit <hash>  Deploy from specific commit
#   --from-tag <tag>      Deploy from specific tag
#   --skip-checks         Skip health checks (faster deployment)
#   --help                Show this help message
#
# Examples:
#   ./deploy-production.sh                     # Deploy current code
#   ./deploy-production.sh --from-commit abc123  # Rollback to commit
#   ./deploy-production.sh --from-tag v1.2.3     # Deploy from tag
#
# Requirements:
# - .env file in packages/api.regarde.bio/ with configuration
# - Clean git working directory (when using --from-commit/--from-tag)
# =============================================================================

# Default options
SKIP_CHECKS=false
FROM_COMMIT=""
FROM_TAG=""

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --from-commit)
            FROM_COMMIT="$2"
            shift 2
            ;;
        --from-tag)
            FROM_TAG="$2"
            shift 2
            ;;
        --skip-checks)
            SKIP_CHECKS=true
            shift
            ;;
        --help)
            echo "Profile Worker Deployment Script"
            echo ""
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --from-commit <hash>  Deploy from specific commit"
            echo "  --from-tag <tag>      Deploy from specific tag"
            echo "  --skip-checks         Skip health checks"
            echo "  --help                Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0                           # Deploy current code"
            echo "  $0 --from-commit abc123      # Deploy from commit"
            echo "  $0 --from-tag v1.2.3         # Deploy from tag"
            echo "  $0 --skip-checks             # Fast deployment"
            echo ""
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Get script directory and project paths
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
DEPLOY_DIR="$(dirname "$SCRIPT_DIR")"
PACKAGE_ROOT="$(dirname "$DEPLOY_DIR")"
PROJECT_ROOT="$(dirname "$(dirname "$PACKAGE_ROOT")")"


# Load logging library
source "$SCRIPT_DIR/logger.sh"

# Script header
log_header "Profile Worker Deployment" "Production deployment"

log_info "Project root: $PROJECT_ROOT"

# Change to api.regarde.bio directory
cd "$PROJECT_ROOT"

# =============================================================================
# Configuration Loading
# =============================================================================

load_config() {
    log_step "Loading configuration"

    if [ ! -f packages/api.regarde.bio/.env ]; then
        log_error ".env file not found in packages/api.regarde.bio/ directory!"
        log_info "Copy the template: cp packages/api.regarde.bio/deploy/config/.env.template packages/api.regarde.bio/.env"
        log_info "Then edit packages/api.regarde.bio/.env with your actual values"
        exit 1
    fi

    # Load environment variables
    set -a
    source packages/api.regarde.bio/.env
    set +a

    # Required variables
    REQUIRED_VARS=(
        "APP_PUBLIC_HOSTNAME"
        "JAZZ_WORKER_ACCOUNT"
        "JAZZ_WORKER_SECRET"
        "JAZZ_SYNC_SERVER_URL"
    )

    # Optional variables with defaults
    SERVICE_NAME=${SERVICE_NAME:-"nickname-registry"}
    API-REGARDE-BIO_APP_PORT=${APP_PORT:-"3000"}
    AUTH-REGARDE-DEV_APP_PORT=${APP_PORT:-"3001"}
    HEALTH_CHECK_TIMEOUT=${HEALTH_CHECK_TIMEOUT:-"10"}
    SERVICE_RESTART_TIMEOUT=${SERVICE_RESTART_TIMEOUT:-"15"}
    NODE_ENV=${NODE_ENV:-"production"}

    # Validate required variables
    for var in "${REQUIRED_VARS[@]}"; do
        if [ -z "${!var}" ]; then
            log_error "Required environment variable $var is not set!"
            log_info "Please check your .env file"
            exit 1
        fi
    done

    log_success "Configuration loaded successfully"
    log_status_ok "Domain" "$APP_PUBLIC_HOSTNAME"
    log_status_ok "Service" "$SERVICE_NAME"
    log_status_ok "Port (api.regarde.bio)" "${API-REGARDE-BIO_APP_PORT}"
    log_status_ok "Port (auth.regarde.dev)" "${AUTH-REGARDE-DEV_APP_PORT}"
}

# =============================================================================
# System Dependencies Check
# =============================================================================

check_dependencies() {
    log_step "Checking system dependencies"

    local missing_deps=()
    local required_commands=("git" "pnpm" "bun" "nginx" "systemctl" "curl" "jq")

    for cmd in "${required_commands[@]}"; do
        if command -v "$cmd" &> /dev/null; then
            log_status_ok "Command available" "$cmd"
        else
            missing_deps+=("$cmd")
            log_status_missing "Command missing" "$cmd"
        fi
    done

    if [ ${#missing_deps[@]} -ne 0 ]; then
        log_error "Missing required dependencies: ${missing_deps[*]}"
        log_info "Run the bootstrap script first: ./deploy/scripts/bootstrap-vm.sh"
        exit 1
    fi

    log_success "All dependencies available"
}

# =============================================================================
# Version Control Functions
# =============================================================================

handle_version_change() {
    # Check if we need to change version
    if [ -n "$FROM_COMMIT" ] || [ -n "$FROM_TAG" ]; then
        log_section "Version Change"

        # Check for clean working directory
        if [ -n "$(git status --porcelain)" ]; then
            log_error "Git working directory is not clean!"
            log_info "Commit or stash your changes first:"
            log_info "  git stash           # To temporarily save changes"
            log_info "  git commit -am 'message'  # To commit changes"
            exit 1
        fi

        local target=""
        if [ -n "$FROM_COMMIT" ]; then
            target="$FROM_COMMIT"
            log_step "Switching to commit: $target"
        else
            target="$FROM_TAG"
            log_step "Switching to tag: $target"
        fi

        # Verify target exists
        if ! git rev-parse --quiet --verify "$target" > /dev/null 2>&1; then
            log_error "Invalid commit/tag: $target"
            log_info "Use 'git log --oneline' to see commits"
            log_info "Use 'git tag -l' to see tags"
            exit 1
        fi

        # Get current state for logging
        local current_commit=$(git rev-parse --short HEAD)
        local target_commit=$(git rev-parse --short "$target")

        if [ "$current_commit" != "$target_commit" ]; then
            log_info "Current: $(git log -1 --pretty=format:'%h - %s' HEAD)"
            log_info "Target:  $(git log -1 --pretty=format:'%h - %s' $target)"

            # Perform the reset
            if git reset --hard "$target"; then
                log_success "Switched to $target"
                log_info "To return to previous version: git reset --hard $current_commit"
            else
                log_error "Failed to switch to $target"
                exit 1
            fi
        else
            log_info "Already at target commit $target_commit"
        fi
    fi
}

# =============================================================================
# Initial Setup Functions
# =============================================================================

setup_nginx() {
    log_step "Setting up nginx configuration"

    local nginx_conf="/etc/nginx/sites-available/$APP_PUBLIC_HOSTNAME"

    sed "s|{{DOMAIN}}|$APP_PUBLIC_HOSTNAME|g; s|{{PORT}}|$APP_PORT|g" \
        "$DEPLOY_DIR/config/nginx.conf" | sudo tee "$nginx_conf" > /dev/null

    sudo ln -sf "$nginx_conf" "/etc/nginx/sites-enabled/"
    sudo rm -f /etc/nginx/sites-enabled/default

    if sudo nginx -t && sudo systemctl restart nginx; then
        log_success "Nginx configured for $APP_PUBLIC_HOSTNAME"
    else
        log_error "Failed to configure nginx"
        exit 1
    fi
}

setup_ssl() {
    log_step "Setting up SSL certificate"

    if [ -z "$SSL_CERTIFICATE_EMAIL" ]; then
        log_warning "SSL_CERTIFICATE_EMAIL not set, skipping SSL setup"
        log_info "Set SSL_CERTIFICATE_EMAIL in .env and run again to enable SSL"
        return
    fi

    if sudo certbot --nginx -d "$APP_PUBLIC_HOSTNAME" \
        --non-interactive --agree-tos --email "$SSL_CERTIFICATE_EMAIL"; then
        log_success "SSL certificate configured"
    else
        log_error "Failed to configure SSL certificate"
        exit 1
    fi
}

setup_systemd() {
    log_step "Setting up systemd service"

    sed "s|{{USER}}|$(whoami)|g; \
         s|{{PROJECT_ROOT}}|$PROJECT_ROOT|g; \
         s|{{PACKAGE_ROOT}}|$PACKAGE_ROOT|g; \
         s|{{BUN_PATH}}|$HOME/.bun/bin|g; \
         s|{{SERVICE_NAME}}|$SERVICE_NAME|g; \
         s|{{NODE_ENV}}|$NODE_ENV|g" \
        "$DEPLOY_DIR/config/systemd.service" | \
        sudo tee "/etc/systemd/system/$SERVICE_NAME.service" > /dev/null

    sudo systemctl daemon-reload
    sudo systemctl enable "$SERVICE_NAME"

    log_success "Systemd service configured"
}

# =============================================================================
# Deployment Functions
# =============================================================================

install_dependencies() {
    log_step "Installing dependencies"

    if pnpm install; then
        log_success "Dependencies installed"
    else
        log_error "Failed to install dependencies"
        exit 1
    fi
}

build_project() {
    log_step "Building project"

    if pnpm --filter @regarde-dev/api.regarde.bio build:schema; && pnpm --filter @regarde-dev/auth.regarde.dev build:schema; then
        log_success "Project built"
    else
        log_error "Failed to build project"
        exit 1
    fi
}

restart_service() {
    log_step "Restarting service"

    if sudo systemctl restart "$SERVICE_NAME"; then
        log_progress "Waiting ${SERVICE_RESTART_TIMEOUT}s for service to stabilize..."
        sleep "$SERVICE_RESTART_TIMEOUT"
        log_success "Service restarted"
    else
        log_error "Failed to restart service"
        exit 1
    fi
}

# =============================================================================
# Health Check Functions
# =============================================================================

check_service_status() {
    log_check "Checking service status"

    if sudo systemctl is-active "$SERVICE_NAME" --quiet; then
        log_status_ok "Service status" "active"
    else
        log_status_error "Service status" "inactive"
        sudo systemctl status "$SERVICE_NAME" --no-pager
        return 1
    fi
}

check_health() {
    log_check "Testing health endpoint"

    local max_attempts=10
    for i in $(seq 1 $max_attempts); do
        if curl -s --max-time "$HEALTH_CHECK_TIMEOUT" "http://localhost:${API-REGARDE-BIO_APP_PORT}/health" > /dev/null; then
            log_status_ok "Health check (api.regarde.bio)" "passed"
            return 0
        fi
        if curl -s --max-time "$HEALTH_CHECK_TIMEOUT" "http://localhost:${AUTH-REGARDE-DEV_APP_PORT}/health" > /dev/null; then
            log_status_ok "Health check (auth.regarde.dev)" "passed"
            return 0
        fi

        if [ $i -eq $max_attempts ]; then
            log_status_warning "Health check" "failed after $max_attempts attempts"
            log_warning "Service may need more time to start. Check logs:"
            log_info "sudo journalctl -u $SERVICE_NAME -f"
            return 0
        fi

        log_progress "Health check attempt $i failed, retrying in 2 seconds..."
        sleep 2
    done
}

# =============================================================================
# Main Deployment Logic
# =============================================================================

main() {
    # Load configuration
    load_config

    # Check if this is initial setup or update
    local is_initial_setup=false
    if ! sudo systemctl list-unit-files | grep -q "^$SERVICE_NAME.service"; then
        is_initial_setup=true
        log_info "Initial setup detected"
    else
        log_info "Update deployment detected"
    fi

    log_section "Dependency Check"
    check_dependencies

    # Handle version change if requested
    handle_version_change

    # Initial setup tasks
    if [ "$is_initial_setup" = true ]; then
        log_section "Initial Setup"
        setup_nginx
        setup_ssl
        setup_systemd
    fi

    log_section "Dependencies"
    install_dependencies

    log_section "Build"
    build_project

    log_section "Service Management"
    restart_service

    log_section "Service Status"
    check_service_status

    # Optional health check
    if [ "$SKIP_CHECKS" = false ]; then
        check_health
    else
        log_info "Health check skipped (--skip-checks flag set)"
    fi

    # Success message
    log_section "Deployment Complete"
    log_complete "Deployment completed successfully!"
    log_status_ok "Commit" "$(git rev-parse --short HEAD)"
    log_status_ok "API URL" "https://$APP_PUBLIC_HOSTNAME"

    echo ""
    log_info "Useful commands:"
    log_info "• Check status: sudo systemctl status $SERVICE_NAME"
    log_info "• View logs: sudo journalctl -u $SERVICE_NAME -f"
    log_info "• Test API: curl -s https://$APP_PUBLIC_HOSTNAME/health | jq ."
}

# Error handling
trap 'log_error "Deployment failed! Check the logs above for details."; exit 1' ERR

# Run main function
main "$@"
