import { RegardeError, REGARDE_ERROR_CODES } from "#core/errors";

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
