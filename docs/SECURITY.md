# Security Practices

This document covers security practices, authentication, audit logging, and secrets management for the Regarde platform.

## Authentication Flow

Authentication uses a 7-step stateless verification process:

### 1. Token Generation (Client-Side)
- Token generated using 16-character secure random string
- Created client-side to avoid sending credentials to server
- Token stored in `RegardeTokenAuth` CoMap with 24-hour expiration

### 2. Token Storage (RegardeTokenAuth CoMap)
```typescript
RegardeTokenAuth.create({
  token: "16-char-random-string",
  expiresAt: Date.now() + 24 * 60 * 60 * 1000
})
```
- Stored in Jazz CoMap (not localStorage or sessionStorage)
- User has full ownership and control
- Automatic expiration tracking

### 3. Headers Sent to API
```typescript
headers: {
  "X-Regarde-Token": token,
  "X-Regarde-Auth-ID": regardeAuthId
}
```
- Token transmitted in headers only
- Never in URL parameters or query strings
- Auth ID identifies the RegardeTokenAuth CoMap

### 4. Worker Verification Process
```typescript
const tokenAuth = await RegardeTokenAuth.load(regardeAuthId, {
  loadAs: workerAccount
});
```
- Worker loads the RegardeTokenAuth CoMap
- Jazz permissions ensure only owner can create/access

### 5. Token Ownership Check
```typescript
if (tokenAuth._owner !== account.id) {
  throw new Error("Token ownership mismatch");
}
```
- Verifies requesting user owns the token
- Prevents token replay attacks

### 6. Expiry Validation
```typescript
if (Date.now() > tokenAuth.expiresAt) {
  throw new Error("Token expired");
}
```
- 24-hour maximum lifetime
- Automatic invalidation after expiry
- User must refresh token before expiration

### 7. Stateless Verification
- No session state maintained server-side
- Token validated from CoMap on each request
- Scalable and stateless architecture

## Access Control

### User Access Patterns
- **Own Data**: Full read/write access to personal CoMaps
- **Registry Data**: Read-only access to public registry entries
- **Payment Events**: Read-only access to own payment history

### Worker Access Patterns
- **User Payment Events**: Write access to append payment events
- **Registry Access**: Full read access to all registries
- **No User Data**: Cannot read user-owned CoMaps beyond what's necessary

### Admin CLI Access
- **Direct Write**: Bypasses token authentication
- **Registry Modifications**: Full write access to all registries
- **Audit Log**: Read-only access for security reviews

### Group Permissions Matrix

| Resource | User | Worker | Admin |
|----------|------|--------|-------|
| RegardeTokenAuth | Owner | None | None |
| Payment Events | Read | Append | Read |
| Registry | Read | Read/Write | Read/Write |
| Audit Log | None | Append | Read |

## Audit Logging

### ALL Registry Operations Must Be Logged
Every registry modification is recorded:
- App registration
- Registry updates
- Payment event ingestion
- Administrative changes

### Audit Entry Structure
```typescript
{
  timestamp: number,        // Unix timestamp
  operation: string,        // Operation type
  nickname: string,         // Target identifier
  accountId: string,        // Acting account
  source: "user" | "worker" | "admin"  // Initiator type
}
```

### Where Audit Logs Are Stored
- Stored in `RegistryAuditLog` CoMap
- Append-only structure prevents tampering
- Accessible via Admin CLI for review

### Review Procedures
```bash
# View recent audit entries
regarde-admin audit list --limit 50

# Filter by operation type
regarde-admin audit list --operation REGISTER_APP

# Export for compliance review
regarde-admin audit export --output audit-report.json
```

## Token Security

### 24-Hour Expiration
- Tokens automatically expire after 24 hours
- Forces regular re-authentication
- Limits exposure window if token compromised

### 16-Character Secure Random Generation
```typescript
const token = generateSecureRandom(16);
```
- Cryptographically secure random generation
- 128-bit entropy
- URL-safe character set

### CoMap-Based Storage
- Stored in Jazz CoMap, not browser storage
- Protected by Jazz encryption and sync
- Owner controls access permissions

### Header Transmission
```typescript
// Correct - headers only
headers: {
  "X-Regarde-Token": token
}

// Wrong - never in URL
/api/endpoint?token=xxx
```

## Webhook Security

### Webhook Secret Validation
Every webhook endpoint requires a secret:
- Generated per-endpoint
- Stored encrypted in registry
- Used for signature verification

### Signature Verification
```typescript
const signature = crypto
  .createHmac('sha256', webhookSecret)
  .update(payload)
  .digest('hex');

if (!crypto.timingSafeEqual(
  Buffer.from(receivedSignature),
  Buffer.from(signature)
)) {
  throw new Error("Invalid signature");
}
```

### Provider-Specific Security
- **LemonSqueezy**: Signature-based verification
- **Stripe**: Signed webhook secrets
- **Polar**: HMAC-SHA256 signatures

### Payload Validation with Zod
```typescript
const WebhookPayloadSchema = z.object({
  event: z.string(),
  data: z.object({
    id: z.string(),
    amount: z.number()
  })
});

const payload = WebhookPayloadSchema.parse(rawPayload);
```

## Environment Variables

### Required Secrets
```bash
# Worker authentication
WORKER_ACCOUNT_SECRET=<64-char-secret>

# Webhook secrets (provider-specific)
LEMONSQUEEZY_WEBHOOK_SECRET=<secret>
STRIPE_WEBHOOK_SECRET=whsec_<secret>
POLAR_WEBHOOK_SECRET=<secret>

# API keys
REGARDE_API_KEY=<api-key>
```

### Optional Configuration
```bash
# Development settings
REGARDE_ENV=development
LOG_LEVEL=debug

# Performance
CACHE_TTL=3600
RATE_LIMIT_WINDOW=60000
```

### Never Commit .env Files
```bash
# .gitignore
.env
.env.local
.env.*.local
*.secret
```

### Local Development with .env.local
- Create `.env.local` for local secrets
- Never commit to version control
- Copy from `.env.example` template

## Admin CLI Security

### Direct Write Access Warning
```
WARNING: Admin CLI has direct write access to registries.
This bypasses normal authentication and authorization checks.
Use with extreme caution.
```

### Backup Before Destructive Operations
```bash
# Always backup before destructive changes
regarde-admin registry backup --output backup-$(date +%Y%m%d).json
```

### Confirmation Prompts
```bash
$ regarde-admin registry clear
This will DELETE ALL registry entries. Are you sure? [y/N]
```

### Security Audit Capability
```bash
# Run security audit
regarde-admin audit security

# Check for anomalies
regarde-admin audit anomalies --since 7d
```

## Security Checklist

### Pre-Deployment Checks

- [ ] All external inputs validated with Zod
- [ ] No secrets in code or config files
- [ ] Audit logging enabled and tested
- [ ] Token expiry configured (24 hours)
- [ ] Webhook secrets rotated
- [ ] Environment variables documented
- [ ] Admin CLI access restricted
- [ ] Backup procedures tested

### Regular Maintenance

- [ ] Review audit logs weekly
- [ ] Rotate webhook secrets quarterly
- [ ] Update dependencies monthly
- [ ] Security scan on deployment
- [ ] Access review for admin users

### Incident Response

1. Immediately rotate compromised secrets
2. Review audit logs for unauthorized access
3. Notify affected users
4. Document incident and remediation
5. Update security procedures as needed