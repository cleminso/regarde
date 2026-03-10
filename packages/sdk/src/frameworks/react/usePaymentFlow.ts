import { useCoState } from "jazz-tools/react";
import type { MaybeLoaded } from "jazz-tools";
import { useMemo } from "react";

import { CheckoutSession } from "#schemas/checkoutSession";
import type { TCheckoutSession, TCheckoutSessionStatus } from "#schemas/checkoutSession";
import { PaymentEvent } from "#schemas/paymentEvent";
import type { TPaymentEvent } from "#schemas/paymentEvent";

export interface TUsePaymentFlowOptions {
  checkoutSessionId: string;
}

export interface TUsePaymentFlowResult {
  checkout: MaybeLoaded<TCheckoutSession>;
  payment: MaybeLoaded<TPaymentEvent> | null;
  status: TCheckoutSessionStatus | null;
  isLoading: boolean;
}

/**
 * React hook for tracking a complete payment flow from checkout to completion.
 *
 * Subscribes to both the CheckoutSession and its linked PaymentEvent,
 * providing a unified view of the payment lifecycle.
 *
 * @param options - Options containing the checkout session ID
 * @returns The checkout, payment, status, and loading state
 */
export function usePaymentFlow(
  options: TUsePaymentFlowOptions,
): TUsePaymentFlowResult {
  const checkout = useCoState(CheckoutSession, options.checkoutSessionId as any);

  const paymentEventId =
    checkout !== null &&
    checkout !== undefined &&
    checkout.$isLoaded === true
      ? checkout.paymentEventId
      : undefined;

  const payment = useCoState(
    PaymentEvent,
    paymentEventId !== undefined ? (paymentEventId as any) : undefined,
  );

  const isLoading = checkout === undefined;

  const status: TCheckoutSessionStatus | null = useMemo(() => {
    if (checkout !== null && checkout !== undefined && checkout.$isLoaded === true) {
      return checkout.status;
    }
    return null;
  }, [checkout]);

  return {
    checkout,
    payment: paymentEventId !== undefined ? payment : null,
    status,
    isLoading,
  };
}