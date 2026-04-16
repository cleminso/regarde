import {
  LicenseEvent,
  TLicenseEventType,
} from "@regarde-dev/core";

import { indexLicenseEvent } from "../indexing/license";
import type { TProcessLicenseEventInput } from "./types";

export const processLicenseEvent = async ({
  normalized,
  data,
  eventOwnerGroup,
  jazzAccountId,
  appId,
  app,
  regardeSDKId,
  processedProviderEvents,
  worker,
  webhookId,
}: TProcessLicenseEventInput): Promise<string> => {
  const event = LicenseEvent.create(
    {
      webhookId,
      provider: normalized.provider,
      mode: normalized.mode,
      providerEventId: normalized.providerEventId,
      prefixedProviderEventUUID: normalized.prefixedProviderEventUUID,
      eventType: normalized.eventType as TLicenseEventType,
      appId,
      userAccountId: jazzAccountId,
      licenseKey: data.licenseKey,
      productId: data.productId,
      entitlementId: data.entitlementId,
      benefitId: data.benefitId,
      grantId: data.grantId,
      status: data.status,
      providerMetadata: { ...normalized.providerMetadata },
      metadata: {},
      timestamp: normalized.timestamp,
    },
    { owner: eventOwnerGroup },
  );

  await event.$jazz.waitForSync();

  processedProviderEvents.$jazz.set(normalized.prefixedProviderEventUUID, event.$jazz.id);
  await processedProviderEvents.$jazz.waitForSync();

  await indexLicenseEvent({
    eventId: event.$jazz.id,
    prefixedProviderEventUUID: normalized.prefixedProviderEventUUID,
    appId,
    jazzAccountId,
    regardeSDKId,
    app,
    worker,
  });

  return event.$jazz.id;
};
