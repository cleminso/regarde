import { RegardeError, REGARDE_ERROR_CODES } from "#core/errors";

import type {
  TCreateCheckoutParams,
  TCreateCheckoutResult,
} from "../types";

/**
 * Creates a Polar checkout session with Regarde metadata embedded.
 *
 * Uses the Polar SDK (@polar-sh/sdk) to create a checkout.
 * Metadata is passed via the checkout metadata field for webhook routing.
 *
 * @param accessToken - Polar access token (provided by SDK user)
 * @param params - Unified checkout parameters with optional Polar escape hatches
 * @returns Provider session ID and payment URL for redirect
 */
export async function createPolarCheckout(
  accessToken: string,
  params: TCreateCheckoutParams,
): Promise<TCreateCheckoutResult> {
  try {
    const { Polar } = await import("@polar-sh/sdk");
    const polar = new Polar({ accessToken });

    const polarEscapeHatch = (params.polar ?? {}) as Record<string, unknown>;

    const checkout = await polar.checkouts.create({
      productPriceId: polarEscapeHatch.productPriceId as string | undefined,
      successUrl: params.successUrl,
      customerEmail: params.customerEmail,
      ...polarEscapeHatch,
      metadata: {
        regarde_session_id: params.checkoutSessionId,
        regarde_app_id: params.appId,
        regarde_user_id: params.userAccountId,
        regarde_sdk_id: params.regardeSDKId,
        ...params.metadata,
        ...(polarEscapeHatch.metadata as
          | Record<string, string>
          | undefined),
      },
    });

    const isUrlPresent = checkout.url !== null && checkout.url !== undefined;
    if (isUrlPresent === false) {
      throw new RegardeError(
        "Polar returned a checkout without a URL",
        REGARDE_ERROR_CODES.CHECKOUT_CREATE_FAILED,
        "polar",
      );
    }

    return {
      providerSessionId: checkout.id,
      paymentUrl: checkout.url as string,
    };
  } catch (error) {
    const isRegardeError = error instanceof RegardeError;
    if (isRegardeError === true) {
      throw error;
    }

    throw new RegardeError(
      error instanceof Error
        ? error.message
        : "Failed to create Polar checkout",
      REGARDE_ERROR_CODES.CHECKOUT_CREATE_FAILED,
      "polar",
      error,
    );
  }
}
