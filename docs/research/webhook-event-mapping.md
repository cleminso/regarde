# Payment Provider Webhook Event Mapping

Complete reference for how payment provider webhook events map to Regarde event types.

## Overview

Regarde processes webhooks from three payment providers: **Polar**, **Stripe**, and **LemonSqueezy**. Each provider sends different event types that are normalized into three Regarde event categories:

- **PaymentEvent** — One-time purchases, refunds, failed payments
- **SubscriptionEvent** — Subscription lifecycle (created, updated, canceled)
- **LicenseEvent** — License grants and revocations

```mermaid
flowchart TB
    subgraph Providers["Payment Providers"]
        P[Polar]
        S[Stripe]
        L[LemonSqueezy]
    end

    subgraph Processing["Regarde Processing"]
        A[Adapter Layer]
        N[Normalization]
        V[Validation]
    end

    subgraph Events["Regarde Events"]
        PE[PaymentEvent]
        SE[SubscriptionEvent]
        LE[LicenseEvent]
    end

    P --> A
    S --> A
    L --> A
    A --> V
    V --> N
    N --> PE
    N --> SE
    N --> LE

    style Providers fill:#e1f5ff
    style Processing fill:#fff4e1
    style Events fill:#e8f5e9
```

---

## Polar

### Event Mapping

| Provider Event            | Regarde Event         | Status                   | Notes                                   |
| :------------------------ | :-------------------- | :----------------------- | :-------------------------------------- |
| `order.paid`              | **PaymentEvent**      | `succeeded`              | Confirmed purchase                      |
| `order.created`           | **PaymentEvent**      | `pending` or `succeeded` | Checks order status field               |
| `refund.created`          | **PaymentEvent**      | `refunded`               | Full or partial refund                  |
| `subscription.created`    | **SubscriptionEvent** | mapped                   | Maps via `mapPolarSubscriptionStatus()` |
| `subscription.updated`    | **SubscriptionEvent** | mapped                   | Includes `cancelAtPeriodEnd` flag       |
| `subscription.active`     | **SubscriptionEvent** | `active`                 | Subscription activated                  |
| `subscription.canceled`   | **SubscriptionEvent** | `canceled`               | User-initiated cancel                   |
| `subscription.uncanceled` | **SubscriptionEvent** | mapped                   | Cancellation reversed                   |
| `subscription.revoked`    | **SubscriptionEvent** | `canceled`               | Provider-initiated termination          |
| `subscription.past_due`   | **SubscriptionEvent** | `past_due`               | Payment overdue                         |
| `benefit_grant.created`   | **LicenseEvent**      | `active`                 | New license issued                      |
| `benefit_grant.updated`   | **LicenseEvent**      | `active`/`revoked`       | Checks `is_revoked` flag                |
| `benefit_grant.revoked`   | **LicenseEvent**      | `revoked`                | License access removed                  |
| `benefit_grant.cycled`    | **LicenseEvent**      | `active`                 | License period renewed                  |

### Context Extraction

Polar extracts context from `data.metadata` with fallbacks:

```mermaid
flowchart LR
    A[Webhook Request] --> B{Source}
    B -->|metadata.regarde_app_id| C[App ID]
    B -->|metadata.regarde_user_id| D[User ID]
    B -->|metadata.regarde_sdk_id| E[SDK ID]
    B -->|URL path appId| C
    B -->|Query params| D
    B -->|Query params| E

    C --> F[Load App Config]
    D --> G[Locate User Data]
    E --> H[Verify SDK]
```

**Priority Order:**

1. `data.metadata.regarde_app_id` (or `app_id`)
2. `data.metadata.regarde_user_id` (or `user_id`)
3. `data.metadata.regarde_sdk_id`
4. URL path `/{provider}/{appId}`
5. Query params `?regarde_user_id=&regarde_sdk_id=`

### Signature Validation

- **Header:** `webhook-signature`
- **Additional Headers:** `webhook-timestamp`, `webhook-id`
- **Format:** `v1,{base64-signature}`
- **Algorithm:** HMAC-SHA256
- **Payload:** `{id}.{timestamp}.{body}` (Standard Webhooks spec)

### Mode Detection

```typescript
const mode = data.is_sandbox === true ? "test" : "production";
```

---

## Stripe

### Event Mapping

| Provider Event                                    | Regarde Event         | Status             | Notes                                    |
| :------------------------------------------------ | :-------------------- | :----------------- | :--------------------------------------- |
| `checkout.session.completed`                      | **PaymentEvent**      | `succeeded`        | One-time checkout complete               |
| `invoice.paid`                                    | **PaymentEvent**      | `succeeded`        | Recurring payment received               |
| `invoice.payment_failed`                          | **PaymentEvent**      | `failed`           | Recurring payment failed                 |
| `customer.subscription.created`                   | **SubscriptionEvent** | mapped             | Maps via `mapStripeSubscriptionStatus()` |
| `customer.subscription.updated`                   | **SubscriptionEvent** | mapped             | Includes `cancelAtPeriodEnd` flag        |
| `customer.subscription.deleted`                   | **SubscriptionEvent** | `canceled`         | Subscription ended                       |
| `entitlements.active_entitlement_summary.updated` | **LicenseEvent**      | `active`/`revoked` | Based on entitlements data               |

### Context Extraction

Stripe extracts context from `data.object.metadata`:

```mermaid
flowchart LR
    A[Webhook Request] --> B{Source}
    B -->|data.object.metadata.regarde_app_id| C[App ID]
    B -->|data.object.metadata.regarde_user_id| D[User ID]
    B -->|data.object.metadata.regarde_sdk_id| E[SDK ID]
    B -->|URL path appId| C
    B -->|Query params| D
    B -->|Query params| E
```

**Priority Order:**

1. `data.object.metadata.regarde_app_id` (or `app_id`)
2. `data.object.metadata.regarde_user_id` (or `user_id`)
3. `data.object.metadata.regarde_sdk_id`
4. URL path `/{provider}/{appId}`
5. Query params `?regarde_user_id=&regarde_sdk_id=`

### Signature Validation

- **Header:** `stripe-signature`
- **Format:** `t={timestamp},v1={hex-signature}`
- **Algorithm:** HMAC-SHA256
- **Tolerance:** 5 minutes (300 seconds)
- **Payload:** `{timestamp}.{body}`

### Mode Detection

```typescript
const mode = event.livemode === false ? "test" : "production";
```

---

## LemonSqueezy

### Event Mapping

| Provider Event                  | Regarde Event         | Status          | Notes                                                     |
| :------------------------------ | :-------------------- | :-------------- | :-------------------------------------------------------- |
| `order_created`                 | **PaymentEvent**      | `succeeded`     | New order placed                                          |
| `order_updated` (failed)        | **PaymentEvent**      | `failed`        | Payment failed                                            |
| `order_updated` (refunded)      | **PaymentEvent**      | `refunded`      | Order refunded                                            |
| `subscription_created`          | **SubscriptionEvent** | mapped          | Status mapping: active/canceled/expired/past_due/trialing |
| `subscription_cancelled`        | **SubscriptionEvent** | `canceled`      | Subscription canceled                                     |
| `subscription_updated`          | **SubscriptionEvent** | mapped          | Any subscription change                                   |
| `subscription_payment_success`  | **PaymentEvent**      | `succeeded`     | Recurring payment successful                              |
| `subscription_payment_failed`   | **PaymentEvent**      | `failed`        | Recurring payment failed                                  |
| `subscription_payment_refunded` | **PaymentEvent**      | `refunded`      | Subscription payment refunded                             |
| `license_key_created`           | **LicenseEvent**      | `active`        | New license key generated                                 |
| `license_key_updated`           | **LicenseEvent**      | active/inactive | Based on `status` field                                   |

### Context Extraction

LemonSqueezy extracts context from `meta.custom_data`:

```mermaid
flowchart LR
    A[Webhook Request] --> B{Source}
    B -->|meta.custom_data.app_id| C[App ID]
    B -->|meta.custom_data.user_id| D[User ID]
    B -->|meta.custom_data.regarde_sdk_id| E[SDK ID]
    B -->|URL path appId| C
    B -->|Query params| D
    B -->|Query params| E
```

**Priority Order:**

1. `meta.custom_data.app_id`
2. `meta.custom_data.user_id`
3. `meta.custom_data.regarde_sdk_id`
4. URL path `/{provider}/{appId}`
5. Query params `?regarde_user_id=&regarde_sdk_id=`

### Signature Validation

- **Header:** `x-signature`
- **Format:** Raw hex string
- **Algorithm:** HMAC-SHA256
- **Payload:** Raw request body

### Mode Detection

```typescript
const mode = meta.test_mode === true ? "test" : "production";
```

---

## Webhook URL Structure

### Base URL Format

```
POST /webhooks/{provider}/{appId}?regarde_user_id={userId}&regarde_sdk_id={sdkId}
```

### Parameters

#### Path Parameters (Required)

| Parameter  | Values                            | Description                     |
| :--------- | :-------------------------------- | :------------------------------ |
| `provider` | `lemonsqueezy`, `stripe`, `polar` | Payment provider identifier     |
| `appId`    | String                            | App's Jazz Account ID (co\_...) |

#### Query Parameters (Optional - Testing Fallback)

| Parameter         | Description                                     |
| :---------------- | :---------------------------------------------- |
| `regarde_user_id` | Jazz Account ID of the user receiving the event |
| `regarde_sdk_id`  | Regarde SDK CoMap ID for verification           |

### Context Extraction Priority

All providers follow the same priority order for extracting context:

```mermaid
flowchart TD
    A[Incoming Webhook] --> B{Has Provider<br/>Metadata?}
    B -->|Yes| C[Extract from<br/>Provider Payload]
    B -->|No| D{Has URL Path<br/>App ID?}
    D -->|Yes| E[Use Path App ID]
    D -->|No| F[Error: Missing App ID]
    C --> G{Has User ID<br/>in Metadata?}
    E --> G
    G -->|Yes| H[Extract User ID]
    G -->|No| I{Has Query Params?}
    I -->|Yes| J[Use Query Params]
    I -->|No| K[Error: Missing User ID]
    H --> L[Validate SDK ID]
    J --> L
    L --> M[Load App &<br/>Process Event]
```

### Full Examples

#### Production (Metadata Embedded)

```bash
curl -X POST https://api.regarde.dev/webhooks/polar/co_app123 \
  -H "webhook-signature: v1,abc123..." \
  -H "webhook-timestamp: 1234567890" \
  -H "webhook-id: evt_123" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "order.paid",
    "data": {
      "id": "order_123",
      "amount": 5000,
      "currency": "usd",
      "customer_id": "cus_123",
      "metadata": {
        "regarde_app_id": "co_app123",
        "regarde_user_id": "co_zUser456",
        "regarde_sdk_id": "co_sdk789"
      }
    }
  }'
```

#### Testing (Query Parameters Fallback)

```bash
curl -X POST "https://api.regarde.dev/webhooks/polar/co_app123?regarde_user_id=co_zUser456&regarde_sdk_id=co_sdk789" \
  -H "webhook-signature: v1,abc123..." \
  -H "webhook-timestamp: 1234567890" \
  -d '{
    "type": "order.paid",
    "data": {
      "id": "order_123",
      "amount": 5000,
      "currency": "usd"
    }
  }'
```

---

## Signature Validation Comparison

```mermaid
flowchart LR
    subgraph Polar["Polar"]
        P1["Header: webhook-signature"]
        P2["Format: v1,{base64}"]
        P3["Standard Webhooks"]
        P4["Payload: {id}.{timestamp}.{body}"]
    end

    subgraph Stripe["Stripe"]
        S1["Header: stripe-signature"]
        S2["Format: t=...,v1=..."]
        S3["Timestamp Tolerance: 5min"]
        S4["Payload: {timestamp}.{body}"]
    end

    subgraph LemonSqueezy["LemonSqueezy"]
        L1["Header: x-signature"]
        L2["Format: raw hex"]
        L3["No timestamp check"]
        L4["Payload: raw body"]
    end

    Polar --> V[Verify]
    Stripe --> V
    LemonSqueezy --> V
    V --> R{Valid?}
    R -->|Yes| Process[Process Event]
    R -->|No| Reject[Return 401]
```

| Provider         | Header              | Format                | Algorithm   | Payload Structure         |
| :--------------- | :------------------ | :-------------------- | :---------- | :------------------------ |
| **Polar**        | `webhook-signature` | `v1,{base64-sig}`     | HMAC-SHA256 | `{id}.{timestamp}.{body}` |
| **Stripe**       | `stripe-signature`  | `t={ts},v1={hex-sig}` | HMAC-SHA256 | `{timestamp}.{body}`      |
| **LemonSqueezy** | `x-signature`       | `{hex-sig}`           | HMAC-SHA256 | `{raw-body}`              |

---

## Event Processing Flow

```mermaid
sequenceDiagram
    participant P as Payment Provider
    participant A as API Gateway
    participant H as Webhook Handler
    participant V as Validation
    participant N as Normalization
    participant J as Jazz Storage

    P->>A: POST /webhooks/{provider}/{appId}
    Note right of P: Headers:<br/>- signature<br/>- timestamp (optional)<br/>- id (optional)

    A->>H: Route to handler

    H->>H: Parse raw body
    H->>H: Extract provider & appId

    H->>V: Validate signature
    Note right of V: Provider-specific<br/>validation logic

    alt Validation Failed
        V-->>H: Invalid signature
        H-->>A: 401 Unauthorized
        A-->>P: Error response
    else Validation Passed
        V-->>H: Valid

        H->>H: Extract context<br/>(appId, userId, sdkId)

        alt Missing Context
            H-->>A: 400 Bad Request
            A-->>P: Error response
        else Context Valid
            H->>J: Load App config
            J-->>H: App + webhook secret

            H->>H: Re-validate with<br/>app-specific secret

            H->>N: Normalize event
            Note right of N: Map provider event<br/>to Regarde event type

            N-->>H: NormalizedEvent

            H->>J: Create CoValue<br/>(PaymentEvent/<br/>SubscriptionEvent/<br/>LicenseEvent)

            J-->>H: Stored successfully
            H-->>A: 200 OK
            A-->>P: {received: true}
        end
    end
```

---

## Implementation Notes

### Critical Rules

1. **Always Use App-Specific Secret**: After loading the App CoMap, re-validate the signature using the app's stored `webhookSecret` (not a global secret).

2. **Explicit Boolean Checks**: Follow AGENTS.md Golden Rule:

   ```typescript
   // Prefer explicit comparisons
   const isValid =
     app.webhookSecret !== null &&
     app.webhookSecret !== undefined &&
     app.webhookSecret !== "";
   if (isValid === false) {
     throw new Error("Missing secret");
   }
   ```

3. **Sync Safety**: After creating a CoValue, always call `coMap.$jazz.waitForSync()` before using it.

4. **Deduplication**: Check `ProcessedProviderEvents` registry to avoid processing the same `prefixedProviderEventUUID` twice.

### Error Handling

| Error                      | Status Code | Cause                                            |
| :------------------------- | :---------- | :----------------------------------------------- |
| `Unsupported provider`     | 400         | Invalid `{provider}` path param                  |
| `Missing required context` | 400         | No metadata or query params found                |
| `Missing App ID`           | 400         | Path param empty or invalid                      |
| `App not found`            | 404         | AppId doesn't exist in Jazz                      |
| `Missing webhookSecret`    | 500         | App loaded but has no secret configured          |
| `Invalid signature`        | 401         | Signature validation failed                      |
| `Duplicate event`          | 200         | Event already processed (safe to return success) |
| `Unsupported event type`   | 500         | Provider sent unmapped event type                |

---

## Related Files

- `packages/api.regarde.dev/src/domains/payments/adapters/polar.ts` — Polar adapter implementation
- `packages/api.regarde.dev/src/domains/payments/adapters/stripe.ts` — Stripe adapter implementation
- `packages/api.regarde.dev/src/domains/payments/adapters/lemonsqueezy.ts` — LemonSqueezy adapter implementation
- `packages/api.regarde.dev/src/domains/payments/adapters/types.ts` — Shared adapter interfaces
- `packages/api.regarde.dev/src/domains/payments/handlers/unifiedWebhook.ts` — Webhook processing logic
- `packages/api.regarde.dev/src/routes/unifiedWebhook.ts` — Route definition
