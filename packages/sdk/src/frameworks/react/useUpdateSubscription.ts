import { useCallback, useState } from "react";

import { RegardeError } from "#core/errors";
import { updateSubscription } from "#core/managers/subscription";
import type { TPaymentProvider } from "#schemas/paymentEvent";

export interface TUpdateSubscriptionParams {
  subscriptionId: string;
  provider: TPaymentProvider;
  priceId?: string;
  quantity?: number;
  metadata?: Record<string, string>;
  stripe?: Record<string, unknown>;
  polar?: Record<string, unknown>;
}

export interface TUseUpdateSubscriptionResult {
  updateSubscription: (apiKey: string, params: TUpdateSubscriptionParams) => Promise<void>;
  isUpdating: boolean;
  error: RegardeError | null;
}

/**
 * React hook for updating a subscription.
 *
 * Operations:
 * - Jazz: None (Jazz state updated via webhooks)
 * - Provider: Calls Stripe/Polar update API
 *
 * Supports changing plan/price, quantity, or metadata.
 *
 * @returns Object with updateSubscription function, loading state, and error
 *
 * @example
 * ```tsx
 * const { updateSubscription, isUpdating, error } = useUpdateSubscription();
 *
 * const handleUpdate = async () => {
 *   await updateSubscription(
 *     "sk_test_...",
 *     {
 *       subscriptionId: "sub_123",
 *       provider: "stripe",
 *       priceId: "price_new_plan",
 *     }
 *   );
 * };
 * ```
 */
export function useUpdateSubscription(): TUseUpdateSubscriptionResult {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<RegardeError | null>(null);

  const updateSubscriptionFn = useCallback(
    async (apiKey: string, params: TUpdateSubscriptionParams): Promise<void> => {
      setIsUpdating(true);
      setError(null);

      try {
        await updateSubscription(apiKey, {
          subscriptionId: params.subscriptionId,
          provider: params.provider,
          priceId: params.priceId,
          quantity: params.quantity,
          metadata: params.metadata,
          stripe: params.stripe,
          polar: params.polar,
        });
      } catch (err) {
        const regardeError =
          err instanceof RegardeError
            ? err
            : new RegardeError(
                err instanceof Error ? err.message : "Unknown error",
                "subscription_update_failed" as const,
              );
        setError(regardeError);
        throw regardeError;
      } finally {
        setIsUpdating(false);
      }
    },
    [],
  );

  return {
    updateSubscription: updateSubscriptionFn,
    isUpdating,
    error,
  };
}
