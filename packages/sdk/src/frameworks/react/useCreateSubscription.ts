import { useAccount, useIsAuthenticated } from "jazz-tools/react";
import { useCallback, useState } from "react";

import { RegardeError } from "#core/errors";
import { createSubscription, type TCreateSubscriptionReturn } from "#core/managers/subscription";
import { RegardeAccount } from "#schemas/regardeAccount";
import type { TPaymentProvider } from "#schemas/paymentEvent";
import type { TRegardeApp } from "#schemas/regardeUserApp";

export interface TCreateSubscriptionParams {
  provider: TPaymentProvider;
  priceId: string;
  app: TRegardeApp;
  customerEmail?: string;
  trialDays?: number;
  metadata?: Record<string, string>;
  stripe?: Record<string, unknown>;
  polar?: Record<string, unknown>;
}

export interface TUseCreateSubscriptionResult {
  createSubscription: (
    apiKey: string,
    params: TCreateSubscriptionParams,
  ) => Promise<TCreateSubscriptionReturn>;
  isCreating: boolean;
  error: RegardeError | null;
}

/**
 * React hook for creating a subscription directly.
 *
 * Operations:
 * - Jazz: Creates Subscription CoMap (needs account for owner group)
 * - Provider: Calls Stripe/Polar subscription API
 *
 * For Stripe: Creates a subscription and returns the subscription ID.
 * For Polar: Creates a checkout session in subscription mode.
 *
 * @returns Object with createSubscription function, loading state, and error
 *
 * @example
 * ```tsx
 * const { createSubscription, isCreating, error } = useCreateSubscription();
 *
 * const handleSubscribe = async () => {
 *   const result = await createSubscription(
 *     "sk_test_...",
 *     {
 *       provider: "stripe",
 *       priceId: "price_123",
 *       app: myApp,
 *       customerEmail: "user@example.com",
 *       trialDays: 14,
 *     }
 *   );
 *   console.log("Subscription created:", result.providerSubscriptionId);
 * };
 * ```
 */
export function useCreateSubscription(): TUseCreateSubscriptionResult {
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

  const createSubscriptionFn = useCallback(
    async (
      apiKey: string,
      params: TCreateSubscriptionParams,
    ): Promise<TCreateSubscriptionReturn> => {
      setIsCreating(true);
      setError(null);

      try {
        const isAccountLoaded =
          account !== null && account !== undefined && account.$isLoaded === true;
        if (isAccountLoaded === false) {
          throw new RegardeError("Account must be loaded", "account_not_loaded" as const);
        }

        const result = await createSubscription(account, apiKey, {
          provider: params.provider,
          priceId: params.priceId,
          app: params.app,
          customerEmail: params.customerEmail,
          trialDays: params.trialDays,
          metadata: params.metadata,
          stripe: params.stripe,
          polar: params.polar,
        });

        return result;
      } catch (err) {
        const regardeError =
          err instanceof RegardeError
            ? err
            : new RegardeError(
                err instanceof Error ? err.message : "Unknown error",
                "subscription_create_failed" as const,
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
    createSubscription: createSubscriptionFn,
    isCreating,
    error,
  };
}
