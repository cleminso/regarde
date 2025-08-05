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

### Backup Registries

```bash
profile-admin download-registries
```

Creates timestamped backup in `registry-backups/` folder:

- Format: `registry-backup-YYYY-MM-DDTHH-MM-SS.json`
- Contains both forward and reverse registries
- Automatically creates backup directory if missing

### List Available Backups

```bash
profile-admin list-backups
```

Shows all backup files with:

- Filename with timestamp
- File size
- Creation date

### Restore from Backup

```bash
profile-admin restore-all --backup-file "registry-backup-2025-08-05T12-22-11.json"
```

Restores registries from backup file (can use just filename if in backup folder).

### Clean Old Backups

```bash
profile-admin clean-old-backups --days 30
```

Removes backup files older than specified days (default: 30 days).

### Delete All Entries

```bash
profile-admin delete-all
```

- Automatically creates backup before deletion
- Requires confirmation prompt
- Clears all registry entries
- Fails safely if backup creation fails

## Development

Run in development mode:

```bash
pnpm dev
```

Run commands directly:

```bash
pnpm cli -- add --nickname "test" --account-id "co_zTest123"
pnpm cli -- health
```

## Architecture

The CLI connects directly to the Jazz worker using the same `RegistryWorkerAccount` schema as the web service. It operates on the existing `registry` and `reverseRegistry` CoRecords without creating new ones.

```
[CLI Command] → [Jazz Worker Connection] → [Registry CoRecords] → [Jazz Network]
```

## Error Handling

- Validates Jazz worker connection before executing commands
- Checks registry loading and availability
- Provides clear error messages for connection failures and validation errors
- Exits with appropriate status codes (0 for success, non-zero for errors)
- Automatic backup creation before destructive operations

## Security

- Backup files are excluded from git commits (contains sensitive account data)
- Environment variables for secure credential storage
- Confirmation prompts for destructive operations
- Safe restore operations with validation
