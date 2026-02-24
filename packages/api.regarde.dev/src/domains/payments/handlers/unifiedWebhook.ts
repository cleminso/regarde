import { Account, Group, ID, Loaded, co } from "jazz-tools";

import {
  RegistryWorkerAccount,
  ProcessedProviderEvents,
  PaymentEvent,
  SubscriptionEvent,
  Subscription,
  LicenseEvent,
  TApp,
  App,
  RegardeSDK,
  TRegistryWorkerAccountRoot,
  useLogging,
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

// ---------------------------------------------------------------------------
// Unified Webhook Handler
// ---------------------------------------------------------------------------

export const unifiedWebhookHandler = (
  worker: Loaded<typeof RegistryWorkerAccount>,
) => {
  return async (c: any) => {
    try {
      const workerId = process.env.REGARDE_REGISTRY_GROUP;
      if (!workerId) {
        logger.debug({
          message: "Starting webhook handler, checking registry group",
          data: { workerId },
        });
        throw new Error(
          "Missing `REGARDE_REGISTRY_GROUP` required environment variable",
        );
      }

      // Extract provider from URL path: /webhooks/{provider}/{appId}
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
          typeof value === 'string' && value.length > 50 ? value.substring(0, 50) + '...' : value
        ])
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
          bodyPreview: rawBody.substring(0, 500), // First 500 chars
          bodyLength: rawBody.length,
        },
      });
      const json = JSON.parse(rawBody);
      logger.debug({
        message: "Webhook payload parsed",
        data: {
          provider,
          eventType: json.type || json.meta?.event_name, // Stripe vs LemonSqueezy
          hasMetadata: !!(
            json.data?.object?.metadata ||
            json.meta?.custom_data ||
            json.data?.metadata
          ),
          payloadKeys: Object.keys(json),
          dataKeys: json.data ? Object.keys(json.data) : null,
        },
      });

      // Load the App first (needed for webhook secret)
      const pathAppId = c.req.param("appId");

      let ctx;
      try {
        logger.debug({
          message: "Attempting to extract context",
          data: {
            provider,
            appIdFromPath: pathAppId,
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
        logger.error({
          message: "Failed to extract context from webhook payload",
          data: {
            provider,
            pathAppId,
            errorMessage:
              extractError instanceof Error ? extractError.message : "Unknown",
            // Add these:
            availableMetadataSources: {
              stripeMetadata: json.data?.object?.metadata,
              lemonSqueezyCustomData: json.meta?.custom_data,
              polarMetadata: json.data?.metadata,
            },
          },
        });
        return c.json(
          { error: "Missing required context in webhook payload" },
          400,
        );
      }

      const appId = ctx.appId as ID<Account>;
      const { jazzAccountId, regardeSDKId } = ctx;

      const isAppIdValid =
        appId !== null && appId !== undefined && appId !== "";
      if (isAppIdValid === false) {
        logger.error({
          message: "Missing App ID",
          data: { provider, pathAppId },
        });
        return c.json({ error: "Missing App ID" }, 400);
      }

      const appRef = await App.load(appId, {
        resolve: {
          payments: { all: true, byUser: true },
          subscriptions: { all: true, byUser: true },
          licenses: { all: true, byUser: true },
        },
      });

      if (!appRef.$jazz.id) {
        logger.error({
          message: "App not found or failed to load",
          data: { appId, provider },
        });
        return c.json({ error: "App not found" }, 404);
      }

      const app = await (appRef as TApp).$jazz.ensureLoaded({
        resolve: {
          payments: { all: true, byUser: true },
          subscriptions: { all: true, byUser: true },
          licenses: { all: true, byUser: true },
        },
      });

      // Validate webhook signature
      const isSecretValid =
        typeof app.webhookSecret === "string" && app.webhookSecret !== "";
      if (isSecretValid === false) {
        logger.error({
          message: "App webhookSecret is missing",
          data: {
            appId,
            provider,
            webhookSecretType: typeof app.webhookSecret,
          },
        });
        return c.json({ error: "App webhookSecret is missing" }, 500);
      }

      const signatureHeader = adapter.signatureHeader;
      const rawSignatureHeader = c.req.header(signatureHeader);
      const signature =
        rawSignatureHeader ??
        c.req.header(
          signatureHeader.charAt(0).toUpperCase() + signatureHeader.slice(1),
        ) ??
        null;

      // Log signature details for debugging
      logger.debug({
        message: "Signature validation attempt",
        data: {
          provider,
          signatureHeader,
          signaturePresent: signature !== null,
          signatureLength: signature?.length,
          rawSignatureHeader: rawSignatureHeader, // Full value
          signaturePreview: signature?.substring(0, 100),
          signatureParts: signature?.split(",").length,
          allSignatureParts: signature?.split(","),
          webhookSecretLength: app.webhookSecret?.length,
          webhookSecretPrefix: app.webhookSecret?.substring(0, 15),
        },
      });

      const isSignatureValid =
        signature !== null &&
        adapter.validateSignature(
          rawBody, 
          signature, 
          app.webhookSecret,
          adapter.timestampHeader ? c.req.header(adapter.timestampHeader) : undefined,
          adapter.idHeader ? c.req.header(adapter.idHeader) : undefined
        );
      if (isSignatureValid === false) {
        logger.error({
          message: "Invalid webhook signature - review misconfiguration",
          data: {
            appId,
            provider,
            isSignaturePresent: signature !== null,
            signatureLength: signature?.length,
            signatureFormat: signature?.includes(",") ? "has-commas" : "no-commas",
            signatureParts: signature?.split(",").length,
            idHeader: adapter.idHeader,
            idValue: adapter.idHeader ? c.req.header(adapter.idHeader) : undefined,
            timestampHeader: adapter.timestampHeader,
            timestampValue: adapter.timestampHeader ? c.req.header(adapter.timestampHeader) : undefined,
            webhookSecretPrefix: app.webhookSecret?.substring(0, 15),
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

      const isRegardeSDKIdValid =
        regardeSDKId !== undefined && regardeSDKId !== "";
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

      // Load worker resources
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
            appId,
            workerAccountId: worker.$jazz.id, // Which worker is trying to load?
          },
        });
        return c.json(
          { error: "Failed to load registryProfileWorkerGroup" },
          500,
        );
      }

      const workerRoot = worker.root as TRegistryWorkerAccountRoot;

      // Need to check for duplicate webhook deliveries against worker deduplication records of processed event IDs
      const processedProviderEvents = workerRoot.processedProviderEvents;
      const isProcessedEventsLoaded =
        processedProviderEvents !== null &&
        processedProviderEvents !== undefined &&
        processedProviderEvents.$isLoaded === true;
      if (isProcessedEventsLoaded === false) {
        logger.error({
          message: "Failed to load processedProviderEvents from worker root",
          data: {
            workerJazzId: worker.$jazz.id, // which worker has the broken root
            workerId, // which registry group
            appId,
            provider,
            processedProviderEventsPresent: processedProviderEvents !== null,
            processedProviderEventsIsLoaded: processedProviderEvents.$isLoaded,
          },
        });
        return c.json(
          { error: "processedProviderEvents not available on worker root" },
          500,
        );
      }

      const { prefixedProviderEventUUID } = normalized;

      // Check idempotency
      if (processedProviderEvents[prefixedProviderEventUUID]) {
        logger.debug({
          message: "Event already processed (idempotent replay)",
          data: { prefixedProviderEventUUID, provider, appId },
        });
        return c.json({ received: true, duplicate: true }, 200);
      }

      // Where do we handle branch for load existing event and create new event?

      // Load user account
      const userAccount = await co.account().load(jazzAccountId);
      const isUserAccountLoaded = userAccount.$isLoaded === true;
      if (isUserAccountLoaded === false) {
        logger.error({
          message: "Failed to load userAccount",
          data: {
            metadata: { operation: "create payment event" },
            userAccountIsLoaded: userAccount.$isLoaded,
            jazzAccountId, // which account id failed to load?
            appId,
            provider,
          },
        });
        return c.json({ error: "Failed to load user account" }, 500);
      }

      // Create ownership group for the event CoMaps
      const eventOwnerGroup = Group.create();
      eventOwnerGroup.addMember(registryProfileWorkerGroup, "admin");
      eventOwnerGroup.addMember(userAccount, "reader");
      eventOwnerGroup.addMember(app.$jazz.owner, "reader");

      // Route to appropriate event handler based on data kind
      let eventId: string;

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
        );
      } else {
        return c.json({ error: "Unknown event kind" }, 400);
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
  app: TApp,
  regardeSDKId: string,
  processedProviderEvents: co.loaded<typeof ProcessedProviderEvents>,
  worker: Loaded<typeof RegistryWorkerAccount>,
): Promise<string> => {
  const event = PaymentEvent.create(
    {
      provider: normalized.provider,
      mode: normalized.mode,
      providerEventId: normalized.providerEventId,
      prefixedProviderEventUUID: normalized.prefixedProviderEventUUID,
      eventType: normalized.eventType as
        | "payment.created"
        | "payment.failed"
        | "payment.refunded",
      app: appId,
      userAccount: jazzAccountId,
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
  processedProviderEvents.$jazz.set(
    normalized.prefixedProviderEventUUID,
    event.$jazz.id,
  );
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
  app: TApp,
  regardeSDKId: string,
  processedProviderEvents: co.loaded<typeof ProcessedProviderEvents>,
  worker: Loaded<typeof RegistryWorkerAccount>,
): Promise<string> => {
  const event = SubscriptionEvent.create(
    {
      provider: normalized.provider,
      mode: normalized.mode,
      providerEventId: normalized.providerEventId,
      prefixedProviderEventUUID: normalized.prefixedProviderEventUUID,
      eventType: normalized.eventType as
        | "subscription.created"
        | "subscription.canceled"
        | "subscription.updated",
      app: appId,
      userAccount: jazzAccountId,
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
  processedProviderEvents.$jazz.set(
    normalized.prefixedProviderEventUUID,
    event.$jazz.id,
  );
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
  app: TApp,
  regardeSDKId: string,
  processedProviderEvents: co.loaded<typeof ProcessedProviderEvents>,
  worker: Loaded<typeof RegistryWorkerAccount>,
): Promise<string> => {
  const event = LicenseEvent.create(
    {
      provider: normalized.provider,
      mode: normalized.mode,
      providerEventId: normalized.providerEventId,
      prefixedProviderEventUUID: normalized.prefixedProviderEventUUID,
      eventType: normalized.eventType as
        | "license.created"
        | "license.updated"
        | "license.revoked",
      app: appId,
      userAccount: jazzAccountId,
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
  processedProviderEvents.$jazz.set(
    normalized.prefixedProviderEventUUID,
    event.$jazz.id,
  );
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
  } else if (
    myPayments.byApp[appId].$jazz.has(prefixedProviderEventUUID) === false
  ) {
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
  } else if (
    mySubscriptions.byApp[appId].$jazz.has(prefixedProviderEventUUID) === false
  ) {
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
  } else if (
    myLicenses.byApp[appId].$jazz.has(prefixedProviderEventUUID) === false
  ) {
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
  app: TApp,
): Promise<void> => {
  const isPaymentsLoaded =
    app.payments !== null && app.payments.$isLoaded === true;
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
  } else if (
    appPaymentsByUser[jazzAccountId].$jazz.has(prefixedProviderEventUUID) ===
    false
  ) {
    appPaymentsByUser[jazzAccountId].$jazz.set(
      prefixedProviderEventUUID,
      eventId,
    );
  }
  await app.$jazz.waitForSync();
};

const indexSubscriptionEventToApp = async (
  eventId: string,
  prefixedProviderEventUUID: string,
  jazzAccountId: string,
  app: TApp,
): Promise<void> => {
  const isSubscriptionsLoaded =
    app.subscriptions !== null && app.subscriptions.$isLoaded === true;
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
  const appSubscriptionsByUser =
    await appSubscriptions.byUser.$jazz.ensureLoaded({
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
  } else if (
    appSubscriptionsByUser[jazzAccountId].$jazz.has(
      prefixedProviderEventUUID,
    ) === false
  ) {
    appSubscriptionsByUser[jazzAccountId].$jazz.set(
      prefixedProviderEventUUID,
      eventId,
    );
  }
  await app.$jazz.waitForSync();
};

const indexLicenseEventToApp = async (
  eventId: string,
  prefixedProviderEventUUID: string,
  jazzAccountId: string,
  app: TApp,
): Promise<void> => {
  const isLicensesLoaded =
    app.licenses !== null && app.licenses.$isLoaded === true;
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
  } else if (
    appLicensesByUser[jazzAccountId].$jazz.has(prefixedProviderEventUUID) ===
    false
  ) {
    appLicensesByUser[jazzAccountId].$jazz.set(
      prefixedProviderEventUUID,
      eventId,
    );
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
        app: appId,
        userAccount: jazzAccountId,
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
    mySubscriptions.status.$jazz.set(
      data.providerSubscriptionId,
      subscription.$jazz.id,
    );
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
