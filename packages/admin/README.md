# Jazz Admin CLI

A command-line tool for administering the Jazz.tools nickname registry with dedicated security permissions.

## Architecture

This CLI uses a **dedicated schema approach** for nickname management:

- **🔐 Security**: Worker gets write access only to nickname data, not entire user profiles
- **🏗️ Separation**: Nickname management is isolated from user profile data
- **🔧 Admin Control**: System-level nickname operations independent of user actions

## Installation

```bash
cd packages/admin
pnpm install
pnpm build
```

## Usage

### Add a nickname

Registry entry: `nickname → account_id`

```bash
pnpm cli add --nickname "john_doe" --account-id "co_abc123..."
```

Reverse registry entry: `account_id → nickname`

```bash
pnpm cli add --account-id "co_abc123..." ---nickname "john_doe"
```

### Update a nickname

```bash
pnpm cli update --nickname "john_doe" --account-id "co_xyz789..."
```

Transfers nickname from old account to new account, updating both registries and nickname groups.

### Remove a nickname

```bash
pnpm cli remove --nickname "john_doe"
```

Removes from registries and deactivates the nickname group (soft delete).

### Check registry health

```bash
pnpm cli health
```

Detects orphaned entries and inconsistencies between forward and reverse registries.

## Security Model

### Permissions Structure

- **User**: `admin` access to their own nickname group
- **Worker**: `writer` access to nickname groups (for admin operations)
- **Profile**: User maintains full control, worker cannot modify

### Data Isolation

- Nickname data stored in dedicated `NicknameGroup` schema
- Profile data remains in user-controlled `OnboardingProfile` schema
- No cross-contamination of permissions

### Health Check Features

Detects and reports:

- **Orphaned nicknames**: Registry entries without reverse entries
- **Orphaned account IDs**: Reverse entries without registry entries
- **Duplicate assignments**: Accounts with multiple nicknames
- **Consistency issues**: Mismatched forward/reverse registry data
