import { Loaded } from "jazz-tools";
import { RegardeSDK } from "#schemas/regardeSDK";

/**
 * Generate a Lemon Squeezy checkout URL with custom data (jazzAccountId)
 * @link https://docs.lemonsqueezy.com/help/checkout/passing-custom-data
 */

export interface LemonSqueezyCheckoutOptions {
  appId: string;
  variantId: string | number;
  storeDomain: string;
  jazzAccountId: string;
  customData?: Record<string, string | number>;
}

/**
 * Generate a Lemon Squeezy checkout URL with jazzAccountId embedded in custom data
 *
 * @param options - Checkout configuration options
 * @param options.appId - Your Regarde app ID to track payments for this specific app
 * @param options.variantId - Lemon Squeezy product variant ID
 * @param options.storeDomain - Lemon Squeezy store domain (e.g., "my-store.lemonsqueezy.com")
 * @param options.jazzAccountId - User's Jazz account ID to link payment with their account
 * @param options.customData - Additional custom data to pass to checkout
 *
 * @returns Full checkout URL with jazzAccountId embedded
 *
 * @example Basic usage
 * ```typescript
 * const checkoutUrl = generateLemonSqueezyCheckoutUrl({
 *   appId: "co_abc123",
 *   variantId: 12345,
 *   storeDomain: "my-store.lemonsqueezy.com",
 *   jazzAccountId: account.$jazz.id, // RegardeAccount ID
 * });
 * // Result: https://my-store.lemonsqueezy.com/checkout/buy/12345?checkout[custom][user_id]=co_abc123
 * ```
 *
 * @example With additional custom data
 * ```typescript
 * const checkoutUrl = generateLemonSqueezyCheckoutUrl({
 *   appId: "co_abc123",
 *   variantId: 12345,
 *   storeDomain: "my-store.lemonsqueezy.com",
 *   jazzAccountId: "co_xyz789",
 *   customData: {
 *     campaign_id: "summer_2024",
 *     plan_type: "premium",
 *   },
 * });
 * ```
 */
export const generateLemonSqueezyCheckoutUrl = (
  options: LemonSqueezyCheckoutOptions,
): string => {
  const { variantId, storeDomain, jazzAccountId, customData } = options;

  const baseUrl = `https://${storeDomain}/checkout/buy/${variantId}`;
  const searchParams = new URLSearchParams();

  const defaultCustomData: Record<string, string> = {
    user_id: jazzAccountId,
  };

  const allCustomData = {
    ...defaultCustomData,
    ...customData,
  };

  Object.entries(allCustomData).forEach(([key, value]) => {
    searchParams.append(`checkout[custom][${key}]`, String(value));
  });

  const queryString = searchParams.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
};

/**
 * Generate Lemon Squeezy checkout URLs for multiple variants
 * Useful for product pages with multiple pricing tiers
 */
export const generateLemonSqueezyCheckoutUrls = (
  configs: Array<
    Omit<LemonSqueezyCheckoutOptions, "variantId"> & {
      variantId: string | number;
    }
  >,
): Record<string, string> => {
  const urls: Record<string, string> = {};

  configs.forEach((config) => {
    const variantId = String(config.variantId);
    urls[variantId] = generateLemonSqueezyCheckoutUrl(config);
  });

  return urls;
};

/**
 * Helper function to get jazzAccountId from loaded RegardeSDK
 */
export const getRegardeSDKId = (
  regardeSDK: Loaded<typeof RegardeSDK> | null,
): string | null => {
  const regardeSDKValid = regardeSDK !== null && regardeSDK.$isLoaded === true;
  if (regardeSDKValid === false) {
    return null;
  }

  return regardeSDK.$jazz.id;
};

/**
 * Generate checkout URL directly from loaded RegardeSDK
 *
 * @example Typical React usage
 * ```typescript
 * const checkoutUrl = useMemo(() => {
 *   return generateLemonSqueezyCheckoutUrlFromAccount(regardeSDK, {
 *     variantId: 12345,
 *     storeDomain: "my-store.lemonsqueezy.com",
 *   });
 * }, [regardeSDK]);
 * ```
 */
export const generateLemonSqueezyCheckoutUrlFromAccount = (
  regardeSDK: Loaded<typeof RegardeSDK>,
  options: Omit<LemonSqueezyCheckoutOptions, "jazzAccountId">,
): string => {
  const regardeSDKId = regardeSDK.$jazz.id;

  return generateLemonSqueezyCheckoutUrl({
    ...options,
    jazzAccountId: regardeSDKId,
    customData: {
      ...options.customData,
      regarde_sdk_id: regardeSDKId,
    },
  });
};

/**
 * Validate that required checkout URL parameters are present
 */
export const validateLemonSqueezyCheckoutOptions = (
  options: LemonSqueezyCheckoutOptions,
): { valid: boolean; error?: string } => {
  if (!options.variantId) {
    return { valid: false, error: "variantId is required" };
  }

  if (!options.storeDomain) {
    return { valid: false, error: "storeDomain is required" };
  }

  if (!options.jazzAccountId) {
    return { valid: false, error: "jazzAccountId is required" };
  }

  if (!options.storeDomain.includes("lemonsqueezy.com")) {
    return { valid: false, error: "Invalid storeDomain format" };
  }

  return { valid: true };
};
