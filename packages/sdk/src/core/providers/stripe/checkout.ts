import type Stripe from "stripe";

import { RegardeError, REGARDE_ERROR_CODES } from "#core/errors";

import type { TCreateCheckoutParams, TCreateCheckoutResult } from "../types";

/**
 * Creates a Stripe Checkout Session with Regarde metadata embedded.
 *
 * The metadata ensures webhooks route back to the correct CheckoutSession CoMap.
 * Stripe-specific escape hatches are spread into the session creation call.
 *
 * @param apiKey - Stripe secret key (provided by SDK user, not stored by Regarde)
 * @param params - Unified checkout parameters with optional Stripe escape hatches
 * @returns Provider session ID and payment URL for redirect
 */
export async function createStripeCheckout(
  apiKey: string,
  params: TCreateCheckoutParams,
): Promise<TCreateCheckoutResult> {
  try {
    // Dynamic import to keep stripe as optional peer dependency
    const { default: StripeSDK } = await import("stripe");
    const stripe = new StripeSDK(apiKey);

    const stripeEscapeHatch = params.stripe ?? {};

    const session: Stripe.Checkout.Session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: params.currency.toLowerCase(),
            product_data: {
              name: params.productName ?? "Purchase",
            },
            unit_amount: params.amount,
            ...(params.mode === "subscription" ? { recurring: { interval: "month" } } : {}),
          },
          quantity: 1,
        },
      ],
      mode: params.mode,
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      customer_email: params.customerEmail,
      ...stripeEscapeHatch,
      metadata: {
        regarde_session_id: params.checkoutSessionId,
        regarde_app_id: params.appId,
        regarde_user_id: params.userAccountId,
        regarde_sdk_id: params.regardeSDKId,
        ...params.metadata,
        // oxlint-disable-next-line no-unsafe-type-assertion -- Provider escape hatch metadata
        ...(stripeEscapeHatch.metadata as Record<string, string> | undefined),
      },
    });

    const isUrlPresent = session.url !== null && session.url !== undefined;
    if (isUrlPresent === false) {
      throw new RegardeError(
        "Stripe returned a checkout session without a URL",
        REGARDE_ERROR_CODES.CHECKOUT_CREATE_FAILED,
        "stripe",
      );
    }

    return {
      providerSessionId: session.id,
      paymentUrl: session.url as string,
    };
  } catch (error) {
    const isRegardeError = error instanceof RegardeError;
    if (isRegardeError === true) {
      throw error;
    }

    throw new RegardeError(
      error instanceof Error ? error.message : "Failed to create Stripe checkout session",
      REGARDE_ERROR_CODES.CHECKOUT_CREATE_FAILED,
      "stripe",
      error,
    );
  }
}
