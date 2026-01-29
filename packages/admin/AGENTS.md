# AGENTS.md - Admin CLI Package Guidelines

## Overview

**@regarde-dev/admin** is the administrative CLI for Regarde developers only. Connects directly to Jazz registry worker account to manage nickname registries, reservations, audit logs, backups, and health monitoring. Executable name: `admin`.

## Access Control

**SECURITY**: This CLI has direct write access to registry data:

- Forward registry (nickname → Jazz account ID)
- Reverse registry (Jazz account ID → nickname)
- Reserved nicknames registry
- Audit log
- Registry backup operations

**NOT for end users** - use @regarde-dev/cli instead.

## Commands

```bash
pnpm dev              # Watch mode
pnpm build            # Build to dist/index.mjs
pnpm clean            # Clean dist directory
pnpm cli -- <cmd>     # Run CLI commands
```

### Running Commands

```bash
# Direct run (no global install)
pnpm cli -- nickname add --nickname "test" --account-id "co_z123"

# After global install
admin nickname add --nickname "test" --account-id "co_z123"

# JSON output for scripting
admin health check --format json

# View all commands
admin --help

# View subcommand help
admin nickname --help
```

## Architecture

### Service-Based Architecture

`AdminService` orchestrates specialized services:

- **NicknameService**: Registry CRUD operations (add, update, remove, lookup)
- **ReservationService**: Reserved nickname management (reserve, unreserve, list)
- **AuditService**: Append-only audit log operations
- **BackupService**: Registry backup/restore (download, restore, delete, clean)
- **ReservationBackupService**: Reservation backup/restore
- **HealthService**: Health checks and integrity validation

### Command Pattern

Curried handler factory with `withAdminService` helper:

```typescript
export const nicknameCommands: ToolConfig[] = [
  {
    name: "add",
    flags: [
      { name: "nickname", mandatory: true },
      { name: "accountId", mandatory: true },
    ],
    handler: async (ctx) => {
      return withAdminService(async (admin) => {
        return await admin.addNickname(ctx.args.nickname, ctx.args.accountId);
      });
    },
  },
];
```

### Worker Initialization

1. Load worker credentials from env (`JAZZ_WORKER_ACCOUNT`, `JAZZ_WORKER_SECRET`, `JAZZ_SYNC_SERVER_URL`)
2. Start Jazz worker with RegistryWorkerAccount schema
3. Deep load registries: `ensureLoaded({ resolve: { root: { registry, reverseRegistry, auditLog, reservedNicknames } } })`
4. Initialize services with loaded registries
5. Commands execute via service layer

### withAdminService Pattern

Ensures proper resource management:

```typescript
async (admin: AdminService) => {
  await admin.initialize(); // Start worker, load registries
  await operation(admin); // Execute command
  await admin.cleanup(); // Shutdown worker
};
```

## Key Commands (Subcommand Structure)

All commands are now organized under subcommands for better organization:

**Nickname Management**: `admin nickname <command>`

- `add` - Add a nickname to account mapping
- `update` - Transfer nickname to different account
- `remove` - Remove nickname from registry
- `fix-account-access` - Fix worker access to account

**Reservations**: `admin reservation <command>`

- `reserve` - Reserve a nickname
- `unreserve` - Remove a reservation
- `list-reserved` - List all reserved nicknames
- `check-reserved` - Check if nickname is reserved

**Audit Log**: `admin audit <command>`

- `history` - Show registry change history
- `history-account` - Show history for specific account
- `history-nickname` - Show history for specific nickname
- `clear-audit` - Clear corrupted audit entries

**Backups**: `admin backup <command>`

- `download-registries` - Export registries as JSON
- `restore-all` - Restore from backup file
- `delete-all` - Delete all registry entries
- `list-backups` - List available backup files
- `clean-old-backups` - Clean old backup files

**Reservation Backups**: `admin reservation-backup <command>`

- `backup-reservations` - Create reservation backup
- `restore-reservations` - Restore from reservation backup
- `list-reservation-backups` - List reservation backups
- `clean-old-reservation-backups` - Clean old reservation backups

**Health & Integrity**: `admin health <command>`

- `health` - Check registry integrity and health
- `check-nickname-health` - Check health for specific nickname/account
- `check-connectivity` - Test Jazz worker connectivity
- `fix-nickname` - Fix synchronization issues

**Integrity**: `admin integrity <command>`

- `validate-data` - Validate data integrity
- `check-duplicates` - Check for duplicate registrations

**Monitoring**: `admin monitoring <command>`

- `metrics` - Display registry metrics

**Performance**: `admin performance <command>`

- `benchmark` - Run performance benchmarks
- `audit-security` - Security audit of access patterns

**Inspection**: `admin inspect <command>`

- `get-nickname` - Inspect nickname state
- `get-account` - Inspect account state

### Global Flags

All subcommands inherit global flags from the parent parser:

- `--format` - Output format: text or json
- `--verbose` / `-v` - Enable verbose output

## Critical Operations

### Audit Logging

**ALL registry operations MUST log to auditLog**:

```typescript
const auditEntry: TRegistryAuditEntry = {
  timestamp: Date.now(),
  operation: "add",
  nickname,
  jazzAccountId: accountId,
  source: "admin-cli", // or "user-app", "worker"
  metadata: { adminAccountId: worker.$jazz.id },
};
root.auditLog.$jazz.push(auditEntry);
await root.auditLog.$jazz.waitForSync();
```

### Validation Safety

Always verify loaded before access:

```typescript
const isLoaded = root !== null && root.$isLoaded === true;
if (isLoaded === false) throw new Error("Root not available");

// Deep load nested structures
await worker.$jazz.ensureLoaded({
  resolve: { root: { registry: true, reverseRegistry: { $each: true } } },
});
```

### Backup Operations

Two separate backup systems in local directories:

- `registry-backups/` - Forward/reverse nickname registries
- `reserveRegistry-backups/` - Reserved nicknames

Backup files timestamped with ISO format. Restore requires confirmation (type "yes" or "DELETE"). Backups can be old-backup-cleaned by retention policy.

### Integrity Validation

Checks forward/reverse registry consistency:

- Validates each nickname→accountId mapping matches reverse mapping
- Detects duplicates in both directions
- `--fix` flag auto-repairs inconsistencies with sync
- Critical for data health monitoring

## Environment Variables

Required:

- `JAZZ_WORKER_ACCOUNT` - Registry worker account ID
- `JAZZ_WORKER_SECRET` - Registry worker account secret
- `JAZZ_SYNC_SERVER_URL` - Jazz sync server URL

Optional:

- `JAZZ_API_KEY` - Appended as `?key=...` to sync server URL
- `DEBUG` - Enables stack traces in JSON error output

## Build Config

Target: `node22`, ES modules, source maps enabled
Output: `dist/index.mjs` (executable via `profile-admin` command)
External: @alcyone-labs/arg-parser, jazz-tools, zod, dotenv, ulidx, @regarde-dev/core

## Key Architectural Decisions

### Service Isolation

- Each service encapsulates specific functionality
- Services initialized on AdminService startup with loaded registries
- Services share audit log instance for comprehensive logging
- Clear separation of concerns (nickname, reservation, audit, backup, health)

### Data Ownership

- Worker owns all registries (forward, reverse, reserved, audit)
- No concept of "user data" - admin CLI bypasses user permissions
- Direct write access to registries without token validation
- This bypasses the 2FA mechanism used in public API

### JSON Output Support

- All commands support `--format json` for scripting
- JSON to stdout, logs/errors to stderr
- Circular reference handling in serialization
- Debug mode includes stack traces

### MCP Integration

- Uses `ArgParser.withMcp()` for Model Context Protocol support
- Commands automatically wrapped with format flag handling
- MCP mode bypasses console patching for clean JSON output

### Risk Management

- `delete-all` requires confirmation (type "DELETE")
- `reserve` enforces category validation (admin, brand, system, offensive, custom)
- Audit log tracks all operations for security auditing
- Backup operations create timestamped backups before destructive changes
