#!/bin/bash

# =============================================================================
# Bash Logger Library
# =============================================================================
# This library provides consistent logging functionality that matches the
# TypeScript Logger class used in other parts of the application.
# 
# Usage:
#   source "$(dirname "$0")/logger.sh"
#   log_success "Operation completed"
#   log_error "Something went wrong"
# =============================================================================

# Color definitions (matching TypeScript Logger class)
declare -r LOG_RESET='\x1b[0m'
declare -r LOG_BRIGHT='\x1b[1m'
declare -r LOG_RED='\x1b[31m'
declare -r LOG_GREEN='\x1b[32m'
declare -r LOG_YELLOW='\x1b[33m'
declare -r LOG_BLUE='\x1b[34m'
declare -r LOG_CYAN='\x1b[36m'
declare -r LOG_GRAY='\x1b[90m'

# Basic logging functions (matching TypeScript Logger class)
log_success() {
    echo -e "${LOG_GREEN}${LOG_BRIGHT}[SUCCESS]${LOG_RESET} $1"
}

log_failed() {
    echo -e "${LOG_RED}${LOG_BRIGHT}[FAILED]${LOG_RESET} $1"
}

log_check() {
    echo -e "${LOG_BLUE}${LOG_BRIGHT}[CHECK]${LOG_RESET} $1"
}

log_status() {
    echo -e "${LOG_YELLOW}${LOG_BRIGHT}[STATUS]${LOG_RESET} $1"
}

log_info() {
    echo -e "${LOG_CYAN}${LOG_BRIGHT}[INFO]${LOG_RESET} $1"
}

log_error() {
    echo -e "${LOG_RED}${LOG_BRIGHT}[ERROR]${LOG_RESET} $1" >&2
}

log_warning() {
    echo -e "${LOG_YELLOW}${LOG_BRIGHT}[WARNING]${LOG_RESET} $1"
}

log_debug() {
    echo -e "${LOG_GRAY}${LOG_BRIGHT}[DEBUG]${LOG_RESET} $1"
}

# Status indication functions (matching TypeScript Logger class)
log_status_ok() {
    local label="$1"
    local value="${2:-}"
    local display_value=""
    if [ -n "$value" ]; then
        display_value=": $value"
    fi
    echo -e "${LOG_GREEN}${LOG_BRIGHT}[OK]${LOG_RESET} ${label}${display_value}"
}

log_status_error() {
    local label="$1"
    local value="${2:-}"
    local display_value=""
    if [ -n "$value" ]; then
        display_value=": $value"
    fi
    echo -e "${LOG_RED}${LOG_BRIGHT}[ERROR]${LOG_RESET} ${label}${display_value}"
}

log_status_warning() {
    local label="$1"
    local value="${2:-}"
    local display_value=""
    if [ -n "$value" ]; then
        display_value=": $value"
    fi
    echo -e "${LOG_YELLOW}${LOG_BRIGHT}[WARN]${LOG_RESET} ${label}${display_value}"
}

log_status_missing() {
    local label="$1"
    local value="${2:-}"
    local display_value=""
    if [ -n "$value" ]; then
        display_value=": $value"
    fi
    echo -e "${LOG_RED}${LOG_BRIGHT}[MISSING]${LOG_RESET} ${label}${display_value}"
}

log_status_inactive() {
    local label="$1"
    local value="${2:-}"
    local display_value=""
    if [ -n "$value" ]; then
        display_value=": $value"
    fi
    echo -e "${LOG_GRAY}${LOG_BRIGHT}[INACTIVE]${LOG_RESET} ${label}${display_value}"
}

log_status_unknown() {
    local label="$1"
    local value="${2:-}"
    local display_value=""
    if [ -n "$value" ]; then
        display_value=": $value"
    fi
    echo -e "${LOG_CYAN}${LOG_BRIGHT}[UNKNOWN]${LOG_RESET} ${label}${display_value}"
}

# Generic status function (matching TypeScript Logger class)
log_format_status() {
    local status="$1"
    local label="$2"
    local value="${3:-}"

    # Convert to lowercase using tr for better compatibility
    local status_lower=$(echo "$status" | tr '[:upper:]' '[:lower:]')

    case "$status_lower" in
        "ok")
            log_status_ok "$label" "$value"
            ;;
        "missing")
            log_status_missing "$label" "$value"
            ;;
        "mismatch")
            log_status_warning "$label" "$value"
            ;;
        "inactive")
            log_status_inactive "$label" "$value"
            ;;
        "not_found")
            log_status_unknown "$label" "$value"
            ;;
        "error")
            log_status_error "$label" "$value"
            ;;
        *)
            log_status_unknown "$label" "$value"
            ;;
    esac
}

# Utility functions for common deployment scenarios
log_step() {
    echo -e "${LOG_BLUE}${LOG_BRIGHT}[STEP]${LOG_RESET} $1"
}

log_progress() {
    echo -e "${LOG_CYAN}${LOG_BRIGHT}[PROGRESS]${LOG_RESET} $1"
}

log_complete() {
    echo -e "${LOG_GREEN}${LOG_BRIGHT}[COMPLETE]${LOG_RESET} $1"
}

# Header function for script identification
log_header() {
    local script_name="$1"
    local description="$2"
    echo ""
    echo -e "${LOG_BLUE}${LOG_BRIGHT}=== $script_name ===${LOG_RESET}"
    if [ -n "$description" ]; then
        echo -e "${LOG_CYAN}$description${LOG_RESET}"
    fi
    echo ""
}

# Section separator
log_section() {
    echo ""
    echo -e "${LOG_GRAY}${LOG_BRIGHT}--- $1 ---${LOG_RESET}"
}

# Export functions so they can be used by sourcing scripts
export -f log_success log_failed log_check log_status log_info log_error log_warning log_debug
export -f log_status_ok log_status_error log_status_warning log_status_missing log_status_inactive log_status_unknown
export -f log_format_status log_step log_progress log_complete log_header log_section
