# Design - Deferred Features Documentation

## Overview

This document establishes a decision framework for features that are **intentionally excluded** from Regarde's current roadmap. It serves as a reference for maintaining product focus and avoiding scope creep while documenting deferred capabilities for future consideration.

The primary purpose is to create a shared understanding of:

- Why certain features are not being built now
- Under what conditions they might be reconsidered
- What implementation would require if pursued
- How to maintain architectural consistency with Regarde's philosophy

---

## Philosophy

**Regarde is not usePayKit.**

usePayKit aims for complete provider abstraction with feature parity across all providers. Regarde takes a fundamentally different approach:

### Core Principles

**1. Leverage Jazz's Strengths**

Regarde builds on Jazz's native capabilities rather than duplicating them:

- Identity and authentication via Jazz `Account`
- Real-time sync across devices
- Offline support and conflict resolution
- Permission and sharing models
- Data ownership and privacy guarantees

**2. Focus on Orchestration**

Regarde makes payments work *with* Jazz, not replace providers:

- Bridge between Jazz's local-first model and payment providers
- Synchronize payment state via Jazz CoValues
- Enable real-time payment tracking without polling
- Maintain provider escape hatches for direct API access

**3. Minimal Abstraction**

Only abstract what is necessary for Jazz integration:

- Don't wrap entire provider APIs
- Don't duplicate features Jazz already provides
- Don't create lowest-common-denominator interfaces
- Expose provider-specific capabilities when valuable

**4. Provider Escape Hatches**

Always allow direct provider API access:

- Store provider IDs in Jazz for reference
- Enable hybrid usage (Regarde hooks + direct API calls)
- Don't force users into Regarde's patterns when unnecessary
- Document how to extend beyond built-in features

**5. Real-time by Default**

Everything syncs via Jazz, no polling required:

- Payment events flow through webhooks to Jazz CoValues
- UI automatically updates when payment state changes
- No need for refresh buttons or polling intervals
- Subscription status updates propagate instantly

### Decision Framework

This means saying "no" to features that:

- **Duplicate what Jazz already provides** (customer management via Account)
- **Are better handled by provider dashboards** (product management, analytics)
- **Add complexity without proportional value** (SetupIntents, usage records)
- **Expand scope beyond payment orchestration** (marketplaces, multi-party, crypto)

**The goal**: Make it incredibly easy to add payments to Jazz apps, not to replace Stripe or Polar.

---

## Low Priority Features (Nice to Have)

### Customer Management API

**Purpose**: Traditional CRUD operations for customer records

**Status**: Low Priority

**Rationale**:

Jazz already provides complete identity management:

```typescript
// Jazz Account ID serves as canonical customer identity
const customerId = account.id; // e.g., "coz_123"

// Public billing info in profile
const billingInfo = {
  name: account.profile.name,
  email: account.profile.email,
  avatar: account.profile.avatar,
};

// Private payment data in root
const paymentProfiles = account.root["regarde-sdk"].paymentProfiles;
```

Payment providers create their own customer records during checkout. Regarde stores the provider customer ID reference:

```typescript
// Stored in Account.root
interface PaymentProfiles {
  stripe?: { customerId: string };
  polar?: { customerId: string };
}
```

**When to Reconsider**:

- Multi-tenant platforms managing customers on behalf of others
- Complex customer metadata requirements beyond Account.profile
- Specific use cases requiring programmatic customer operations

**Implementation Requirements**:

- `customers.create()` - Create in provider, store ID in Account.root
- `customers.retrieve()` - Get from provider API
- `customers.update()` - Sync between provider and Account.profile
- `customers.list()` - Query with Jazz caching layer

---

### Usage Records / Metered Billing

**Purpose**: Track usage metrics for billing (API calls, storage, compute)

**Status**: Low Priority

**Rationale**:

Usage tracking is inherently application-specific:

- Different metrics per app (requests, storage, seats, features)
- Varying tracking logic (counters, gauges, time-based, event-based)
- Different aggregation methods (sum, max, average, latest)

Provider support varies:

- Stripe: Supports usage records via `subscriptionItems.createUsageRecord()`
- Polar: Does not support metered billing natively

Can be built on existing subscription management:

```typescript
// Track usage in application layer
const usageTracker = createUsageTracker({
  metrics: ['api_calls', 'storage_gb'],
  aggregation: 'sum',
});

// Periodically sync to Stripe
await stripe.subscriptionItems.createUsageRecord({
  subscription_item: itemId,
  quantity: usageTracker.getCurrent('api_calls'),
  timestamp: Date.now(),
});
```

**When to Reconsider**:

- Building usage-based SaaS (API services, cloud resources)
- High volume requiring automated metered billing
- Need for real-time usage visibility to customers
- Displaying "current bill this month" in-app

**Implementation Requirements**:

- `usageRecords.create()` - Report usage to provider
- `usageRecords.list()` - Retrieve usage history
- Subscription items management
- Usage tracking SDK/helpers
- Real-time aggregation in Jazz CoValues

---

### Customer Portal

**Purpose**: Self-service billing management UI for end users

**Status**: Low Priority

**Rationale**:

Providers offer mature hosted portals:

- Stripe Customer Portal: Fully featured, customizable
- Polar: Account management via native interface
- Simple redirect pattern suffices for most cases

Building custom portal is significant scope:

- Requires customer management, payment methods, invoices, subscriptions
- Needs secure authentication and session handling
- UI complexity (forms, validation, error states)
- Cross-scenario testing burden

Can leverage existing hooks:

```typescript
// Show billing history
const { invoices } = useInvoices();

// Handle cancellation
const { cancel } = useCancelSubscription();

// Redirect for payment method updates
const portalUrl = await createPortalSession(customerId);
window.location.href = portalUrl;
```

**When to Reconsider**:

- White-label experience critical (cannot show provider branding)
- Deep integration with app's design system required
- Custom portal features not offered by providers
- Unified portal across multiple providers needed

**Implementation Requirements**:

- Portal session creation (`billingPortal.sessions.create()`)
- React components for subscription management
- Payment method management UI
- Invoice history and download
- Billing information update forms
- Secure routing and authentication

---

### Dispute/Chargeback Handling

**Purpose**: Manage payment disputes and chargebacks

**Status**: Low Priority

**Rationale**:

Events can be handled via webhooks when needed:

```typescript
// Extend webhook adapter for dispute events
const disputeEvents = [
  'charge.dispute.created',
  'charge.dispute.closed',
  'charge.dispute.funds_withdrawn',
];
```

Not common for MVP:

- Low dispute rates for new products
- Dispute management typically done in provider dashboards
- Evidence collection and submission workflows are complex

Complexity vs. value:

- Requires legal/compliance knowledge
- Automated responses can backfire
- Manual process via provider dashboard often safer

**When to Reconsider**:

- High transaction volume with frequent disputes
- Automated dispute response workflows needed
- Building dashboard with dispute analytics
- Immediate alerts on disputes required

**Implementation Requirements**:

- Webhook handlers for dispute events
- `Dispute` CoMap schema
- Evidence collection API
- Submission workflows
- Dispute status tracking
- Admin notification system

---

### Advanced Reporting

**Purpose**: Financial analytics, exports, charts, business intelligence

**Status**: Low Priority

**Rationale**:

Providers offer comprehensive dashboards:

- Stripe Dashboard: Revenue, MRR, churn, cohort analysis
- Polar Dashboard: Sales, subscriptions, revenue

Can query CoMaps directly:

```typescript
// PaymentEvent CoMaps contain all transaction data
const payments = await PaymentEvent.list();

// Custom aggregations with Jazz queries
const revenueThisMonth = payments
  .filter(p => p.status === 'succeeded')
  .filter(p => isThisMonth(p.createdAt))
  .reduce((sum, p) => sum + p.amount, 0);
```

Analytics outside core scope:

- Regarde focuses on making payments work, not analyzing them
- Analytics needs vary widely by business
- Third-party tools (ChartMogul, Baremetrics) can connect to providers

**When to Reconsider**:

- Embedded analytics required in application
- Showing "revenue this month" to users
- Building admin dashboard with charts
- Custom metrics not available in provider dashboards

**Implementation Requirements**:

- Aggregation queries on PaymentEvent CoMaps
- Time-series data storage
- Chart components
- Export functionality (CSV, PDF)
- Caching layer for performance

---

## Explicitly Out of Scope

These features are **not planned** for Regarde:

### PaymentIntent (Stripe-only)

**Status**: Out of Scope

**Purpose**: Direct payment processing without hosted checkout

**Rationale**:

- **Stripe-only feature**: Polar has no equivalent, breaking unified API promise
- **Requires SDK-user's backend**: Unlike CheckoutSession which works with Regarde webhooks, PaymentIntent requires hosting a backend server
- **Complexity vs. value**: CheckoutSession covers 90% of use cases
- **Provider lock-in**: Deep integration with Stripe Elements and Stripe.js

Architecture:

```
SDK-user's React app → SDK-user's backend → Stripe API
                      ↓
                 Create PaymentIntent
                      ↓
                 Return client_secret
                      ↓
              Stripe Elements (custom form)
                      ↓
              Confirm payment inline
```

**When to Reconsider**:

- White-label payment experience (no Stripe branding)
- Mobile apps where redirects are poor UX
- Complex 3D Secure flows with custom UI
- Off-session payment collection for subscriptions

**Alternative**: Use CheckoutSession with `ui_mode: 'embedded'`

---

### Stripe Connect / Marketplace Support

**Status**: Out of Scope

**Rationale**:

- Complex multi-party payment flows
- Requires onboarding, KYC, and compliance handling
- Significantly expands scope beyond payment orchestration
- Can be built on top of Regarde if needed

---

### Multi-party Payments

**Status**: Out of Scope

**Rationale**:

- Split payments, marketplace fees, platform payouts
- Requires complex money movement orchestration
- Legal and compliance implications
- Use Stripe Connect if this is needed

---

### Cryptocurrency Support

**Status**: Out of Scope

**Rationale**:

- Outside current provider scope (Stripe, Polar)
- Would require new provider integrations
- Regulatory complexity
- Different from traditional payment orchestration

---

### Tax Calculation

**Status**: Out of Scope

**Rationale**:

- Tax laws vary by jurisdiction
- Stripe Tax and other services exist for this
- Can be integrated at checkout creation via metadata
- Not core to payment orchestration

---

### Subscription Scheduling

**Status**: Out of Scope

**Rationale**:

- Scheduling subscription starts, changes, or cancellations
- Can be built with scheduled jobs on top of existing APIs
- Not commonly needed for MVP

---

## Summary Matrix

| Feature                         | Priority | Rationale                              | Revisit Condition               |
| ------------------------------- | -------- | -------------------------------------- | ------------------------------- |
| Customer Management API         | Low      | Jazz Account provides identity         | Multi-tenant platforms          |
| Product & Price Management      | Low      | Provider dashboards sufficient         | Marketplaces, dynamic pricing   |
| Usage Records / Metered Billing | Low      | Application-specific tracking          | Usage-based SaaS                |
| Setup Intents                   | Low      | PaymentIntents covers most cases       | Wallet features, saved cards UI |
| Customer Portal                 | Low      | Provider portals exist                 | White-label requirements        |
| Dispute/Chargeback Handling     | Low      | Manual process via dashboards          | High dispute volume             |
| Advanced Reporting              | Low      | Provider dashboards + direct queries   | Embedded analytics needs        |
| LemonSqueezy Provider           | Out      | Focus on Stripe/Polar                  | Community demand                |
| Stripe Connect                  | Out      | Complex multi-party flows              | Marketplace requirements        |
| Multi-party Payments            | Out      | Money movement orchestration           | Platform/marketplace            |
| Cryptocurrency                  | Out      | Outside provider scope                 | Crypto payment demand           |
| Tax Calculation                 | Out      | Specialized services exist             | Never (use Stripe Tax)          |
| Subscription Scheduling         | Out      | Can be built on top                    | Advanced scheduling needs       |

---

## Decision Log

Future additions to this document should include:

- Date of decision
- Context and trade-offs considered
- Conditions that would trigger reconsideration
- Links to relevant discussions or issues

This ensures the rationale behind deferred features is preserved as the product evolves.
