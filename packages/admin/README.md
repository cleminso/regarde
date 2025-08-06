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

### Add Nickname

```bash
profile-admin add --nickname "johndoe" --account-id "co_z123456789"
```

### Update Nickname - Transfer Nickname to Different Account

```bash
profile-admin update --nickname "johndoe" --account-id "co_z987654321"
```

### Remove Nickname

```bash
profile-admin remove --nickname "johndoe"
```

### Health Check

```bash
profile-admin health
```

Checks registry integrity and reports:

- Total nicknames and accounts
- Orphaned entries (forward/reverse registry mismatches)
- Duplicate mappings
- Overall registry health status

### Audit Trail

The system now includes comprehensive audit logging for all registry changes.

#### View Recent Changes

```bash
profile-admin history
```

Shows the 20 most recent changes with ULID-based chronological ordering.

#### Limit Number of Results

```bash
profile-admin history --limit 50
```

#### Filter by Account ID

```bash
profile-admin history --account-id "co_z123456789"
```

#### Filter by Nickname

```bash
profile-admin history --nickname "johndoe"
```

#### Filter by Source

```bash
profile-admin history --source "admin-cli"
```

Available sources:

- `admin-cli` - Changes made via this CLI tool
- `user-app` - Changes made by users in the profile application
- `worker` - System/worker-initiated changes

#### Example Output

```
Registry Change History:
01ARZ3NDEKTSV4RRFFQ69G5FAU: ∅ → johndoe (co_zUser123) [user-app] 5 mins ago
01ARZ3NDEKTSV4RRFFQ69G5FAT: jazz → ∅ (co_z8at4cd6bPMeo7J9M5ndWp1MduQ) [admin-cli] 10 mins ago
```

### Backup Registries

```bash
profile-admin download-registries
```

Creates timestamped backup in `registry-backups/` folder.

### Restore from Backup

```bash
profile-admin restore-all --backup-file "registry-backups/registry-backup-2024-01-15T10-30-00.json"
```

### Delete All Entries

```bash
profile-admin delete-all
```

- Automatically creates backup before deletion
- Requires confirmation prompt
- Clears all registry entries
- Fails safely if backup creation fails

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

Run commands directly:

```bash
pnpm cli -- add --nickname "test" --account-id "co_zTest123"
pnpm cli -- health
pnpm cli -- history --limit 10
```

## Architecture

The CLI connects directly to the Jazz worker using the same `RegistryWorkerAccount` schema as the web service. It operates on the existing `registry` and `reverseRegistry` CoRecords plus the new `auditLog` CoList.

```
[CLI Command] → [Jazz Worker Connection] → [Registry CoRecords + Audit CoList] → [Jazz Network]
```

### Audit Trail Architecture

- **ULID-based IDs**: Globally unique, chronologically sortable identifiers
- **Atomic Logging**: Audit entries are created atomically with registry changes
- **Source Attribution**: All changes are tagged with their source (admin-cli, user-app, worker)
- **Graceful Degradation**: Registry operations continue even if audit logging fails

## Error Handling

The system includes comprehensive error handling:

- Network connectivity issues
- Invalid Jazz account credentials
- Registry data corruption
- Audit logging failures (non-blocking)
- Backup/restore operations
