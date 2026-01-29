#!/bin/bash
# Multi-Skill Installer for jazz-regarde
# Supports: --local, --global, --self

set -e

# Detect project directory
PROJECT_NAME="${PROJECT_NAME:-$(basename "$(pwd)")}"
SKILLS_DIR=".opencode/skills"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_info() {
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

# Show usage
usage() {
    cat << EOF
Usage: $0 [OPTIONS]

Install jazz-regarde skill for AI agents.

Options:
    --local     Install in current project (.opencode/skills/)
    --global    Install in ~/.config/opencode/skills/
    --self      Install as development setup
    -h, --help  Show this help message

Examples:
    $0 --local    # Install in current project
    $0 --global   # Install globally for all projects
    $0 --self     # Development setup
EOF
}

# Install skill to target directory
install_skill() {
    local target_dir="$1"
    local skill_name="$2"
    local source_dir="$3"
    
    print_info "Installing $skill_name to $target_dir..."
    
    # Create target directory
    mkdir -p "$target_dir"
    
    # Copy skill files
    if [ -d "$source_dir" ]; then
        cp -r "$source_dir"/* "$target_dir/"
        print_success "Installed $skill_name"
    else
        print_error "Source directory not found: $source_dir"
        exit 1
    fi
}

# Check if this is running from the skill directory
get_source_dir() {
    # If script is in skills/jazz-regarde/, use parent directory
    if [ -d "$(dirname "$0")/../commands" ]; then
        echo "$(dirname "$0")/.."
    else
        # Assume we're in the skill root
        echo "."
    fi
}

# Main installation logic
main() {
    local mode=""
    local source_dir
    
    # Parse arguments
    case "${1:-}" in
        --local)
            mode="local"
            ;;
        --global)
            mode="global"
            ;;
        --self)
            mode="self"
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        "")
            print_error "Please specify installation mode: --local, --global, or --self"
            usage
            exit 1
            ;;
        *)
            print_error "Unknown option: $1"
            usage
            exit 1
            ;;
    esac
    
    source_dir=$(get_source_dir)
    
    case "$mode" in
        local)
            target="./$SKILLS_DIR/jazz-regarde"
            install_skill "$target" "jazz-regarde" "$source_dir"
            print_info "Installed locally in current project"
            print_info "Target: $target"
            ;;
        global)
            target="$HOME/.config/opencode/skills/jazz-regarde"
            install_skill "$target" "jazz-regarde" "$source_dir"
            print_info "Installed globally for all projects"
            print_info "Target: $target"
            ;;
        self)
            print_info "Development setup - no installation needed"
            print_info "Source: $source_dir"
            ;;
    esac
    
    print_success "Installation complete!"
    print_info "Skill: jazz-regarde"
    print_info "Mode: $mode"
}

main "$@"
