import type { TPaymentProvider } from "@regarde-dev/core";

import type { PaymentProviderAdapter } from "./types";
import { stripeAdapter } from "./stripe";
import { polarAdapter } from "./polar";

const adapterRegistry: Record<TPaymentProvider, PaymentProviderAdapter> = {
  stripe: stripeAdapter,
  polar: polarAdapter,
};

export const getAdapter = (
  provider: string,
): PaymentProviderAdapter | undefined => {
  return adapterRegistry[provider as TPaymentProvider];
};

export const isSupportedProvider = (
  provider: string,
): provider is TPaymentProvider => {
  return provider in adapterRegistry;
};

export { stripeAdapter } from "./stripe";
export { polarAdapter } from "./polar";
export type {
  PaymentProviderAdapter,
  NormalizedEvent,
  NormalizedEventData,
  NormalizedPaymentData,
  NormalizedSubscriptionData,
  NormalizedLicenseData,
  WebhookContext,
  WebhookQueryContext,
  TUnifiedEventType,
} from "./types";
export { PROVIDER_PREFIXES, prefixProviderEventId } from "./types";
