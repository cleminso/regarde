import { Group, co, z } from "jazz-tools";

import { RegardeError, REGARDE_ERROR_CODES } from "#core/errors";
import {
  createStripeCheckout,
  createPolarCheckout,
  createLemonSqueezyCheckout,
} from "#core/providers";
import type { TCreateCheckoutParams } from "#core/providers/types";
import {
  CheckoutSession,
  type TCheckoutSession,
  type TCheckoutMode,
} from "#schemas/checkoutSession";
import type { TPaymentProvider } from "#schemas/paymentEvent";
import type { TRegardeAccount } from "#schemas/regardeAccount";
import type { TRegardeApp } from "#schemas/regardeUserApp";

export interface TCreateCheckoutOptions {
  provider: TPaymentProvider;
  amount: number;
  currency: string;
  mode: TCheckoutMode;
  app: TRegardeApp;
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string;
  productName?: string;
  metadata?: Record<string, string>;
  stripe?: Record<string, unknown>;
  polar?: Record<string, unknown>;
  lemonsqueezy?: Record<string, unknown>;
}

export interface TCreateCheckoutReturn {
  checkoutSession: TCheckoutSession;
  paymentUrl: string;
}

/**
 * Creates a checkout session for the given app and account.
 *
 * Flow:
 * 1. Creates CheckoutSession CoMap with status "pending"
 * 2. Calls provider API with embedded Regarde metadata
 * 3. Updates CheckoutSession with provider session ID and payment URL
 * 4. Indexes checkout session in app's checkoutSessions
 *
 * @param account - The RegardeAccount creating the checkout
 * @param apiKey - Provider API key (Stripe secret, Polar token, or LemonSqueezy key)
 * @param options - Checkout creation options
 * @returns The created CheckoutSession CoMap and payment URL
 */
export const createCheckout = async (
  account: TRegardeAccount,
  apiKey: string,
  options: TCreateCheckoutOptions,
): Promise<TCreateCheckoutReturn> => {
  const isAccountLoaded = account !== null && account.$isLoaded === true;
  if (isAccountLoaded === false) {
    throw new RegardeError(
      "Account must be loaded to create checkout",
      REGARDE_ERROR_CODES.ACCOUNT_NOT_LOADED,
    );
  }

  const isRootLoaded =
    account.root !== null &&
    account.root !== undefined &&
    account.root.$isLoaded === true;
  if (isRootLoaded === false) {
    throw new RegardeError(
      "Account root must be loaded",
      REGARDE_ERROR_CODES.SDK_NOT_INITIALIZED,
    );
  }

  const regardeSdk = account.root["regarde-sdk"];
  const isSdkLoaded =
    regardeSdk !== null &&
    regardeSdk !== undefined &&
    regardeSdk.$isLoaded === true;
  if (isSdkLoaded === false) {
    throw new RegardeError(
      "RegardeSDK must be initialized",
      REGARDE_ERROR_CODES.SDK_NOT_INITIALIZED,
    );
  }

  const app = options.app;
  const isAppLoaded = app !== null && app !== undefined && app.$isLoaded === true;
  if (isAppLoaded === false) {
    throw new RegardeError(
      "App must be loaded",
      REGARDE_ERROR_CODES.COMAP_NOT_FOUND,
    );
  }

  const ownerGroup = regardeSdk.$jazz.owner;
  const isOwnerGroupLoaded =
    ownerGroup !== null && ownerGroup !== undefined && ownerGroup.$isLoaded === true;
  if (isOwnerGroupLoaded === false) {
    throw new RegardeError(
      "Failed to get owner group for checkout creation",
      REGARDE_ERROR_CODES.SYNC_FAILED,
    );
  }

  const jazzAccountId = account.$jazz.id;
  const regardeSdkId = regardeSdk.$jazz.id;
  const appId = app.$jazz.id;

  const checkoutSession = CheckoutSession.create(
    {
      appId,
      userAccountId: jazzAccountId,
      provider: options.provider,
      status: "pending",
      mode: options.mode,
      amount: options.amount,
      currency: options.currency.toUpperCase(),
      customerEmail: options.customerEmail,
      createdAt: Date.now(),
      providerMetadata: {},
    },
    { owner: ownerGroup },
  );

  await checkoutSession.$jazz.waitForSync();

  const checkoutSessionId = checkoutSession.$jazz.id;

  const providerParams: TCreateCheckoutParams = {
    provider: options.provider,
    amount: options.amount,
    currency: options.currency,
    mode: options.mode,
    appId,
    userAccountId: jazzAccountId,
    regardeSDKId: regardeSdkId,
    checkoutSessionId,
    successUrl: options.successUrl,
    cancelUrl: options.cancelUrl,
    customerEmail: options.customerEmail,
    productName: options.productName,
    metadata: options.metadata,
    stripe: options.stripe,
    polar: options.polar,
    lemonsqueezy: options.lemonsqueezy,
  };

  let providerResult;
  switch (options.provider) {
    case "stripe":
      providerResult = await createStripeCheckout(apiKey, providerParams);
      break;
    case "polar":
      providerResult = await createPolarCheckout(apiKey, providerParams);
      break;
    case "lemonsqueezy":
      providerResult = await createLemonSqueezyCheckout(apiKey, providerParams);
      break;
    default:
      throw new RegardeError(
        `Unsupported provider: ${options.provider}`,
        REGARDE_ERROR_CODES.PROVIDER_NOT_CONFIGURED,
      );
  }

  checkoutSession.$jazz.set("providerSessionId", providerResult.providerSessionId);
  checkoutSession.$jazz.set("paymentUrl", providerResult.paymentUrl);
  await checkoutSession.$jazz.waitForSync();

  await indexCheckoutSession(app, checkoutSessionId, providerResult.providerSessionId, jazzAccountId);

  return {
    checkoutSession,
    paymentUrl: providerResult.paymentUrl,
  };
};

const indexCheckoutSession = async (
  app: TRegardeApp,
  checkoutSessionId: string,
  providerSessionId: string,
  userAccountId: string,
): Promise<void> => {
  const checkoutSessions = app.checkoutSessions;
  const isSessionsLoaded =
    checkoutSessions !== null &&
    checkoutSessions !== undefined &&
    checkoutSessions.$isLoaded === true;

  if (isSessionsLoaded === false) {
    return;
  }

  const { all, byUser } = await checkoutSessions.$jazz.ensureLoaded({
    resolve: { all: true, byUser: true },
  });

  all.$jazz.set(providerSessionId, checkoutSessionId);

  const userSessions = byUser[userAccountId];
  const hasUserSessions =
    userSessions !== null && userSessions !== undefined && userSessions.$isLoaded === true;

  if (hasUserSessions === true) {
    userSessions.$jazz.set(providerSessionId, checkoutSessionId);
  } else {
    const newUserRecord = co.record(z.string(), z.string()).create(
      { [providerSessionId]: checkoutSessionId },
      { owner: byUser.$jazz.owner },
    );
    await newUserRecord.$jazz.waitForSync();
    byUser.$jazz.set(userAccountId, newUserRecord);
  }

  await checkoutSessions.$jazz.waitForSync();
};
