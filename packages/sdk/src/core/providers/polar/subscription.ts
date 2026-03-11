import { RegardeError, REGARDE_ERROR_CODES } from "#core/errors";

/**
 * Pauses a Polar subscription.
 *
 * Polar does not natively support pause - this cancels at period end
 * as the closest equivalent. The SDK user should be informed of this.
 */
export async function pausePolarSubscription(
  accessToken: string,
  providerSubscriptionId: string,
): Promise<void> {
  try {
    const { Polar } = await import("@polar-sh/sdk");
    const polar = new Polar({ accessToken });

    await polar.subscriptions.update({
      id: providerSubscriptionId,
      subscriptionUpdate: {
        cancelAtPeriodEnd: true,
      },
    });
  } catch (error) {
    throw new RegardeError(
      error instanceof Error
        ? error.message
        : "Failed to pause Polar subscription",
      REGARDE_ERROR_CODES.SUBSCRIPTION_PAUSE_FAILED,
      "polar",
      error,
    );
  }
}

/**
 * Cancels a Polar subscription.
 *
 * @param cancelAtPeriodEnd - Not used for Polar (always cancels via API).
 */
export async function cancelPolarSubscription(
  accessToken: string,
  providerSubscriptionId: string,
  _cancelAtPeriodEnd: boolean = true,
): Promise<void> {
  try {
    const { Polar } = await import("@polar-sh/sdk");
    const polar = new Polar({ accessToken });

    await polar.subscriptions.cancel({ id: providerSubscriptionId });
  } catch (error) {
    throw new RegardeError(
      error instanceof Error
        ? error.message
        : "Failed to cancel Polar subscription",
      REGARDE_ERROR_CODES.SUBSCRIPTION_CANCEL_FAILED,
      "polar",
      error,
    );
  }
}

// TODO: verify that Polar use Cancel or Revoke
