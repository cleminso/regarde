import type { PaymentProviderAdapter } from "#payments/adapters/types";

import { extractStripeContext } from "./context";
import { normalizeStripeEvent } from "./normalize";
import { validateStripeSignature } from "./signature";

export const stripeAdapter: PaymentProviderAdapter = {
  provider: "stripe",
  signatureHeader: "stripe-signature",
  validateSignature: validateStripeSignature,
  extractContext: extractStripeContext,
  normalizeEvent: normalizeStripeEvent,
};
