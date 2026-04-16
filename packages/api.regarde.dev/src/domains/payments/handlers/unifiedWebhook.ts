import { Account, Group, ID, Loaded, co } from "jazz-tools";

import {
  RegistryWorkerAccount,
  TRegardeApp,
  RegardeApp,
  TRegistryWorkerAccountRoot,
  type TWebhook,
  useLogging,
} from "@regarde-dev/core";

import { getAdapter, isSupportedProvider } from "#payments/adapters/index";
import type { NormalizedEvent } from "#payments/types/normalized";
import { parseJsonObject } from "./schema";
import { processLicenseEvent } from "#payments/services/processing/license";
import { processPaymentEvent } from "#payments/services/processing/payment";
import { processSubscriptionEvent } from "#payments/services/processing/subscription";
import { getWebhookAttemptState, incrementWebhookAttemptCount } from "#payments/services/telemetry/attempts";
import { buildWebhookDeliveryEntries, recordWebhookDelivery } from "#payments/services/telemetry/delivery";
import type { TWebhookDeliveryContext, TWebhookDeliveryFeeds } from "#payments/services/telemetry/types";

const logger = useLogging({
  module: import.meta.filename,
});

const getProviderEventDetails = (payload: Record<string, unknown>): {
  providerEventId: string;
  parsedEventType: string;
} => {
  const payloadWithMeta = payload as {
    id?: string;
    type?: string;
    meta?: { event_id?: string; event_name?: string };
  };

  return {
    providerEventId: payloadWithMeta.id ?? payloadWithMeta.meta?.event_id ?? "unknown",
    parsedEventType: payloadWithMeta.type ?? payloadWithMeta.meta?.event_name ?? "unknown",
  };
};

const getRequestHeaders = (c: any): Record<string, string> => {
  return Object.fromEntries(
    Object.entries(c.req.header()).map(([key, value]) => [
      key,
      typeof value === "string" ? value : JSON.stringify(value),
    ]),
  );
};

const createWebhookDeliveryContext = (input: TWebhookDeliveryContext): TWebhookDeliveryContext => {
  return input;
};

export const unifiedWebhookHandler = (worker: Loaded<typeof RegistryWorkerAccount>) => {
  return async (c: any) => {
    try {
      const workerId = process.env.REGARDE_REGISTRY_GROUP;
      const hasWorkerId = typeof workerId === "string" && workerId !== "";
      if (hasWorkerId === false) {
        logger.debug({
          message: "Starting webhook handler, checking registry group",
          data: { workerId },
        });
        throw new Error("Missing `REGARDE_REGISTRY_GROUP` required environment variable");
      }

      const provider = c.req.param("provider");

      if (isSupportedProvider(provider) === false) {
        logger.error({
          message: "Unsupported payment provider",
          data: { provider },
        });
        return c.json({ error: `Unsupported provider: ${provider}` }, 400);
      }

      const adapter = getAdapter(provider);
      if (adapter === undefined) {
        return c.json({ error: `No adapter for provider: ${provider}` }, 400);
      }

      const rawBody = await c.req.text();
      const isPolarProvider = provider === "polar";
      const allHeaders = Object.fromEntries(
        Object.entries(c.req.header()).map(([key, value]) => [
          key,
          typeof value === "string" && value.length > 50 ? `${value.substring(0, 50)}...` : value,
        ]),
      );

      const headers =
        isPolarProvider === true
          ? allHeaders
          : {
              stripeSignature: c.req.header("stripe-signature"),
              contentType: c.req.header("content-type"),
              userAgent: c.req.header("user-agent"),
            };

      logger.debug({
        message: "Webhook request received",
        data: {
          provider,
          url: c.req.url,
          queryParams: c.req.query(),
          headers,
          bodyPreview: rawBody.substring(0, 500),
          bodyLength: rawBody.length,
        },
      });

      const json = parseJsonObject(rawBody);
      if (json === null) {
        return c.json({ error: "Invalid webhook payload" }, 400);
      }

      logger.debug({
        message: "Webhook payload parsed",
        data: {
          provider,
          eventType:
            (json.type as string | undefined) ??
            ((json.meta as { event_name?: string } | undefined)?.event_name ?? undefined),
          hasMetadata:
            Boolean(
              (json.data as { object?: { metadata?: unknown }; metadata?: unknown } | undefined)?.object
                ?.metadata,
            ) ||
            Boolean(
              (json.meta as { custom_data?: unknown } | undefined)?.custom_data,
            ) ||
            Boolean((json.data as { metadata?: unknown } | undefined)?.metadata),
          payloadKeys: Object.keys(json),
          dataKeys:
            json.data !== undefined && typeof json.data === "object" && json.data !== null
              ? Object.keys(json.data)
              : null,
        },
      });

      const pathAppId = c.req.param("appId");
      const pathWebhookId = c.req.param("webhookId");

      const appRef = await RegardeApp.load(pathAppId, {
        loadAs: worker,
        resolve: {
          webhooks: { $each: { events: true } },
          payments: { all: true, byUser: true },
          subscriptions: { all: true, byUser: true },
          licenses: { all: true, byUser: true },
        },
      });

      const hasAppRefId = typeof appRef.$jazz.id === "string" && appRef.$jazz.id !== "";
      if (hasAppRefId === false) {
        logger.error({
          message: "App not found or failed to load",
          data: { appId: pathAppId, provider },
        });
        return c.json({ error: "App not found" }, 404);
      }

      const app = await (appRef as TRegardeApp).$jazz.ensureLoaded({
        resolve: {
          webhooks: { $each: { events: true } },
          payments: { all: true, byUser: true },
          subscriptions: { all: true, byUser: true },
          licenses: { all: true, byUser: true },
        },
      });

      const webhook = app.webhooks.find((entry: TWebhook) => entry.$jazz.id === pathWebhookId);
      const isWebhookLoaded = webhook !== undefined && webhook !== null && webhook.$isLoaded === true;

      if (isWebhookLoaded === false) {
        logger.error({
          message: "Webhook not found",
          data: {
            appId: pathAppId,
            webhookId: pathWebhookId,
            availableWebhooks: app.webhooks.map((entry: TWebhook) => entry.$jazz.id),
          },
        });
        return c.json({ error: "Webhook not found" }, 404);
      }

      if (webhook.isEnabled === false) {
        logger.debug({
          message: "Webhook is disabled - acknowledging but not processing",
          data: {
            appId: pathAppId,
            webhookId: pathWebhookId,
          },
        });
        return c.json({ received: true, ignored: true, reason: "webhook disabled" }, 200);
      }

      const registryProfileWorkerGroup = await co.group().load(workerId, {
        loadAs: worker,
      });

      if (registryProfileWorkerGroup.$isLoaded !== true) {
        logger.error({
          message: "Failed to load registryProfileWorkerGroup",
          data: {
            workerId,
            provider,
            appId: pathAppId,
            workerAccountId: worker.$jazz.id,
          },
        });
        return c.json({ error: "Failed to load registryProfileWorkerGroup" }, 500);
      }

      const workerRoot = worker.root as TRegistryWorkerAccountRoot;
      const processedProviderEvents = workerRoot.processedProviderEvents;
      const isProcessedProviderEventsLoaded =
        processedProviderEvents !== null &&
        processedProviderEvents !== undefined &&
        processedProviderEvents.$isLoaded === true;
      if (isProcessedProviderEventsLoaded === false) {
        logger.error({
          message: "Failed to load processedProviderEvents from worker root",
          data: {
            workerJazzId: worker.$jazz.id,
            workerId,
            appId: pathAppId,
            provider,
            processedProviderEventsPresent: processedProviderEvents !== null,
            processedProviderEventsIsLoaded: processedProviderEvents?.$isLoaded,
          },
        });
        return c.json({ error: "processedProviderEvents not available on worker root" }, 500);
      }

      const webhookDeliveries = workerRoot.webhookDeliveries;
      const isWebhookDeliveriesLoaded =
        webhookDeliveries !== null &&
        webhookDeliveries !== undefined &&
        webhookDeliveries.$isLoaded === true;
      if (isWebhookDeliveriesLoaded === false) {
        logger.error({
          message: "Failed to load webhookDeliveries from worker root",
          data: {
            workerJazzId: worker.$jazz.id,
            workerId,
            appId: pathAppId,
            provider,
            webhookDeliveriesPresent: webhookDeliveries !== null,
            webhookDeliveriesLoaded: webhookDeliveries?.$isLoaded,
          },
        });
        return c.json({ error: "webhookDeliveries not available on worker root" }, 500);
      }

      const webhookAttemptCounts = workerRoot.webhookAttemptCounts;
      const isWebhookAttemptCountsLoaded =
        webhookAttemptCounts !== null &&
        webhookAttemptCounts !== undefined &&
        webhookAttemptCounts.$isLoaded === true;
      if (isWebhookAttemptCountsLoaded === false) {
        logger.error({
          message: "Failed to load webhookAttemptCounts from worker root",
          data: {
            workerJazzId: worker.$jazz.id,
            workerId,
            appId: pathAppId,
            provider,
            webhookAttemptCountsPresent: webhookAttemptCounts !== null,
            webhookAttemptCountsLoaded: webhookAttemptCounts?.$isLoaded,
          },
        });
        return c.json({ error: "webhookAttemptCounts not available on worker root" }, 500);
      }

      const requestHeaders = getRequestHeaders(c);
      const deliveryFeeds: TWebhookDeliveryFeeds = {
        webhookEvents: webhook.events,
        webhookDeliveries,
      };
      const deliveryContext = createWebhookDeliveryContext({
        appId: pathAppId,
        ownerAccountId: app.ownerAccountId,
        webhookId: pathWebhookId,
        provider: webhook.provider,
        environment: webhook.environment,
        payload: json,
        headers: requestHeaders,
      });

      let ctx;
      try {
        logger.debug({
          message: "Attempting to extract context",
          data: {
            provider,
            appIdFromPath: pathAppId,
            webhookId: pathWebhookId,
            queryParams: c.req.query(),
          },
        });

        const queryParams = c.req.query();
        ctx = adapter.extractContext(json, {
          pathAppId,
          regarde_user_id: queryParams.regarde_user_id,
          regarde_sdk_id: queryParams.regarde_sdk_id,
        });
      } catch (extractError) {
        const { providerEventId, parsedEventType } = getProviderEventDetails(json);
        const receivedAt = Date.now();
        const { isRetry, retryCount } = await getWebhookAttemptState(
          webhookAttemptCounts,
          pathWebhookId,
          providerEventId,
        );
        const errorMessage =
          extractError instanceof Error
            ? extractError.message
            : "Failed to extract context from payload";

        await recordWebhookDelivery({
          ...deliveryFeeds,
          ...buildWebhookDeliveryEntries({
            context: deliveryContext,
            providerEventId,
            parsedEventType,
            receivedAt,
            httpStatusCode: "400",
            responseBody: JSON.stringify({
              error: "Missing required context in webhook payload",
            }),
            deliveryOutcome: "context_error",
            isRetry,
            retryCount,
            error: errorMessage,
          }),
        });
        await incrementWebhookAttemptCount(
          webhookAttemptCounts,
          pathWebhookId,
          providerEventId,
          retryCount,
        );

        logger.error({
          message: "Failed to extract context from webhook payload",
          data: {
            provider,
            pathAppId,
            webhookId: pathWebhookId,
            errorMessage,
            availableMetadataSources: {
              stripeMetadata: (json.data as { object?: { metadata?: unknown } } | undefined)?.object
                ?.metadata,
              polarMetadata: (json.data as { metadata?: unknown } | undefined)?.metadata,
            },
          },
        });
        return c.json({ error: "Missing required context in webhook payload" }, 400);
      }

      const appId = ctx.appId as ID<Account>;
      const { jazzAccountId, regardeSDKId } = ctx;

      const hasAppId = appId !== null && appId !== undefined && appId !== "";
      if (hasAppId === false) {
        logger.error({
          message: "Missing App ID",
          data: { provider, pathAppId, webhookId: pathWebhookId },
        });
        return c.json({ error: "Missing App ID" }, 400);
      }

      const signatureHeader = adapter.signatureHeader;
      const rawSignatureHeader = c.req.header(signatureHeader);
      const signature =
        rawSignatureHeader ??
        c.req.header(signatureHeader.charAt(0).toUpperCase() + signatureHeader.slice(1)) ??
        null;

      logger.debug({
        message: "Signature validation attempt",
        data: {
          provider,
          webhookId: pathWebhookId,
          signatureHeader,
          signaturePresent: signature !== null,
          signatureLength: signature?.length,
          signaturePreview: signature?.substring(0, 100),
        },
      });

      const isSignatureValid =
        signature !== null &&
        adapter.validateSignature(
          rawBody,
          signature,
          webhook.secret,
          adapter.timestampHeader ? c.req.header(adapter.timestampHeader) : undefined,
          adapter.idHeader ? c.req.header(adapter.idHeader) : undefined,
        );

      if (isSignatureValid === false) {
        const { providerEventId, parsedEventType } = getProviderEventDetails(json);
        const receivedAt = Date.now();
        const { isRetry, retryCount } = await getWebhookAttemptState(
          webhookAttemptCounts,
          pathWebhookId,
          providerEventId,
        );

        await recordWebhookDelivery({
          ...deliveryFeeds,
          ...buildWebhookDeliveryEntries({
            context: deliveryContext,
            providerEventId,
            parsedEventType,
            receivedAt,
            httpStatusCode: "401",
            responseBody: JSON.stringify({ error: "Invalid Signature" }),
            deliveryOutcome: "signature_error",
            isRetry,
            retryCount,
            error: "Invalid signature",
          }),
        });
        await incrementWebhookAttemptCount(
          webhookAttemptCounts,
          pathWebhookId,
          providerEventId,
          retryCount,
        );

        logger.error({
          message: "Invalid webhook signature",
          data: {
            appId,
            webhookId: pathWebhookId,
            provider,
          },
        });
        return c.json({ error: "Invalid Signature" }, 401);
      }

      let normalized: NormalizedEvent;
      try {
        normalized = adapter.normalizeEvent(json);
      } catch (normalizeError) {
        const errorMessage = normalizeError instanceof Error ? normalizeError.message : "Unknown";

        if (errorMessage.includes("Unsupported") === true) {
          const { providerEventId, parsedEventType } = getProviderEventDetails(json);
          const receivedAt = Date.now();
          const { isRetry, retryCount } = await getWebhookAttemptState(
            webhookAttemptCounts,
            pathWebhookId,
            providerEventId,
          );

          await recordWebhookDelivery({
            ...deliveryFeeds,
            ...buildWebhookDeliveryEntries({
              context: deliveryContext,
              providerEventId,
              parsedEventType,
              receivedAt,
              httpStatusCode: "200",
              responseBody: JSON.stringify({ received: true, processed: false, reason: errorMessage }),
              deliveryOutcome: "unsupported",
              isRetry,
              retryCount,
              error: errorMessage,
            }),
          });
          await incrementWebhookAttemptCount(
            webhookAttemptCounts,
            pathWebhookId,
            providerEventId,
            retryCount,
          );

          logger.debug({
            message: "Event acknowledged but not processed",
            data: {
              provider,
              appId,
              eventType: (json.type as string | undefined) ?? undefined,
              reason: errorMessage,
            },
          });
          return c.json({ received: true, processed: false, reason: errorMessage }, 200);
        }

        logger.error({
          message: "Failed to normalize webhook event",
          data: {
            provider,
            appId,
            errorMessage,
          },
        });
        return c.json({ error: "Failed to normalize event" }, 400);
      }

      const hasRegardeSDKId = regardeSDKId !== undefined && regardeSDKId !== "";
      if (hasRegardeSDKId === false) {
        logger.error({
          message: "RegardeSDK ID is required",
          data: {
            appId,
            jazzAccountId,
            normalized,
          },
        });
        return c.json({ error: "RegardeSDK ID is required" }, 400);
      }

      const { prefixedProviderEventUUID, providerEventId, eventType } = normalized;
      const isAlreadyProcessed = processedProviderEvents[prefixedProviderEventUUID] !== undefined;
      const receivedAt = Date.now();
      const { isRetry, retryCount } = await getWebhookAttemptState(
        webhookAttemptCounts,
        pathWebhookId,
        providerEventId,
      );

      await recordWebhookDelivery({
        ...deliveryFeeds,
        ...buildWebhookDeliveryEntries({
          context: deliveryContext,
          providerEventId,
          parsedEventType: eventType,
          receivedAt,
          httpStatusCode: "200",
          responseBody: JSON.stringify(
            isAlreadyProcessed === true
              ? { received: true, duplicate: true, retryCount }
              : { received: true },
          ),
          deliveryOutcome: isAlreadyProcessed === true ? "duplicate" : "processed",
          isRetry,
          retryCount,
        }),
      });
      await incrementWebhookAttemptCount(
        webhookAttemptCounts,
        pathWebhookId,
        providerEventId,
        retryCount,
      );

      if (isAlreadyProcessed === true) {
        logger.debug({
          message: "Event already processed (idempotent replay)",
          data: {
            prefixedProviderEventUUID,
            provider,
            appId,
            providerEventId,
            retryCount,
          },
        });
        return c.json({ received: true, duplicate: true, retryCount }, 200);
      }

      const userAccount = await co.account().load(jazzAccountId, {
        loadAs: worker,
      });
      if (userAccount.$isLoaded !== true) {
        logger.error({
          message: "Failed to load userAccount",
          data: {
            metadata: { operation: "create payment event" },
            userAccountIsLoaded: userAccount.$isLoaded,
            jazzAccountId,
            appId,
            provider,
          },
        });
        return c.json({ error: "Failed to load user account" }, 500);
      }

      const eventOwnerGroup = Group.create({
        owner: worker,
      });
      eventOwnerGroup.addMember(registryProfileWorkerGroup, "admin");
      eventOwnerGroup.addMember(userAccount, "reader");
      eventOwnerGroup.addMember(app.$jazz.owner, "reader");

      let eventId: string;

      try {
        if (normalized.data.kind === "payment") {
          eventId = await processPaymentEvent({
            normalized,
            data: normalized.data,
            eventOwnerGroup,
            jazzAccountId,
            appId,
            app,
            regardeSDKId,
            processedProviderEvents,
            worker,
            webhookId: pathWebhookId,
          });
        } else if (normalized.data.kind === "subscription") {
          eventId = await processSubscriptionEvent({
            normalized,
            data: normalized.data,
            eventOwnerGroup,
            jazzAccountId,
            appId,
            app,
            regardeSDKId,
            processedProviderEvents,
            worker,
            webhookId: pathWebhookId,
          });
        } else if (normalized.data.kind === "license") {
          eventId = await processLicenseEvent({
            normalized,
            data: normalized.data,
            eventOwnerGroup,
            jazzAccountId,
            appId,
            app,
            regardeSDKId,
            processedProviderEvents,
            worker,
            webhookId: pathWebhookId,
          });
        } else {
          return c.json({ error: "Unknown event kind" }, 400);
        }
      } catch (processingError) {
        const processingReceivedAt = Date.now();
        const processingAttemptState = await getWebhookAttemptState(
          webhookAttemptCounts,
          pathWebhookId,
          normalized.providerEventId,
        );
        const errorMessage =
          processingError instanceof Error ? processingError.message : "Processing failed";

        await recordWebhookDelivery({
          ...deliveryFeeds,
          ...buildWebhookDeliveryEntries({
            context: deliveryContext,
            providerEventId: normalized.providerEventId,
            parsedEventType: normalized.eventType,
            receivedAt: processingReceivedAt,
            httpStatusCode: "500",
            responseBody: JSON.stringify({ error: errorMessage }),
            deliveryOutcome: "processing_error",
            isRetry: processingAttemptState.isRetry,
            retryCount: processingAttemptState.retryCount,
            error: errorMessage,
          }),
        });
        await incrementWebhookAttemptCount(
          webhookAttemptCounts,
          pathWebhookId,
          normalized.providerEventId,
          processingAttemptState.retryCount,
        );
        throw processingError;
      }

      logger.info({
        message: "Webhook processing complete",
        data: {
          prefixedProviderEventUUID,
          eventId,
          provider,
          eventType: normalized.eventType,
          appId,
          jazzAccountId,
        },
      });

      return c.json({ received: true }, 200);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error({
        message: "Unexpected error in unified webhook handler",
        data: { errorMessage: message },
      });
      return c.json({ error: message }, 500);
    }
  };
};
