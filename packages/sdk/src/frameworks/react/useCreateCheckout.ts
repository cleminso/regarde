import { useAccount, useIsAuthenticated } from "jazz-tools/react";
import { useCallback, useState } from "react";

import { RegardeError } from "#core/errors";
import { createCheckout } from "#core/managers/checkout";
import type { TCreateCheckoutOptions } from "#core/managers/checkout";
import type { TCheckoutSession } from "#schemas/checkoutSession";
import type { TPaymentProvider } from "#schemas/paymentEvent";
import { RegardeAccount } from "#schemas/regardeAccount";
import type { TRegardeApp } from "#schemas/regardeUserApp";

export interface TCreateCheckoutParams {
  provider: TPaymentProvider;
  amount: number;
  currency: string;
  mode: "payment" | "subscription";
  app: TRegardeApp;
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string;
  productName?: string;
  metadata?: Record<string, string>;
  stripe?: Record<string, unknown>;
  polar?: Record<string, unknown>;
  lemonsqueezy?: Record<string, unknown>;
}

export interface TUseCreateCheckoutResult {
  createCheckout: (
    apiKey: string,
    params: TCreateCheckoutParams,
  ) => Promise<{ checkoutSession: TCheckoutSession; paymentUrl: string }>;
  isCreating: boolean;
  error: RegardeError | null;
}

/**
 * React hook for creating a checkout session.
 *
 * @returns Object with createCheckout function, loading state, and error
 *
 * @example
 * ```tsx
 * const { createCheckout, isCreating, error } = useCreateCheckout();
 *
 * const handleCheckout = async () => {
 *   const { checkoutSession, paymentUrl } = await createCheckout(
 *     "sk_test_...",
 *     {
 *       provider: "stripe",
 *       amount: 1000,
 *       currency: "usd",
 *       mode: "payment",
 *       app: myApp,
 *       successUrl: "https://example.com/success",
 *       cancelUrl: "https://example.com/cancel",
 *     }
 *   );
 *   window.location.href = paymentUrl;
 * };
 * ```
 */
export function useCreateCheckout(): TUseCreateCheckoutResult {
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

  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<RegardeError | null>(null);

  const createCheckoutFn = useCallback(
    async (
      apiKey: string,
      params: TCreateCheckoutParams,
    ): Promise<{ checkoutSession: TCheckoutSession; paymentUrl: string }> => {
      setIsCreating(true);
      setError(null);

      try {
        const isAccountLoaded =
          account !== null && account !== undefined && account.$isLoaded === true;
        if (isAccountLoaded === false) {
          throw new RegardeError(
            "Account must be loaded",
            "account_not_loaded" as const,
          );
        }

        const result = await createCheckout(account, apiKey, {
          ...params,
          provider: params.provider,
          amount: params.amount,
          currency: params.currency,
          mode: params.mode,
          app: params.app,
          successUrl: params.successUrl,
          cancelUrl: params.cancelUrl,
          customerEmail: params.customerEmail,
          productName: params.productName,
          metadata: params.metadata,
          stripe: params.stripe,
          polar: params.polar,
          lemonsqueezy: params.lemonsqueezy,
        });

        return result;
      } catch (err) {
        const regardeError =
          err instanceof RegardeError
            ? err
            : new RegardeError(
                err instanceof Error ? err.message : "Unknown error",
                "checkout_create_failed" as const,
              );
        setError(regardeError);
        throw regardeError;
      } finally {
        setIsCreating(false);
      }
    },
    [account],
  );

  return {
    createCheckout: createCheckoutFn,
    isCreating,
    error,
  };
}
