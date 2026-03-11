import { RegardeError, REGARDE_ERROR_CODES } from "#core/errors";
import {
  pauseStripeSubscription,
  resumeStripeSubscription,
  cancelStripeSubscription,
  cancelPolarSubscription,
} from "#core/providers";
import type { TPaymentProvider } from "#schemas/paymentEvent";
import type { TRegardeAccount } from "#schemas/regardeAccount";
import type { TSubscription } from "#schemas/subscriptionEvent";

export interface TSubscriptionActionOptions {
  subscription: TSubscription;
  apiKey: string;
  cancelAtPeriodEnd?: boolean;
}

const validateSubscription = (subscription: TSubscription): void => {
  const isLoaded =
    subscription !== null && subscription !== undefined && subscription.$isLoaded === true;
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
 * - Polar: Not supported (throws error)
 *
 * @param _account - The Regarde account (unused but required for type consistency)
 * @param options - Subscription action options including the subscription to pause
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
    case "polar":
      throw new RegardeError(
        "Polar does not support pausing subscriptions. Use cancel instead.",
        REGARDE_ERROR_CODES.SUBSCRIPTION_PAUSE_FAILED,
        "polar",
      );
    default:
      throw new RegardeError(
        `Pause not supported for provider: ${provider as string}`,
        REGARDE_ERROR_CODES.SUBSCRIPTION_PAUSE_FAILED,
        provider as TPaymentProvider,
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
 * @param _account - The Regarde account (unused but required for type consistency)
 * @param options - Subscription action options including the subscription to resume
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
    case "polar":
      throw new RegardeError(
        "Polar does not support resuming subscriptions.",
        REGARDE_ERROR_CODES.SUBSCRIPTION_RESUME_FAILED,
        "polar",
      );
    default:
      throw new RegardeError(
        `Resume not supported for provider: ${provider as string}`,
        REGARDE_ERROR_CODES.SUBSCRIPTION_RESUME_FAILED,
        provider as TPaymentProvider,
      );
  }
};

/**
 * Cancels a subscription.
 *
 * All providers support cancellation. For Stripe, you can choose to cancel
 * at period end or immediately.
 *
 * @param _account - The Regarde account (unused but required for type consistency)
 * @param options - Subscription action options including the subscription to cancel
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
      await cancelStripeSubscription(options.apiKey, providerSubscriptionId, cancelAtPeriodEnd);
      break;
    case "polar":
      await cancelPolarSubscription(options.apiKey, providerSubscriptionId);
      break;
    default:
      throw new RegardeError(
        `Cancel not supported for provider: ${provider as string}`,
        REGARDE_ERROR_CODES.SUBSCRIPTION_CANCEL_FAILED,
        provider as TPaymentProvider,
      );
  }
};
