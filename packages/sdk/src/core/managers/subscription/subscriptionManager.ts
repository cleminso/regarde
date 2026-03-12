import { RegardeError, REGARDE_ERROR_CODES } from "#core/errors";
import {
  createStripeSubscription,
  updateStripeSubscription,
  pauseStripeSubscription,
  resumeStripeSubscription,
  cancelStripeSubscription,
  createPolarSubscription,
  updatePolarSubscription,
  cancelPolarSubscription,
} from "#core/providers";
import type { TPaymentProvider } from "#schemas/paymentEvent";
import type { TRegardeAccount } from "#schemas/regardeAccount";
import type { TRegardeApp } from "#schemas/regardeUserApp";

export interface TCreateSubscriptionOptions {
  provider: TPaymentProvider;
  priceId: string;
  app: TRegardeApp;
  customerEmail?: string;
  trialDays?: number;
  metadata?: Record<string, string>;
  stripe?: Record<string, unknown>;
  polar?: Record<string, unknown>;
}

export interface TCreateSubscriptionReturn {
  providerSubscriptionId: string;
  paymentUrl?: string;
  status: string;
}

export interface TUpdateSubscriptionOptions {
  subscriptionId: string;
  provider: TPaymentProvider;
  priceId?: string;
  quantity?: number;
  /**
   * Metadata to attach to the subscription.
   * Note: Not supported by Polar. Only Stripe supports metadata updates.
   */
  metadata?: Record<string, string>;
  stripe?: Record<string, unknown>;
  polar?: Record<string, unknown>;
}

export interface TSubscriptionActionOptions {
  subscriptionId: string;
  provider: TPaymentProvider;
  apiKey: string;
  cancelAtPeriodEnd?: boolean;
}

const validateAccount = (account: TRegardeAccount): void => {
  const isAccountLoaded = account !== null && account.$isLoaded === true;
  if (isAccountLoaded === false) {
    throw new RegardeError("Account must be loaded", REGARDE_ERROR_CODES.ACCOUNT_NOT_LOADED);
  }

  const isRootLoaded =
    account.root !== null && account.root !== undefined && account.root.$isLoaded === true;
  if (isRootLoaded === false) {
    throw new RegardeError("Account root must be loaded", REGARDE_ERROR_CODES.SDK_NOT_INITIALIZED);
  }

  const regardeSdk = account.root["regarde-sdk"];
  const isSdkLoaded =
    regardeSdk !== null && regardeSdk !== undefined && regardeSdk.$isLoaded === true;
  if (isSdkLoaded === false) {
    throw new RegardeError(
      "RegardeSDK must be initialized",
      REGARDE_ERROR_CODES.SDK_NOT_INITIALIZED,
    );
  }
};

const validateApp = (app: TRegardeApp): void => {
  const isAppLoaded = app !== null && app !== undefined && app.$isLoaded === true;
  if (isAppLoaded === false) {
    throw new RegardeError("App must be loaded", REGARDE_ERROR_CODES.COMAP_NOT_FOUND);
  }
};

/**
 * Creates a subscription directly with the provider.
 *
 * For Stripe: Creates a subscription and returns the subscription ID.
 * For Polar: Creates a checkout session in subscription mode.
 *
 * @param account - The RegardeAccount creating the subscription
 * @param apiKey - Provider API key
 * @param options - Subscription creation options
 * @returns Provider subscription ID and optional payment details
 */
export const createSubscription = async (
  account: TRegardeAccount,
  apiKey: string,
  options: TCreateSubscriptionOptions,
): Promise<TCreateSubscriptionReturn> => {
  validateAccount(account);
  validateApp(options.app);

  const jazzAccountId = account.$jazz.id;
  const appId = options.app.$jazz.id;

  switch (options.provider) {
    case "stripe": {
      const result = await createStripeSubscription(apiKey, {
        priceId: options.priceId,
        customerEmail: options.customerEmail,
        trialDays: options.trialDays,
        metadata: {
          regarde_app_id: appId,
          regarde_user_id: jazzAccountId,
          ...options.metadata,
        },
        stripe: options.stripe,
      });
      return {
        providerSubscriptionId: result.providerSubscriptionId,
        status: result.status,
      };
    }
    case "polar": {
      const result = await createPolarSubscription(apiKey, {
        productId: options.priceId,
        customerEmail: options.customerEmail,
        metadata: {
          regarde_app_id: appId,
          regarde_user_id: jazzAccountId,
          ...options.metadata,
        },
        polar: options.polar,
      });
      return {
        providerSubscriptionId: result.providerCheckoutId,
        paymentUrl: result.paymentUrl,
        status: result.status,
      };
    }
    default:
      throw new RegardeError(
        `Unsupported provider: ${options.provider as string}`,
        REGARDE_ERROR_CODES.PROVIDER_NOT_CONFIGURED,
      );
  }
};

/**
 * Updates a subscription with the provider.
 *
 * Supports changing plan/price, quantity, or metadata (Stripe only).
 *
 * Provider-specific limitations:
 * - Stripe: Supports all options (priceId, quantity, metadata)
 * - Polar: Only supports changing productId (priceId). Metadata and quantity updates
 *          are not supported by Polar's API.
 *
 * @param apiKey - Provider API key
 * @param options - Subscription update options
 */
export const updateSubscription = async (
  apiKey: string,
  options: TUpdateSubscriptionOptions,
): Promise<void> => {
  switch (options.provider) {
    case "stripe":
      await updateStripeSubscription(apiKey, options.subscriptionId, {
        priceId: options.priceId,
        quantity: options.quantity,
        metadata: options.metadata,
        stripe: options.stripe,
      });
      break;
    case "polar":
      // Note: Polar does not support metadata updates on subscriptions
      await updatePolarSubscription(apiKey, options.subscriptionId, {
        productId: options.priceId,
        polar: options.polar,
      });
      break;
    default:
      throw new RegardeError(
        `Unsupported provider: ${options.provider as string}`,
        REGARDE_ERROR_CODES.PROVIDER_NOT_CONFIGURED,
      );
  }
};

/**
 * Pauses a subscription.
 *
 * Provider support:
 * - Stripe: Native pause via pause_collection
 * - Polar: Not supported (throws error)
 *
 * @param options - Subscription action options (includes apiKey, subscriptionId, provider)
 */
export const pauseSubscription = async (options: TSubscriptionActionOptions): Promise<void> => {
  switch (options.provider) {
    case "stripe":
      await pauseStripeSubscription(options.apiKey, options.subscriptionId);
      break;
    case "polar":
      throw new RegardeError(
        "Polar does not support pausing subscriptions. Use cancel instead.",
        REGARDE_ERROR_CODES.SUBSCRIPTION_PAUSE_FAILED,
        "polar",
      );
    default:
      throw new RegardeError(
        `Pause not supported for provider: ${options.provider as string}`,
        REGARDE_ERROR_CODES.SUBSCRIPTION_PAUSE_FAILED,
        options.provider,
      );
  }
};

/**
 * Resumes a paused subscription.
 *
 * Provider support:
 * - Stripe: Native resume via clearing pause_collection
 * - Polar: Not supported
 *
 * @param options - Subscription action options (includes apiKey, subscriptionId, provider)
 */
export const resumeSubscription = async (options: TSubscriptionActionOptions): Promise<void> => {
  switch (options.provider) {
    case "stripe":
      await resumeStripeSubscription(options.apiKey, options.subscriptionId);
      break;
    case "polar":
      throw new RegardeError(
        "Polar does not support resuming subscriptions.",
        REGARDE_ERROR_CODES.SUBSCRIPTION_RESUME_FAILED,
        "polar",
      );
    default:
      throw new RegardeError(
        `Resume not supported for provider: ${options.provider as string}`,
        REGARDE_ERROR_CODES.SUBSCRIPTION_RESUME_FAILED,
        options.provider,
      );
  }
};

/**
 * Cancels a subscription.
 *
 * All providers support cancellation. For Stripe, you can choose to cancel
 * at period end or immediately.
 *
 * @param options - Subscription action options (includes apiKey, subscriptionId, provider, cancelAtPeriodEnd)
 */
export const cancelSubscription = async (options: TSubscriptionActionOptions): Promise<void> => {
  const cancelAtPeriodEnd = options.cancelAtPeriodEnd ?? true;

  switch (options.provider) {
    case "stripe":
      await cancelStripeSubscription(options.apiKey, options.subscriptionId, cancelAtPeriodEnd);
      break;
    case "polar":
      await cancelPolarSubscription(options.apiKey, options.subscriptionId);
      break;
    default:
      throw new RegardeError(
        `Cancel not supported for provider: ${options.provider as string}`,
        REGARDE_ERROR_CODES.SUBSCRIPTION_CANCEL_FAILED,
        options.provider,
      );
  }
};
