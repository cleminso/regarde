import { useAccount, useIsAuthenticated } from "jazz-tools/react";
import { useCallback } from "react";

import { useLogging } from "#core/logger";
import { RegardeAccount } from "#schemas/regardeAccount";

const logger = useLogging({
  module: __filename,
});

/**
 * Options for generating checkout link.
 */
export interface RegardeLemonSqueezyCheckoutLinkOptions {
  /** LemonSqueezy product variant ID */
  variantId: string | number;
  /** Store domain (overrides storeName) */
  storeDomain: string;
  /** Custom data to pass to checkout */
  customData?: Record<string, string | number>;
}

/**
 * Checkout link generator result.
 */
export interface UseRegardeLemonSqueezyCheckoutLinkResult {
  /** Generate checkout URL with user and app identifiers */
  generateLemonSqueezyCheckoutLink: (options: RegardeLemonSqueezyCheckoutLinkOptions) => string;
  /** Whether RegardeAccount is loading */
  isLoading: boolean;
  /** Error message if RegardeSDK not loaded, null otherwise */
  error: string | null;
}

/**
 * React hook for generating LemonSqueezy checkout links.
 *
 * Generates checkout URLs with Regarde app and user identifiers embedded
 * in custom data fields. App ID is required for webhook routing.
 *
 * @param appId - Regarde App ID used for webhook routing
 * @param storeName - Store name (e.g., "my-store")
 * @param storeDomain - Full store domain (e.g., "https://my-store.lemonsqueezy.com")
 * @returns Checkout link generator with loading and error states
 * @throws {Error} When neither storeName nor storeDomain is provided
 * @throws {Error} When storeDomain format is invalid
 *
 * @example
 * ```tsx
 * function CheckoutPage() {
 *   const { generateLemonSqueezyCheckoutLink, isLoading, error } =
 *     useRegardeLemonSqueezyCheckoutLink("co_app123", "my-store");
 *
 *   const handleCheckout = () => {
 *     const url = generateLemonSqueezyCheckoutLink({
 *       variantId: 12345,
 *       storeDomain: "https://my-store.lemonsqueezy.com",
 *       customData: { plan: "pro" }
 *     });
 *     window.location.href = url;
 *   };
 *
 *   if (error) return <div>Error: {error}</div>;
 *   if (isLoading) return <div>Loading...</div>;
 *
 *   return <button onClick={handleCheckout}>Subscribe</button>;
 * }
 * ```
 */
export function useRegardeLemonSqueezyCheckoutLink(
  /** JAZZ Regarde AppIp */
  appId: string,
  /** Your Store NAME (see the list here: https://app.lemonsqueezy.com/settings/stores) */
  storeName?: string,
  /** You Store DOMAIN (e.g. https://my-store.lemonsqueezy.com), find it here: https://app.lemonsqueezy.com/settings/stores */
  storeDomain?: string,
): UseRegardeLemonSqueezyCheckoutLinkResult {
  if (!storeDomain && !storeName)
    throw new Error(
      "Store information missing. You must pass either the storeName or the storeDomain",
    );

  if (storeDomain && storeDomain.match(/^.*\.lemonsqueezy.com$/))
    throw new Error(
      `The store domain appears invalid: ${storeDomain}, make sure it contains a valid domain name. See your list of stores here: https://app.lemonsqueezy.com/settings/stores`,
    );

  const isAuthenticated = useIsAuthenticated();
  const account = useAccount(
    RegardeAccount,
    isAuthenticated
      ? {
          resolve: {
            root: {
              "regarde-sdk": true,
            },
          },
        }
      : {},
  );

  const generateLemonSqueezyCheckoutLink = useCallback(
    (options: RegardeLemonSqueezyCheckoutLinkOptions): string => {
      const { variantId, storeDomain, customData } = options;

      const isAccountValid = account !== null && account.$isLoaded === true;
      if (isAccountValid === false) {
        logger.error({
          message: "Account must be loaded",
          data: {
            account,
          },
        });
        throw new Error("Account must be loaded");
      }

      const jazzAccountId = account.$jazz.id;
      const root = account.root;
      const rootLoaded = root !== null && root.$isLoaded === true;
      if (rootLoaded === false) {
        throw new Error(
          "RegardeAccount root must be loaded. Load with resolve: { root: { ['regarde-sdk']: true } }",
        );
      }

      const regardeSdk = root["regarde-sdk"];

      const isRegardeSdkValid = regardeSdk !== null && regardeSdk.$isLoaded === true;
      if (isRegardeSdkValid === false) {
        logger.error({
          message: "RegardeSDK must be loaded",
          data: {
            regardeSdk,
          },
        });
        throw new Error("RegardeSDK must be loaded");
      }

      const regardeSdkId = regardeSdk.$jazz.id;

      const effectiveStoreDomain = storeDomain || `${storeName}.lemonsqueezy.com`;
      const baseUrl = `https://${effectiveStoreDomain}/checkout/buy/${variantId}`;
      const searchParams = new URLSearchParams();

      const allCustomData: Record<string, string> = {
        app_id: appId,
        user_id: jazzAccountId,
        regarde_sdk_id: regardeSdkId,
        ...customData,
      };

      Object.entries(allCustomData).forEach(([key, value]) => {
        searchParams.append(`checkout[custom][${key}]`, String(value));
      });

      const queryString = searchParams.toString();
      const checkoutUrl = queryString ? `${baseUrl}?${queryString}` : baseUrl;

      logger.info({
        message: "Generated Lemon Squeezy checkout link",
        data: {
          metadata: {
            operation: "generate-checkout-link",
          },
          appId,
          variantId,
          effectiveStoreDomain,
          jazzAccountId,
          regardeSdkId,
        },
      });

      return checkoutUrl;
    },
    [account, appId, storeName, storeDomain],
  );

  const isLoading = isAuthenticated === true && (account === undefined || !account.$isLoaded);

  const error =
    isAuthenticated === true && isLoading === false && account.$isLoaded === true
      ? account.root.$isLoaded === true &&
        account.root.$jazz.has("regarde-sdk") === true &&
        account.root["regarde-sdk"]?.$isLoaded === true
        ? null
        : "RegardeSDK not loaded"
      : null;

  return {
    generateLemonSqueezyCheckoutLink,
    isLoading,
    error,
  };
}
