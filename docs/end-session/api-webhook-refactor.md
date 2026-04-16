# Session: payments-webhook-refactor

**Date:** 2026-04-16

## Overview

Refactored the payments webhook domain so `unifiedWebhook.ts` is an orchestration-focused handler and the domain logic now lives in dedicated `services/` subfolders. Also tightened webhook payload handling with a dedicated Zod JSON-object parser and reduced repeated delivery logging construction through shared webhook delivery builders and local shared types.

## Files Changed

- Created: `packages/api.regarde.dev/src/domains/payments/handlers/schema.ts`
- Modified: `packages/api.regarde.dev/src/domains/payments/handlers/unifiedWebhook.ts`
- Created: `packages/api.regarde.dev/src/domains/payments/services/indexing/license.ts`
- Created: `packages/api.regarde.dev/src/domains/payments/services/indexing/payment.ts`
- Created: `packages/api.regarde.dev/src/domains/payments/services/indexing/subscription.ts`
- Created: `packages/api.regarde.dev/src/domains/payments/services/indexing/types.ts`
- Created: `packages/api.regarde.dev/src/domains/payments/services/processing/license.ts`
- Created: `packages/api.regarde.dev/src/domains/payments/services/processing/payment.ts`
- Created: `packages/api.regarde.dev/src/domains/payments/services/processing/subscription.ts`
- Created: `packages/api.regarde.dev/src/domains/payments/services/processing/types.ts`
- Created: `packages/api.regarde.dev/src/domains/payments/services/sideEffects/checkoutSession.ts`
- Created: `packages/api.regarde.dev/src/domains/payments/services/sideEffects/invoice.ts`
- Created: `packages/api.regarde.dev/src/domains/payments/services/sideEffects/subscriptionState.ts`
- Created: `packages/api.regarde.dev/src/domains/payments/services/webhook/attempts.ts`
- Created: `packages/api.regarde.dev/src/domains/payments/services/webhook/delivery.ts`
- Created: `packages/api.regarde.dev/src/domains/payments/services/webhook/types.ts`

## Decisions Made

- Split `payments/services/` by concern (`webhook`, `processing`, `indexing`, `sideEffects`) — This keeps orchestration, domain mutation, projections, and telemetry separate.
- Keep `webhook.events` as app-facing canonical delivery history and worker records as operator telemetry — This preserves a clear product/admin boundary.
- Extract repeated delivery record construction into webhook helpers — This reduces duplication and drift across error and success branches.
- Use local `types.ts` only where repetition is real — Shared contracts are centralized without creating broad abstract layers.
- Validate webhook payloads with a dedicated Zod JSON-object parser — External input is validated instead of asserted with casts.

## What Worked / Didn't Work

- Responsibility-based extraction worked well — `unifiedWebhook.ts` became easier to reason about.
- Shared webhook delivery builders reduced noise — Repeated app and registry payload construction became smaller.
- Cast-based JSON typing did not hold up — Replacing it with schema validation produced a cleaner boundary.
- Broad temporary types like `Record<string, unknown>` drifted from schema expectations — Exported validated JSON types are safer.

## Next Steps

1. Decide whether the JSON parsing helper should stay in `payments/handlers/` or move to a shared API-domain schema utility.
2. Consider adding a small workflow context type for `unifiedWebhook.ts` if the handler still feels parameter-heavy.
3. Capture the refactoring rules from this session in `docs/design-docs/code-style.md` or a related architecture guide.
