import type { PaymentProviderAdapter } from "../types";

import { extractPolarContext } from "./context";
import { normalizePolarEvent } from "./normalize";
import { validatePolarSignature } from "./signature";

export const polarAdapter: PaymentProviderAdapter = {
  provider: "polar",
  signatureHeader: "webhook-signature",
  timestampHeader: "webhook-timestamp",
  idHeader: "webhook-id",
  validateSignature: validatePolarSignature,
  extractContext: extractPolarContext,
  normalizeEvent: normalizePolarEvent,
};
