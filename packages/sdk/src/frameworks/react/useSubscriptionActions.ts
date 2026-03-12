import { useIsAuthenticated } from "jazz-tools/react";
import { useCallback, useState } from "react";

import { RegardeError } from "#core/errors";
import {
  pauseSubscription,
  resumeSubscription,
  cancelSubscription,
} from "#core/managers/subscription";
import type { TPaymentProvider } from "#schemas/paymentEvent";

export interface TUsePauseSubscriptionResult {
  pauseSubscription: (
    apiKey: string,
    subscriptionId: string,
    provider: TPaymentProvider,
  ) => Promise<void>;
  isPausing: boolean;
  error: RegardeError | null;
}

export interface TUseResumeSubscriptionResult {
  resumeSubscription: (
    apiKey: string,
    subscriptionId: string,
    provider: TPaymentProvider,
  ) => Promise<void>;
  isResuming: boolean;
  error: RegardeError | null;
}

export interface TUseCancelSubscriptionResult {
  cancelSubscription: (
    apiKey: string,
    subscriptionId: string,
    provider: TPaymentProvider,
    cancelAtPeriodEnd?: boolean,
  ) => Promise<void>;
  isCanceling: boolean;
  error: RegardeError | null;
}

/**
 * React hook for pausing a subscription.
 *
 * Operations:
 * - Jazz: None (Jazz state updated via webhooks)
 * - Provider: Calls Stripe/Polar pause API
 *
 * @returns Object with pauseSubscription function, isPausing state, and error
 */
export function usePauseSubscription(): TUsePauseSubscriptionResult {
  const [isPausing, setIsPausing] = useState(false);
  const [error, setError] = useState<RegardeError | null>(null);

  const pauseFn = useCallback(
    async (apiKey: string, subscriptionId: string, provider: TPaymentProvider): Promise<void> => {
      setIsPausing(true);
      setError(null);

      try {
        await pauseSubscription({
          subscriptionId,
          provider,
          apiKey,
        });
      } catch (err) {
        const regardeError =
          err instanceof RegardeError
            ? err
            : new RegardeError(
                err instanceof Error ? err.message : "Unknown error",
                "subscription_pause_failed" as const,
              );
        setError(regardeError);
        throw regardeError;
      } finally {
        setIsPausing(false);
      }
    },
    [],
  );

  return {
    pauseSubscription: pauseFn,
    isPausing,
    error,
  };
}

/**
 * React hook for resuming a paused subscription.
 *
 * Operations:
 * - Jazz: None (Jazz state updated via webhooks)
 * - Provider: Calls Stripe/Polar resume API
 *
 * @returns Object with resumeSubscription function, isResuming state, and error
 */
export function useResumeSubscription(): TUseResumeSubscriptionResult {
  const [isResuming, setIsResuming] = useState(false);
  const [error, setError] = useState<RegardeError | null>(null);

  const resumeFn = useCallback(
    async (apiKey: string, subscriptionId: string, provider: TPaymentProvider): Promise<void> => {
      setIsResuming(true);
      setError(null);

      try {
        await resumeSubscription({
          subscriptionId,
          provider,
          apiKey,
        });
      } catch (err) {
        const regardeError =
          err instanceof RegardeError
            ? err
            : new RegardeError(
                err instanceof Error ? err.message : "Unknown error",
                "subscription_resume_failed" as const,
              );
        setError(regardeError);
        throw regardeError;
      } finally {
        setIsResuming(false);
      }
    },
    [],
  );

  return {
    resumeSubscription: resumeFn,
    isResuming,
    error,
  };
}

/**
 * React hook for canceling a subscription.
 *
 * Operations:
 * - Jazz: None (Jazz state updated via webhooks)
 * - Provider: Calls Stripe/Polar cancel API
 *
 * @returns Object with cancelSubscription function, isCanceling state, and error
 */
export function useCancelSubscription(): TUseCancelSubscriptionResult {
  const [isCanceling, setIsCanceling] = useState(false);
  const [error, setError] = useState<RegardeError | null>(null);

  const cancelFn = useCallback(
    async (
      apiKey: string,
      subscriptionId: string,
      provider: TPaymentProvider,
      cancelAtPeriodEnd?: boolean,
    ): Promise<void> => {
      setIsCanceling(true);
      setError(null);

      try {
        await cancelSubscription({
          subscriptionId,
          provider,
          apiKey,
          cancelAtPeriodEnd,
        });
      } catch (err) {
        const regardeError =
          err instanceof RegardeError
            ? err
            : new RegardeError(
                err instanceof Error ? err.message : "Unknown error",
                "subscription_cancel_failed" as const,
              );
        setError(regardeError);
        throw regardeError;
      } finally {
        setIsCanceling(false);
      }
    },
    [],
  );

  return {
    cancelSubscription: cancelFn,
    isCanceling,
    error,
  };
}
