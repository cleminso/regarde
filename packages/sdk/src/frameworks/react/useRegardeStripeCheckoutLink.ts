import { useAccount, useIsAuthenticated } from "jazz-tools/react";
import { useCallback } from "react";

import { RegardeError, REGARDE_ERROR_CODES } from "#core/errors";
import { createStripeCheckout } from "#core/providers/stripe/checkout";
import type { TCreateCheckoutParams } from "#core/providers/types";
import { RegardeAccount } from "#schemas/regardeAccount";
import type { TRegardeApp } from "#schemas/regardeUserApp";

export interface TRegardeStripeCheckoutLinkOptions {
  amount: number;
  currency: string;
  mode: "payment" | "subscription";
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string;
  productName?: string;
  metadata?: Record<string, string>;
  stripe?: Record<string, unknown>;
}

export interface TUseRegardeStripeCheckoutLinkResult {
  generateStripeCheckoutLink: (
    apiKey: string,
    options: TRegardeStripeCheckoutLinkOptions,
  ) => Promise<string>;
  isLoading: boolean;
  error: RegardeError | null;
}

/**
 * React hook for generating Stripe checkout links with Regarde metadata.
 *
 * This is a convenience wrapper around the lower-level checkout creation.
 * For full control including CheckoutSession tracking, use `useCreateCheckout`.
 *
 * @param app - The RegardeApp for metadata embedding
 * @returns Checkout link generator with loading state
 */
export function useRegardeStripeCheckoutLink(
  app: TRegardeApp,
): TUseRegardeStripeCheckoutLinkResult {
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

  const generateStripeCheckoutLink = useCallback(
    async (apiKey: string, options: TRegardeStripeCheckoutLinkOptions): Promise<string> => {
      const isAccountLoaded =
        account !== null && account !== undefined && account.$isLoaded === true;
      if (isAccountLoaded === false) {
        throw new RegardeError("Account must be loaded", REGARDE_ERROR_CODES.ACCOUNT_NOT_LOADED);
      }

      const isAppLoaded = app !== null && app !== undefined && app.$isLoaded === true;
      if (isAppLoaded === false) {
        throw new RegardeError("App must be loaded", REGARDE_ERROR_CODES.COMAP_NOT_FOUND);
      }

      const regardeSdk = account.root["regarde-sdk"];
      const isSdkLoaded =
        regardeSdk !== null && regardeSdk !== undefined && regardeSdk.$isLoaded === true;
      if (isSdkLoaded === false) {
        throw new RegardeError(
          "RegardeSDK must be initialized",
          REGARDE_ERROR_CODES.SDK_NOT_INITIALIZED,
        );
      }

      const tempSessionId = `temp_${Date.now()}`;

      const params: TCreateCheckoutParams = {
        provider: "stripe",
        amount: options.amount,
        currency: options.currency,
        mode: options.mode,
        appId: app.$jazz.id,
        userAccountId: account.$jazz.id,
        regardeSDKId: regardeSdk.$jazz.id,
        checkoutSessionId: tempSessionId,
        successUrl: options.successUrl,
        cancelUrl: options.cancelUrl,
        customerEmail: options.customerEmail,
        productName: options.productName,
        metadata: options.metadata,
        stripe: options.stripe,
      };

      const result = await createStripeCheckout(apiKey, params);
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
    generateStripeCheckoutLink,
    isLoading,
    error: isLoading === true ? null : error,
  };
}
