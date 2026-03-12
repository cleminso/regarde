import { RegardeError, REGARDE_ERROR_CODES } from "#core/errors";

/**
 * Parameters for creating a Polar refund.
 */
export interface TCreatePolarRefundParams {
  orderId: string;
  amount: number;
  reason?: string;
  metadata?: Record<string, string>;
}

/**
 * Result from creating a Polar refund.
 */
export interface TCreatePolarRefundResult {
  providerRefundId: string;
  status: "pending" | "succeeded" | "failed";
}

/**
 * Creates a Polar refund.
 *
 * Polar refunds require an order ID (not payment intent ID like Stripe).
 * The order ID should be obtained from the PaymentEvent.providerMetadata.
 *
 * @param accessToken - Polar access token (provided by SDK user)
 * @param params - Refund creation parameters
 * @returns Provider refund ID and status
 */
export async function createPolarRefund(
  accessToken: string,
  params: TCreatePolarRefundParams,
): Promise<TCreatePolarRefundResult> {
  try {
    const { Polar } = await import("@polar-sh/sdk");
    const polar = new Polar({ accessToken });

    // Map free-form reason to Polar's required RefundReason enum
    // Valid values: duplicate, fraudulent, customer_request, service_disruption,
    // satisfaction_guarantee, dispute_prevention, other
    const reasonMap: Record<string, string> = {
      duplicate: "duplicate",
      fraudulent: "fraudulent",
      "customer request": "customer_request",
      "service disruption": "service_disruption",
      "satisfaction guarantee": "satisfaction_guarantee",
      "dispute prevention": "dispute_prevention",
    };
    const hasReason =
      params.reason !== undefined && params.reason !== null && params.reason.length > 0;
    const mappedReason =
      hasReason === true ? (reasonMap[params.reason!.toLowerCase()] ?? "other") : "other";

    const refund = await polar.refunds.create({
      orderId: params.orderId,
      amount: params.amount,
      reason: mappedReason as
        | "duplicate"
        | "fraudulent"
        | "customer_request"
        | "service_disruption"
        | "satisfaction_guarantee"
        | "dispute_prevention"
        | "other",
      metadata: {
        ...params.metadata,
      },
    });

    const statusMap: Record<string, "pending" | "succeeded" | "failed"> = {
      pending: "pending",
      succeeded: "succeeded",
      failed: "failed",
    };

    return {
      providerRefundId: refund.id,
      status: statusMap[refund.status] ?? "pending",
    };
  } catch (error) {
    throw new RegardeError(
      error instanceof Error ? error.message : "Failed to create Polar refund",
      REGARDE_ERROR_CODES.REFUND_CREATE_FAILED,
      "polar",
      error,
    );
  }
}
