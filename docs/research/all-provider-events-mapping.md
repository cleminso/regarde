# Provider Webhook Events - Complete Reference

**Date**: February 26, 2026  
**Purpose**: Complete catalog of ALL webhook events from Stripe, Polar, and LemonSqueezy with Regarde mapping status  
**Sources**:

- Stripe: https://docs.stripe.com/api/events/types
- Polar: https://polar.sh/docs/integrate/webhooks/events
- LemonSqueezy: https://docs.lemonsqueezy.com/help/webhooks/event-types

---

## Executive Summary

| Provider         | Total Events | Currently Mapped | Missing |
| ---------------- | ------------ | ---------------- | ------- |
| **Stripe**       | 170+         | 8                | 162+    |
| **Polar**        | 22           | 13               | 9       |
| **LemonSqueezy** | 17           | 10               | 7       |

**Critical Gap**: Polar has NO explicit `payment.failed` event - the only provider without direct payment failure visibility.

---

## Critical Missing Events (Payment Failures)

| Priority     | Provider | Event                                   | Current State       | Note                                         |
| ------------ | -------- | --------------------------------------- | ------------------- | -------------------------------------------- |
| **CRITICAL** | Polar    | `payment.failed` equivalent             | **NO EVENT EXISTS** | Only provider without payment failure events |
| **HIGH**     | Stripe   | `payment_intent.payment_failed`         | NOT MAPPED          | Most common payment failure path             |
| **HIGH**     | Stripe   | `charge.failed`                         | NOT MAPPED          | Alternative failure path                     |
| **MEDIUM**   | Stripe   | `checkout.session.async_payment_failed` | NOT MAPPED          | Delayed payment failures                     |
| **MEDIUM**   | Stripe   | `invoice.payment_action_required`       | NOT MAPPED          | SCA/3D Secure required                       |
| **MEDIUM**   | Stripe   | `refund.created`                        | NOT MAPPED          | Refund tracking                              |

---

# 1. STRIPE Webhook Events

## 1.1 Billing & Payments

| Event                                        | Mapping                       | Description                             | Key Fields                                                                        |
| -------------------------------------------- | ----------------------------- | --------------------------------------- | --------------------------------------------------------------------------------- |
| `application_fee.created`                    | NOT MAPPED                    | Application fee created                 | `id`, `amount`, `account`                                                         |
| `application_fee.refund.updated`             | NOT MAPPED                    | Application fee refund updated          | `id`, `amount`, `status`                                                          |
| `application_fee.refunded`                   | NOT MAPPED                    | Application fee refunded                | `id`, `amount_refunded`                                                           |
| `balance.available`                          | NOT MAPPED                    | Balance updated                         | `available`, `pending`                                                            |
| `balance_settings.updated`                   | NOT MAPPED                    | Balance settings changed                | `id`, `settings`                                                                  |
| `billing_portal.configuration.created`       | NOT MAPPED                    | Portal config created                   | `id`, `business_profile`                                                          |
| `billing_portal.configuration.updated`       | NOT MAPPED                    | Portal config updated                   | `id`, `updated_fields`                                                            |
| `billing_portal.session.created`             | NOT MAPPED                    | Portal session created                  | `id`, `customer`, `url`                                                           |
| `billing.alert.triggered`                    | NOT MAPPED                    | Custom alert threshold met              | `alert`, `value`                                                                  |
| `billing.credit_balance_transaction.created` | NOT MAPPED                    | Credit balance transaction created      | `id`, `credit_grant`, `amount`                                                    |
| `billing.credit_grant.created`               | NOT MAPPED                    | Credit grant created                    | `id`, `amount`, `currency`                                                        |
| `billing.credit_grant.updated`               | NOT MAPPED                    | Credit grant updated                    | `id`, `amount_used`                                                               |
| `billing.meter.created`                      | NOT MAPPED                    | Meter created                           | `id`, `display_name`                                                              |
| `billing.meter.deactivated`                  | NOT MAPPED                    | Meter deactivated                       | `id`, `status`                                                                    |
| `billing.meter.reactivated`                  | NOT MAPPED                    | Meter reactivated                       | `id`, `status`                                                                    |
| `billing.meter.updated`                      | NOT MAPPED                    | Meter updated                           | `id`, `updated_fields`                                                            |
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
| `coupon.created`                             | NOT MAPPED                    | Coupon created                          | `id`, `name`, `percent_off`, `amount_off`                                         |
| `coupon.deleted`                             | NOT MAPPED                    | Coupon deleted                          | `id`, `deleted=true`                                                              |
| `coupon.updated`                             | NOT MAPPED                    | Coupon updated                          | `id`, `updated_fields`                                                            |
| `credit_note.created`                        | NOT MAPPED                    | Credit note created                     | `id`, `amount`, `invoice`                                                         |
| `credit_note.updated`                        | NOT MAPPED                    | Credit note updated                     | `id`, `status`, `amount`                                                          |
| `credit_note.voided`                         | NOT MAPPED                    | Credit note voided                      | `id`, `voided_at`, `status`                                                       |
| `invoice_payment.paid`                       | NOT MAPPED                    | InvoicePayment paid                     | `id`, `amount`, `status`                                                          |
| `invoice.created`                            | NOT MAPPED                    | Invoice created                         | `id`, `amount_due`, `subscription`, `customer`                                    |
| `invoice.deleted`                            | NOT MAPPED                    | Draft invoice deleted                   | `id`, `deleted=true`                                                              |
| `invoice.finalization_failed`                | NOT MAPPED                    | Invoice finalization failed             | `id`, `last_finalization_error`                                                   |
| `invoice.finalized`                          | NOT MAPPED                    | Invoice finalized                       | `id`, `status=open`                                                               |
| `invoice.marked_uncollectible`               | NOT MAPPED                    | Invoice marked uncollectible            | `id`, `status=uncollectible`                                                      |
| `invoice.overdue`                            | NOT MAPPED                    | Invoice overdue                         | `id`, `status=overdue`                                                            |
| `invoice.overpaid`                           | NOT MAPPED                    | Invoice overpaid                        | `id`, `amount_overpaid`                                                           |
| `invoice.paid`                               | `payment.created` (succeeded) | Invoice paid                            | `id`, `amount_paid`, `subscription`, `billing_reason`                             |
| `invoice.payment_action_required`            | **NOT MAPPED**                | **SCA action required**                 | `id`, `hosted_invoice_url`                                                        |
| `invoice.payment_attempt_required`           | NOT MAPPED                    | Payment attempt required                | `id`, `payment_intent`                                                            |
| `invoice.payment_failed`                     | `payment.failed`              | Invoice payment failed                  | `id`, `amount_due`, `attempt_count`, `next_payment_attempt`, `last_payment_error` |
| `invoice.payment_succeeded`                  | `payment.created` (succeeded) | Invoice payment succeeded               | `id`, `amount_paid`, `subscription`                                               |
| `invoice.sent`                               | NOT MAPPED                    | Invoice email sent                      | `id`, `sent_at`                                                                   |
| `invoice.upcoming`                           | NOT MAPPED                    | Upcoming invoice warning                | `id`, `subscription`, `next_payment_attempt`                                      |
| `invoice.updated`                            | NOT MAPPED                    | Invoice updated                         | `id`, `updated_fields`                                                            |
| `invoice.voided`                             | NOT MAPPED                    | Invoice voided                          | `id`, `status=void`                                                               |
| `invoice.will_be_due`                        | NOT MAPPED                    | Invoice will be due soon                | `id`, `due_date`                                                                  |
| `invoiceitem.created`                        | NOT MAPPED                    | Invoice item created                    | `id`, `amount`, `description`                                                     |
| `invoiceitem.deleted`                        | NOT MAPPED                    | Invoice item deleted                    | `id`, `deleted=true`                                                              |
| `mandate.updated`                            | NOT MAPPED                    | Mandate updated                         | `id`, `status`                                                                    |
| `payment_intent.amount_capturable_updated`   | NOT MAPPED                    | PaymentIntent capturable amount updated | `id`, `amount_capturable`                                                         |
| `payment_intent.canceled`                    | NOT MAPPED                    | PaymentIntent canceled                  | `id`, `cancellation_reason`                                                       |
| `payment_intent.created`                     | NOT MAPPED                    | PaymentIntent created                   | `id`, `amount`, `currency`, `status`                                              |
| `payment_intent.partially_funded`            | NOT MAPPED                    | PaymentIntent partially funded          | `id`, `amount_remaining`                                                          |
| `payment_intent.payment_failed`              | **NOT MAPPED**                | **PaymentIntent failed**                | `id`, `last_payment_error`, `decline_code`, `charges`                             |
| `payment_intent.processing`                  | NOT MAPPED                    | PaymentIntent processing                | `id`, `status=processing`                                                         |
| `payment_intent.requires_action`             | NOT MAPPED                    | PaymentIntent requires 3D Secure        | `id`, `client_secret`, `next_action`                                              |
| `payment_intent.succeeded`                   | NOT MAPPED                    | PaymentIntent succeeded                 | `id`, `charges`, `status=succeeded`                                               |
| `payment_link.created`                       | NOT MAPPED                    | Payment link created                    | `id`, `url`                                                                       |
| `payment_link.updated`                       | NOT MAPPED                    | Payment link updated                    | `id`, `updated_fields`                                                            |
| `payment_method.attached`                    | NOT MAPPED                    | Payment method attached                 | `id`, `customer`, `type`                                                          |
| `payment_method.automatically_updated`       | NOT MAPPED                    | Payment method auto-updated             | `id`, `card[exp_month]`, `card[exp_year]`                                         |
| `payment_method.detached`                    | NOT MAPPED                    | Payment method detached                 | `id`, `customer`                                                                  |
| `payment_method.updated`                     | NOT MAPPED                    | Payment method updated                  | `id`, `billing_details`, `metadata`                                               |
| `payout.canceled`                            | NOT MAPPED                    | Payout canceled                         | `id`, `status=canceled`                                                           |
| `payout.created`                             | NOT MAPPED                    | Payout created                          | `id`, `amount`, `date`, `status`                                                  |
| `payout.failed`                              | NOT MAPPED                    | Payout failed                           | `id`, `failure_code`                                                              |
| `payout.paid`                                | NOT MAPPED                    | Payout paid                             | `id`, `status=paid`                                                               |
| `payout.reconciliation_completed`            | NOT MAPPED                    | Payout reconciliation completed         | `id`, `reconciliation_status`                                                     |
| `payout.updated`                             | NOT MAPPED                    | Payout updated                          | `id`, `updated_fields`                                                            |
| `promotion_code.created`                     | NOT MAPPED                    | Promotion code created                  | `id`, `code`, `coupon`                                                            |
| `promotion_code.updated`                     | NOT MAPPED                    | Promotion code updated                  | `id`, `active`, `expires_at`                                                      |
| `quote.accepted`                             | NOT MAPPED                    | Quote accepted                          | `id`, `status=accepted`                                                           |
| `quote.canceled`                             | NOT MAPPED                    | Quote canceled                          | `id`, `status=canceled`                                                           |
| `quote.created`                              | NOT MAPPED                    | Quote created                           | `id`, `status=draft`                                                              |
| `quote.finalized`                            | NOT MAPPED                    | Quote finalized                         | `id`, `status=open`                                                               |
| `quote.will_expire`                          | NOT MAPPED                    | Quote will expire soon                  | `id`, `expires_at`                                                                |
| `refund.created`                             | **NOT MAPPED**                | **Refund created**                      | `id`, `amount`, `charge`, `payment_intent`, `reason`                              |
| `refund.failed`                              | NOT MAPPED                    | Refund failed                           | `id`, `failure_reason`                                                            |
| `refund.updated`                             | NOT MAPPED                    | Refund updated                          | `id`, `status`, `amount`                                                          |
| `setup_intent.canceled`                      | NOT MAPPED                    | SetupIntent canceled                    | `id`, `cancellation_reason`                                                       |
| `setup_intent.created`                       | NOT MAPPED                    | SetupIntent created                     | `id`, `status`, `customer`                                                        |
| `setup_intent.requires_action`               | NOT MAPPED                    | SetupIntent requires action             | `id`, `next_action`                                                               |
| `setup_intent.setup_failed`                  | NOT MAPPED                    | SetupIntent setup failed                | `id`, `last_setup_error`                                                          |
| `setup_intent.succeeded`                     | NOT MAPPED                    | SetupIntent succeeded                   | `id`, `payment_method`, `status=succeeded`                                        |
| `source.canceled`                            | NOT MAPPED                    | Source canceled                         | `id`, `status=canceled`                                                           |
| `source.chargeable`                          | NOT MAPPED                    | Source chargeable                       | `id`, `status=chargeable`                                                         |
| `source.failed`                              | NOT MAPPED                    | Source failed                           | `id`, `failure_code`, `status=failed`                                             |
| `source.mandate_notification`                | NOT MAPPED                    | Source mandate notification             | `id`, `type`, `status`                                                            |
| `source.refund_attributes_required`          | NOT MAPPED                    | Source refund attributes required       | `id`, `refund_attributes_status`                                                  |
| `source.transaction.created`                 | NOT MAPPED                    | Source transaction created              | `id`, `amount`, `status`                                                          |
| `source.transaction.updated`                 | NOT MAPPED                    | Source transaction updated              | `id`, `status`                                                                    |
| `tax_rate.created`                           | NOT MAPPED                    | Tax rate created                        | `id`, `display_name`, `percentage`                                                |
| `tax_rate.updated`                           | NOT MAPPED                    | Tax rate updated                        | `id`, `display_name`, `percentage`                                                |
| `tax.settings.updated`                       | NOT MAPPED                    | Tax settings updated                    | `id`, `updated_fields`                                                            |

## 1.2 Subscriptions

| Event                                          | Mapping                 | Description            | Key Fields                                                           |
| ---------------------------------------------- | ----------------------- | ---------------------- | -------------------------------------------------------------------- |
| `customer.subscription.created`                | `subscription.created`  | Subscription created   | `id`, `status`, `current_period_*`, `items`, `trial_end`, `customer` |
| `customer.subscription.deleted`                | `subscription.canceled` | Subscription ended     | `id`, `status=canceled`, `ended_at`                                  |
| `customer.subscription.paused`                 | NOT MAPPED              | Subscription paused    | `id`, `pause_collection`, `status`                                   |
| `customer.subscription.pending_update_applied` | NOT MAPPED              | Pending update applied | `id`, `pending_update`                                               |
| `customer.subscription.pending_update_expired` | NOT MAPPED              | Pending update expired | `id`, `pending_update`                                               |
| `customer.subscription.resumed`                | NOT MAPPED              | Subscription resumed   | `id`, `status=active`, `pause_collection`                            |
| `customer.subscription.trial_will_end`         | NOT MAPPED              | Trial ending in 3 days | `id`, `trial_end`, `status`                                          |
| `customer.subscription.updated`                | `subscription.updated`  | Subscription updated   | `id`, `status`, `items`, `cancel_at_period_end`                      |
| `plan.created`                                 | NOT MAPPED              | Plan created           | `id`, `amount`, `currency`, `interval`                               |
| `plan.deleted`                                 | NOT MAPPED              | Plan deleted           | `id`, `deleted=true`                                                 |
| `plan.updated`                                 | NOT MAPPED              | Plan updated           | `id`, `amount`, `updated_fields`                                     |
| `price.created`                                | NOT MAPPED              | Price created          | `id`, `unit_amount`, `currency`, `product`                           |
| `price.deleted`                                | NOT MAPPED              | Price deleted          | `id`, `deleted=true`                                                 |
| `price.updated`                                | NOT MAPPED              | Price updated          | `id`, `unit_amount`, `updated_fields`                                |
| `subscription_schedule.aborted`                | NOT MAPPED              | Schedule aborted       | `id`, `status`, `subscription`                                       |
| `subscription_schedule.canceled`               | NOT MAPPED              | Schedule canceled      | `id`, `status=canceled`                                              |
| `subscription_schedule.completed`              | NOT MAPPED              | Schedule completed     | `id`, `status=completed`                                             |
| `subscription_schedule.created`                | NOT MAPPED              | Schedule created       | `id`, `status`, `phases`                                             |
| `subscription_schedule.expiring`               | NOT MAPPED              | Schedule expiring soon | `id`, `expires_at`                                                   |
| `subscription_schedule.released`               | NOT MAPPED              | Schedule released      | `id`, `released_subscription`                                        |
| `subscription_schedule.updated`                | NOT MAPPED              | Schedule updated       | `id`, `status`, `phases`                                             |

## 1.3 Customers

| Event                                             | Mapping                           | Description                  | Key Fields                             |
| ------------------------------------------------- | --------------------------------- | ---------------------------- | -------------------------------------- |
| `cash_balance.funds_available`                    | NOT MAPPED                        | Cash balance funds available | `customer`, `available`                |
| `customer.created`                                | NOT MAPPED                        | Customer created             | `id`, `email`, `name`, `metadata`      |
| `customer.deleted`                                | NOT MAPPED                        | Customer deleted             | `id`, `deleted=true`                   |
| `customer.discount.created`                       | NOT MAPPED                        | Coupon attached              | `id`, `coupon`, `customer`             |
| `customer.discount.deleted`                       | NOT MAPPED                        | Coupon removed               | `id`, `deleted=true`                   |
| `customer.discount.updated`                       | NOT MAPPED                        | Coupon switched              | `id`, `coupon`, `customer`             |
| `customer.source.created`                         | NOT MAPPED                        | Source created               | `id`, `customer`, `type`               |
| `customer.source.deleted`                         | NOT MAPPED                        | Source removed               | `id`, `deleted=true`                   |
| `customer.source.expiring`                        | NOT MAPPED                        | Source expiring soon         | `id`, `exp_month`, `exp_year`          |
| `customer.source.updated`                         | NOT MAPPED                        | Source updated               | `id`, `updated_fields`                 |
| `customer.tax_id.created`                         | NOT MAPPED                        | Tax ID created               | `id`, `type`, `value`, `customer`      |
| `customer.tax_id.deleted`                         | NOT MAPPED                        | Tax ID deleted               | `id`, `deleted=true`                   |
| `customer.tax_id.updated`                         | NOT MAPPED                        | Tax ID updated               | `id`, `verification`, `updated_fields` |
| `customer.updated`                                | NOT MAPPED                        | Customer updated             | `id`, `updated_fields`                 |
| `customer_cash_balance_transaction.created`       | NOT MAPPED                        | Cash balance transaction     | `id`, `amount`, `customer`             |
| `entitlements.active_entitlement_summary.updated` | `license.created/updated/revoked` | Entitlements changed         | `customer`, `entitlements.data`        |

## 1.4 Products & Prices

| Event             | Mapping    | Description     | Key Fields                     |
| ----------------- | ---------- | --------------- | ------------------------------ |
| `product.created` | NOT MAPPED | Product created | `id`, `name`, `type`           |
| `product.deleted` | NOT MAPPED | Product deleted | `id`, `deleted=true`           |
| `product.updated` | NOT MAPPED | Product updated | `id`, `name`, `updated_fields` |

## 1.5 Account & Platform

| Event                              | Mapping    | Description              | Key Fields                      |
| ---------------------------------- | ---------- | ------------------------ | ------------------------------- |
| `account.application.authorized`   | NOT MAPPED | App authorized           | `id`, `name`                    |
| `account.application.deauthorized` | NOT MAPPED | App deauthorized         | `id`, `name`                    |
| `account.external_account.created` | NOT MAPPED | External account created | `id`, `account`, `type`         |
| `account.external_account.deleted` | NOT MAPPED | External account deleted | `id`, `deleted=true`            |
| `account.external_account.updated` | NOT MAPPED | External account updated | `id`, `updated_fields`          |
| `account.updated`                  | NOT MAPPED | Account updated          | `id`, `updated_fields`          |
| `capability.updated`               | NOT MAPPED | Capability updated       | `id`, `status`, `requirements`  |
| `person.created`                   | NOT MAPPED | Person created           | `id`, `account`, `relationship` |
| `person.deleted`                   | NOT MAPPED | Person deleted           | `id`, `deleted=true`            |
| `person.updated`                   | NOT MAPPED | Person updated           | `id`, `updated_fields`          |

## 1.6 Financial Connections

| Event                                                          | Mapping    | Description             | Key Fields                       |
| -------------------------------------------------------------- | ---------- | ----------------------- | -------------------------------- |
| `financial_connections.account.account_numbers_updated`        | NOT MAPPED | Account numbers updated | `id`, `account_numbers`          |
| `financial_connections.account.created`                        | NOT MAPPED | Account created         | `id`, `account_holder`           |
| `financial_connections.account.deactivated`                    | NOT MAPPED | Account deactivated     | `id`, `status=inactive`          |
| `financial_connections.account.disconnected`                   | NOT MAPPED | Account disconnected    | `id`, `status=disconnected`      |
| `financial_connections.account.reactivated`                    | NOT MAPPED | Account reactivated     | `id`, `status=active`            |
| `financial_connections.account.refreshed_balance`              | NOT MAPPED | Balance refreshed       | `id`, `balance_refresh`          |
| `financial_connections.account.refreshed_ownership`            | NOT MAPPED | Ownership refreshed     | `id`, `ownership_refresh`        |
| `financial_connections.account.refreshed_transactions`         | NOT MAPPED | Transactions refreshed  | `id`, `transaction_refresh`      |
| `financial_connections.account.upcoming_account_number_expiry` | NOT MAPPED | Account number expiring | `id`, `tokenized_account_number` |
| `topup.canceled`                                               | NOT MAPPED | Top-up canceled         | `id`, `status=canceled`          |
| `topup.created`                                                | NOT MAPPED | Top-up created          | `id`, `amount`, `status`         |
| `topup.failed`                                                 | NOT MAPPED | Top-up failed           | `id`, `failure_code`             |
| `topup.reversed`                                               | NOT MAPPED | Top-up reversed         | `id`, `reversed_at`              |
| `topup.succeeded`                                              | NOT MAPPED | Top-up succeeded        | `id`, `status=succeeded`         |
| `transfer.created`                                             | NOT MAPPED | Transfer created        | `id`, `amount`, `destination`    |
| `transfer.reversed`                                            | NOT MAPPED | Transfer reversed       | `id`, `amount_reversed`          |
| `transfer.updated`                                             | NOT MAPPED | Transfer updated        | `id`, `updated_fields`           |

## 1.7 Climate

| Event                               | Mapping    | Description             | Key Fields                    |
| ----------------------------------- | ---------- | ----------------------- | ----------------------------- |
| `climate.order.canceled`            | NOT MAPPED | Climate order canceled  | `id`, `status=canceled`       |
| `climate.order.created`             | NOT MAPPED | Climate order created   | `id`, `amount`, `status`      |
| `climate.order.delayed`             | NOT MAPPED | Climate order delayed   | `id`, `delay_reason`          |
| `climate.order.delivered`           | NOT MAPPED | Climate order delivered | `id`, `delivered_at`          |
| `climate.order.product_substituted` | NOT MAPPED | Product substituted     | `id`, `product`               |
| `climate.product.created`           | NOT MAPPED | Climate product created | `id`, `name`, `price_per_ton` |
| `climate.product.pricing_updated`   | NOT MAPPED | Climate product updated | `id`, `price_per_ton`         |

## 1.8 Issuing

| Event                                                  | Mapping    | Description           | Key Fields                            |
| ------------------------------------------------------ | ---------- | --------------------- | ------------------------------------- |
| `issuing_authorization.created`                        | NOT MAPPED | Authorization created | `id`, `amount`, `card`, `status`      |
| `issuing_authorization.request`                        | NOT MAPPED | Authorization request | `id`, `amount`, `card`, `merchant`    |
| `issuing_authorization.updated`                        | NOT MAPPED | Authorization updated | `id`, `status`, `amount`              |
| `issuing_card.created`                                 | NOT MAPPED | Card created          | `id`, `cardholder`, `status`          |
| `issuing_card.updated`                                 | NOT MAPPED | Card updated          | `id`, `status`, `cancellation_reason` |
| `issuing_cardholder.created`                           | NOT MAPPED | Cardholder created    | `id`, `name`, `status`                |
| `issuing_cardholder.updated`                           | NOT MAPPED | Cardholder updated    | `id`, `updated_fields`                |
| `issuing_dispute.closed`                               | NOT MAPPED | Dispute closed        | `id`, `status`, `resolution`          |
| `issuing_dispute.created`                              | NOT MAPPED | Dispute created       | `id`, `amount`, `status`              |
| `issuing_dispute.funds_reinstated`                     | NOT MAPPED | Funds reinstated      | `id`, `amount`, `currency`            |
| `issuing_dispute.funds_rescinded`                      | NOT MAPPED | Funds rescinded       | `id`, `amount`, `currency`            |
| `issuing_dispute.submitted`                            | NOT MAPPED | Dispute submitted     | `id`, `status=submitted`              |
| `issuing_dispute.updated`                              | NOT MAPPED | Dispute updated       | `id`, `evidence`, `status`            |
| `issuing_personalization_design.activated`             | NOT MAPPED | Design activated      | `id`, `status=active`                 |
| `issuing_personalization_design.deactivated`           | NOT MAPPED | Design deactivated    | `id`, `status=inactive`               |
| `issuing_personalization_design.rejected`              | NOT MAPPED | Design rejected       | `id`, `status=rejected`               |
| `issuing_personalization_design.updated`               | NOT MAPPED | Design updated        | `id`, `updated_fields`                |
| `issuing_token.created`                                | NOT MAPPED | Token created         | `id`, `card`, `wallet_provider`       |
| `issuing_token.updated`                                | NOT MAPPED | Token updated         | `id`, `status`, `device_fingerprint`  |
| `issuing_transaction.created`                          | NOT MAPPED | Transaction created   | `id`, `amount`, `card`, `merchant`    |
| `issuing_transaction.purchase_details_receipt_updated` | NOT MAPPED | Receipt updated       | `id`, `purchase_details`              |
| `issuing_transaction.updated`                          | NOT MAPPED | Transaction updated   | `id`, `amount`, `status`              |

## 1.9 Identity

| Event                                          | Mapping    | Description                 | Key Fields                |
| ---------------------------------------------- | ---------- | --------------------------- | ------------------------- |
| `identity.verification_session.canceled`       | NOT MAPPED | Verification canceled       | `id`, `status=canceled`   |
| `identity.verification_session.created`        | NOT MAPPED | Verification created        | `id`, `type`, `status`    |
| `identity.verification_session.processing`     | NOT MAPPED | Verification processing     | `id`, `status=processing` |
| `identity.verification_session.redacted`       | NOT MAPPED | Verification redacted       | `id`, `redacted_at`       |
| `identity.verification_session.requires_input` | NOT MAPPED | Verification requires input | `id`, `required_inputs`   |
| `identity.verification_session.verified`       | NOT MAPPED | Verification verified       | `id`, `status=verified`   |

## 1.10 Radar & Security

| Event                               | Mapping    | Description             | Key Fields                     |
| ----------------------------------- | ---------- | ----------------------- | ------------------------------ |
| `radar.early_fraud_warning.created` | NOT MAPPED | Fraud warning created   | `id`, `charge`, `fraud_type`   |
| `radar.early_fraud_warning.updated` | NOT MAPPED | Fraud warning updated   | `id`, `status`                 |
| `reserve.hold.created`              | NOT MAPPED | Reserve hold created    | `id`, `amount`, `currency`     |
| `reserve.hold.updated`              | NOT MAPPED | Reserve hold updated    | `id`, `amount`, `status`       |
| `reserve.plan.created`              | NOT MAPPED | Reserve plan created    | `id`, `amount`, `interval`     |
| `reserve.plan.disabled`             | NOT MAPPED | Reserve plan disabled   | `id`, `status=disabled`        |
| `reserve.plan.expired`              | NOT MAPPED | Reserve plan expired    | `id`, `status=expired`         |
| `reserve.plan.updated`              | NOT MAPPED | Reserve plan updated    | `id`, `updated_fields`         |
| `reserve.release.created`           | NOT MAPPED | Reserve release created | `id`, `amount`, `reserve_plan` |
| `review.closed`                     | NOT MAPPED | Review closed           | `id`, `reason`, `open`         |
| `review.opened`                     | NOT MAPPED | Review opened           | `id`, `charge`, `reason`       |

## 1.11 Reporting

| Event                               | Mapping    | Description          | Key Fields                                         |
| ----------------------------------- | ---------- | -------------------- | -------------------------------------------------- |
| `reporting.report_run.failed`       | NOT MAPPED | Report run failed    | `id`, `status=failed`, `error`                     |
| `reporting.report_run.succeeded`    | NOT MAPPED | Report run succeeded | `id`, `status=succeeded`, `result`                 |
| `reporting.report_type.updated`     | NOT MAPPED | Report type updated  | `id`, `data_available_start`, `data_available_end` |
| `sigma.scheduled_query_run.created` | NOT MAPPED | Query run created    | `id`, `status`, `result`                           |

## 1.12 Terminal

| Event                              | Mapping    | Description               | Key Fields               |
| ---------------------------------- | ---------- | ------------------------- | ------------------------ |
| `terminal.reader.action_failed`    | NOT MAPPED | Terminal action failed    | `id`, `action`, `error`  |
| `terminal.reader.action_succeeded` | NOT MAPPED | Terminal action succeeded | `id`, `action`, `status` |
| `terminal.reader.action_updated`   | NOT MAPPED | Terminal action updated   | `id`, `action`, `status` |

## 1.13 Test Helpers

| Event                                      | Mapping    | Description          | Key Fields                    |
| ------------------------------------------ | ---------- | -------------------- | ----------------------------- |
| `test_helpers.test_clock.advancing`        | NOT MAPPED | Test clock advancing | `id`, `status=advancing`      |
| `test_helpers.test_clock.created`          | NOT MAPPED | Test clock created   | `id`, `frozen_time`, `status` |
| `test_helpers.test_clock.deleted`          | NOT MAPPED | Test clock deleted   | `id`, `deleted=true`          |
| `test_helpers.test_clock.internal_failure` | NOT MAPPED | Test clock failed    | `id`, `error`                 |
| `test_helpers.test_clock.ready`            | NOT MAPPED | Test clock ready     | `id`, `status=ready`          |

## 1.14 Other

| Event          | Mapping    | Description  | Key Fields                         |
| -------------- | ---------- | ------------ | ---------------------------------- |
| `file.created` | NOT MAPPED | File created | `id`, `filename`, `purpose`, `url` |

---

# 2. POLAR Webhook Events (22 events)

**Critical Note**: Polar does NOT have any explicit `payment.failed` event.

## 2.1 Billing

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
| `benefit.created`       | NOT MAPPED        | Benefit created | `id`, `name`, `type`, `description`             |
| `benefit.updated`       | NOT MAPPED        | Benefit updated | `id`, `name`, `updated_fields`                  |

## 2.6 Products

| Event             | Mapping    | Description     | Key Fields                            |
| ----------------- | ---------- | --------------- | ------------------------------------- |
| `product.created` | NOT MAPPED | Product created | `id`, `name`, `description`, `prices` |
| `product.updated` | NOT MAPPED | Product updated | `id`, `name`, `updated_fields`        |

## 2.7 Organization

| Event                  | Mapping    | Description          | Key Fields                     |
| ---------------------- | ---------- | -------------------- | ------------------------------ |
| `organization.updated` | NOT MAPPED | Organization updated | `id`, `name`, `updated_fields` |

---

# 3. LEMONSQUEEZY Webhook Events (17 events)

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

## 3.4 Customers

| Event              | Mapping        | Description      | Key Fields                               |
| ------------------ | -------------- | ---------------- | ---------------------------------------- |
| `customer_updated` | **NOT MAPPED** | Customer updated | `id`, `email`, `name`, `city`, `country` |

## 3.5 Affiliates

| Event                 | Mapping        | Description         | Key Fields                        |
| --------------------- | -------------- | ------------------- | --------------------------------- |
| `affiliate_activated` | **NOT MAPPED** | Affiliate activated | `id`, `email`, `name`, `store_id` |

---

# Summary & Recommendations

## Coverage Statistics

| Provider         | Total Events | Currently Mapped | NOT MAPPED | Mapping % |
| ---------------- | ------------ | ---------------- | ---------- | --------- |
| **Stripe**       | 170+         | 8                | 162+       | 4.7%      |
| **Polar**        | 22           | 13               | 9          | 59.1%     |
| **LemonSqueezy** | 17           | 10               | 7          | 58.8%     |

## Critical Missing Events

| Priority     | Provider     | Event                                   | Current State       |
| ------------ | ------------ | --------------------------------------- | ------------------- |
| **CRITICAL** | Polar        | `payment.failed` equivalent             | **NO EVENT EXISTS** |
| **HIGH**     | Stripe       | `payment_intent.payment_failed`         | NOT MAPPED          |
| **HIGH**     | Stripe       | `charge.failed`                         | NOT MAPPED          |
| **MEDIUM**   | Stripe       | `checkout.session.async_payment_failed` | NOT MAPPED          |
| **MEDIUM**   | Stripe       | `invoice.payment_action_required`       | NOT MAPPED          |
| **MEDIUM**   | Stripe       | `refund.created`                        | NOT MAPPED          |
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

_Compiled from official documentation - February 26, 2026_
