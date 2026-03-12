import { RegardeError, REGARDE_ERROR_CODES } from "#core/errors";

import type { TCreateCheckoutParams, TCreateCheckoutResult } from "../types";

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

    const polarEscapeHatch = params.polar ?? {};
    const products = polarEscapeHatch.products as string[] | undefined;

    const hasProducts =
      products !== null && products !== undefined && Array.isArray(products) && products.length > 0;
    if (hasProducts === false) {
      throw new RegardeError(
        "Polar checkout requires 'products' array (pass via polar.products escape hatch)",
        REGARDE_ERROR_CODES.MISSING_REQUIRED_FIELD,
        "polar",
      );
    }

    const checkout = await polar.checkouts.create({
      products,
      successUrl: params.successUrl,
      customerEmail: params.customerEmail,
      ...polarEscapeHatch,
      metadata: {
        regarde_session_id: params.checkoutSessionId,
        regarde_app_id: params.appId,
        regarde_user_id: params.userAccountId,
        regarde_sdk_id: params.regardeSDKId,
        ...params.metadata,
        // oxlint-disable-next-line no-unsafe-type-assertion -- Provider escape hatch metadata
        ...(polarEscapeHatch.metadata as Record<string, string> | undefined),
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
      paymentUrl: checkout.url,
    };
  } catch (error) {
    const isRegardeError = error instanceof RegardeError;
    if (isRegardeError === true) {
      throw error;
    }

    throw new RegardeError(
      error instanceof Error ? error.message : "Failed to create Polar checkout",
      REGARDE_ERROR_CODES.CHECKOUT_CREATE_FAILED,
      "polar",
      error,
    );
  }
}
