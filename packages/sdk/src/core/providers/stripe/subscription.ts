import type Stripe from "stripe";

import { RegardeError, REGARDE_ERROR_CODES } from "#core/errors";

/**
 * Parameters for creating a Stripe subscription.
 */
export interface TCreateStripeSubscriptionParams {
  priceId: string;
  customerId?: string;
  customerEmail?: string;
  trialDays?: number;
  metadata?: Record<string, string>;
  stripe?: Record<string, unknown>;
}

/**
 * Result from creating a Stripe subscription.
 */
export interface TCreateStripeSubscriptionResult {
  providerSubscriptionId: string;
  paymentUrl?: string;
  clientSecret?: string;
  status: string;
}

/**
 * Creates a Stripe subscription.
 *
 * Creates a subscription and returns the subscription ID. If no customer exists,
 * one will be created from the email. If a payment is required, a checkout URL
 * or client secret may be returned.
 *
 * @param apiKey - Stripe secret key (provided by SDK user, not stored by Regarde)
 * @param params - Subscription creation parameters
 * @returns Provider subscription ID and optional payment details
 */
export async function createStripeSubscription(
  apiKey: string,
  params: TCreateStripeSubscriptionParams,
): Promise<TCreateStripeSubscriptionResult> {
  try {
    const { default: StripeSDK } = await import("stripe");
    const stripe = new StripeSDK(apiKey);

    let customerId = params.customerId;

    // Create customer if email provided and no customer ID
    if (customerId === undefined && params.customerEmail !== undefined) {
      const customer = await stripe.customers.create({
        email: params.customerEmail,
        metadata: {
          ...params.metadata,
        },
      });
      customerId = customer.id;
    }

    const subscription = await stripe.subscriptions.create({
      customer: customerId!,
      items: [{ price: params.priceId }],
      ...(params.trialDays !== undefined
        ? {
            trial_period_days: params.trialDays,
            trial_settings: {
              end_behavior: {
                missing_payment_method: "pause",
              },
            },
          }
        : {}),
      ...params.stripe,
      metadata: {
        ...params.metadata,
        // oxlint-disable-next-line no-unsafe-type-assertion
        ...(params.stripe?.metadata as Record<string, string> | undefined),
      },
    });

    return {
      providerSubscriptionId: subscription.id,
      status: subscription.status,
    };
  } catch (error) {
    throw new RegardeError(
      error instanceof Error ? error.message : "Failed to create Stripe subscription",
      REGARDE_ERROR_CODES.SUBSCRIPTION_CREATE_FAILED,
      "stripe",
      error,
    );
  }
}

/**
 * Parameters for updating a Stripe subscription.
 */
export interface TUpdateStripeSubscriptionParams {
  priceId?: string;
  quantity?: number;
  metadata?: Record<string, string>;
  stripe?: Record<string, unknown>;
}

/**
 * Updates a Stripe subscription.
 *
 * Supports changing the price/plan, quantity, or metadata.
 *
 * @param apiKey - Stripe secret key
 * @param providerSubscriptionId - The Stripe subscription ID
 * @param params - Update parameters
 */
export async function updateStripeSubscription(
  apiKey: string,
  providerSubscriptionId: string,
  params: TUpdateStripeSubscriptionParams,
): Promise<void> {
  try {
    const { default: StripeSDK } = await import("stripe");
    const stripe = new StripeSDK(apiKey);

    const updateParams: Stripe.SubscriptionUpdateParams = {
      ...params.stripe,
      metadata: {
        ...params.metadata,
        // oxlint-disable-next-line no-unsafe-type-assertion
        ...(params.stripe?.metadata as Record<string, string> | undefined),
      },
    };

    // Update price if provided
    if (params.priceId !== undefined) {
      const subscription = await stripe.subscriptions.retrieve(providerSubscriptionId);
      const itemId = subscription.items.data[0]?.id;
      if (itemId !== undefined) {
        await stripe.subscriptionItems.update(itemId, {
          price: params.priceId,
          ...(params.quantity !== undefined ? { quantity: params.quantity } : {}),
        });
      }
    } else if (params.quantity !== undefined) {
      // Just update quantity
      const subscription = await stripe.subscriptions.retrieve(providerSubscriptionId);
      const itemId = subscription.items.data[0]?.id;
      if (itemId !== undefined) {
        await stripe.subscriptionItems.update(itemId, {
          quantity: params.quantity,
        });
      }
    }

    // Update subscription metadata
    await stripe.subscriptions.update(providerSubscriptionId, updateParams);
  } catch (error) {
    throw new RegardeError(
      error instanceof Error ? error.message : "Failed to update Stripe subscription",
      REGARDE_ERROR_CODES.SUBSCRIPTION_UPDATE_FAILED,
      "stripe",
      error,
    );
  }
}

/**
 * Pauses a Stripe subscription.
 *
 * Uses Stripe's pause_collection feature to temporarily halt billing.
 *
 * @param apiKey - The Stripe API key
 * @param providerSubscriptionId - The Stripe subscription ID
 */
export async function pauseStripeSubscription(
  apiKey: string,
  providerSubscriptionId: string,
): Promise<void> {
  try {
    const { default: StripeSDK } = await import("stripe");
    const stripe = new StripeSDK(apiKey);

    await stripe.subscriptions.update(providerSubscriptionId, {
      pause_collection: { behavior: "void" },
    });
  } catch (error) {
    throw new RegardeError(
      error instanceof Error ? error.message : "Failed to pause Stripe subscription",
      REGARDE_ERROR_CODES.SUBSCRIPTION_PAUSE_FAILED,
      "stripe",
      error,
    );
  }
}

/**
 * Resumes a paused Stripe subscription.
 *
 * Clears the pause_collection flag to resume billing.
 *
 * @param apiKey - The Stripe API key
 * @param providerSubscriptionId - The Stripe subscription ID
 */
export async function resumeStripeSubscription(
  apiKey: string,
  providerSubscriptionId: string,
): Promise<void> {
  try {
    const { default: StripeSDK } = await import("stripe");
    const stripe = new StripeSDK(apiKey);

    await stripe.subscriptions.update(providerSubscriptionId, {
      // Stripe types expect undefined but API accepts null
      // oxlint-disable-next-line no-unsafe-type-assertion
      pause_collection: null as unknown as undefined,
    });
  } catch (error) {
    throw new RegardeError(
      error instanceof Error ? error.message : "Failed to resume Stripe subscription",
      REGARDE_ERROR_CODES.SUBSCRIPTION_RESUME_FAILED,
      "stripe",
      error,
    );
  }
}

/**
 * Cancels a Stripe subscription.
 *
 * @param apiKey - The Stripe API key
 * @param providerSubscriptionId - The Stripe subscription ID
 * @param cancelAtPeriodEnd - If true, cancels at end of current billing period.
 *                            If false, cancels immediately (default: true).
 */
export async function cancelStripeSubscription(
  apiKey: string,
  providerSubscriptionId: string,
  cancelAtPeriodEnd: boolean = true,
): Promise<void> {
  try {
    const { default: StripeSDK } = await import("stripe");
    const stripe = new StripeSDK(apiKey);

    if (cancelAtPeriodEnd === true) {
      await stripe.subscriptions.update(providerSubscriptionId, {
        cancel_at_period_end: true,
      });
    } else {
      await stripe.subscriptions.cancel(providerSubscriptionId);
    }
  } catch (error) {
    throw new RegardeError(
      error instanceof Error ? error.message : "Failed to cancel Stripe subscription",
      REGARDE_ERROR_CODES.SUBSCRIPTION_CANCEL_FAILED,
      "stripe",
      error,
    );
  }
}
