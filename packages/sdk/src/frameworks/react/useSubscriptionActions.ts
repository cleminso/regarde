import { useAccount, useIsAuthenticated } from "jazz-tools/react";
import { useCallback, useState } from "react";

import { RegardeError } from "#core/errors";
import {
  pauseSubscription,
  resumeSubscription,
  cancelSubscription,
} from "#core/managers/subscription";
import { RegardeAccount } from "#schemas/regardeAccount";
import type { TSubscription } from "#schemas/subscriptionEvent";

export interface TUsePauseSubscriptionResult {
  pauseSubscription: (apiKey: string, subscription: TSubscription) => Promise<void>;
  isPausing: boolean;
  error: RegardeError | null;
}

export interface TUseResumeSubscriptionResult {
  resumeSubscription: (apiKey: string, subscription: TSubscription) => Promise<void>;
  isResuming: boolean;
  error: RegardeError | null;
}

export interface TUseCancelSubscriptionResult {
  cancelSubscription: (
    apiKey: string,
    subscription: TSubscription,
    cancelAtPeriodEnd?: boolean,
  ) => Promise<void>;
  isCanceling: boolean;
  error: RegardeError | null;
}

/**
 * React hook for pausing a subscription.
 *
 * @returns Object with pauseSubscription function, isPausing state, and error
 */
export function usePauseSubscription(): TUsePauseSubscriptionResult {
  const isAuthenticated = useIsAuthenticated();
  const account = useAccount(RegardeAccount, isAuthenticated ? {} : {});

  const [isPausing, setIsPausing] = useState(false);
  const [error, setError] = useState<RegardeError | null>(null);

  const pauseFn = useCallback(
    async (apiKey: string, subscription: TSubscription): Promise<void> => {
      setIsPausing(true);
      setError(null);

      try {
        const isAccountLoaded =
          account !== null && account !== undefined && account.$isLoaded === true;
        if (isAccountLoaded === false) {
          throw new RegardeError("Account must be loaded", "account_not_loaded" as const);
        }

        await pauseSubscription(account, {
          subscription,
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
    [account],
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
 * @returns Object with resumeSubscription function, isResuming state, and error
 */
export function useResumeSubscription(): TUseResumeSubscriptionResult {
  const isAuthenticated = useIsAuthenticated();
  const account = useAccount(RegardeAccount, isAuthenticated ? {} : {});

  const [isResuming, setIsResuming] = useState(false);
  const [error, setError] = useState<RegardeError | null>(null);

  const resumeFn = useCallback(
    async (apiKey: string, subscription: TSubscription): Promise<void> => {
      setIsResuming(true);
      setError(null);

      try {
        const isAccountLoaded =
          account !== null && account !== undefined && account.$isLoaded === true;
        if (isAccountLoaded === false) {
          throw new RegardeError("Account must be loaded", "account_not_loaded" as const);
        }

        await resumeSubscription(account, {
          subscription,
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
    [account],
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
 * @returns Object with cancelSubscription function, isCanceling state, and error
 */
export function useCancelSubscription(): TUseCancelSubscriptionResult {
  const isAuthenticated = useIsAuthenticated();
  const account = useAccount(RegardeAccount, isAuthenticated ? {} : {});

  const [isCanceling, setIsCanceling] = useState(false);
  const [error, setError] = useState<RegardeError | null>(null);

  const cancelFn = useCallback(
    async (
      apiKey: string,
      subscription: TSubscription,
      cancelAtPeriodEnd?: boolean,
    ): Promise<void> => {
      setIsCanceling(true);
      setError(null);

      try {
        const isAccountLoaded =
          account !== null && account !== undefined && account.$isLoaded === true;
        if (isAccountLoaded === false) {
          throw new RegardeError("Account must be loaded", "account_not_loaded" as const);
        }

        await cancelSubscription(account, {
          subscription,
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
    [account],
  );

  return {
    cancelSubscription: cancelFn,
    isCanceling,
    error,
  };
}
