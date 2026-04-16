import type { TPaymentProvider } from "@regarde-dev/core";

import { polarAdapter } from "./polar";
import { stripeAdapter } from "./stripe";
import type { PaymentProviderAdapter } from "./types";

const adapterRegistry: Record<TPaymentProvider, PaymentProviderAdapter> = {
  stripe: stripeAdapter,
  polar: polarAdapter,
};

export const getAdapter = (provider: string): PaymentProviderAdapter | undefined => {
  return adapterRegistry[provider as TPaymentProvider];
};

export const isSupportedProvider = (provider: string): provider is TPaymentProvider => {
  return provider in adapterRegistry;
};

export { stripeAdapter } from "./stripe";
export { polarAdapter } from "./polar";
export type {
  PaymentProviderAdapter,
  WebhookContext,
  WebhookQueryContext,
} from "./types";
export type {
  NormalizedEvent,
  NormalizedEventData,
  NormalizedPaymentData,
  NormalizedSubscriptionData,
  NormalizedLicenseData,
  TUnifiedEventType,
} from "../types/normalized";
export { PROVIDER_PREFIXES, prefixProviderEventId } from "./types";
