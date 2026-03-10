import { co, z } from "jazz-tools";

import { PAYMENT_PROVIDERS } from "./paymentEvent";

/**
 * Invoice line item.
 */
export const InvoiceLineItem = co.map({
  description: z.string(),
  quantity: z.number(),
  unitPrice: z.number().describe("Price in smallest currency unit"),
  total: z.number().describe("Line total in smallest currency unit"),
});

export type TInvoiceLineItem = co.loaded<typeof InvoiceLineItem>;

/**
 * User-owned receipt generated from PaymentEvent data.
 *
 * Created by the worker when a payment succeeds. Because this is a Jazz
 * CoMap owned by the user's group, it works offline and syncs across
 * devices - users always have access to their receipts.
 *
 * @schema
 * - `appId`: RegardeApp ID
 * - `userAccountId`: Jazz account ID of the payer
 * - `paymentEventId`: Links to the PaymentEvent that generated this invoice
 * - `provider`: Payment provider source
 * - `invoiceNumber`: Human-readable invoice identifier
 * - `date`: Invoice date as Unix timestamp
 * - `amount`: Total amount in smallest currency unit
 * - `currency`: ISO 4217 currency code
 * - `description`: Payment description
 * - `items`: List of line items
 * - `subtotal`: Subtotal before tax
 * - `tax`: Tax amount (optional)
 * - `total`: Total amount including tax
 * - `providerInvoiceId`: Provider's invoice ID for reconciliation (optional)
 * - `createdAt`: Unix timestamp of creation
 */
export const Invoice = co.map({
  appId: z.string(),
  userAccountId: z.string(),
  paymentEventId: z.string().describe("Links to PaymentEvent"),

  provider: z.enum(PAYMENT_PROVIDERS),

  invoiceNumber: z.string(),
  date: z.number(),
  amount: z.number().describe("Total in smallest currency unit"),
  currency: z.string(),
  description: z.string(),

  items: co.list(InvoiceLineItem),

  subtotal: z.number(),
  tax: z.optional(z.number()),
  total: z.number(),

  providerInvoiceId: z.optional(z.string()),

  createdAt: z.number(),
});

export type TInvoice = co.loaded<typeof Invoice>;
