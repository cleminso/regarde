import { RegardeError, REGARDE_ERROR_CODES } from "#core/errors";

const LEMONSQUEEZY_API_BASE = "https://api.lemonsqueezy.com/v1";

const lemonSqueezyFetch = async (
  apiKey: string,
  endpoint: string,
  method: string,
  body?: Record<string, unknown>,
): Promise<void> => {
  const response = await fetch(`${LEMONSQUEEZY_API_BASE}${endpoint}`, {
    method,
    headers: {
      Accept: "application/vnd.api+json",
      "Content-Type": "application/vnd.api+json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const isSuccessful = response.ok === true;
  if (isSuccessful === false) {
    const errorBody = await response.text();
    throw new Error(`LemonSqueezy API error (${response.status}): ${errorBody}`);
  }
};

/**
 * Pauses a LemonSqueezy subscription.
 *
 * Uses the LemonSqueezy REST API to update subscription status to paused.
 */
export const pauseLemonSqueezySubscription = async (
  apiKey: string,
  providerSubscriptionId: string,
): Promise<void> => {
  try {
    await lemonSqueezyFetch(
      apiKey,
      `/subscriptions/${providerSubscriptionId}`,
      "PATCH",
      {
        data: {
          type: "subscriptions",
          id: providerSubscriptionId,
          attributes: { pause: { mode: "void" } },
        },
      },
    );
  } catch (error) {
    throw new RegardeError(
      `Failed to pause LemonSqueezy subscription: ${error instanceof Error ? error.message : "Unknown error"}`,
      REGARDE_ERROR_CODES.SUBSCRIPTION_PAUSE_FAILED,
      "lemonsqueezy",
      error,
    );
  }
};

/**
 * Resumes a paused LemonSqueezy subscription.
 *
 * Clears the pause by setting pause to null.
 */
export const resumeLemonSqueezySubscription = async (
  apiKey: string,
  providerSubscriptionId: string,
): Promise<void> => {
  try {
    await lemonSqueezyFetch(
      apiKey,
      `/subscriptions/${providerSubscriptionId}`,
      "PATCH",
      {
        data: {
          type: "subscriptions",
          id: providerSubscriptionId,
          attributes: { pause: null },
        },
      },
    );
  } catch (error) {
    throw new RegardeError(
      `Failed to resume LemonSqueezy subscription: ${error instanceof Error ? error.message : "Unknown error"}`,
      REGARDE_ERROR_CODES.SUBSCRIPTION_RESUME_FAILED,
      "lemonsqueezy",
      error,
    );
  }
};

/**
 * Cancels a LemonSqueezy subscription.
 */
export const cancelLemonSqueezySubscription = async (
  apiKey: string,
  providerSubscriptionId: string,
): Promise<void> => {
  try {
    await lemonSqueezyFetch(
      apiKey,
      `/subscriptions/${providerSubscriptionId}`,
      "DELETE",
    );
  } catch (error) {
    throw new RegardeError(
      `Failed to cancel LemonSqueezy subscription: ${error instanceof Error ? error.message : "Unknown error"}`,
      REGARDE_ERROR_CODES.SUBSCRIPTION_CANCEL_FAILED,
      "lemonsqueezy",
      error,
    );
  }
};
