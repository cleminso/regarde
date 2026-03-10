import { useCoState } from "jazz-tools/react";
import type { MaybeLoaded } from "jazz-tools";

import { PaymentEvent } from "#schemas/paymentEvent";
import type { TPaymentEvent, TPaymentStatus } from "#schemas/paymentEvent";

export interface TUsePaymentStatusOptions {
  paymentEventId: string;
}

export interface TUsePaymentStatusResult {
  payment: MaybeLoaded<TPaymentEvent>;
  status: TPaymentStatus | null;
  isLoading: boolean;
}

/**
 * React hook for subscribing to a payment event's real-time status.
 *
 * Jazz sync propagates payment status changes from the worker automatically.
 *
 * @param options - Options containing the payment event ID
 * @returns The payment event, status, and loading state
 */
export function usePaymentStatus(
  options: TUsePaymentStatusOptions,
): TUsePaymentStatusResult {
  const payment = useCoState(PaymentEvent, options.paymentEventId as any);

  const isLoading = payment === undefined;

  const status =
    payment !== null && payment !== undefined && payment.$isLoaded === true
      ? payment.status
      : null;

  return {
    payment,
    status,
    isLoading,
  };
}