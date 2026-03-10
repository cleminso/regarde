import { RegardeError, REGARDE_ERROR_CODES } from "#core/errors";
import {
  pauseStripeSubscription,
  resumeStripeSubscription,
  cancelStripeSubscription,
  cancelPolarSubscription,
  cancelLemonSqueezySubscription,
  pauseLemonSqueezySubscription,
  resumeLemonSqueezySubscription,
} from "#core/providers";
import type { TPaymentProvider } from "#schemas/paymentEvent";
import type { TSubscription } from "#schemas/subscriptionEvent";
import type { TRegardeAccount } from "#schemas/regardeAccount";

export interface TSubscriptionActionOptions {
  subscription: TSubscription;
  apiKey: string;
  cancelAtPeriodEnd?: boolean;
}

const validateSubscription = (subscription: TSubscription): void => {
  const isLoaded =
    subscription !== null &&
    subscription !== undefined &&
    subscription.$isLoaded === true;
  if (isLoaded === false) {
    throw new RegardeError(
      "Subscription must be loaded",
      REGARDE_ERROR_CODES.SUBSCRIPTION_NOT_FOUND,
    );
  }
};

/**
 * Pauses a subscription.
 *
 * Provider support:
 * - Stripe: Native pause via pause_collection
 * - LemonSqueezy: Native pause via API
 * - Polar: Not supported (throws error)
 */
export const pauseSubscription = async (
  _account: TRegardeAccount,
  options: TSubscriptionActionOptions,
): Promise<void> => {
  validateSubscription(options.subscription);

  const provider = options.subscription.provider;
  const providerSubscriptionId = options.subscription.providerSubscriptionId;

  switch (provider) {
    case "stripe":
      await pauseStripeSubscription(options.apiKey, providerSubscriptionId);
      break;
    case "lemonsqueezy":
      await pauseLemonSqueezySubscription(options.apiKey, providerSubscriptionId);
      break;
    case "polar":
      throw new RegardeError(
        "Polar does not support pausing subscriptions. Use cancel instead.",
        REGARDE_ERROR_CODES.SUBSCRIPTION_PAUSE_FAILED,
        "polar",
      );
    default:
      throw new RegardeError(
        `Pause not supported for provider: ${provider}`,
        REGARDE_ERROR_CODES.SUBSCRIPTION_PAUSE_FAILED,
        provider,
      );
  }
};

/**
 * Resumes a paused subscription.
 *
 * Provider support:
 * - Stripe: Native resume via clearing pause_collection
 * - LemonSqueezy: Native resume via API
 * - Polar: Not supported
 */
export const resumeSubscription = async (
  _account: TRegardeAccount,
  options: TSubscriptionActionOptions,
): Promise<void> => {
  validateSubscription(options.subscription);

  const provider = options.subscription.provider;
  const providerSubscriptionId = options.subscription.providerSubscriptionId;

  switch (provider) {
    case "stripe":
      await resumeStripeSubscription(options.apiKey, providerSubscriptionId);
      break;
    case "lemonsqueezy":
      await resumeLemonSqueezySubscription(options.apiKey, providerSubscriptionId);
      break;
    case "polar":
      throw new RegardeError(
        "Polar does not support resuming subscriptions.",
        REGARDE_ERROR_CODES.SUBSCRIPTION_RESUME_FAILED,
        "polar",
      );
    default:
      throw new RegardeError(
        `Resume not supported for provider: ${provider}`,
        REGARDE_ERROR_CODES.SUBSCRIPTION_RESUME_FAILED,
        provider,
      );
  }
};

/**
 * Cancels a subscription.
 *
 * All providers support cancellation. For Stripe, you can choose to cancel
 * at period end or immediately.
 */
export const cancelSubscription = async (
  _account: TRegardeAccount,
  options: TSubscriptionActionOptions,
): Promise<void> => {
  validateSubscription(options.subscription);

  const provider = options.subscription.provider;
  const providerSubscriptionId = options.subscription.providerSubscriptionId;
  const cancelAtPeriodEnd = options.cancelAtPeriodEnd ?? true;

  switch (provider) {
    case "stripe":
      await cancelStripeSubscription(
        options.apiKey,
        providerSubscriptionId,
        cancelAtPeriodEnd,
      );
      break;
    case "polar":
      await cancelPolarSubscription(options.apiKey, providerSubscriptionId);
      break;
    case "lemonsqueezy":
      await cancelLemonSqueezySubscription(options.apiKey, providerSubscriptionId);
      break;
    default:
      throw new RegardeError(
        `Cancel not supported for provider: ${provider}`,
        REGARDE_ERROR_CODES.SUBSCRIPTION_CANCEL_FAILED,
        provider as TPaymentProvider,
      );
  }
};
