import type { MaybeLoaded, ID } from "jazz-tools";
import { useCoState } from "jazz-tools/react";

import { CheckoutSession } from "#schemas/checkoutSession";
import type { TCheckoutSession } from "#schemas/checkoutSession";

export interface TUseCheckoutOptions {
  checkoutSessionId: ID<typeof CheckoutSession>;
}

export interface TUseCheckoutResult {
  checkout: MaybeLoaded<TCheckoutSession>;
  isLoading: boolean;
}

/**
 * React hook for subscribing to a checkout session's real-time updates.
 *
 * Jazz sync propagates status changes from the worker to all subscribers
 * automatically - no polling needed.
 *
 * @param options - Options containing the checkout session ID
 * @returns The checkout session and loading state
 *
 * @example
 * ```tsx
 * function CheckoutStatus({ checkoutSessionId }: { checkoutSessionId: string }) {
 *   const { checkout, isLoading } = useCheckout({ checkoutSessionId });
 *
 *   if (isLoading) return <div>Loading...</div>;
 *   if (!checkout.$isLoaded) return <div>Checkout not found</div>;
 *
 *   return (
 *     <div>
 *       Status: {checkout.status}
 *       {checkout.status === "succeeded" && <SuccessMessage />}
 *       {checkout.status === "failed" && <FailureMessage />}
 *     </div>
 *   );
 * }
 * ```
 */
export function useCheckout(options: TUseCheckoutOptions): TUseCheckoutResult {
  const checkout = useCoState(CheckoutSession, options.checkoutSessionId);

  const isLoading = checkout === undefined;

  return {
    checkout,
    isLoading,
  };
}
