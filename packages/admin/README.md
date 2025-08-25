# Jazz Admin CLI

A command-line tool for managing the Profile nickname registry. This tool connects directly to the Profile worker to perform administrative operations on the nickname registries.

## Setup

1. **Install Dependencies**:

   ```bash
   pnpm install
   ```

2. **Environment Configuration**:
   Copy `.env.example` to `.env` and configure:

   ```bash
   cp .env.example .env
   ```

   Required environment variables:
   - `JAZZ_WORKER_ACCOUNT`: Worker account ID
   - `JAZZ_WORKER_SECRET`: Worker account secret
   - `JAZZ_SYNC_SERVER_URL`: Jazz sync server URL
   - `JAZZ_API_KEY`: API key (optional)

3. **Build and Install**:

   ```bash
   pnpm build
   pnpm link --global
   ```

   After installation, you can use `profile-admin` command.

## Usage

### Nickname Management

#### Add Nickname

```bash
profile-admin add --nickname "johndoe" --account-id "co_z123456789"
```

Add a nickname with admin override for reserved nicknames:

```bash
profile-admin add --nickname "admin" --account-id "co_z123456789" --allow-reserved
```

#### Update Nickname - Transfer Nickname to Different Account

```bash
profile-admin update --nickname "johndoe" --account-id "co_z987654321"
```

#### Remove Nickname

```bash
profile-admin remove --nickname "johndoe"
```

### Reservation Management

#### Reserve a Nickname

```bash
profile-admin reserve --nickname "admin" --category "admin" --reason "Administrative use"
```

Available categories: `admin`, `brand`, `system`, `offensive`, `custom`

#### Remove Nickname Reservation

```bash
profile-admin unreserve --nickname "admin"
```

#### List Reserved Nicknames

```bash
profile-admin list-reserved
profile-admin list-reserved --category "admin"
```

#### Check Reservation Status

```bash
profile-admin check-reserved --nickname "admin"
```

### Health Checks

#### Registry Health Check

```bash
profile-admin health
```

Checks registry integrity and reports:

- Total nicknames and accounts
- Reserved nicknames count
- Orphaned entries (forward/reverse registry mismatches)
- Duplicate mappings
- Overall registry health status with text-based status indicators

#### Nickname-Specific Health Check

```bash
profile-admin check-nickname-health --nickname "johndoe"
profile-admin check-nickname-health --account-id "co_z123456789"
```

Shows detailed health status with text-based indicators:

- `[OK]` - Component is healthy
- `[MISSING]` - Component is missing
- `[WARN]` - Component has warnings/mismatches
- `[INACTIVE]` - Component is inactive
- `[UNKNOWN]` - Component status is unknown

#### Fix Nickname Issues

```bash
profile-admin fix-nickname --nickname "johndoe"
profile-admin fix-nickname --account-id "co_z123456789"
```

### Audit Trail

The system includes comprehensive audit logging for all registry changes with enhanced filtering capabilities.

#### View Recent Changes

```bash
profile-admin history
```

Shows the 20 most recent changes with ULID-based chronological ordering.

#### Limit Number of Results

```bash
profile-admin history --limit 50
```

#### Filter by Source

```bash
profile-admin history --source "admin-cli"
```

Available sources:

- `admin-cli` - Changes made via this CLI tool
- `user-app` - Changes made by users in the profile application
- `worker` - System/worker-initiated changes

#### Account-Specific History

```bash
profile-admin history-account --account-id "co_z123456789"
```

Shows all changes for a specific account.

#### Nickname-Specific History

```bash
profile-admin history-nickname --nickname "johndoe"
```

Shows all changes for a specific nickname.

#### Example Output

```
Registry Change History:
01ARZ3NDEKTSV4RRFFQ69G5FAU: ∅ → johndoe (co_zUser123) [user-app] 5 mins ago
01ARZ3NDEKTSV4RRFFQ69G5FAT: jazz → ∅ (co_z8at4cd6bPMeo7J9M5ndWp1MduQ) [admin-cli] 10 mins ago
```

### Backup Management

#### Create Registry Backup

```bash
profile-admin download-registries
```

Creates timestamped backup in `registry-backups/` folder.

#### List Available Backups

```bash
profile-admin list-backups
```

Shows all available backup files with size and date information.

#### Restore from Backup

```bash
profile-admin restore-all --backup-file "registry-backups/registry-backup-2024-01-15T10-30-00.json"
```

#### Delete All Entries

```bash
profile-admin delete-all
```

- Automatically creates backup before deletion
- Requires confirmation prompt (`DELETE`)
- Clears all registry entries
- Fails safely if backup creation fails

#### Clean Old Backups

```bash
profile-admin clean-old-backups --days-to-keep 30
```

Removes backup files older than specified days (default: 30 days).

### Monitoring & Diagnostics

#### Registry Metrics

```bash
profile-admin metrics
profile-admin metrics --format json
profile-admin metrics --format prometheus
```

#### Connectivity Check

```bash
profile-admin check-connectivity
```

#### Data Integrity Validation

```bash
profile-admin validate-data
profile-admin validate-data --fix --verbose
```

#### Performance Benchmarking

```bash
profile-admin benchmark --operations 1000
```

#### Security Audit

```bash
profile-admin audit-security --days 30
```

### Advanced Data Management

#### Duplicate Detection

```bash
profile-admin check-duplicates
```

#### Comprehensive Health Check

```bash
profile-admin validate-data --verbose
```

## Production Deployment Checklist

### Pre-deployment Validation
- [ ] Run `profile-admin health` to verify registry integrity
- [ ] Run `profile-admin validate-data` to check data consistency
- [ ] Run `profile-admin check-connectivity` to verify Jazz worker connection
- [ ] Create backup with `profile-admin download-registries`

### Monitoring Setup
- [ ] Set up metrics collection with `profile-admin metrics --format prometheus`
- [ ] Configure health check alerts using `profile-admin health`
- [ ] Schedule regular data validation with `profile-admin validate-data`

### Maintenance Tasks
- [ ] Schedule backup cleanup with `profile-admin clean-old-backups --days-to-keep 30`
- [ ] Run weekly security audits with `profile-admin audit-security --days 7`
- [ ] Monitor performance with `profile-admin benchmark`

## Migration Notes

For existing deployments, the audit trail system is automatically initialized when the worker account is first loaded after the update. The migration:

- Safely adds the `auditLog` field to existing worker accounts
- Maintains backward compatibility with existing registry data
- Uses ULID-based IDs for natural chronological ordering
- Gracefully handles cases where audit logging might fail

## Development

Run in development mode:

```bash
pnpm dev
```

Run commands directly during development:

```bash
pnpm cli -- add --nickname "test" --account-id "co_zTest123"
pnpm cli -- health
pnpm cli -- history --limit 10
pnpm cli -- reserve --nickname "admin" --category "admin"
pnpm cli -- check-nickname-health --nickname "test"
```

### Testing Commands

Test the modular CLI structure:

```bash
# Test nickname management
pnpm cli -- add --nickname "testuser" --account-id "co_zTest123"
pnpm cli -- update --nickname "testuser" --account-id "co_zTest456"
pnpm cli -- remove --nickname "testuser"

# Test reservation system
pnpm cli -- reserve --nickname "reserved" --category "system"
pnpm cli -- list-reserved
pnpm cli -- unreserve --nickname "reserved"

# Test health checks
pnpm cli -- health
pnpm cli -- check-nickname-health --nickname "existing"
pnpm cli -- fix-nickname --nickname "broken"

# Test audit trail
pnpm cli -- history --limit 5
pnpm cli -- history-account --account-id "co_zTest123"
pnpm cli -- history-nickname --nickname "testuser"

# Test backup operations
pnpm cli -- download-registries
pnpm cli -- list-backups
```

## Modular CLI Structure

The CLI is organized into specialized command modules:

```
src/cli/
├── commands/
│   ├── nickname.ts      # Nickname management (add, update, remove)
│   ├── reservation.ts   # Reservation management (reserve, unreserve, list-reserved)
│   ├── health.ts        # Health checks and diagnostics
│   ├── audit.ts         # Audit trail and history commands
│   └── backup.ts        # Backup and restore operations
├── index.ts             # CLI initialization and command registration
└── types.ts             # Common types and withAdminService helper
```

### Service Layer Architecture

The CLI delegates to a service layer with specialized services:

```
AdminService (Orchestrator)
├── NicknameService      # Nickname CRUD operations
├── ReservationService   # Nickname reservation management
├── HealthService        # Registry health checks and fixes
├── AuditService         # Change tracking and history
└── BackupService        # Backup and restore operations
```

### Data Flow

```
[CLI Command] → [AdminService] → [Specialized Service] → [Jazz Worker] → [Registry CoRecords] → [Jazz Network]
```

### Audit Trail Architecture

- **ULID-based IDs**: Globally unique, chronologically sortable identifiers
- **Atomic Logging**: Audit entries are created atomically with registry changes
- **Source Attribution**: All changes are tagged with their source (admin-cli, user-app, worker)
- **Enhanced Filtering**: Support for account-specific and nickname-specific history
- **Graceful Degradation**: Registry operations continue even if audit logging fails

## Error Handling

The refactored system includes comprehensive error handling with improved patterns:

### Service Layer Error Handling

- **Consistent Error Propagation**: Errors from specialized services are properly propagated through AdminService to the CLI
- **Validation Errors**: Input validation occurs at the service layer with descriptive error messages
- **Resource Management**: The `withAdminService` helper ensures proper cleanup even when errors occur

### Error Types Handled

- **Network connectivity issues**: Jazz worker connection failures
- **Invalid Jazz account credentials**: Authentication and authorization errors
- **Registry data corruption**: Inconsistency detection and reporting
- **Audit logging failures**: Non-blocking audit failures with graceful degradation
- **Backup/restore operations**: File system errors and data validation
- **Reservation conflicts**: Nickname reservation validation and conflict resolution
- **Service initialization**: Proper error handling during service setup

### CLI Error Handling Pattern

```typescript
// All CLI commands use the withAdminService helper for consistent error handling
export async function withAdminService<T>(
  operation: (admin: AdminService) => Promise<T>,
): Promise<T> {
  const admin = new AdminService();
  try {
    await admin.initialize();
    const result = await operation(admin);
    await admin.cleanup();
    return result;
  } catch (error) {
    await admin.cleanup();
    throw error; // Propagated to CLI error handler
  }
}
```

### Error Output

Errors are displayed with consistent formatting using the Logger utility:

- `[ERROR]` prefix for error messages
- Stack traces in debug mode (`DEBUG=1`)
- Graceful exit codes for different error types

## Refactoring Benefits

The recent CLI refactoring provides several key improvements:

### Maintainability

- **Modular Structure**: Commands are organized by functionality in separate files
- **Service Separation**: Business logic is separated from CLI presentation logic
- **Type Safety**: Complete TypeScript interfaces ensure proper service integration
- **Consistent Patterns**: Standardized error handling and service delegation

### Extensibility

- **Easy Command Addition**: New commands can be added by creating new command files
- **Service Composition**: New services can be easily integrated into the AdminService
- **Interface Compliance**: All services implement well-defined interfaces

### Reliability

- **Comprehensive Testing**: Modular structure enables better unit testing
- **Error Isolation**: Errors in one service don't affect others
- **Resource Management**: Proper cleanup and connection management
- **Text-Based Status**: Portable status indicators work across all terminal environments

### Developer Experience

- **Clear Architecture**: Easy to understand service boundaries and responsibilities
- **Consistent APIs**: All services follow the same patterns
- **Enhanced Logging**: Improved debugging with structured logging
- **Better Documentation**: Clear separation makes documentation more focused

## Complete Command Reference

### Nickname Management

- `add` - Add nickname to account mapping
- `update` - Transfer nickname to different account
- `remove` - Remove nickname from registry

### Reservation Management

- `reserve` - Reserve a nickname with category and reason
- `unreserve` - Remove nickname reservation
- `list-reserved` - List reserved nicknames (optionally filtered by category)
- `check-reserved` - Check if a nickname is reserved

### Health & Diagnostics

- `health` - Check overall registry integrity
- `check-nickname-health` - Check health of specific nickname/account
- `fix-nickname` - Attempt to fix synchronization issues

### Audit & History

- `history` - Show recent registry changes (with optional source filtering)
- `history-account` - Show changes for specific account
- `history-nickname` - Show changes for specific nickname

### Backup & Restore

- `download-registries` - Create timestamped backup
- `restore-all` - Restore from backup file
- `delete-all` - Clear all entries (with automatic backup)
- `list-backups` - List available backup files
- `clean-old-backups` - Remove old backup files
