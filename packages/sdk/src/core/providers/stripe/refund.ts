import { RegardeError, REGARDE_ERROR_CODES } from "#core/errors";

/**
 * Parameters for creating a Stripe refund.
 */
export interface TCreateStripeRefundParams {
  paymentIntentId: string;
  amount?: number;
  reason?: string;
  metadata?: Record<string, string>;
}

/**
 * Result from creating a Stripe refund.
 */
export interface TCreateStripeRefundResult {
  providerRefundId: string;
  status: "pending" | "succeeded" | "failed";
}

/**
 * Creates a Stripe refund.
 *
 * Refunds can be full (omit amount) or partial (specify amount).
 * Reason is optional and can be "duplicate", "fraudulent", or "requested_by_customer".
 *
 * @param apiKey - Stripe secret key (provided by SDK user, not stored by Regarde)
 * @param params - Refund creation parameters
 * @returns Provider refund ID and status
 */
export async function createStripeRefund(
  apiKey: string,
  params: TCreateStripeRefundParams,
): Promise<TCreateStripeRefundResult> {
  try {
    const { default: StripeSDK } = await import("stripe");
    const stripe = new StripeSDK(apiKey);

    const refund = await stripe.refunds.create({
      payment_intent: params.paymentIntentId,
      ...(params.amount !== undefined ? { amount: params.amount } : {}),
      ...(params.reason !== undefined
        ? { reason: params.reason as "duplicate" | "fraudulent" | "requested_by_customer" }
        : {}),
      metadata: {
        ...params.metadata,
      },
    });

    const statusMap: Record<string, "pending" | "succeeded" | "failed"> = {
      pending: "pending",
      succeeded: "succeeded",
      failed: "failed",
    };

    // Handle potential null status from Stripe SDK types
    const refundStatus = refund.status ?? "pending";

    return {
      providerRefundId: refund.id,
      status: statusMap[refundStatus] ?? "pending",
    };
  } catch (error) {
    throw new RegardeError(
      error instanceof Error ? error.message : "Failed to create Stripe refund",
      REGARDE_ERROR_CODES.REFUND_CREATE_FAILED,
      "stripe",
      error,
    );
  }
}
