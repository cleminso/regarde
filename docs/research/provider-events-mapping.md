# Provider Webhook Events - Complete Reference

**Date**: February 26, 2026  
**Purpose**: Complete catalog of relevant webhook events from Stripe, Polar, and LemonSqueezy for Regarde payment processing  
**Note**: Only events related to payment lifecycle, subscriptions, licenses, and customer linking are included. Product configuration, platform operations, and provider-internal events are excluded.  
**Sources**:

- Stripe: https://docs.stripe.com/api/events/types
- Polar: https://polar.sh/docs/integrate/webhooks/events
- LemonSqueezy: https://docs.lemonsqueezy.com/help/webhooks/event-types

---

## Executive Summary

| Provider         | Total Events | Currently Mapped | Missing |
| ---------------- | ------------ | ---------------- | ------- |
| **Stripe**       | 40           | 8                | 32      |
| **Polar**        | 15           | 11               | 4       |
| **LemonSqueezy** | 13           | 10               | 3       |

**Critical Gap**: Polar has NO explicit `payment.failed` event - the only provider without direct payment failure visibility.

---

## Critical Missing Events (Payment Failures)

| Priority     | Provider | Event                                   | Current State       | Note                                         |
| ------------ | -------- | --------------------------------------- | ------------------- | -------------------------------------------- |
| **CRITICAL** | Polar    | `payment.failed` equivalent             | **NO EVENT EXISTS** | Only provider without payment failure events |
| **HIGH**     | Stripe   | `payment_intent.payment_failed`         | NOT MAPPED          | Most common payment failure path             |
| **HIGH**     | Stripe   | `charge.failed`                         | NOT MAPPED          | Alternative failure path                     |
| **MEDIUM**   | Stripe   | `checkout.session.async_payment_failed` | NOT MAPPED          | Delayed payment failures                     |
| **MEDIUM**   | Stripe   | `refund.created`                        | NOT MAPPED          | Refund tracking                              |
| **MEDIUM**   | Stripe   | `invoice.payment_action_required`       | NOT MAPPED          | SCA/3D Secure required                       |

---

# 1. STRIPE Webhook Events

## 1.1 Payment Lifecycle

| Event                                        | Mapping                       | Description                             | Key Fields                                                                        |
| -------------------------------------------- | ----------------------------- | --------------------------------------- | --------------------------------------------------------------------------------- |
| `charge.captured`                            | NOT MAPPED                    | Uncaptured charge captured              | `id`, `amount_captured`, `captured`                                               |
| `charge.dispute.closed`                      | NOT MAPPED                    | Dispute closed                          | `id`, `status`, `reason`                                                          |
| `charge.dispute.created`                     | NOT MAPPED                    | Customer disputed charge                | `id`, `charge`, `amount`, `reason`                                                |
| `charge.dispute.funds_reinstated`            | NOT MAPPED                    | Funds reinstated after dispute          | `id`, `amount`, `currency`                                                        |
| `charge.dispute.funds_withdrawn`             | NOT MAPPED                    | Funds withdrawn for dispute             | `id`, `amount`, `currency`                                                        |
| `charge.dispute.updated`                     | NOT MAPPED                    | Dispute updated                         | `id`, `evidence`, `status`                                                        |
| `charge.expired`                             | NOT MAPPED                    | Uncaptured charge expired               | `id`, `expires_at`                                                                |
| `charge.failed`                              | **NOT MAPPED**                | **Failed charge attempt**               | `id`, `failure_code`, `failure_message`, `outcome`                                |
| `charge.pending`                             | NOT MAPPED                    | Pending charge created                  | `id`, `status=pending`                                                            |
| `charge.refund.updated`                      | NOT MAPPED                    | Refund updated                          | `id`, `status`, `amount`                                                          |
| `charge.refunded`                            | NOT MAPPED                    | Charge refunded                         | `id`, `refunded`, `refunds`                                                       |
| `charge.succeeded`                           | NOT MAPPED                    | Charge successful                       | `id`, `amount`, `status=succeeded`                                                |
| `charge.updated`                             | NOT MAPPED                    | Charge updated                          | `id`, `description`, `metadata`                                                   |
| `checkout.session.async_payment_failed`      | **NOT MAPPED**                | **Delayed payment failed**              | `id`, `payment_status=unpaid`                                                     |
| `checkout.session.async_payment_succeeded`   | NOT MAPPED                    | Delayed payment succeeded               | `id`, `payment_status=paid`                                                       |
| `checkout.session.completed`                 | `payment.created` (succeeded) | Checkout completed                      | `id`, `amount_total`, `customer`, `payment_intent`, `metadata`                    |
| `checkout.session.expired`                   | NOT MAPPED                    | Checkout expired                        | `id`, `expires_at`, `status=expired`                                              |
| `invoice.created`                            | NOT MAPPED                    | Invoice created                         | `id`, `amount_due`, `subscription`, `customer`                                    |
| `invoice.deleted`                            | NOT MAPPED                    | Draft invoice deleted                   | `id`, `deleted=true`                                                              |
| `invoice.finalization_failed`                | NOT MAPPED                    | Invoice finalization failed             | `id`, `last_finalization_error`                                                   |
| `invoice.finalized`                          | NOT MAPPED                    | Invoice finalized                       | `id`, `status=open`                                                               |
| `invoice.marked_uncollectible`               | NOT MAPPED                    | Invoice marked uncollectible            | `id`, `status=uncollectible`                                                      |
| `invoice.paid`                               | `payment.created` (succeeded) | Invoice paid                            | `id`, `amount_paid`, `subscription`, `billing_reason`                             |
| `invoice.payment_action_required`            | **NOT MAPPED**                | **SCA action required**                 | `id`, `hosted_invoice_url`                                                        |
| `invoice.payment_failed`                     | `payment.failed`              | Invoice payment failed                  | `id`, `amount_due`, `attempt_count`, `next_payment_attempt`, `last_payment_error` |
| `invoice.payment_succeeded`                  | `payment.created` (succeeded) | Invoice payment succeeded               | `id`, `amount_paid`, `subscription`                                               |
| `invoice.voided`                             | NOT MAPPED                    | Invoice voided                          | `id`, `status=void`                                                               |
| `payment_intent.amount_capturable_updated`   | NOT MAPPED                    | PaymentIntent capturable amount updated | `id`, `amount_capturable`                                                         |
| `payment_intent.canceled`                    | NOT MAPPED                    | PaymentIntent canceled                  | `id`, `cancellation_reason`                                                       |
| `payment_intent.created`                     | NOT MAPPED                    | PaymentIntent created                   | `id`, `amount`, `currency`, `status`                                              |
| `payment_intent.partially_funded`            | NOT MAPPED                    | PaymentIntent partially funded          | `id`, `amount_remaining`                                                          |
| `payment_intent.payment_failed`              | **NOT MAPPED**                | **PaymentIntent failed**                | `id`, `last_payment_error`, `decline_code`, `charges`                             |
| `payment_intent.processing`                  | NOT MAPPED                    | PaymentIntent processing                | `id`, `status=processing`                                                         |
| `payment_intent.requires_action`             | NOT MAPPED                    | PaymentIntent requires 3D Secure        | `id`, `client_secret`, `next_action`                                              |
| `payment_intent.succeeded`                   | NOT MAPPED                    | PaymentIntent succeeded                 | `id`, `charges`, `status=succeeded`                                               |
| `refund.created`                             | **NOT MAPPED**                | **Refund created**                      | `id`, `amount`, `charge`, `payment_intent`, `reason`                              |
| `refund.failed`                              | NOT MAPPED                    | Refund failed                           | `id`, `failure_reason`                                                            |
| `refund.updated`                             | NOT MAPPED                    | Refund updated                          | `id`, `status`, `amount`                                                          |

## 1.2 Subscriptions

| Event                                          | Mapping                 | Description            | Key Fields                                                           |
| ---------------------------------------------- | ----------------------- | ---------------------- | -------------------------------------------------------------------- |
| `customer.subscription.created`                | `subscription.created`  | Subscription created   | `id`, `status`, `current_period_*`, `items`, `trial_end`, `customer` |
| `customer.subscription.deleted`                | `subscription.canceled` | Subscription ended     | `id`, `status=canceled`, `ended_at`                                  |
| `customer.subscription.paused`                 | NOT MAPPED              | Subscription paused    | `id`, `pause_collection`, `status`                                   |
| `customer.subscription.resumed`                | NOT MAPPED              | Subscription resumed   | `id`, `status=active`, `pause_collection`                            |
| `customer.subscription.trial_will_end`         | NOT MAPPED              | Trial ending in 3 days | `id`, `trial_end`, `status`                                          |
| `customer.subscription.updated`                | `subscription.updated`  | Subscription updated   | `id`, `status`, `items`, `cancel_at_period_end`                      |

## 1.3 Customers & Entitlements

| Event                                             | Mapping                           | Description          | Key Fields                        |
| ------------------------------------------------- | --------------------------------- | -------------------- | --------------------------------- |
| `customer.created`                                | NOT MAPPED                        | Customer created     | `id`, `email`, `name`, `metadata` |
| `customer.deleted`                                | NOT MAPPED                        | Customer deleted     | `id`, `deleted=true`              |
| `customer.updated`                                | NOT MAPPED                        | Customer updated     | `id`, `updated_fields`            |
| `entitlements.active_entitlement_summary.updated` | `license.created/updated/revoked` | Entitlements changed | `customer`, `entitlements.data`   |

---

# 2. POLAR Webhook Events

**Critical Note**: Polar does NOT have any explicit `payment.failed` event.

## 2.1 Orders & Payments

| Event              | Mapping                       | Description      | Key Fields                                             |
| ------------------ | ----------------------------- | ---------------- | ------------------------------------------------------ |
| `checkout.created` | NOT MAPPED                    | Checkout created | `id`, `customer_id`, `url`, `expires_at`               |
| `checkout.updated` | NOT MAPPED                    | Checkout updated | `id`, `status`, `expires_at`                           |
| `order.created`    | `payment.created` (pending)   | Order created    | `id`, `amount`, `currency`, `billing_reason`, `status` |
| `order.paid`       | `payment.created` (succeeded) | Order paid       | `id`, `amount`, `status=paid`, `paid_at`               |
| `order.updated`    | NOT MAPPED                    | Order updated    | `id`, `status`, `updated_fields`                       |
| `order.refunded`   | **NOT MAPPED**                | Order refunded   | `id`, `refund_amount`, `status=refunded`               |

## 2.2 Customers

| Event                    | Mapping        | Description                                                                      | Key Fields                                       |
| ------------------------ | -------------- | -------------------------------------------------------------------------------- | ------------------------------------------------ |
| `customer.created`       | NOT MAPPED     | Customer created                                                                 | `id`, `email`, `name`, `metadata`                |
| `customer.updated`       | NOT MAPPED     | Customer updated                                                                 | `id`, `email`, `name`, `updated_fields`          |
| `customer.deleted`       | NOT MAPPED     | Customer deleted                                                                 | `id`, `deleted_at`                               |
| `customer.state_changed` | **NOT MAPPED** | **Aggregated state change** - includes active subscriptions and granted benefits | `id`, `active_subscriptions`, `granted_benefits` |

## 2.3 Subscriptions

| Event                     | Mapping                 | Description                        | Key Fields                                                     |
| ------------------------- | ----------------------- | ---------------------------------- | -------------------------------------------------------------- |
| `subscription.created`    | `subscription.created`  | Subscription created               | `id`, `status`, `customer_id`, `price_id`, `current_period_*`  |
| `subscription.active`     | `subscription.updated`  | Subscription active                | `id`, `status=active`, `started_at`                            |
| `subscription.uncanceled` | `subscription.updated`  | Cancellation undone                | `id`, `cancel_at_period_end=false`                             |
| `subscription.canceled`   | `subscription.canceled` | Subscription canceled              | `id`, `status=canceled`, `cancel_at_period_end`, `canceled_at` |
| `subscription.past_due`   | `subscription.updated`  | Payment failed                     | `id`, `status=past_due`, `payment_method`                      |
| `subscription.revoked`    | `subscription.updated`  | Subscription revoked               | `id`, `status=revoked`, `ended_at`, `revoked_at`               |
| `subscription.updated`    | `subscription.updated`  | **Catch-all** subscription changes | `id`, `status`, `cancel_at_period_end`, `current_period_*`     |

## 2.4 Refunds

| Event            | Mapping            | Description    | Key Fields                           |
| ---------------- | ------------------ | -------------- | ------------------------------------ |
| `refund.created` | `payment.refunded` | Refund created | `id`, `order_id`, `amount`, `reason` |
| `refund.updated` | **NOT MAPPED**     | Refund updated | `id`, `status`, `updated_fields`     |

## 2.5 Benefits (License Events)

| Event                   | Mapping           | Description     | Key Fields                                      |
| ----------------------- | ----------------- | --------------- | ----------------------------------------------- |
| `benefit_grant.created` | `license.created` | Benefit granted | `id`, `benefit_id`, `customer_id`, `granted_at` |
| `benefit_grant.updated` | `license.updated` | Benefit updated | `id`, `is_revoked`, `updated_fields`            |
| `benefit_grant.revoked` | `license.revoked` | Benefit revoked | `id`, `is_revoked=true`, `revoked_at`           |

---

# 3. LEMONSQUEEZY Webhook Events

## 3.1 Orders

| Event            | Mapping                       | Description    | Key Fields                                                       |
| ---------------- | ----------------------------- | -------------- | ---------------------------------------------------------------- |
| `order_created`  | `payment.created` (succeeded) | Order placed   | `id`, `identifier`, `total`, `currency`, `status`, `customer_id` |
| `order_refunded` | `payment.refunded`            | Order refunded | `id`, `refunded`, `refunded_at`, `refund_amount`                 |

## 3.2 Subscriptions

| Event                            | Mapping                       | Description              | Key Fields                                                     |
| -------------------------------- | ----------------------------- | ------------------------ | -------------------------------------------------------------- |
| `subscription_created`           | `subscription.created`        | Subscription created     | `id`, `status`, `product_id`, `variant_id`, `customer_id`      |
| `subscription_updated`           | `subscription.updated`        | Subscription updated     | `id`, `status`, `ends_at`, `trial_ends_at`, `pause_collection` |
| `subscription_cancelled`         | `subscription.canceled`       | Subscription cancelled   | `id`, `cancelled`, `ends_at`, `status`                         |
| `subscription_resumed`           | **NOT MAPPED**                | Subscription resumed     | `id`, `cancelled=false`, `ends_at=null`                        |
| `subscription_expired`           | **NOT MAPPED**                | **Subscription expired** | `id`, `status=expired`, `ends_at`                              |
| `subscription_paused`            | **NOT MAPPED**                | Subscription paused      | `id`, `pause_collection`, `status`                             |
| `subscription_unpaused`          | **NOT MAPPED**                | Subscription unpaused    | `id`, `pause_collection=null`, `status`                        |
| `subscription_payment_success`   | `payment.created` (succeeded) | Payment success          | `id`, `subscription_id`, `total`, `status=paid`                |
| `subscription_payment_failed`    | `payment.failed`              | **Payment failed**       | `id`, `subscription_id`, `status=failed`, `billing_reason`     |
| `subscription_payment_recovered` | **NOT MAPPED**                | **Payment recovered**    | `id`, `subscription_id`, `status=paid`, `recovered=true`       |
| `subscription_payment_refunded`  | `payment.refunded`            | Payment refunded         | `id`, `subscription_id`, `refunded_amount`                     |

## 3.3 Licenses

| Event                 | Mapping           | Description     | Key Fields                                        |
| --------------------- | ----------------- | --------------- | ------------------------------------------------- |
| `license_key_created` | `license.created` | License created | `id`, `key`, `status`, `order_id`, `product_id`   |
| `license_key_updated` | `license.updated` | License updated | `id`, `status`, `activations_count`, `expires_at` |

---

# Summary & Recommendations

## Coverage Statistics

| Provider         | Total Events | Currently Mapped | NOT MAPPED | Mapping % |
| ---------------- | ------------ | ---------------- | ---------- | --------- |
| **Stripe**       | 40           | 8                | 32         | 20.0%     |
| **Polar**        | 15           | 11               | 4          | 73.3%     |
| **LemonSqueezy** | 13           | 10               | 3          | 76.9%     |

## Critical Missing Events

| Priority     | Provider     | Event                                   | Current State       |
| ------------ | ------------ | --------------------------------------- | ------------------- |
| **CRITICAL** | Polar        | `payment.failed` equivalent             | **NO EVENT EXISTS** |
| **HIGH**     | Stripe       | `payment_intent.payment_failed`         | NOT MAPPED          |
| **HIGH**     | Stripe       | `charge.failed`                         | NOT MAPPED          |
| **MEDIUM**   | Stripe       | `checkout.session.async_payment_failed` | NOT MAPPED          |
| **MEDIUM**   | Stripe       | `refund.created`                        | NOT MAPPED          |
| **MEDIUM**   | Stripe       | `invoice.payment_action_required`       | NOT MAPPED          |
| **LOW**      | LemonSqueezy | `subscription_payment_recovered`        | NOT MAPPED          |
| **LOW**      | LemonSqueezy | `subscription_expired`                  | NOT MAPPED          |

## Provider-Specific Limitations

### Polar - No Payment Failure Events

Polar webhooks do NOT include explicit payment failure events. To detect failures:

1. Check `order.created` status field (if not "paid", infer failure)
2. Use `subscription.past_due` for subscription renewal failures
3. Poll Polar API for order status if webhook not received

### Implementation Priority

1. **IMMEDIATE**: Document Polar limitation
2. **HIGH**: Add Stripe `payment_intent.payment_failed`
3. **HIGH**: Add Stripe `charge.failed`
4. **MEDIUM**: Add Stripe `refund.created`
5. **LOW**: Add LemonSqueezy `subscription_payment_recovered` and `subscription_expired`

---

_**Excluded Categories**: Product configuration, platform operations, financial connections, climate/issuing/identity/terminal products, reporting, test helpers, payouts, tax rates, coupons, and application fees. These are not relevant to Regarde's core mission of tracking customer payment events._

_Compiled from official documentation - February 26, 2026_
