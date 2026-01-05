# Regarde Registry Admin CLI (`profile-admin`)

CLI tool for operating the Regarde nickname registries. It connects directly to the Jazz **registry worker account** (`RegistryWorkerAccount`) and performs administrative reads/writes against:

- Forward registry: `nickname → Jazz account ID`
- Reverse registry: `Jazz account ID → nickname`
- Reserved nicknames registry (with metadata)
- Audit log (append-only list)

`profile-admin` is the current executable name (legacy naming).

## Setup

### Install

```bash
pnpm install
```

### Environment

Copy `.env.example` to `.env` and set:

- `JAZZ_WORKER_ACCOUNT` (required)
- `JAZZ_WORKER_SECRET` (required)
- `JAZZ_SYNC_SERVER_URL` (required)
- `JAZZ_API_KEY` (optional; appended as `?key=...` if not already present)

### Build / run

Build the package:

```bash
pnpm --filter @regarde-dev/admin build
```

Run locally (no global install):

```bash
pnpm --filter @regarde-dev/admin cli -- <command> [flags]
```

Optional global install (creates `profile-admin`):

```bash
pnpm --filter @regarde-dev/admin build
pnpm --filter @regarde-dev/admin link --global
```

## Commands (actual CLI surface)

### Scriptable output

Add `--format json` to any command to print a single JSON payload to stdout (logs and prompts are written to stderr).

### Nicknames

```bash
profile-admin add --nickname "johndoe" --account-id "co_z123456789"
profile-admin add --nickname "admin" --account-id "co_z123456789" --allow-reserved

profile-admin update --nickname "johndoe" --account-id "co_z987654321"

profile-admin remove --nickname "johndoe"

profile-admin fix-account-access --account-id "co_z123456789"

profile-admin get-nickname --nickname "johndoe"
profile-admin get-account --account-id "co_z123456789"
```

### Reservations

```bash
profile-admin reserve --nickname "admin" --category "admin" --reason "Administrative use"
profile-admin unreserve --nickname "admin"

profile-admin list-reserved
profile-admin list-reserved --category "brand"

profile-admin check-reserved --nickname "admin"
```

Valid categories: `admin`, `brand`, `system`, `offensive`, `custom` (default: `custom`).

### Audit log

```bash
profile-admin history
profile-admin history --limit 50
profile-admin history --source "admin-cli"

profile-admin history-account --account-id "co_z123456789"
profile-admin history-nickname --nickname "johndoe"

profile-admin clear-audit
```

### Health

```bash
profile-admin health

profile-admin check-nickname-health --nickname "johndoe"
profile-admin check-nickname-health --account-id "co_z123456789"

profile-admin fix-nickname --nickname "johndoe"
profile-admin fix-nickname --account-id "co_z123456789"

profile-admin check-connectivity
```

### Monitoring

```bash
profile-admin metrics
profile-admin metrics --format prometheus
profile-admin metrics --format json
```

### Registry backups (`registry-backups/`)

```bash
profile-admin download-registries
profile-admin list-backups
profile-admin restore-all --backup-file "registry-backups/registry-backup-2024-01-15T10-30-00.json"

profile-admin delete-all  # prompts: type DELETE
profile-admin clean-old-backups --days-to-keep 30
```

### Reservation backups (`reserveRegistry-backups/`)

```bash
profile-admin backup-reservations
profile-admin list-reservation-backups
profile-admin restore-reservations --backup-file "reserveRegistry-backups/reservation-backup-2024-01-15T10-30-00.json"  # prompts: type yes
profile-admin clean-old-reservation-backups --days-to-keep 30
```

### Data integrity

```bash
profile-admin validate-data
profile-admin validate-data --fix --verbose

profile-admin check-duplicates
```

### Performance / security

```bash
profile-admin benchmark --operations 1000
profile-admin audit-security --days 30
```

## Development

Watch build:

```bash
pnpm --filter @regarde-dev/admin dev
```

Run commands during development:

```bash
pnpm --filter @regarde-dev/admin cli -- add --nickname "test" --account-id "co_zTest123"
pnpm --filter @regarde-dev/admin cli -- health
pnpm --filter @regarde-dev/admin cli -- history --limit 10
```

## Code layout

CLI entrypoint and command registration:

- `src/cli/index.ts`
- `src/cli/types.ts` (`withAdminService` helper)

Commands:

```
src/cli/commands/
├── audit.ts
├── backup.ts
├── health.ts
├── integrity.ts
├── inspect.ts
├── monitoring.ts
├── nickname.ts
├── performance.ts
├── reservation.ts
└── reservationBackup.ts
```

Services:

```
src/services/
├── admin.ts
├── audit.ts
├── backup.ts
├── health.ts
├── nickname.ts
├── reservation.ts
└── reservationBackup.ts
```
