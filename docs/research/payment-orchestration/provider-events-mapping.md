# Provider Webhook Events - Complete Reference

**Date**: February 26, 2026  
**Last Updated**: March 2, 2026  
**Purpose**: Complete catalog of relevant webhook events from Stripe, Polar, and LemonSqueezy for Regarde payment processing  
**Note**: Only events related to payment lifecycle, subscriptions, licenses, and customer linking are included. Product configuration, platform operations, and provider-internal events are excluded.  
**Sources**:

- Stripe: https://docs.stripe.com/api/events/types
- Polar: https://polar.sh/docs/integrate/webhooks/events
- LemonSqueezy: https://docs.lemonsqueezy.com/help/webhooks/event-types

---

## Executive Summary

| Provider         | Total Events | Currently Mapped | Missing | Mapping % |
| ---------------- | ------------ | ---------------- | ------- | --------- |
| **Stripe**       | 40           | 38               | 2       | 95.0%     |
| **Polar**        | 15           | 15               | 0       | 100%      |
| **LemonSqueezy** | 13           | 13               | 0       | 100%      |

**Status**: All priority events implemented. Only 2 Stripe dispute events remain unmapped (out of scope for core payment tracking).

---

## Critical Missing Events (Payment Failures) - RESOLVED

| Priority     | Provider | Event                                   | Current State       | Note                                         |
| ------------ | -------- | --------------------------------------- | ------------------- | -------------------------------------------- |
| **CRITICAL** | Polar    | `payment.failed` equivalent             | **NO EVENT EXISTS** | Only provider without payment failure events |
| **HIGH**     | Stripe   | `payment_intent.payment_failed`         | NOT MAPPED          | Most common payment failure path             |
| **HIGH**     | Stripe   | `charge.failed`                         | NOT MAPPED          | Alternative failure path                     |
| **MEDIUM**   | Stripe   | `checkout.session.async_payment_failed` | NOT MAPPED          | Delayed payment failures                     |
| **MEDIUM**   | Stripe   | `refund.created`                        | NOT MAPPED          | Refund tracking                              |
| **MEDIUM**   | Stripe   | `invoice.payment_action_required`       | NOT MAPPED          | SCA/3D Secure required                       |

All critical payment failure events have been implemented:

| Provider | Event                                   | Status | Mapping                                     |
| -------- | --------------------------------------- | ------ | ------------------------------------------- |
| Stripe   | `payment_intent.payment_failed`         | MAPPED | `payment.failed`                            |
| Stripe   | `charge.failed`                         | MAPPED | `payment.failed`                            |
| Stripe   | `checkout.session.async_payment_failed` | MAPPED | `payment.checkout_failed`                   |
| Stripe   | `refund.created`                        | MAPPED | `payment.refunded`                          |
| Stripe   | `invoice.payment_action_required`       | MAPPED | `payment.created` (status: action_required) |

**Note**: Polar still has NO explicit `payment.failed` event - this is a provider limitation, not a Regarde limitation.

---

# 1. STRIPE Webhook Events

## 1.1 Payment Lifecycle

| Event                                      | Mapping                    | Description                             | Key Fields                                                                        |
| ------------------------------------------ | -------------------------- | --------------------------------------- | --------------------------------------------------------------------------------- |
| `charge.captured`                          | `payment.captured`         | Uncaptured charge captured              | `id`, `amount_captured`, `captured`                                               |
| `charge.expired`                           | `payment.expired`          | Uncaptured charge expired               | `id`, `expires_at`                                                                |
| `charge.failed`                            | `payment.failed`           | Failed charge attempt                   | `id`, `failure_code`, `failure_message`, `outcome`                                |
| `charge.pending`                           | `payment.processing`       | Pending charge created                  | `id`, `status=pending`                                                            |
| `charge.refund.updated`                    | `payment.refunded`         | Refund updated                          | `id`, `status`, `amount`                                                          |
| `charge.refunded`                          | `payment.refunded`         | Charge refunded                         | `id`, `refunded`, `refunds`                                                       |
| `charge.succeeded`                         | `payment.succeeded`        | Charge successful                       | `id`, `amount`, `status=succeeded`                                                |
| `charge.updated`                           | `payment.updated`          | Charge updated                          | `id`, `description`, `metadata`                                                   |
| `checkout.session.async_payment_failed`    | `payment.checkout_failed`  | Checkout async payment failed           | `id`, `payment_status=unpaid`                                                     |
| `checkout.session.async_payment_succeeded` | `payment.checkout_succeeded`| Checkout async payment succeeded       | `id`, `payment_status=paid`                                                       |
| `checkout.session.completed`               | `payment.checkout_completed`| Checkout completed                     | `id`, `amount_total`, `customer`, `payment_intent`, `metadata`                    |
| `checkout.session.expired`                 | `payment.checkout_expired` | Checkout expired                        | `id`, `expires_at`, `status=expired`                                              |
| `invoice.created`                          | `payment.processing`       | Invoice created                         | `id`, `amount_due`, `subscription`, `customer`                                    |
| `invoice.deleted`                          | `payment.canceled`         | Draft invoice deleted                   | `id`, `deleted=true`                                                              |
| `invoice.finalization_failed`              | `payment.failed`           | Invoice finalization failed             | `id`, `last_finalization_error`                                                   |
| `invoice.finalized`                        | `payment.processing`       | Invoice finalized                       | `id`, `status=open`                                                               |
| `invoice.marked_uncollectible`             | `payment.failed`           | Invoice marked uncollectible            | `id`, `status=uncollectible`                                                      |
| `invoice.paid`                             | `payment.succeeded`        | Invoice paid                            | `id`, `amount_paid`, `subscription`, `billing_reason`                             |
| `invoice.payment_action_required`          | `payment.action_required`  | SCA action required                     | `id`, `hosted_invoice_url`                                                        |
| `invoice.payment_failed`                   | `payment.failed`           | Invoice payment failed                  | `id`, `amount_due`, `attempt_count`, `next_payment_attempt`, `last_payment_error` |
| `invoice.payment_succeeded`                | `payment.succeeded`        | Invoice payment succeeded               | `id`, `amount_paid`, `subscription`                                               |
| `invoice.voided`                           | `payment.canceled`         | Invoice voided                          | `id`, `status=void`                                                               |
| `payment_intent.amount_capturable_updated` | `payment.processing`       | PaymentIntent capturable amount updated | `id`, `amount_capturable`                                                         |
| `payment_intent.canceled`                  | `payment.canceled`         | PaymentIntent canceled                  | `id`, `cancellation_reason`                                                       |
| `payment_intent.created`                   | `payment.processing`       | PaymentIntent created                   | `id`, `amount`, `currency`, `status`                                              |
| `payment_intent.partially_funded`          | `payment.partially_funded` | PaymentIntent partially funded          | `id`, `amount_remaining`                                                          |
| `payment_intent.payment_failed`            | `payment.failed`           | PaymentIntent failed                    | `id`, `last_payment_error`, `decline_code`, `charges`                             |
| `payment_intent.processing`                | `payment.processing`       | PaymentIntent processing                | `id`, `status=processing`                                                         |
| `payment_intent.requires_action`           | `payment.action_required`  | PaymentIntent requires 3D Secure        | `id`, `client_secret`, `next_action`                                              |
| `payment_intent.succeeded`                 | `payment.succeeded`        | PaymentIntent succeeded                 | `id`, `charges`, `status=succeeded`                                               |
| `refund.created`                           | `payment.refunded`         | Refund created                          | `id`, `amount`, `charge`, `payment_intent`, `reason`                              |
| `refund.failed`                            | `payment.refund_failed`    | Refund failed                           | `id`, `failure_reason`                                                            |
| `refund.updated`                           | `payment.refunded`         | Refund updated                          | `id`, `status`, `amount`                                                          |

## 1.2 Subscriptions

| Event                                  | Mapping                       | Description            | Key Fields                                                           |
| -------------------------------------- | ----------------------------- | ---------------------- | -------------------------------------------------------------------- |
| `customer.subscription.created`        | `subscription.created`        | Subscription created   | `id`, `status`, `current_period_*`, `items`, `trial_end`, `customer` |
| `customer.subscription.deleted`        | `subscription.canceled`       | Subscription ended     | `id`, `status=canceled`, `ended_at`                                  |
| `customer.subscription.paused`         | `subscription.paused`         | Subscription paused    | `id`, `pause_collection`, `status`                                   |
| `customer.subscription.resumed`        | `subscription.resumed`        | Subscription resumed   | `id`, `status=active`, `pause_collection`                            |
| `customer.subscription.trial_will_end` | `subscription.trial_will_end` | Trial ending in 3 days | `id`, `trial_end`, `status`                                          |
| `customer.subscription.updated`        | `subscription.updated`        | Subscription updated   | `id`, `status`, `items`, `cancel_at_period_end`                      |

## 1.3 Customers & Entitlements

| Event                                             | Mapping                           | Description          | Key Fields                        |
| ------------------------------------------------- | --------------------------------- | -------------------- | --------------------------------- |
| `customer.created`                                | Unsupported                       | Customer created     | `id`, `email`, `name`, `metadata` |
| `customer.deleted`                                | Unsupported                       | Customer deleted     | `id`, `deleted=true`              |
| `customer.updated`                                | Unsupported                       | Customer updated     | `id`, `updated_fields`            |
| `entitlements.active_entitlement_summary.updated` | `license.created/updated/revoked` | Entitlements changed | `customer`, `entitlements.data`   |

---

# 2. POLAR Webhook Events

**Critical Note**: Polar does NOT have any explicit `payment.failed` event.

## 2.1 Orders & Payments

| Event              | Mapping                    | Description      | Key Fields                                             |
| ------------------ | -------------------------- | ---------------- | ------------------------------------------------------ |
| `checkout.created` | `payment.checkout_started` | Checkout created | `id`, `customer_id`, `url`, `expires_at`               |
| `checkout.updated` | `payment.updated`          | Checkout updated | `id`, `status`, `expires_at`                           |
| `order.created`    | `payment.processing`       | Order created    | `id`, `amount`, `currency`, `billing_reason`, `status` |
| `order.paid`       | `payment.succeeded`        | Order paid       | `id`, `amount`, `status=paid`, `paid_at`               |
| `order.updated`    | `payment.updated`          | Order updated    | `id`, `status`, `updated_fields`                       |
| `order.refunded`   | `payment.refunded`         | Order refunded   | `id`, `refund_amount`, `status=refunded`               |

## 2.2 Customers

| Event                    | Mapping                | Description                                                                  | Key Fields                                       |
| ------------------------ | ---------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------ |
| `customer.created`       | Unsupported            | Customer created                                                             | `id`, `email`, `name`, `metadata`                |
| `customer.updated`       | Unsupported            | Customer updated                                                             | `id`, `email`, `name`, `updated_fields`          |
| `customer.deleted`       | Unsupported            | Customer deleted                                                             | `id`, `deleted_at`                               |
| `customer.state_changed` | `subscription.updated` | Aggregated state change - includes active subscriptions and granted benefits | `id`, `active_subscriptions`, `granted_benefits` |

## 2.3 Subscriptions

| Event                     | Mapping                   | Description                    | Key Fields                                                     |
| ------------------------- | ------------------------- | ------------------------------ | -------------------------------------------------------------- |
| `subscription.created`    | `subscription.created`    | Subscription created           | `id`, `status`, `customer_id`, `price_id`, `current_period_*`  |
| `subscription.active`     | `subscription.activated`  | Subscription active            | `id`, `status=active`, `started_at`                            |
| `subscription.uncanceled` | `subscription.uncanceled` | Cancellation undone            | `id`, `cancel_at_period_end=false`                             |
| `subscription.canceled`   | `subscription.canceled`   | Subscription canceled          | `id`, `status=canceled`, `cancel_at_period_end`, `canceled_at` |
| `subscription.past_due`   | `subscription.past_due`   | Payment failed                 | `id`, `status=past_due`, `payment_method`                      |
| `subscription.revoked`    | `subscription.expired`    | Subscription revoked           | `id`, `status=revoked`, `ended_at`, `revoked_at`               |
| `subscription.updated`    | `subscription.updated`    | Catch-all subscription changes | `id`, `status`, `cancel_at_period_end`, `current_period_*`     |

## 2.4 Refunds

| Event            | Mapping            | Description    | Key Fields                           |
| ---------------- | ------------------ | -------------- | ------------------------------------ |
| `refund.created` | `payment.refunded` | Refund created | `id`, `order_id`, `amount`, `reason` |
| `refund.updated` | `payment.updated`  | Refund updated | `id`, `status`, `updated_fields`     |

## 2.5 Benefits (License Events)

| Event                   | Mapping           | Description     | Key Fields                                      |
| ----------------------- | ----------------- | --------------- | ----------------------------------------------- |
| `benefit_grant.created` | `license.created` | Benefit granted | `id`, `benefit_id`, `customer_id`, `granted_at` |
| `benefit_grant.updated` | `license.updated` | Benefit updated | `id`, `is_revoked`, `updated_fields`            |
| `benefit_grant.revoked` | `license.revoked` | Benefit revoked | `id`, `is_revoked=true`, `revoked_at`           |
| `benefit_grant.cycled`  | `license.updated` | Benefit cycled  | `id`, `is_revoked`, `updated_fields`            |

---

# 3. LEMONSQUEEZY Webhook Events

## 3.1 Orders

| Event            | Mapping             | Description    | Key Fields                                                       |
| ---------------- | ------------------- | -------------- | ---------------------------------------------------------------- |
| `order_created`  | `payment.succeeded` | Order placed   | `id`, `identifier`, `total`, `currency`, `status`, `customer_id` |
| `order_refunded` | `payment.refunded`  | Order refunded | `id`, `refunded`, `refunded_at`, `refund_amount`                 |

## 3.2 Subscriptions

| Event                            | Mapping                       | Description            | Key Fields                                                     |
| -------------------------------- | ----------------------------- | ---------------------- | -------------------------------------------------------------- |
| `subscription_created`           | `subscription.created`        | Subscription created   | `id`, `status`, `product_id`, `variant_id`, `customer_id`      |
| `subscription_updated`           | `subscription.updated`        | Subscription updated   | `id`, `status`, `ends_at`, `trial_ends_at`, `pause_collection` |
| `subscription_cancelled`         | `subscription.canceled`       | Subscription cancelled | `id`, `cancelled`, `ends_at`, `status`                         |
| `subscription_resumed`           | `subscription.updated`        | Subscription resumed   | `id`, `cancelled=false`, `ends_at=null`                        |
| `subscription_expired`           | `subscription.updated`        | Subscription expired   | `id`, `status=expired`, `ends_at`                              |
| `subscription_paused`            | `subscription.updated`        | Subscription paused    | `id`, `pause_collection`, `status`                             |
| `subscription_unpaused`          | `subscription.updated`        | Subscription unpaused  | `id`, `pause_collection=null`, `status`                        |
| `subscription_payment_success`   | `payment.succeeded`    | Payment success        | `id`, `subscription_id`, `total`, `status=paid`                |
| `subscription_payment_failed`    | `payment.failed`       | Payment failed         | `id`, `subscription_id`, `status=failed`, `billing_reason`     |
| `subscription_payment_recovered` | `payment.succeeded`    | Payment recovered      | `id`, `subscription_id`, `status=paid`, `recovered=true`       |
| `subscription_payment_refunded`  | `payment.refunded`     | Payment refunded       | `id`, `subscription_id`, `refunded_amount`                     |

## 3.3 Licenses

| Event                  | Mapping           | Description     | Key Fields                                        |
| ---------------------- | ----------------- | --------------- | ------------------------------------------------- |
| `license_key_created`  | `license.created` | License created | `id`, `key`, `status`, `order_id`, `product_id`   |
| `license_key_updated`  | `license.updated` | License updated | `id`, `status`, `activations_count`, `expires_at` |
| `license_key_disabled` | `license.revoked` | License revoked | `id`, `key`, `status=disabled`                    |

---

# Summary & Recommendations

## Coverage Statistics

| Provider         | Total Events | Currently Mapped | NOT MAPPED | Mapping % |
| ---------------- | ------------ | ---------------- | ---------- | --------- |
| **Stripe**       | 40           | 38               | 2          | 95.0%     |
| **Polar**        | 15           | 15               | 0          | 100%      |
| **LemonSqueezy** | 13           | 13               | 0          | 100%      |

## Implementation Status: COMPLETE

All payment lifecycle, subscription, license, and customer events are now mapped. The only remaining unmapped events are Stripe dispute events which are out of scope for core payment tracking.

## Schema Updates Applied

### Payment Event Types (17 total)

**Checkout events (5):**
- `payment.checkout_started` - Checkout session started (Polar)
- `payment.checkout_completed` - Checkout session completed (Stripe)
- `payment.checkout_succeeded` - Checkout async payment succeeded (Stripe)
- `payment.checkout_failed` - Checkout async payment failed (Stripe)
- `payment.checkout_expired` - Checkout session expired (Stripe)

**Lifecycle events (6):**
- `payment.authorized`, `payment.captured`, `payment.succeeded`, `payment.failed`, `payment.canceled`, `payment.expired`

**Intermediate states (3):**
- `payment.processing`, `payment.action_required`, `payment.partially_funded`

**Post-payment (2):**
- `payment.refunded`, `payment.refund_failed`

**Metadata-only (1):**
- `payment.updated`

### Status Updates
1. **Payment Statuses**: Added `"action_required"` for SCA/3D Secure flows
2. **Subscription Statuses**: Added `"paused"` for pause/resume functionality

## Provider-Specific Limitations

### Polar - No Payment Failure Events

Polar webhooks do NOT include explicit payment failure events. To detect failures:

1. Check `order.created` status field (if not "paid", infer failure)
2. Use `subscription.past_due` for subscription renewal failures
3. Poll Polar API for order status if webhook not received

This is a **provider limitation**, not a Regarde limitation. Polar simply doesn't expose payment failure webhooks.

---

_**Excluded Categories**: Product configuration, platform operations, financial connections, climate/issuing/identity/terminal products, reporting, test helpers, payouts, tax rates, coupons, and application fees. These are not relevant to Regarde's core mission of tracking customer payment events._

_Dispute events (`charge.dispute.*`) are also excluded as they represent post-payment dispute resolution rather than payment lifecycle._

_Compiled from official documentation - February 26, 2026_  
_Last Updated - March 2, 2026_
