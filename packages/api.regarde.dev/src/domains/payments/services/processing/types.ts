import { Group, Loaded, co } from "jazz-tools";

import { ProcessedProviderEvents, RegistryWorkerAccount, TRegardeApp } from "@regarde-dev/core";

import type {
  NormalizedEvent,
  NormalizedLicenseData,
  NormalizedPaymentData,
  NormalizedSubscriptionData,
} from "#payments/types/normalized";

export type TProcessEventInput<TData> = {
  normalized: NormalizedEvent;
  data: TData;
  eventOwnerGroup: ReturnType<typeof Group.create>;
  jazzAccountId: string;
  appId: string;
  app: TRegardeApp;
  regardeSDKId: string;
  processedProviderEvents: co.loaded<typeof ProcessedProviderEvents>;
  worker: Loaded<typeof RegistryWorkerAccount>;
  webhookId: string;
};

export type TProcessPaymentEventInput = TProcessEventInput<NormalizedPaymentData>;

export type TProcessSubscriptionEventInput = TProcessEventInput<NormalizedSubscriptionData>;

export type TProcessLicenseEventInput = TProcessEventInput<NormalizedLicenseData>;
