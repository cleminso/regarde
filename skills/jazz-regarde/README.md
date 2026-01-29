# Jazz Regarde Patterns

Comprehensive guide to Jazz local-first database patterns used in the Regarde SDK project.

## Table of Contents

- [Overview](#overview)
- [What's Included](#whats-included)
- [Getting Started](#getting-started)
- [Key Concepts](#key-concepts)
  - [CoValues (Collaborative Values)](#covalues-collaborative-values)
  - [Sync Safety](#sync-safety)
  - [Regarde-Specific Patterns](#regarde-specific-patterns)
- [Installation](#installation)
- [Troubleshooting](#troubleshooting)
- [Quick Links](#quick-links)

## Overview

Jazz is a local-first database that syncs across devices and users. This skill captures patterns specific to:

- **Regarde SDK**: Client SDK for managing apps and payments
- **CoValue Schemas**: Defining structured collaborative data
- **Sync Safety**: Ensuring data consistency across devices
- **Authentication**: Passkeys, passphrases, and tokens
- **Permissions**: Group-based access control
- **React/Preact Integration**: Hooks for reactive UI

## What's Included

| Reference             | Description                                                  | Files                                                                                      |
| --------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| `covalues/`           | CoMap, CoList, CoRecord, CoFeed, FileStream, ImageDefinition | [README](./references/covalues/README.md), [API](./references/covalues/api.md)             |
| `schemas/`            | Schema definitions, migrations, discriminated unions         | [README](./references/schemas/README.md), [Migrations](./references/schemas/migrations.md) |
| `sync-safety/`        | Write-Wait-Use patterns, loading states, subscriptions       | [README](./references/sync-safety/README.md)                                               |
| `authentication/`     | Passkey, passphrase, token-based auth                        | [README](./references/authentication/README.md), [API](./references/authentication/api.md) |
| `groups-permissions/` | Group roles, sharing, permission checks                      | [README](./references/groups-permissions/README.md)                                        |
| `react-hooks/`        | useAccount, useCoState, useRegardeAuth                       | [README](./references/react-hooks/README.md)                                               |
| `patterns/`           | Common implementation patterns                               | [README](./references/patterns/README.md)                                                  |
| `gotchas/`            | Common pitfalls and how to avoid them                        | [README](./references/gotchas/README.md)                                                   |

## Getting Started

1. Read [sync-safety/README.md](./references/sync-safety/README.md) - Critical patterns for correct Jazz usage (Write-Wait-Use, explicit $isLoaded checks)
2. Read [schemas/README.md](./references/schemas/README.md) - How to define your data structures with co.map, co.list, co.record
3. Read [groups-permissions/README.md](./references/groups-permissions/README.md) - Understanding access control and Group ownership
4. Reference [patterns/README.md](./references/patterns/README.md) for specific implementation patterns
5. Check [gotchas/README.md](./references/gotchas/README.md) to avoid common mistakes

**Recommended reading order**: Sync Safety → Schemas → Groups/Permissions → React Hooks → Patterns

## Key Concepts

### CoValues (Collaborative Values)

Jazz data structures that sync automatically:

- **CoMap**: Key-value objects (like JSON objects)
- **CoList**: Ordered arrays
- **CoRecord**: Dynamic key-value stores
- **CoFeed**: Per-user append-only feeds
- **FileStream**: Binary data
- **ImageDefinition**: Image handling with resizing

### Sync Safety

Critical rules:

1. **Write-Wait-Use**: Always wait for sync after writes
2. **Check $isLoaded**: Never access unloaded CoValues
3. **Use Groups**: Always create Groups for ownership
4. **Subscriptions**: Use for real-time UI updates

### Regarde-Specific Patterns

- **RegardeAccount**: Extended Jazz account with SDK root
- **RegardeSDK**: Container for auth, apps, payments
- **RegardeAuth**: 24-hour token for API authentication
- **App**: User-defined app with payment configuration
- **PaymentEvent**: Webhook-triggered payment records

### Out of Scope (Not Used by Regarde)

The following Jazz features are documented for completeness but are **NOT used** in the Regarde SDK:

- **CoFeed**: Per-user append-only feeds (use CoList instead)
- **CoImage / ImageDefinition**: Image handling with resizing (not needed for payment data)
- **FileStream**: Binary data storage (not used)
- **Passkey Authentication**: Biometric authentication (Regarde uses Passphrase for CLI, Tokens for API)
- **Guest Mode**: Anonymous read-only access (not implemented in Regarde)

If you need these features, refer to the [official Jazz documentation](https://jazz.tools/docs).

## Installation

```bash
# Copy skill to your local .opencode/skills directory
cp -r skills/jazz-regarde ~/.config/opencode/skills/

# Or use the install script (if available)
./skills/jazz-regarde/install.sh --local
```

## Troubleshooting

- `Cannot read properties of null` / `undefined` when reading CoValues: you missed an explicit loaded check (`coValue !== null && coValue.$isLoaded === true`) before accessing fields.
- `coValue.$jazz.id` is `undefined`: you used the ID before `await coValue.$jazz.waitForSync()`.
- Changes “disappear” or are inconsistent across devices: you wrote and then read immediately; use Write-Wait-Use and, for nested structures, Create-Set-Sync.
- `Insufficient permissions` / write fails: you created data without a group or forgot to add required members/roles; ensure `{ owner: Group.create(...) }` and validate `account.canWrite(coValue) === true`.
- Infinite rerenders in React: your `resolve` object changes every render; memoize it with `useMemo`.

## Quick Links

- [Jazz Documentation](https://jazz.tools/docs)
- [Regarde SDK Source](../packages/sdk/)
- [AGENTS.md Guidelines](../AGENTS.md)
