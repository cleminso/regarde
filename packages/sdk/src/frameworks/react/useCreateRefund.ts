import { useAccount, useIsAuthenticated } from "jazz-tools/react";
import { useCallback, useState } from "react";

import { RegardeError } from "#core/errors";
import { createRefund } from "#core/managers/refund";
import { RegardeAccount } from "#schemas/regardeAccount";
import type { TPaymentEvent, TPaymentProvider } from "#schemas/paymentEvent";
import type { TRefund } from "#schemas/refund";
import type { TRegardeApp } from "#schemas/regardeUserApp";

export interface TCreateRefundParams {
  paymentEvent: TPaymentEvent;
  app: TRegardeApp;
  amount?: number;
  reason?: string;
  metadata?: Record<string, string>;
}

export interface TUseCreateRefundResult {
  createRefund: (
    apiKey: string,
    provider: TPaymentProvider,
    params: TCreateRefundParams,
  ) => Promise<{ refund: TRefund }>;
  isCreating: boolean;
  error: RegardeError | null;
}

/**
 * React hook for creating a refund.
 *
 * Operations:
 * - Jazz: Creates Refund CoMap (needs account for owner group)
 * - Provider: Calls Stripe/Polar refund API
 *
 * @returns Object with createRefund function, loading state, and error
 *
 * @example
 * ```tsx
 * const { createRefund, isCreating, error } = useCreateRefund();
 *
 * const handleRefund = async () => {
 *   const { refund } = await createRefund(
 *     "sk_test_...",
 *     "stripe",
 *     {
 *       paymentEvent: myPaymentEvent,
 *       app: myApp,
 *       amount: 500, // Partial refund (omit for full refund)
 *       reason: "Customer request",
 *     }
 *   );
 *   console.log("Refund created:", refund.$jazz.id);
 * };
 * ```
 */
export function useCreateRefund(): TUseCreateRefundResult {
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

  const createRefundFn = useCallback(
    async (
      apiKey: string,
      provider: TPaymentProvider,
      params: TCreateRefundParams,
    ): Promise<{ refund: TRefund }> => {
      setIsCreating(true);
      setError(null);

      try {
        const isAccountLoaded =
          account !== null && account !== undefined && account.$isLoaded === true;
        if (isAccountLoaded === false) {
          throw new RegardeError("Account must be loaded", "account_not_loaded" as const);
        }

        const result = await createRefund(account, apiKey, provider, {
          paymentEvent: params.paymentEvent,
          app: params.app,
          amount: params.amount,
          reason: params.reason,
          metadata: params.metadata,
        });

        return result;
      } catch (err) {
        const regardeError =
          err instanceof RegardeError
            ? err
            : new RegardeError(
                err instanceof Error ? err.message : "Unknown error",
                "refund_create_failed" as const,
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
    createRefund: createRefundFn,
    isCreating,
    error,
  };
}
