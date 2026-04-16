import { Loaded } from "jazz-tools";

import {
  CheckoutSession,
  RegistryWorkerAccount,
  TCheckoutSessionStatus,
  TRegardeApp,
  useLogging,
} from "@regarde-dev/core";

import type { NormalizedEvent } from "../../adapters";

const logger = useLogging({
  module: import.meta.filename,
});

type TUpdateCheckoutSessionFromPaymentInput = {
  normalized: NormalizedEvent;
  paymentEventId: string;
  app: TRegardeApp;
  worker: Loaded<typeof RegistryWorkerAccount>;
};

export const updateCheckoutSessionFromPayment = async ({
  normalized,
  paymentEventId,
  worker,
}: TUpdateCheckoutSessionFromPaymentInput): Promise<void> => {
  const checkoutSessionId = normalized.providerMetadata.regarde_session_id;
  const hasCheckoutSessionId =
    checkoutSessionId !== undefined && checkoutSessionId !== null && checkoutSessionId !== "";

  if (hasCheckoutSessionId === false) {
    return;
  }

  const checkoutSession = await CheckoutSession.load(checkoutSessionId, {
    loadAs: worker,
  });

  if (checkoutSession.$isLoaded !== true) {
    logger.warn({
      message: "CheckoutSession not found for payment event",
      data: { checkoutSessionId, paymentEventId },
    });
    return;
  }

  let newStatus: TCheckoutSessionStatus | undefined;
  switch (normalized.eventType) {
    case "payment.checkout_completed":
    case "payment.succeeded":
      newStatus = "succeeded";
      break;
    case "payment.failed":
    case "payment.canceled":
      newStatus = "failed";
      break;
    case "payment.checkout_expired":
      newStatus = "expired";
      break;
    default:
      break;
  }

  if (newStatus === undefined) {
    return;
  }

  checkoutSession.$jazz.set("status", newStatus);
  checkoutSession.$jazz.set("completedAt", normalized.timestamp);
  checkoutSession.$jazz.set("paymentEventId", paymentEventId);
  await checkoutSession.$jazz.waitForSync();

  logger.info({
    message: "Updated CheckoutSession status",
    data: {
      checkoutSessionId,
      status: newStatus,
      paymentEventId,
    },
  });
};
