import {
  TRegistryWebhookDelivery,
  TRegistryWorkerAccountRoot,
  TWebhook,
  TWebhookEvent,
} from "@regarde-dev/core";

export type TWebhookDeliveryFeeds = {
  webhookEvents: TWebhook["events"];
  webhookDeliveries: TRegistryWorkerAccountRoot["webhookDeliveries"];
};

export type TWebhookDeliveryContext = {
  appId: string;
  ownerAccountId: string;
  webhookId: string;
  provider: TRegistryWebhookDelivery["provider"];
  environment: TRegistryWebhookDelivery["environment"];
  payload: TWebhookEvent["payload"];
  headers: Record<string, string>;
};

export type TBuildWebhookDeliveryInput = {
  context: TWebhookDeliveryContext;
  providerEventId: string;
  parsedEventType: string;
  receivedAt: number;
  httpStatusCode: string;
  responseBody: string;
  deliveryOutcome: TRegistryWebhookDelivery["deliveryOutcome"];
  isRetry: boolean;
  retryCount: number;
  error?: string;
  regardeEventId?: string;
};

export type TWebhookDeliveryEntries = {
  appEvent: TWebhookEvent;
  registryDelivery: TRegistryWebhookDelivery;
};
