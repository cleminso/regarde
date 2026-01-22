import { useCallback } from "react";
import { useAccount, useIsAuthenticated } from "jazz-tools/react";
import { RegardeAccount } from "#schemas/regardeAccount";
import { useLogging } from "#core/logger";

const logger = useLogging({
  module: __filename,
});

export interface RegardeLemonSqueezyCheckoutLinkOptions {
  variantId: string | number;
  storeDomain: string;
  customData?: Record<string, string | number>;
}

export interface UseRegardeLemonSqueezyCheckoutLinkResult {
  generateLemonSqueezyCheckoutLink: (
    options: RegardeLemonSqueezyCheckoutLinkOptions,
  ) => string;
  isLoading: boolean;
  error: string | null;
}

/**
 * You must pass either the storeName or the storeDomain
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

      const accountValid = account !== null && account.$isLoaded === true;
      if (accountValid === false) {
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

      const regardeSdkValid =
        regardeSdk !== null && regardeSdk.$isLoaded === true;
      if (regardeSdkValid === false) {
        throw new Error("RegardeSDK must be loaded");
      }

      const regardeSdkId = regardeSdk.$jazz.id;

      const effectiveStoreDomain =
        storeDomain || `${storeName}.lemonsqueezy.com`;
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
    [account, appId],
  );

  const isLoading =
    isAuthenticated === true && (account === undefined || !account.$isLoaded);

  const error =
    isAuthenticated === true &&
    isLoading === false &&
    account.$isLoaded === true
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
