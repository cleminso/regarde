import { Account, Group, ID, Loaded, co } from "jazz-tools";

import {
  RegistryWorkerAccount,
  ProcessedProviderEvents,
  PaymentEvent,
  SubscriptionEvent,
  Subscription,
  LicenseEvent,
  CheckoutSession,
  Invoice,
  TRegardeApp,
  RegardeApp,
  RegardeSDK,
  TRegistryWorkerAccountRoot,
  type TRegistryWebhookDelivery,
  type TWebhook,
  type TWebhookEvent,
  useLogging,
  type TPaymentEventType,
  type TSubscriptionEventType,
  type TLicenseEventType,
  type TCheckoutSessionStatus,
} from "@regarde-dev/core";

import { getAdapter, isSupportedProvider } from "../adapters";
import type {
  NormalizedEvent,
  NormalizedPaymentData,
  NormalizedSubscriptionData,
  NormalizedLicenseData,
} from "../adapters";

const logger = useLogging({
  module: import.meta.filename,
});

const appendWebhookEvent = async (feed: TWebhook["events"], entry: TWebhookEvent): Promise<void> => {
  if (feed === null || feed.$isLoaded !== true) {
    return;
  }

  feed.$jazz.push(entry);
  await feed.$jazz.waitForSync();
};

const appendRegistryWebhookDelivery = async (
  feed: TRegistryWorkerAccountRoot["webhookDeliveries"],
  entry: TRegistryWebhookDelivery,
): Promise<void> => {
  if (feed === null || feed.$isLoaded !== true) {
    return;
  }

  feed.$jazz.push(entry);
  await feed.$jazz.waitForSync();
};

const getWebhookAttemptState = async (
  attemptCounts: TRegistryWorkerAccountRoot["webhookAttemptCounts"],
  webhookId: string,
  providerEventId: string,
): Promise<{ isRetry: boolean; retryCount: number }> => {
  if (attemptCounts === null || attemptCounts.$isLoaded !== true) {
    return { isRetry: false, retryCount: 0 };
  }

  const webhookCounts = attemptCounts[webhookId];
  if (webhookCounts === null || webhookCounts === undefined || webhookCounts.$isLoaded !== true) {
    return { isRetry: false, retryCount: 0 };
  }

  const loadedWebhookCounts = await webhookCounts.$jazz.ensureLoaded({
    resolve: { $each: true },
  });
  const retryCount = loadedWebhookCounts[providerEventId] ?? 0;

  return {
    isRetry: retryCount > 0,
    retryCount,
  };
};

const incrementWebhookAttemptCount = async (
  attemptCounts: TRegistryWorkerAccountRoot["webhookAttemptCounts"],
  webhookId: string,
  providerEventId: string,
  currentRetryCount: number,
): Promise<void> => {
  if (attemptCounts === null || attemptCounts.$isLoaded !== true) {
    return;
  }

  const webhookCounts = attemptCounts[webhookId];
  if (webhookCounts === null || webhookCounts === undefined || webhookCounts.$isLoaded !== true) {
    attemptCounts.$jazz.set(webhookId, {
      [providerEventId]: 1,
    });
    await attemptCounts.$jazz.waitForSync();
    return;
  }

  const loadedWebhookCounts = await webhookCounts.$jazz.ensureLoaded({
    resolve: { $each: true },
  });
  loadedWebhookCounts.$jazz.set(providerEventId, currentRetryCount + 1);
  await loadedWebhookCounts.$jazz.waitForSync();
};

// ---------------------------------------------------------------------------
// Unified Webhook Handler
// ---------------------------------------------------------------------------

export const unifiedWebhookHandler = (worker: Loaded<typeof RegistryWorkerAccount>) => {
  return async (c: any) => {
    try {
      const workerId = process.env.REGARDE_REGISTRY_GROUP;
      if (!workerId) {
        logger.debug({
          message: "Starting webhook handler, checking registry group",
          data: { workerId },
        });
        throw new Error("Missing `REGARDE_REGISTRY_GROUP` required environment variable");
      }

      // Extract provider from URL path: /v1/webhooks/{provider}/{appId}/{webhookId}
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

      // Capture raw body for signature verification
      const rawBody = await c.req.text();

      // For debugging Polar webhooks, log ALL headers
      const isPolarProvider = provider === "polar";
      const allHeaders = Object.fromEntries(
        Object.entries(c.req.header()).map(([key, value]) => [
          key,
          typeof value === "string" && value.length > 50 ? value.substring(0, 50) + "..." : value,
        ]),
      );

      const headers = isPolarProvider
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
      const json = JSON.parse(rawBody);
      logger.debug({
        message: "Webhook payload parsed",
        data: {
          provider,
          eventType: json.type || json.meta?.event_name, // Stripe
          hasMetadata: !!(
            json.data?.object?.metadata ||
            json.meta?.custom_data ||
            json.data?.metadata
          ),
          payloadKeys: Object.keys(json),
          dataKeys: json.data ? Object.keys(json.data) : null,
        },
      });

      // Extract IDs from URL path: /v1/webhooks/{provider}/{appId}/{webhookId}
      const pathAppId = c.req.param("appId");
      const pathWebhookId = c.req.param("webhookId");

      // Load the App with webhooks
      const appRef = await RegardeApp.load(pathAppId, {
        loadAs: worker,
        resolve: {
          webhooks: { $each: { events: true } },
          payments: { all: true, byUser: true },
          subscriptions: { all: true, byUser: true },
          licenses: { all: true, byUser: true },
        },
      });

      if (!appRef.$jazz.id) {
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

      // Find specific webhook by ID
      const webhook = app.webhooks.find((w: TWebhook) => w.$jazz.id === pathWebhookId);
      const isWebhookLoaded =
        webhook !== undefined && webhook !== null && webhook.$isLoaded === true;

      if (isWebhookLoaded === false) {
        logger.error({
          message: "Webhook not found",
          data: {
            appId: pathAppId,
            webhookId: pathWebhookId,
            availableWebhooks: app.webhooks.map((w: TWebhook) => w.$jazz.id),
          },
        });
        return c.json({ error: "Webhook not found" }, 404);
      }

      // TODO: Do I need this? Check if webhook is enabled
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

      // Load worker resources needed for idempotency and admin analytics
      const registryProfileWorkerGroup = await co.group().load(workerId, {
        loadAs: worker,
      });

      const isGroupLoaded = registryProfileWorkerGroup.$isLoaded === true;
      if (isGroupLoaded === false) {
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
      const isProcessedEventsLoaded =
        processedProviderEvents !== null &&
        processedProviderEvents !== undefined &&
        processedProviderEvents.$isLoaded === true;
      if (isProcessedEventsLoaded === false) {
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

      // Capture headers for debugging and storage
      // Convert all values to strings (JSON.stringify for non-strings)
      const requestHeaders = Object.fromEntries(
        Object.entries(c.req.header()).map(([key, value]) => [
          key,
          typeof value === "string" ? value : JSON.stringify(value),
        ]),
      );

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
          pathAppId: pathAppId,
          regarde_user_id: queryParams.regarde_user_id,
          regarde_sdk_id: queryParams.regarde_sdk_id,
        });
      } catch (extractError) {
        // Extract provider event info from raw payload for error logging
        const rawProviderEventId = json.id || json.meta?.event_id || "unknown";
        const rawEventType = json.type || json.meta?.event_name || "unknown";

        const receivedAt = Date.now();
        const { isRetry, retryCount } = await getWebhookAttemptState(
          webhookAttemptCounts,
          pathWebhookId,
          rawProviderEventId,
        );

        await appendWebhookEvent(webhook.events, {
          payload: json,
          headers: requestHeaders,
          receivedAt,
          regardeEventId: undefined,
          providerEventId: rawProviderEventId,
          parsedEventType: rawEventType,
          error:
            extractError instanceof Error
              ? extractError.message
              : "Failed to extract context from payload",
          httpStatusCode: "400",
          responseBody: JSON.stringify({
            error: "Missing required context in webhook payload",
          }),
          webhookId: pathWebhookId,
        });
        await appendRegistryWebhookDelivery(webhookDeliveries, {
          appId: pathAppId,
          ownerAccountId: app.ownerAccountId,
          webhookId: pathWebhookId,
          provider: webhook.provider,
          environment: webhook.environment,
          providerEventId: rawProviderEventId,
          parsedEventType: rawEventType,
          receivedAt,
          httpStatusCode: "400",
          error:
            extractError instanceof Error
              ? extractError.message
              : "Failed to extract context from payload",
          regardeEventId: undefined,
          deliveryOutcome: "context_error",
          isRetry,
          retryCount,
        });
        await incrementWebhookAttemptCount(
          webhookAttemptCounts,
          pathWebhookId,
          rawProviderEventId,
          retryCount,
        );

        logger.error({
          message: "Failed to extract context from webhook payload",
          data: {
            provider,
            pathAppId,
            webhookId: pathWebhookId,
            errorMessage: extractError instanceof Error ? extractError.message : "Unknown",
            availableMetadataSources: {
              stripeMetadata: json.data?.object?.metadata,
              polarMetadata: json.data?.metadata,
            },
          },
        });
        return c.json({ error: "Missing required context in webhook payload" }, 400);
      }

      const appId = ctx.appId as ID<Account>;
      const { jazzAccountId, regardeSDKId } = ctx;

      const isAppIdValid = appId !== null && appId !== undefined && appId !== "";
      if (isAppIdValid === false) {
        logger.error({
          message: "Missing App ID",
          data: { provider, pathAppId, webhookId: pathWebhookId },
        });
        return c.json({ error: "Missing App ID" }, 400);
      }

      // Validate webhook signature using webhook-specific secret
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
        // Extract provider event info from raw payload for error logging
        const sigErrorProviderEventId = json.id || json.meta?.event_id || "unknown";
        const sigErrorEventType = json.type || json.meta?.event_name || "unknown";

        const receivedAt = Date.now();
        const { isRetry, retryCount } = await getWebhookAttemptState(
          webhookAttemptCounts,
          pathWebhookId,
          sigErrorProviderEventId,
        );

        await appendWebhookEvent(webhook.events, {
          payload: json,
          headers: requestHeaders,
          receivedAt,
          regardeEventId: undefined,
          providerEventId: sigErrorProviderEventId,
          parsedEventType: sigErrorEventType,
          error: "Invalid signature",
          httpStatusCode: "401",
          responseBody: JSON.stringify({ error: "Invalid Signature" }),
          webhookId: pathWebhookId,
        });
        await appendRegistryWebhookDelivery(webhookDeliveries, {
          appId: pathAppId,
          ownerAccountId: app.ownerAccountId,
          webhookId: pathWebhookId,
          provider: webhook.provider,
          environment: webhook.environment,
          providerEventId: sigErrorProviderEventId,
          parsedEventType: sigErrorEventType,
          receivedAt,
          httpStatusCode: "401",
          error: "Invalid signature",
          regardeEventId: undefined,
          deliveryOutcome: "signature_error",
          isRetry,
          retryCount,
        });
        await incrementWebhookAttemptCount(
          webhookAttemptCounts,
          pathWebhookId,
          sigErrorProviderEventId,
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

      // Normalize event
      let normalized: NormalizedEvent;
      try {
        normalized = adapter.normalizeEvent(json);
      } catch (normalizeError) {
        const errorMessage = normalizeError instanceof Error ? normalizeError.message : "Unknown";

        // Check if this is an unsupported event type (not an error, just not processed)
        if (errorMessage.includes("Unsupported")) {
          const unsupportedProviderEventId = json.id || json.meta?.event_id || "unknown";
          const unsupportedParsedEventType = json.type || json.meta?.event_name || "unknown";
          const receivedAt = Date.now();
          const { isRetry, retryCount } = await getWebhookAttemptState(
            webhookAttemptCounts,
            pathWebhookId,
            unsupportedProviderEventId,
          );
          await appendWebhookEvent(webhook.events, {
            payload: json,
            headers: requestHeaders,
            receivedAt,
            regardeEventId: undefined,
            providerEventId: unsupportedProviderEventId,
            parsedEventType: unsupportedParsedEventType,
            error: errorMessage,
            httpStatusCode: "200",
            responseBody: JSON.stringify({ received: true, processed: false, reason: errorMessage }),
            webhookId: pathWebhookId,
          });
          await appendRegistryWebhookDelivery(webhookDeliveries, {
            appId: pathAppId,
            ownerAccountId: app.ownerAccountId,
            webhookId: pathWebhookId,
            provider: webhook.provider,
            environment: webhook.environment,
            providerEventId: unsupportedProviderEventId,
            parsedEventType: unsupportedParsedEventType,
            receivedAt,
            httpStatusCode: "200",
            error: errorMessage,
            regardeEventId: undefined,
            deliveryOutcome: "unsupported",
            isRetry,
            retryCount,
          });
          await incrementWebhookAttemptCount(
            webhookAttemptCounts,
            pathWebhookId,
            unsupportedProviderEventId,
            retryCount,
          );
          logger.debug({
            message: "Event acknowledged but not processed",
            data: {
              provider,
              appId,
              eventType: json.type,
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

      const isRegardeSDKIdValid = regardeSDKId !== undefined && regardeSDKId !== "";
      if (isRegardeSDKIdValid === false) {
        logger.error({
          message: "RegardeSDK ID is required",
          data: {
            appId, // which app configuration is broken?
            jazzAccountId, // which user account is involved?
            normalized, // what did provider actually send?
          },
        });
        return c.json({ error: "RegardeSDK ID is required" }, 400);
      }

      const { prefixedProviderEventUUID, providerEventId, eventType } = normalized;

      // Calculate retry tracking
      const isAlreadyProcessed = processedProviderEvents[prefixedProviderEventUUID] !== undefined;
      const receivedAt = Date.now();
      const { isRetry, retryCount } = await getWebhookAttemptState(
        webhookAttemptCounts,
        pathWebhookId,
        providerEventId,
      );

      const eventEntry = {
        payload: json,
        headers: requestHeaders,
        receivedAt,
        providerEventId,
        parsedEventType: eventType,
        httpStatusCode: isAlreadyProcessed === true ? "200" : "200",
        responseBody: JSON.stringify(
          isAlreadyProcessed === true
            ? { received: true, duplicate: true, retryCount }
            : { received: true },
        ),
        webhookId: pathWebhookId,
      };

      await appendWebhookEvent(webhook.events, eventEntry);
      await appendRegistryWebhookDelivery(webhookDeliveries, {
        appId: pathAppId,
        ownerAccountId: app.ownerAccountId,
        webhookId: pathWebhookId,
        provider: webhook.provider,
        environment: webhook.environment,
        providerEventId,
        parsedEventType: eventType,
        receivedAt,
        httpStatusCode: eventEntry.httpStatusCode,
        error: undefined,
        regardeEventId: undefined,
        deliveryOutcome: isAlreadyProcessed === true ? "duplicate" : "processed",
        isRetry,
        retryCount,
      });
      await incrementWebhookAttemptCount(
        webhookAttemptCounts,
        pathWebhookId,
        providerEventId,
        retryCount,
      );

      // Check idempotency - skip normalization if already processed
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

      // Load user account
      const userAccount = await co.account().load(jazzAccountId, {
        loadAs: worker,
      });
      const isUserAccountLoaded = userAccount.$isLoaded === true;
      if (isUserAccountLoaded === false) {
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

      // Create ownership group for the event CoMaps
      const eventOwnerGroup = Group.create({
        owner: worker,
      });
      eventOwnerGroup.addMember(registryProfileWorkerGroup, "admin");
      eventOwnerGroup.addMember(userAccount, "reader");
      eventOwnerGroup.addMember(app.$jazz.owner, "reader");

      // Route to appropriate event handler based on data kind
      let eventId: string;

      try {
        if (normalized.data.kind === "payment") {
          eventId = await handlePaymentEvent(
            normalized,
            normalized.data,
            eventOwnerGroup,
            jazzAccountId,
            appId,
            app,
            regardeSDKId,
            processedProviderEvents,
            worker,
            pathWebhookId,
          );
        } else if (normalized.data.kind === "subscription") {
          eventId = await handleSubscriptionEvent(
            normalized,
            normalized.data,
            eventOwnerGroup,
            jazzAccountId,
            appId,
            app,
            regardeSDKId,
            processedProviderEvents,
            worker,
            pathWebhookId,
          );
        } else if (normalized.data.kind === "license") {
          eventId = await handleLicenseEvent(
            normalized,
            normalized.data,
            eventOwnerGroup,
            jazzAccountId,
            appId,
            app,
            regardeSDKId,
            processedProviderEvents,
            worker,
            pathWebhookId,
          );
        } else {
          return c.json({ error: "Unknown event kind" }, 400);
        }
      } catch (processingError) {
        const receivedAt = Date.now();
        const { isRetry, retryCount } = await getWebhookAttemptState(
          webhookAttemptCounts,
          pathWebhookId,
          normalized.providerEventId,
        );

        const errorMessage =
          processingError instanceof Error ? processingError.message : "Processing failed";
        await appendWebhookEvent(webhook.events, {
          payload: json,
          headers: requestHeaders,
          receivedAt,
          regardeEventId: undefined,
          providerEventId: normalized.providerEventId,
          parsedEventType: normalized.eventType,
          error: errorMessage,
          httpStatusCode: "500",
          responseBody: JSON.stringify({ error: errorMessage }),
          webhookId: pathWebhookId,
        });
        await appendRegistryWebhookDelivery(webhookDeliveries, {
          appId: pathAppId,
          ownerAccountId: app.ownerAccountId,
          webhookId: pathWebhookId,
          provider: webhook.provider,
          environment: webhook.environment,
          providerEventId: normalized.providerEventId,
          parsedEventType: normalized.eventType,
          receivedAt,
          httpStatusCode: "500",
          error: errorMessage,
          regardeEventId: undefined,
          deliveryOutcome: "processing_error",
          isRetry,
          retryCount,
        });
        await incrementWebhookAttemptCount(
          webhookAttemptCounts,
          pathWebhookId,
          normalized.providerEventId,
          retryCount,
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

// ---------------------------------------------------------------------------
// Payment Event Handler
// ---------------------------------------------------------------------------

const handlePaymentEvent = async (
  normalized: NormalizedEvent,
  data: NormalizedPaymentData,
  eventOwnerGroup: ReturnType<typeof Group.create>,
  jazzAccountId: string,
  appId: string,
  app: TRegardeApp,
  regardeSDKId: string,
  processedProviderEvents: co.loaded<typeof ProcessedProviderEvents>,
  worker: Loaded<typeof RegistryWorkerAccount>,
  webhookId: string,
): Promise<string> => {
  const event = PaymentEvent.create(
    {
      webhookId,
      provider: normalized.provider,
      mode: normalized.mode,
      providerEventId: normalized.providerEventId,
      prefixedProviderEventUUID: normalized.prefixedProviderEventUUID,
      eventType: normalized.eventType as TPaymentEventType,
      appId: appId,
      userAccountId: jazzAccountId,
      amount: data.amount,
      currency: data.currency,
      status: data.status,
      providerSubscriptionId: data.providerSubscriptionId,
      providerLicenseId: data.providerLicenseId,
      providerMetadata: { ...normalized.providerMetadata },
      metadata: {},
      timestamp: normalized.timestamp,
    },
    { owner: eventOwnerGroup },
  );

  await event.$jazz.waitForSync();

  // Mark as processed
  processedProviderEvents.$jazz.set(normalized.prefixedProviderEventUUID, event.$jazz.id);
  await processedProviderEvents.$jazz.waitForSync();

  // Index into user SDK
  await indexPaymentEventToUser(
    event.$jazz.id,
    normalized.prefixedProviderEventUUID,
    appId,
    regardeSDKId,
    worker,
  );

  // Index into App
  await indexPaymentEventToApp(
    event.$jazz.id,
    normalized.prefixedProviderEventUUID,
    jazzAccountId,
    app,
  );

  // If payment is linked to a subscription, update the Subscription state
  if (data.providerSubscriptionId) {
    await updateSubscriptionFromPayment(
      event.$jazz.id,
      data.providerSubscriptionId,
      regardeSDKId,
      worker,
    );
  }

  // Update CheckoutSession status if this payment is linked to a checkout
  await updateCheckoutSessionFromPayment(normalized, event.$jazz.id, app, worker);

  // Create Invoice for successful payments
  await createInvoiceFromPayment(
    normalized,
    data,
    event.$jazz.id,
    app,
    jazzAccountId,
    eventOwnerGroup,
    worker,
  );

  return event.$jazz.id;
};

// ---------------------------------------------------------------------------
// Subscription Event Handler
// ---------------------------------------------------------------------------

const handleSubscriptionEvent = async (
  normalized: NormalizedEvent,
  data: NormalizedSubscriptionData,
  eventOwnerGroup: ReturnType<typeof Group.create>,
  jazzAccountId: string,
  appId: string,
  app: TRegardeApp,
  regardeSDKId: string,
  processedProviderEvents: co.loaded<typeof ProcessedProviderEvents>,
  worker: Loaded<typeof RegistryWorkerAccount>,
  webhookId: string,
): Promise<string> => {
  const event = SubscriptionEvent.create(
    {
      webhookId,
      provider: normalized.provider,
      mode: normalized.mode,
      providerEventId: normalized.providerEventId,
      prefixedProviderEventUUID: normalized.prefixedProviderEventUUID,
      eventType: normalized.eventType as TSubscriptionEventType,
      appId: appId,
      userAccountId: jazzAccountId,
      providerSubscriptionId: data.providerSubscriptionId,
      status: data.status,
      currentPeriodStart: data.currentPeriodStart,
      currentPeriodEnd: data.currentPeriodEnd,
      planId: data.planId,
      providerMetadata: { ...normalized.providerMetadata },
      metadata: {},
      timestamp: normalized.timestamp,
    },
    { owner: eventOwnerGroup },
  );

  await event.$jazz.waitForSync();

  // Mark as processed
  processedProviderEvents.$jazz.set(normalized.prefixedProviderEventUUID, event.$jazz.id);
  await processedProviderEvents.$jazz.waitForSync();

  // Index into user SDK
  await indexSubscriptionEventToUser(
    event.$jazz.id,
    normalized.prefixedProviderEventUUID,
    appId,
    regardeSDKId,
    worker,
  );

  // Index into App
  await indexSubscriptionEventToApp(
    event.$jazz.id,
    normalized.prefixedProviderEventUUID,
    jazzAccountId,
    app,
  );

  // Manage Subscription mutable state
  await manageSubscriptionState(
    normalized,
    data,
    event.$jazz.id,
    eventOwnerGroup,
    jazzAccountId,
    appId,
    regardeSDKId,
    worker,
  );

  return event.$jazz.id;
};

// ---------------------------------------------------------------------------
// License Event Handler
// ---------------------------------------------------------------------------

const handleLicenseEvent = async (
  normalized: NormalizedEvent,
  data: NormalizedLicenseData,
  eventOwnerGroup: ReturnType<typeof Group.create>,
  jazzAccountId: string,
  appId: string,
  app: TRegardeApp,
  regardeSDKId: string,
  processedProviderEvents: co.loaded<typeof ProcessedProviderEvents>,
  worker: Loaded<typeof RegistryWorkerAccount>,
  webhookId: string,
): Promise<string> => {
  const event = LicenseEvent.create(
    {
      webhookId,
      provider: normalized.provider,
      mode: normalized.mode,
      providerEventId: normalized.providerEventId,
      prefixedProviderEventUUID: normalized.prefixedProviderEventUUID,
      eventType: normalized.eventType as TLicenseEventType,
      appId: appId,
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

  // Mark as processed
  processedProviderEvents.$jazz.set(normalized.prefixedProviderEventUUID, event.$jazz.id);
  await processedProviderEvents.$jazz.waitForSync();

  // Index into user SDK
  await indexLicenseEventToUser(
    event.$jazz.id,
    normalized.prefixedProviderEventUUID,
    appId,
    regardeSDKId,
    worker,
  );

  // Index into App
  await indexLicenseEventToApp(
    event.$jazz.id,
    normalized.prefixedProviderEventUUID,
    jazzAccountId,
    app,
  );

  return event.$jazz.id;
};

// ---------------------------------------------------------------------------
// User SDK Indexing
// ---------------------------------------------------------------------------

const indexPaymentEventToUser = async (
  eventId: string,
  prefixedProviderEventUUID: string,
  appId: string,
  regardeSDKId: string,
  worker: Loaded<typeof RegistryWorkerAccount>,
): Promise<void> => {
  const userSDK = await RegardeSDK.load(regardeSDKId, {
    loadAs: worker,
    resolve: {
      myPayments: {
        all: { $each: true },
        byApp: { $each: true },
      },
    },
  });

  const isUserSDKLoaded = userSDK.$isLoaded === true;
  if (isUserSDKLoaded === false) {
    logger.error({
      message: "Failed to load user RegardeSDK for payment indexing",
      data: { regardeSDKId },
    });
    return;
  }

  const { myPayments } = await userSDK.$jazz.ensureLoaded({
    resolve: {
      myPayments: {
        all: { $each: true },
        byApp: true,
      },
    },
  });

  if (myPayments.all.$jazz.has(prefixedProviderEventUUID) === false) {
    myPayments.all.$jazz.set(prefixedProviderEventUUID, eventId);
    await myPayments.$jazz.waitForSync();
  }

  if (myPayments.byApp.$jazz.has(appId) === false) {
    myPayments.byApp.$jazz.set(appId, {
      [prefixedProviderEventUUID]: eventId,
    });
  } else if (myPayments.byApp[appId].$jazz.has(prefixedProviderEventUUID) === false) {
    myPayments.byApp[appId].$jazz.set(prefixedProviderEventUUID, eventId);
  }
  await myPayments.$jazz.waitForSync();
};

const indexSubscriptionEventToUser = async (
  eventId: string,
  prefixedProviderEventUUID: string,
  appId: string,
  regardeSDKId: string,
  worker: Loaded<typeof RegistryWorkerAccount>,
): Promise<void> => {
  const userSDK = await RegardeSDK.load(regardeSDKId, {
    loadAs: worker,
    resolve: {
      mySubscriptions: {
        all: { $each: true },
        byApp: { $each: true },
        status: { $each: true },
      },
    },
  });

  const isUserSDKLoaded = userSDK.$isLoaded === true;
  if (isUserSDKLoaded === false) {
    logger.error({
      message: "Failed to load user RegardeSDK for subscription indexing",
      data: { regardeSDKId },
    });
    return;
  }

  const { mySubscriptions } = await userSDK.$jazz.ensureLoaded({
    resolve: {
      mySubscriptions: {
        all: { $each: true },
        byApp: true,
      },
    },
  });

  if (mySubscriptions.all.$jazz.has(prefixedProviderEventUUID) === false) {
    mySubscriptions.all.$jazz.set(prefixedProviderEventUUID, eventId);
    await mySubscriptions.$jazz.waitForSync();
  }

  if (mySubscriptions.byApp.$jazz.has(appId) === false) {
    mySubscriptions.byApp.$jazz.set(appId, {
      [prefixedProviderEventUUID]: eventId,
    });
  } else if (mySubscriptions.byApp[appId].$jazz.has(prefixedProviderEventUUID) === false) {
    mySubscriptions.byApp[appId].$jazz.set(prefixedProviderEventUUID, eventId);
  }
  await mySubscriptions.$jazz.waitForSync();
};

const indexLicenseEventToUser = async (
  eventId: string,
  prefixedProviderEventUUID: string,
  appId: string,
  regardeSDKId: string,
  worker: Loaded<typeof RegistryWorkerAccount>,
): Promise<void> => {
  const userSDK = await RegardeSDK.load(regardeSDKId, {
    loadAs: worker,
    resolve: {
      myLicenses: {
        all: { $each: true },
        byApp: { $each: true },
      },
    },
  });

  const isUserSDKLoaded = userSDK.$isLoaded === true;
  if (isUserSDKLoaded === false) {
    logger.error({
      message: "Failed to load user RegardeSDK for license indexing",
      data: { regardeSDKId },
    });
    return;
  }

  const { myLicenses } = await userSDK.$jazz.ensureLoaded({
    resolve: {
      myLicenses: {
        all: { $each: true },
        byApp: true,
      },
    },
  });

  if (myLicenses.all.$jazz.has(prefixedProviderEventUUID) === false) {
    myLicenses.all.$jazz.set(prefixedProviderEventUUID, eventId);
    await myLicenses.$jazz.waitForSync();
  }

  if (myLicenses.byApp.$jazz.has(appId) === false) {
    myLicenses.byApp.$jazz.set(appId, {
      [prefixedProviderEventUUID]: eventId,
    });
  } else if (myLicenses.byApp[appId].$jazz.has(prefixedProviderEventUUID) === false) {
    myLicenses.byApp[appId].$jazz.set(prefixedProviderEventUUID, eventId);
  }
  await myLicenses.$jazz.waitForSync();
};

// ---------------------------------------------------------------------------
// App-Level Indexing
// ---------------------------------------------------------------------------

const indexPaymentEventToApp = async (
  eventId: string,
  prefixedProviderEventUUID: string,
  jazzAccountId: string,
  app: TRegardeApp,
): Promise<void> => {
  const isPaymentsLoaded = app.payments !== null && app.payments.$isLoaded === true;
  if (isPaymentsLoaded === false) {
    logger.error({
      message: "App payments not loaded for indexing",
      data: { appId: app.$jazz.id },
    });
    return;
  }
  const appPayments = await app.payments.$jazz.ensureLoaded({
    resolve: { all: { $each: true }, byUser: true },
  });
  const appPaymentsByUser = await appPayments.byUser.$jazz.ensureLoaded({
    resolve: { $each: true },
  });

  if (appPayments.all.$jazz.has(prefixedProviderEventUUID) === false) {
    appPayments.all.$jazz.set(prefixedProviderEventUUID, eventId);
    await app.$jazz.waitForSync();
  }

  if (appPaymentsByUser.$jazz.has(jazzAccountId) === false) {
    appPaymentsByUser.$jazz.set(jazzAccountId, {
      [prefixedProviderEventUUID]: eventId,
    });
  } else if (appPaymentsByUser[jazzAccountId].$jazz.has(prefixedProviderEventUUID) === false) {
    appPaymentsByUser[jazzAccountId].$jazz.set(prefixedProviderEventUUID, eventId);
  }
  await app.$jazz.waitForSync();
};

const indexSubscriptionEventToApp = async (
  eventId: string,
  prefixedProviderEventUUID: string,
  jazzAccountId: string,
  app: TRegardeApp,
): Promise<void> => {
  const isSubscriptionsLoaded = app.subscriptions !== null && app.subscriptions.$isLoaded === true;
  if (isSubscriptionsLoaded === false) {
    logger.error({
      message: "App subscriptions not loaded for indexing",
      data: { appId: app.$jazz.id },
    });
    return;
  }
  const appSubscriptions = await app.subscriptions.$jazz.ensureLoaded({
    resolve: { all: { $each: true }, byUser: true },
  });
  const appSubscriptionsByUser = await appSubscriptions.byUser.$jazz.ensureLoaded({
    resolve: { $each: true },
  });

  if (appSubscriptions.all.$jazz.has(prefixedProviderEventUUID) === false) {
    appSubscriptions.all.$jazz.set(prefixedProviderEventUUID, eventId);
    await app.$jazz.waitForSync();
  }

  if (appSubscriptionsByUser.$jazz.has(jazzAccountId) === false) {
    appSubscriptionsByUser.$jazz.set(jazzAccountId, {
      [prefixedProviderEventUUID]: eventId,
    });
  } else if (appSubscriptionsByUser[jazzAccountId].$jazz.has(prefixedProviderEventUUID) === false) {
    appSubscriptionsByUser[jazzAccountId].$jazz.set(prefixedProviderEventUUID, eventId);
  }
  await app.$jazz.waitForSync();
};

const indexLicenseEventToApp = async (
  eventId: string,
  prefixedProviderEventUUID: string,
  jazzAccountId: string,
  app: TRegardeApp,
): Promise<void> => {
  const isLicensesLoaded = app.licenses !== null && app.licenses.$isLoaded === true;
  if (isLicensesLoaded === false) {
    logger.error({
      message: "App licenses not loaded for indexing",
      data: { appId: app.$jazz.id },
    });
    return;
  }
  const appLicenses = await app.licenses.$jazz.ensureLoaded({
    resolve: { all: { $each: true }, byUser: true },
  });
  const appLicensesByUser = await appLicenses.byUser.$jazz.ensureLoaded({
    resolve: { $each: true },
  });

  if (appLicenses.all.$jazz.has(prefixedProviderEventUUID) === false) {
    appLicenses.all.$jazz.set(prefixedProviderEventUUID, eventId);
    await app.$jazz.waitForSync();
  }

  if (appLicensesByUser.$jazz.has(jazzAccountId) === false) {
    appLicensesByUser.$jazz.set(jazzAccountId, {
      [prefixedProviderEventUUID]: eventId,
    });
  } else if (appLicensesByUser[jazzAccountId].$jazz.has(prefixedProviderEventUUID) === false) {
    appLicensesByUser[jazzAccountId].$jazz.set(prefixedProviderEventUUID, eventId);
  }
  await app.$jazz.waitForSync();
};

// ---------------------------------------------------------------------------
// Subscription State Management
// ---------------------------------------------------------------------------

const manageSubscriptionState = async (
  normalized: NormalizedEvent,
  data: NormalizedSubscriptionData,
  subscriptionEventId: string,
  eventOwnerGroup: ReturnType<typeof Group.create>,
  jazzAccountId: string,
  appId: string,
  regardeSDKId: string,
  worker: Loaded<typeof RegistryWorkerAccount>,
): Promise<void> => {
  const userSDK = await RegardeSDK.load(regardeSDKId, {
    loadAs: worker,
    resolve: {
      mySubscriptions: {
        status: { $each: true },
      },
    },
  });

  const isUserSDKLoaded = userSDK.$isLoaded === true;
  if (isUserSDKLoaded === false) {
    logger.error({
      message: "Failed to load user SDK for subscription state management",
      data: { regardeSDKId },
    });
    return;
  }

  const { mySubscriptions } = await userSDK.$jazz.ensureLoaded({
    resolve: {
      mySubscriptions: {
        status: { $each: true },
      },
    },
  });

  const existingSubId = mySubscriptions.status[data.providerSubscriptionId];

  if (existingSubId && normalized.eventType !== "subscription.created") {
    // Update existing subscription
    const existingSub = await Subscription.load(existingSubId, {
      loadAs: worker,
    });

    const isSubLoaded = existingSub !== null && existingSub.$isLoaded === true;
    if (isSubLoaded === false) {
      logger.error({
        message: "Failed to load existing Subscription for update",
        data: {
          existingSubId,
          providerSubscriptionId: data.providerSubscriptionId,
        },
      });
      return;
    }

    existingSub.$jazz.set("status", data.status);
    existingSub.$jazz.set("lastSubscriptionEventId", subscriptionEventId);
    existingSub.$jazz.set("updatedAt", normalized.timestamp);

    if (data.currentPeriodStart !== undefined) {
      existingSub.$jazz.set("currentPeriodStart", data.currentPeriodStart);
    }
    if (data.currentPeriodEnd !== undefined) {
      existingSub.$jazz.set("currentPeriodEnd", data.currentPeriodEnd);
    }
    if (data.planId !== undefined) {
      existingSub.$jazz.set("planId", data.planId);
    }
    if (data.cancelAtPeriodEnd !== undefined) {
      existingSub.$jazz.set("cancelAtPeriodEnd", data.cancelAtPeriodEnd);
    }
    if (normalized.eventType === "subscription.canceled") {
      existingSub.$jazz.set("canceledByEventId", subscriptionEventId);
    }

    await existingSub.$jazz.waitForSync();
  } else {
    // Create new subscription state
    const subscription = Subscription.create(
      {
        appId: appId,
        userAccountId: jazzAccountId,
        provider: normalized.provider,
        providerSubscriptionId: data.providerSubscriptionId,
        createdByEventId: subscriptionEventId,
        lastSubscriptionEventId: subscriptionEventId,
        status: data.status,
        currentPeriodStart: data.currentPeriodStart ?? normalized.timestamp,
        currentPeriodEnd: data.currentPeriodEnd ?? normalized.timestamp,
        planId: data.planId ?? "",
        cancelAtPeriodEnd: data.cancelAtPeriodEnd ?? false,
        createdAt: normalized.timestamp,
        updatedAt: normalized.timestamp,
      },
      { owner: eventOwnerGroup },
    );

    await subscription.$jazz.waitForSync();

    // Index by providerSubscriptionId
    mySubscriptions.status.$jazz.set(data.providerSubscriptionId, subscription.$jazz.id);
    await mySubscriptions.$jazz.waitForSync();
  }
};

const updateSubscriptionFromPayment = async (
  paymentEventId: string,
  providerSubscriptionId: string,
  regardeSDKId: string,
  worker: Loaded<typeof RegistryWorkerAccount>,
): Promise<void> => {
  const userSDK = await RegardeSDK.load(regardeSDKId, {
    loadAs: worker,
    resolve: {
      mySubscriptions: {
        status: { $each: true },
      },
    },
  });

  const isUserSDKLoaded = userSDK.$isLoaded === true;
  if (isUserSDKLoaded === false) return;

  const { mySubscriptions } = await userSDK.$jazz.ensureLoaded({
    resolve: { mySubscriptions: { status: { $each: true } } },
  });

  const existingSubId = mySubscriptions.status[providerSubscriptionId];
  if (!existingSubId) return;

  const existingSub = await Subscription.load(existingSubId, {
    loadAs: worker,
  });

  const isSubLoaded = existingSub !== null && existingSub.$isLoaded === true;
  if (isSubLoaded === false) return;

  existingSub.$jazz.set("lastPaymentEventId", paymentEventId);
  existingSub.$jazz.set("updatedAt", Date.now());
  await existingSub.$jazz.waitForSync();
};

// ---------------------------------------------------------------------------
// CheckoutSession Update
// ---------------------------------------------------------------------------

const updateCheckoutSessionFromPayment = async (
  normalized: NormalizedEvent,
  paymentEventId: string,
  app: TRegardeApp,
  worker: Loaded<typeof RegistryWorkerAccount>,
): Promise<void> => {
  const providerMetadata = normalized.providerMetadata;
  const checkoutSessionId = providerMetadata.regarde_session_id;

  const hasCheckoutSessionId =
    checkoutSessionId !== undefined && checkoutSessionId !== null && checkoutSessionId !== "";
  if (hasCheckoutSessionId === false) {
    return;
  }

  const checkoutSession = await CheckoutSession.load(checkoutSessionId, {
    loadAs: worker,
  });

  const isSessionLoaded =
    checkoutSession !== null && checkoutSession !== undefined && checkoutSession.$isLoaded === true;
  if (isSessionLoaded === false) {
    logger.warn({
      message: "CheckoutSession not found for payment event",
      data: { checkoutSessionId, paymentEventId },
    });
    return;
  }

  let newStatus: TCheckoutSessionStatus | undefined;
  switch (normalized.eventType) {
    case "payment.checkout_completed":
    case "payment.succeeded":
      newStatus = "succeeded";
      break;
    case "payment.failed":
    case "payment.canceled":
      newStatus = "failed";
      break;
    case "payment.checkout_expired":
      newStatus = "expired";
      break;
    default:
      break;
  }

  const shouldUpdateStatus = newStatus !== undefined;
  if (shouldUpdateStatus === true) {
    checkoutSession.$jazz.set("status", newStatus as TCheckoutSessionStatus);
    checkoutSession.$jazz.set("completedAt", normalized.timestamp);
    checkoutSession.$jazz.set("paymentEventId", paymentEventId);
    await checkoutSession.$jazz.waitForSync();

    logger.info({
      message: "Updated CheckoutSession status",
      data: {
        checkoutSessionId,
        status: newStatus,
        paymentEventId,
      },
    });
  }
};

// ---------------------------------------------------------------------------
// Invoice Creation
// ---------------------------------------------------------------------------

const createInvoiceFromPayment = async (
  normalized: NormalizedEvent,
  data: NormalizedPaymentData,
  paymentEventId: string,
  app: TRegardeApp,
  jazzAccountId: string,
  eventOwnerGroup: ReturnType<typeof Group.create>,
  worker: Loaded<typeof RegistryWorkerAccount>,
): Promise<void> => {
  const isSuccessfulPayment = data.status === "succeeded";
  if (isSuccessfulPayment === false) {
    return;
  }

  const amountNum = parseInt(data.amount, 10);
  const isAmountValid = Number.isNaN(amountNum) === false;

  const invoice = Invoice.create(
    {
      appId: app.$jazz.id,
      userAccountId: jazzAccountId,
      paymentEventId,
      provider: normalized.provider,
      invoiceNumber: `INV-${Date.now()}`,
      date: normalized.timestamp,
      amount: isAmountValid ? amountNum : 0,
      currency: data.currency.toUpperCase(),
      description: `Payment via ${normalized.provider}`,
      items: [
        {
          description: "Payment",
          quantity: 1,
          unitPrice: isAmountValid ? amountNum : 0,
          total: isAmountValid ? amountNum : 0,
        },
      ],
      subtotal: isAmountValid ? amountNum : 0,
      total: isAmountValid ? amountNum : 0,
      providerInvoiceId: normalized.providerMetadata.invoiceId,
      createdAt: Date.now(),
    },
    { owner: eventOwnerGroup },
  );

  await invoice.$jazz.waitForSync();

  logger.info({
    message: "Created Invoice from payment",
    data: {
      invoiceId: invoice.$jazz.id,
      paymentEventId,
      amount: data.amount,
      currency: data.currency,
    },
  });
};
