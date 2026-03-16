# ConnectRPC Research

## What

ConnectRPC = schema-first RPC using Protobuf. HTTP/JSON + gRPC protocols. Generated clients.

## Architecture Context

```
┌─────────────────────────────────────┐
│  CLIENT (packages/sdk)              │
│  ┌──────────────┐  ┌──────────────┐ │
│  │ Jazz         │  │ HTTP API     │ │
│  │ (co+z)       │  │ (fetch)      │ │
│  │ Real-time    │  │ Registry ops │ │
│  │ sync         │  │ Auth, apps   │ │
│  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────┘
                   │
                   ▼ HTTP
┌─────────────────────────────────────┐
│  SERVER (packages/api.regarde.dev)  │
│  ┌──────────────┐  ┌──────────────┐ │
│  │ HTTP Routes  │  │ Jazz Worker  │ │
│  │ (Hono+Zod)   │  │ (Registry)   │ │
│  │ 6 endpoints  │  │ CoValues     │ │
│  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────┘
```

Jazz = distributed state layer (not HTTP). Own sync protocol, CRDTs, permissions.
ConnectRPC = HTTP API layer only. Different domains.

## Benefits

- **Single schema** → API + SDK types from proto
- **Breaking detection** → `buf breaking` CI check
- **Multi-lang SDK** → Go, Python, Swift clients generated
- **Validation** → protovalidate in schema, not code
- **Still curl-able** → HTTP/JSON fallback

## Current State

Regarde has 6 endpoints:
- POST /verify
- POST /checkAvailability
- POST /register
- POST /lookup
- POST /registerApp
- POST /v1/webhooks/*

~400 lines route definitions. ~2000 lines SDK managers (mostly Stripe/Polar, not API calls).

## Verdict

**Not worth it now.**

Tooling overhead > benefits at 6 endpoints.

## When

Re-evaluate when:
- 15+ endpoints
- Multi-language SDK demand
- Public API v2
- Team > 5 devs

## Alternative (Now)

1. Shared Zod schemas (API + SDK)
2. OpenAPI client generation
3. Handler unit tests

80% benefit. 20% effort.
