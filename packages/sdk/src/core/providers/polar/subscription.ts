import { RegardeError, REGARDE_ERROR_CODES } from "#core/errors";

/**
 * Parameters for creating a Polar subscription.
 *
 * Note: Polar creates subscriptions via checkout sessions, not direct API calls.
 * This function creates a checkout session configured for subscription mode.
 */
export interface TCreatePolarSubscriptionParams {
  productId: string;
  customerEmail?: string;
  metadata?: Record<string, string>;
  polar?: Record<string, unknown>;
}

/**
 * Result from creating a Polar subscription.
 *
 * Returns a checkout URL that the user must visit to complete the subscription.
 */
export interface TCreatePolarSubscriptionResult {
  providerCheckoutId: string;
  paymentUrl: string;
  status: "pending";
}

/**
 * Creates a Polar subscription via checkout session.
 *
 * Polar does not support direct subscription creation like Stripe.
 * Instead, this creates a checkout session in subscription mode.
 * The user must complete the checkout to activate the subscription.
 *
 * @param accessToken - Polar access token
 * @param params - Subscription creation parameters
 * @returns Checkout session ID and payment URL
 */
export async function createPolarSubscription(
  accessToken: string,
  params: TCreatePolarSubscriptionParams,
): Promise<TCreatePolarSubscriptionResult> {
  try {
    const { Polar } = await import("@polar-sh/sdk");
    const polar = new Polar({ accessToken });

    const checkout = await polar.checkouts.create({
      products: [params.productId],
      customerEmail: params.customerEmail,
      ...params.polar,
      metadata: {
        ...params.metadata,
        // oxlint-disable-next-line no-unsafe-type-assertion -- Provider escape hatch metadata
        ...(params.polar?.metadata as Record<string, string> | undefined),
      },
    });

    const isUrlPresent = checkout.url !== null && checkout.url !== undefined;
    if (isUrlPresent === false) {
      throw new RegardeError(
        "Polar returned a checkout without a URL",
        REGARDE_ERROR_CODES.SUBSCRIPTION_CREATE_FAILED,
        "polar",
      );
    }

    return {
      providerCheckoutId: checkout.id,
      paymentUrl: checkout.url,
      status: "pending",
    };
  } catch (error) {
    throw new RegardeError(
      error instanceof Error ? error.message : "Failed to create Polar subscription checkout",
      REGARDE_ERROR_CODES.SUBSCRIPTION_CREATE_FAILED,
      "polar",
      error,
    );
  }
}

/**
 * Valid update operations for Polar subscriptions.
 * Polar's API uses discriminated unions - each operation has specific fields.
 */
export type TPolarSubscriptionUpdate =
  | { productId: string }
  | { cancelAtPeriodEnd: boolean }
  | { revoke: true };

/**
 * Parameters for updating a Polar subscription.
 *
 * Note: Polar does NOT support metadata updates on subscriptions. Metadata can only
 * be set during checkout creation or product updates. Use the productId field to
 * change the subscription's product/plan.
 */
export interface TUpdatePolarSubscriptionParams {
  /** Change the subscription to a different product/plan */
  productId?: string;
  /**
   * Additional Polar-specific options.
   * Note: Cannot include 'metadata' - Polar's subscription update API doesn't support it.
   */
  polar?: Omit<Record<string, unknown>, "metadata">;
}

/**
 * Updates a Polar subscription.
 *
 * Supports changing the product/plan. Note: metadata updates are not supported
 * by Polar's subscription update API. Metadata can only be set during checkout
 * creation or product updates.
 *
 * @param accessToken - Polar access token
 * @param providerSubscriptionId - The Polar subscription ID
 * @param params - Update parameters
 * @throws {RegardeError} When metadata is provided in params.polar (not supported)
 */
export async function updatePolarSubscription(
  accessToken: string,
  providerSubscriptionId: string,
  params: TUpdatePolarSubscriptionParams,
): Promise<void> {
  try {
    // Validate: metadata is not supported in subscription updates
    const polarParams = params.polar ?? {};
    const hasMetadata = "metadata" in polarParams;
    if (hasMetadata === true) {
      throw new RegardeError(
        "Polar does not support metadata in subscription updates. Metadata can only be set during checkout creation or product updates.",
        REGARDE_ERROR_CODES.PROVIDER_VALIDATION_FAILED,
        "polar",
      );
    }

    const { Polar } = await import("@polar-sh/sdk");
    const polar = new Polar({ accessToken });

    // Build subscription update - note: metadata is NOT supported in SubscriptionUpdate
    // It can only be set during product updates (SubscriptionUpdateProduct)
    // Use type assertion to satisfy the SDK's discriminated union type
    // oxlint-disable-next-line no-unsafe-type-assertion
    const subscriptionUpdate = {
      ...(params.productId !== undefined ? { productId: params.productId } : {}),
      ...polarParams,
    } as TPolarSubscriptionUpdate;

    await polar.subscriptions.update({
      id: providerSubscriptionId,
      subscriptionUpdate,
    });
  } catch (error) {
    const isRegardeError = error instanceof RegardeError;
    if (isRegardeError === true) {
      throw error;
    }

    throw new RegardeError(
      error instanceof Error ? error.message : "Failed to update Polar subscription",
      REGARDE_ERROR_CODES.SUBSCRIPTION_UPDATE_FAILED,
      "polar",
      error,
    );
  }
}

/**
 * Pauses a Polar subscription.
 *
 * Polar does not natively support pause - this cancels at period end
 * as the closest equivalent. The SDK user should be informed of this.
 *
 * @param accessToken - The Polar API access token
 * @param providerSubscriptionId - The Polar subscription ID
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
      error instanceof Error ? error.message : "Failed to pause Polar subscription",
      REGARDE_ERROR_CODES.SUBSCRIPTION_PAUSE_FAILED,
      "polar",
      error,
    );
  }
}

/**
 * Cancels a Polar subscription immediately.
 *
 * Polar uses `revoke()` for immediate cancellation (not `cancel()`).
 * This immediately ends the subscription and stops billing.
 *
 * @param accessToken - The Polar API access token
 * @param providerSubscriptionId - The Polar subscription ID
 * @param _cancelAtPeriodEnd - Not used for Polar (always cancels immediately via revoke API).
 */
export async function cancelPolarSubscription(
  accessToken: string,
  providerSubscriptionId: string,
  _cancelAtPeriodEnd: boolean = true,
): Promise<void> {
  try {
    const { Polar } = await import("@polar-sh/sdk");
    const polar = new Polar({ accessToken });

    await polar.subscriptions.revoke({ id: providerSubscriptionId });
  } catch (error) {
    throw new RegardeError(
      error instanceof Error ? error.message : "Failed to cancel Polar subscription",
      REGARDE_ERROR_CODES.SUBSCRIPTION_CANCEL_FAILED,
      "polar",
      error,
    );
  }
}
