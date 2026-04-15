# Refund worker ownership

## Summary

Yes: refunds should go through the API worker.

The important distinction is not only `event` vs `entity`, but whether a CoMap is:

- authoritative billing truth
- client-side initiation / session state

`PaymentEvent`, `SubscriptionEvent`, `Subscription`, `LicenseEvent`, and `Invoice` are authoritative records and are already created by the worker with the correct ownership pattern:

- worker-admin
- user reader
- app/workspace reader

`Refund` should follow the same pattern.

## Current problem

Today `Refund` is created in the SDK in `packages/sdk/src/core/managers/refund/refundManager.ts`.

That means the client currently:

- creates the `Refund` CoMap
- calls the provider refund API directly
- updates and indexes the refund locally

This is different from the other authoritative billing records, which are created by the worker.

## Why this matters

Refunding is not just creating a new record. It changes the effective financial state of an existing payment.

So refund creation should be treated as a privileged state transition and routed through the API worker.

The desired flow is:

1. client sends authenticated refund request to API
2. worker verifies user can perform the action for the target app
3. worker calls provider refund API
4. worker creates authoritative `Refund` CoMap
5. worker indexes refund into SDK/app refund indexes

## Important nuance

`CheckoutSession` is different.

It is client-created operational session state, then later updated by the worker from webhook events.
So it should be evaluated separately from authoritative billing truth.

## Current blocker

To move refund creation fully to the worker, the worker must have access to the provider secret for the target app.

That provider secret does not currently appear to be managed server-side in the existing architecture.

So the project must choose one of these paths:

### Preferred

Store/manage provider credentials server-side per app, then let the worker execute refunds directly.

### Intermediate

Add an authenticated refund endpoint and still let the client send the provider secret in the request, while moving authoritative `Refund` CoMap creation to the worker.

## Recommendation

Treat `Refund` as authoritative billing truth, not as client-owned workflow state.

Implement a refund API endpoint and move final `Refund` CoMap creation to the worker.
