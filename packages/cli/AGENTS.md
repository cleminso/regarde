# AGENTS.md - User CLI Package Guidelines

## Overview

**@regarde-dev/cli** is the public CLI for Regarde users. Handles authentication (Jazz Account ID + BIP39 passphrase), credential storage, app registration, and account management. NOT for registry admin operations.

## Core Responsibility

- User authentication via Jazz Account ID + BIP39 passphrase validation
- Credential storage (local filesystem, not encrypted currently)
- App registration with Regarde registry
- Session management (login/signup/logout)
- Interactive prompts with validation

## Commands

```bash
pnpm dev              # Watch mode with .env.local
pnpm build            # Production build
pnpm build:test       # Test build (NODE_ENV=test)
pnpm test             # Run Vitest once
pnpm test:watch       # Vitest watch mode
pnpm setup            # Setup local test worker
pnpm start            # Production run
```

### Single Tests

```bash
vitest src/__tests__/login.contract.test.ts
vitest -t "authentication"
```

## Architecture

### Tool Pattern

Each command is a `ToolConfig` object with name, description, flags, outputSchema (Zod), and handler. Handler returns `{ ok, command, data?, error? }`.

### Authentication Flow

1. User provides Jazz Account ID + BIP39 passphrase (12-24 words)
2. Validate passphrase via `@scure/bip39` wordlist check
3. Derive account secret: `mnemonicToEntropy()` → `agentSecretFromSecretSeed()`
4. Start Jazz worker with RegardeAccount schema
5. Store credentials locally (`authStorage.set()`)
6. RegardeSDK initialized with registration token for API auth

### Key Tools

**Authentication**: `login`, `signup` (placeholder), `logout`
**App Management**: `register-app` (requires --name, --payment-provider, optional --description)

### Credential Management

- Stored in OS temp directory via `os.tmpdir()`
- Contains: accountID, accountSecret, passphrase, authMethod
- Validated on login, cleared on logout
- Credentials validated on each login attempt

### API Integration

- Uses `node-fetch` for HTTP requests to api.regarde.dev
- Authentication via RegardeAuth token from RegardeSDK (2FA mechanism)
- App registration flow: create App CoMap locally → register with API
- HTTP errors categorized (401→auth prompt, 404→server not found, 500→server error)

### Validation Strategy

All user input validated with explicit checks and clear error messages:

- Account ID: must start with "co\_"
- Passphrase: 12-24 words, BIP39 wordlist validation
- Payment provider: enum (lemonsqueezy|stripe)
- Uses `inquirer` for interactive prompts with password fields

### Error Handling

Errors categorized by type with actionable suggestions:

- Authentication errors: prompt re-login
- Network/Connection errors: check API server status
- API errors (4xx/5xx): mapped to specific user messages
- Generic errors: display with context

## Build Config

Target: `node22`, ES modules, source maps enabled
Output: `dist/index.mjs` (executable via `regarde` command)
External: @alcyone-labs/arg-parser, jazz-tools, zod, @scure/base, @noble/hashes, node-fetch, inquirer, chalk, cojson-transport-ws, @regarde-dev/core

## Environment Variables

Optional:

- `JAZZ_SYNC_SERVER_URL` - Default: wss://cloud.jazz.tools
- `JAZZ_API_KEY` - Jazz API key for authentication

## Key Architectural Decisions

### Security Model

- Credentials stored locally in filesystem (plaintext - TODO: encrypt)
- Authentication via Jazz account with BIP39 passphrase
- 2FA via RegardeAuth token (24-hour lifetime, managed by SDK)
- NO direct registry access - all registry operations via API with token auth

### Tool Pattern

- Declarative tool configuration with Zod schema validation
- Handler receives context with parsed args
- Returns structured result for programmatic use
- All tools follow identical pattern for consistency

### Interactive Prompt Design

- Uses `inquirer` for password masking and validation
- Validation errors provide specific guidance ("must start with 'co\_'", "check spelling")
- Passphrase validation enforces BIP39 wordlist rules
- Fallback to stored credentials if available

### API Contract

- Communication with api.regarde.dev via HTTP
- Uses RegardeAuth token headers (X-Regarde-Token, X-Regarde-Token-Id, X-Jazz-Account-Id)
- App registration returns: appId, webhookUrl, webhookSecret
- All errors mapped to user-friendly messages with next steps
