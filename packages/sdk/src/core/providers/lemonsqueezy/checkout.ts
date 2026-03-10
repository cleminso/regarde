import { RegardeError, REGARDE_ERROR_CODES } from "#core/errors";

import type {
  TCreateCheckoutParams,
  TCreateCheckoutResult,
  TRegardeMetadata,
} from "../types";

/**
 * Creates a LemonSqueezy checkout URL with Regarde metadata embedded.
 *
 * LemonSqueezy checkout URLs are constructed client-side using the store
 * domain and variant ID. Regarde metadata is embedded as custom data
 * query parameters for webhook routing.
 *
 * Unlike Stripe/Polar which use server-side API calls, LemonSqueezy
 * checkouts are URL-based. The API key is used for subscription actions,
 * not checkout creation.
 *
 * @param _apiKey - LemonSqueezy API key (used for subscription actions, not checkout)
 * @param params - Unified checkout parameters with LemonSqueezy escape hatches
 * @returns Provider session ID and payment URL for redirect
 */
export const createLemonSqueezyCheckout = async (
  _apiKey: string,
  params: TCreateCheckoutParams,
): Promise<TCreateCheckoutResult> => {
  const lsEscapeHatch = (params.lemonsqueezy ?? {}) as Record<string, unknown>;

  const storeDomain = lsEscapeHatch.storeDomain as string | undefined;
  const variantId = lsEscapeHatch.variantId as string | number | undefined;

  const hasStoreDomain =
    storeDomain !== undefined && storeDomain !== null && storeDomain !== "";
  if (hasStoreDomain === false) {
    throw new RegardeError(
      "LemonSqueezy checkout requires lemonsqueezy.storeDomain in escape hatch (e.g. 'my-store.lemonsqueezy.com')",
      REGARDE_ERROR_CODES.MISSING_REQUIRED_FIELD,
      "lemonsqueezy",
    );
  }

  const hasVariantId =
    variantId !== undefined && variantId !== null && variantId !== "";
  if (hasVariantId === false) {
    throw new RegardeError(
      "LemonSqueezy checkout requires lemonsqueezy.variantId in escape hatch",
      REGARDE_ERROR_CODES.MISSING_REQUIRED_FIELD,
      "lemonsqueezy",
    );
  }

  const regardeMetadata: TRegardeMetadata = {
    regarde_app_id: params.appId,
    regarde_user_id: params.userAccountId,
    regarde_sdk_id: params.regardeSDKId,
    regarde_session_id: params.checkoutSessionId,
  };

  const baseUrl = `https://${storeDomain}/checkout/buy/${variantId}`;
  const searchParams = new URLSearchParams();

  const allCustomData: Record<string, string> = {
    ...regardeMetadata,
    ...params.metadata,
  };

  for (const [key, value] of Object.entries(allCustomData)) {
    searchParams.append(`checkout[custom][${key}]`, String(value));
  }

  if (params.customerEmail !== undefined) {
    searchParams.append("checkout[email]", params.customerEmail);
  }

  const queryString = searchParams.toString();
  const paymentUrl =
    queryString !== "" ? `${baseUrl}?${queryString}` : baseUrl;

  const sessionId = `ls_checkout_${params.checkoutSessionId}`;

  return {
    providerSessionId: sessionId,
    paymentUrl,
  };
};
