# Admin CLI Package

## Overview

The **@regarde-dev/admin** package provides the administrative CLI for Regarde developers. It connects directly to Jazz registry worker accounts to manage nickname registries, reservations, audit logs, backups, and health monitoring. This is for internal administrative use only.

## Quick Commands

```bash
# Development
pnpm dev                   # Watch mode
pnpm build                # Build to dist/index.mjs
pnpm clean               # Clean dist directory
pnpm cli -- <cmd>        # Run CLI commands

# Examples
pnpm cli -- nickname add --nickname "test" --account-id "co_z123"
admin --help             # View all commands
admin <command> --help   # View subcommand help
```

## Security Warning

This CLI has **DIRECT WRITE ACCESS** to registries. All operations MUST log to auditLog. NOT for end users - use @regarde-dev/cli instead.

## Full Specification

See [../../docs/specs/admin-operations.md](../../docs/specs/admin-operations.md) for complete Admin CLI documentation including:

- Service architecture
- All subcommand references
- Critical operations (audit, backup, integrity)
- Risk management practices
