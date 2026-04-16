import { Loaded } from "jazz-tools";

import { RegistryWorkerAccount, TRegardeApp } from "@regarde-dev/core";

export type TIndexEventInput = {
  eventId: string;
  prefixedProviderEventUUID: string;
  appId: string;
  jazzAccountId: string;
  regardeSDKId: string;
  app: TRegardeApp;
  worker: Loaded<typeof RegistryWorkerAccount>;
};

export type TIndexEventToUserInput = {
  eventId: string;
  prefixedProviderEventUUID: string;
  appId: string;
  regardeSDKId: string;
  worker: Loaded<typeof RegistryWorkerAccount>;
};

export type TIndexEventToAppInput = {
  eventId: string;
  prefixedProviderEventUUID: string;
  jazzAccountId: string;
  app: TRegardeApp;
};
