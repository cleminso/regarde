# Regarde.dev

Distributed authentication and registry system built on Jazz. Provides stateless authentication, nickname registration, and app management through a decentralized, multi-actor architecture.

## Table of Contents

- [Quick Start](#quick-start)
- [Architecture Overview](#architecture-overview)
- [Packages](#packages)
- [Core Concepts](#core-concepts)
- [Development](#development)
- [Project Structure](#project-structure)

## Quick Start

```bash
# Install dependencies
pnpm install

# Start development mode for all packages
pnpm dev

# Run tests
pnpm test

# Build all packages
pnpm build

# Check code style (Prettier + Oxlint)
pnpm format-and-lint

# Auto-fix code style issues
pnpm format-and-lint:fix
```

## Architecture Overview

Regarde.dev uses a stateless authentication system where tokens are generated client-side and verified server-side. All state is stored in Jazz Cloud CoMaps, enabling horizontal scalability without server-side sessions.

### System Flow

1. **SDK** - Client-side token generation and CoMap initialization
2. **API** - Server-side token verification and registry operations
3. **Accounts** - User data stored in personal Jazz accounts
4. **Workers** - Service accounts with registry write permissions

### Data Ownership

- **User-owned**: Apps, PaymentEvents, UserHandle, Auth tokens
- **Registry-owned**: Nickname registries, AppMetadata, reserved nicknames
- **Permissions**: Managed through Jazz group membership

## Packages

### @regarde-dev/core

Client SDK for Regarde. Initializes Jazz CoMaps in user accounts, generates registration tokens, provides React/Preact hooks, and manages app/payment state.

**See**: [packages/sdk/README.md](packages/sdk/README.md)

### api.regarde.dev

Registry API service for nickname management and app registration. Uses RegistryWorkerAccount with write access to nickname registries and user data.

**See**: [packages/api.regarde.dev/README.md](packages/api.regarde.dev/README.md)

### @regarde-dev/cli

Public CLI tool for Regarde users. Handles authentication (Jazz Account ID + BIP39 passphrase), app registration, nickname management, and credential storage.

**See**: [packages/cli/README.md](packages/cli/README.md)

### @regarde-dev/admin

Admin CLI tool for registry operations. Service-based architecture with audit logging, backup operations, and direct registry write access.

**See**: [packages/admin/README.md](packages/admin/README.md)

## Core Concepts

### Stateless Authentication

Tokens are generated client-side and stored in `RegardeAuth` CoMaps with 24-hour expiration. Each API request independently verifies token ownership and expiration via Jazz group membership.

**Headers**:

- `X-Regarde-Token`: 16-character token string
- `X-Regarde-Token-Id`: CoMap ID for verification

### Worker Accounts

Service accounts with specific permissions:

- **RegistryWorkerAccount**: Manages nickname registries, writes to user data for payment events
- **ProfileWorkerAccount**: Read-only access to user profiles (separate service)

Workers are stateless - all instances access the same registries in Jazz Cloud.

### Data Synchronization

All CoValues sync through Jazz Cloud with eventual consistency:

- RegardeAccount (user root)
- RegardeSDK (auth, apps, payments)
- NicknameRegistry (global mappings)
- RegistryAppMetadata (app verification state)

### Group Permissions

- **userGroup**: User + worker writers for apps, payments, user data
- **regardeAdminOtherReadersGroup**: Worker admin + user reader for payment events
- **Registry group**: Hardcoded ID `co_zoppoxWWJaHYKPgSgUkuCCXQX21` for registry operations

## Development

### Tools

- **Vite 8** with Rolldown - Build tool for all packages
- **Oxlint** - Fast linter (10-100x faster than ESLint)
- **Vitest** - Test runner (Vite-native)
- **Prettier** - Code formatter with import sorting
- **TypeScript** - Strict type checking

### Package-Specific Commands

```bash
# Development mode for specific package
pnpm --filter @regarde-dev/core dev
pnpm --filter api.regarde.dev dev

# Build specific package
pnpm --filter @regarde-dev/core build

# Run tests
pnpm test --run              # Run all tests once
pnpm test --watch            # Watch mode
vitest path/to/test.test.ts  # Run single test file
```

### Code Style

See [AGENTS.md](AGENTS.md) for comprehensive guidelines:

- **Components**: PascalCase
- **Functions**: camelCase
- **Types**: PascalCase with 'T' prefix (`TProfile`)
- **Constants**: UPPER_SNAKE_CASE
- **Files**: camelCase
- **Folders**: kebab-case

### Import Order (Prettier auto-enforced)

```typescript
// Framework imports
import { useAccount } from "jazz-tools/react";

// Workspace imports
import { RegardeAccount } from "@regarde-dev/core";

// Aliased imports (#/)
import { useMyRegardeAccount } from "#/lib/account/useMyRegardeAccount";

// Relative imports
import { MyComponent } from "./MyComponent";
```

## Project Structure

```
regarde.dev/
├── packages/
│   ├── sdk/                  # @regarde-dev/core - Client SDK
│   │   ├── src/
│   │   │   ├── core/         # CoMap schemas, managers
│   │   │   ├── frameworks/   # React/Preact hooks
│   │   │   └── registry/     # Registry schemas
│   │   └── AGENTS.md         # SDK-specific guidelines
│   ├── api.regarde.dev/      # Registry API service
│   │   ├── src/
│   │   │   ├── domains/      # Domain handlers
│   │   │   └── lib/          # Shared utilities
│   │   └── AGENTS.md         # API-specific guidelines
│   ├── cli/                  # Public CLI for users
│   │   ├── src/
│   │   │   ├── commands/     # CLI command tools
│   │   │   └── lib/          # Credential management
│   │   └── AGENTS.md         # CLI-specific guidelines
│   └── admin/                # Admin CLI for developers
│       ├── src/
│       │   ├── services/     # Service layer
│       │   └── commands/     # Admin commands
│       └── AGENTS.md         # Admin-specific guidelines
├── AGENTS.md                 # Repository-wide guidelines
└── README.md                 # This file
```

### Note on /app Directory

The `/app/regarde.bio/` directory contains an internal testing application used for SDK development. It's not part of the main Regarde.dev services and will be moved outside this project in the future. This README focuses on the `/packages/` directory which contains the production services.

## Documentation

- [AGENTS.md](AGENTS.md) - Repository-wide guidelines for agentic coding
- [packages/sdk/README.md](packages/sdk/README.md) - SDK usage and API reference
- [packages/api.regarde.dev/README.md](packages/api.regarde.dev/README.md) - API service documentation
- [packages/cli/README.md](packages/cli/README.md) - Public CLI documentation
- [packages/admin/README.md](packages/admin/README.md) - Admin CLI documentation
