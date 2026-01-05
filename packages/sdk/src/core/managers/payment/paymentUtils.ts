import { TPaymentEvent } from "#schemas/paymentEvent";
import { TApp } from "#schemas/regardeUserApp";
import { Account } from "jazz-tools";

export interface PaymentQueryParams {
  appId?: string;
  userId?: string;
}

/**
 * Returns the payment history for the provided user within the context of the provided App.
 *
 * @param app The Regarde App instance (optional/loaded)
 * @param me The current user account (optional/loaded)
 * @returns List of payments or undefined if loading/not found.
 */
export const usePaymentHistory = (
  app: TApp | undefined | null,
  me: Account | undefined | null,
): TPaymentEvent[] | undefined => {
  if (!app || !me) return undefined;

  const userId = me.$jazz.id;
  const userIdValid = typeof userId === "string" && userId.length > 0;
  if (userIdValid === false) return undefined;

  const payments = app.payments;
  const paymentsExist = payments !== null && payments !== undefined;
  if (paymentsExist === false) return undefined;

  const paymentsLoaded = payments.$isLoaded === true;
  if (paymentsLoaded === false) return undefined;

  // CoFeed access: app.payments.perAccount[userId]
  // Single source of truth - all payments in one feed
  const userFeed = payments.perAccount[userId];
  return userFeed
    ? Array.from(userFeed.all)
        .map((entry) => entry.value)
        .filter(
          (payment): payment is TPaymentEvent =>
            payment !== null && payment.$isLoaded === true,
        )
    : undefined;
};

/**
 * Returns whether the current user has an active subscription/access.
 *
 * @param app The Regarde App instance
 * @param me The current user account
 * @returns boolean
 */
export const useSubscription = (
  app: TApp | undefined | null,
  me: Account | undefined | null,
) => {
  const payments = usePaymentHistory(app, me);

  // Default to false if no payments or not loaded
  if (!payments) return false;

  // Check for any completed payment
  return payments.some((p) => p && p.paymentStatus === "completed");
};
