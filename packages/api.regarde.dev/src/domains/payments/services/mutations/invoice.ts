import { Group } from "jazz-tools";

import { Invoice, TRegardeApp, useLogging } from "@regarde-dev/core";

import type { NormalizedEvent, NormalizedPaymentData } from "#payments/types/normalized";

const logger = useLogging({
  module: import.meta.filename,
});

type TCreateInvoiceFromPaymentInput = {
  normalized: NormalizedEvent;
  data: NormalizedPaymentData;
  paymentEventId: string;
  app: TRegardeApp;
  jazzAccountId: string;
  eventOwnerGroup: ReturnType<typeof Group.create>;
};

export const createInvoiceFromPayment = async ({
  normalized,
  data,
  paymentEventId,
  app,
  jazzAccountId,
  eventOwnerGroup,
}: TCreateInvoiceFromPaymentInput): Promise<void> => {
  if (data.status !== "succeeded") {
    return;
  }

  const amountNum = parseInt(data.amount, 10);
  const isAmountValid = Number.isNaN(amountNum) === false;

  const invoice = Invoice.create(
    {
      appId: app.$jazz.id,
      userAccountId: jazzAccountId,
      paymentEventId,
      provider: normalized.provider,
      invoiceNumber: `INV-${Date.now()}`,
      date: normalized.timestamp,
      amount: isAmountValid ? amountNum : 0,
      currency: data.currency.toUpperCase(),
      description: `Payment via ${normalized.provider}`,
      items: [
        {
          description: "Payment",
          quantity: 1,
          unitPrice: isAmountValid ? amountNum : 0,
          total: isAmountValid ? amountNum : 0,
        },
      ],
      subtotal: isAmountValid ? amountNum : 0,
      total: isAmountValid ? amountNum : 0,
      providerInvoiceId: normalized.providerMetadata.invoiceId,
      createdAt: Date.now(),
    },
    { owner: eventOwnerGroup },
  );

  await invoice.$jazz.waitForSync();

  logger.info({
    message: "Created Invoice from payment",
    data: {
      invoiceId: invoice.$jazz.id,
      paymentEventId,
      amount: data.amount,
      currency: data.currency,
    },
  });
};
