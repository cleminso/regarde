import { useAccount, useIsAuthenticated } from "jazz-tools/react";
import { useCallback } from "react";

import { RegardeError, REGARDE_ERROR_CODES } from "#core/errors";
import { createPolarCheckout } from "#core/providers/polar/checkout";
import type { TCreateCheckoutParams } from "#core/providers/types";
import { RegardeAccount } from "#schemas/regardeAccount";
import type { TRegardeApp } from "#schemas/regardeUserApp";

export interface TRegardePolarCheckoutLinkOptions {
  productPriceId?: string;
  productId?: string;
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string;
  metadata?: Record<string, string>;
  polar?: Record<string, unknown>;
}

export interface TUseRegardePolarCheckoutLinkResult {
  generatePolarCheckoutLink: (
    accessToken: string,
    options: TRegardePolarCheckoutLinkOptions,
  ) => Promise<string>;
  isLoading: boolean;
  error: RegardeError | null;
}

/**
 * React hook for generating Polar checkout links with Regarde metadata.
 *
 * @param app - The RegardeApp for metadata embedding
 * @returns Checkout link generator with loading state
 */
export function useRegardePolarCheckoutLink(
  app: TRegardeApp,
): TUseRegardePolarCheckoutLinkResult {
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

  const generatePolarCheckoutLink = useCallback(
    async (
      accessToken: string,
      options: TRegardePolarCheckoutLinkOptions,
    ): Promise<string> => {
      const isAccountLoaded =
        account !== null && account !== undefined && account.$isLoaded === true;
      if (isAccountLoaded === false) {
        throw new RegardeError(
          "Account must be loaded",
          REGARDE_ERROR_CODES.ACCOUNT_NOT_LOADED,
        );
      }

      const isAppLoaded = app !== null && app !== undefined && app.$isLoaded === true;
      if (isAppLoaded === false) {
        throw new RegardeError("App must be loaded", REGARDE_ERROR_CODES.COMAP_NOT_FOUND);
      }

      const regardeSdk = account.root["regarde-sdk"];
      const isSdkLoaded =
        regardeSdk !== null &&
        regardeSdk !== undefined &&
        regardeSdk.$isLoaded === true;
      if (isSdkLoaded === false) {
        throw new RegardeError(
          "RegardeSDK must be initialized",
          REGARDE_ERROR_CODES.SDK_NOT_INITIALIZED,
        );
      }

      const tempSessionId = `temp_${Date.now()}`;

      const params: TCreateCheckoutParams = {
        provider: "polar",
        amount: 0, // Polar uses productPriceId
        currency: "USD",
        mode: "payment",
        appId: app.$jazz.id,
        userAccountId: account.$jazz.id,
        regardeSDKId: regardeSdk.$jazz.id,
        checkoutSessionId: tempSessionId,
        successUrl: options.successUrl,
        cancelUrl: options.cancelUrl,
        customerEmail: options.customerEmail,
        metadata: options.metadata,
        polar: {
          productPriceId: options.productPriceId,
          productId: options.productId,
          ...options.polar,
        },
      };

      const result = await createPolarCheckout(accessToken, params);
      return result.paymentUrl;
    },
    [account, app],
  );

  const isAccountNotLoaded = account === undefined || account.$isLoaded === false;
  const isLoading = isAuthenticated === true && isAccountNotLoaded;

  const error =
    isAuthenticated === true &&
    isLoading === false &&
    account.$isLoaded === true &&
    account.root.$isLoaded === true &&
    account.root["regarde-sdk"]?.$isLoaded === true
      ? null
      : new RegardeError("RegardeSDK not loaded", REGARDE_ERROR_CODES.SDK_NOT_INITIALIZED);

  return {
    generatePolarCheckoutLink,
    isLoading,
    error: isLoading === true ? null : error,
  };
}
