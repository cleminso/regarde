import { useCoState } from "jazz-tools/react";
import type { MaybeLoaded } from "jazz-tools";

import { Subscription } from "#schemas/subscriptionEvent";
import type { TSubscription, TSubscriptionStatus } from "#schemas/subscriptionEvent";

export interface TUseSubscriptionForUserOptions {
  subscriptionId: string;
}

export interface TUseSubscriptionForUserResult {
  subscription: MaybeLoaded<TSubscription>;
  status: TSubscriptionStatus | null;
  isActive: boolean;
  isLoading: boolean;
}

/**
 * React hook for subscribing to a subscription's real-time status.
 *
 * Jazz sync propagates subscription changes from the worker automatically.
 *
 * @param options - Options containing the subscription ID
 * @returns The subscription, status, and loading state
 */
export function useSubscriptionForUser(
  options: TUseSubscriptionForUserOptions,
): TUseSubscriptionForUserResult {
  const subscription = useCoState(Subscription, options.subscriptionId as any);

  const isLoading = subscription === undefined;

  const status =
    subscription !== null &&
    subscription !== undefined &&
    subscription.$isLoaded === true
      ? subscription.status
      : null;

  const isActive =
    status === "active" || status === "trialing" || status === "past_due";

  return {
    subscription,
    status,
    isActive,
    isLoading,
  };
}