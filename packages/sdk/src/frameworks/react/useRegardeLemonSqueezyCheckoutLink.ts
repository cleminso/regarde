import { useCallback } from "react";
import type { Loaded } from "jazz-tools";
import { useAccount, useIsAuthenticated } from "jazz-tools/react";
import { RegardeAccount } from "#schemas/regardeAccount";

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

export function useRegardeLemonSqueezyCheckoutLink(
  appId: string,
): UseRegardeLemonSqueezyCheckoutLinkResult {
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

      const baseUrl = `https://${storeDomain}/checkout/buy/${variantId}`;
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
      return queryString ? `${baseUrl}?${queryString}` : baseUrl;
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
