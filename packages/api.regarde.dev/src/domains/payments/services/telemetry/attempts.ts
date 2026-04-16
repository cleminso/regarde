import { TRegistryWorkerAccountRoot } from "@regarde-dev/core";

export const getWebhookAttemptState = async (
  attemptCounts: TRegistryWorkerAccountRoot["webhookAttemptCounts"],
  webhookId: string,
  providerEventId: string,
): Promise<{ isRetry: boolean; retryCount: number }> => {
  const isAttemptCountsLoaded = attemptCounts !== null && attemptCounts.$isLoaded === true;
  if (isAttemptCountsLoaded === false) {
    return { isRetry: false, retryCount: 0 };
  }

  const webhookCounts = attemptCounts[webhookId];
  const hasWebhookCounts = webhookCounts !== null && webhookCounts !== undefined;
  if (hasWebhookCounts === false) {
    return { isRetry: false, retryCount: 0 };
  }

  const isWebhookCountsLoaded = webhookCounts.$isLoaded === true;
  const loadedWebhookCounts =
    isWebhookCountsLoaded === true
      ? await webhookCounts.$jazz.ensureLoaded({
          resolve: { $each: true },
        })
      : null;

  if (loadedWebhookCounts === null) {
    return { isRetry: false, retryCount: 0 };
  }

  const retryCount = loadedWebhookCounts[providerEventId] ?? 0;

  return {
    isRetry: retryCount > 0,
    retryCount,
  };
};

export const incrementWebhookAttemptCount = async (
  attemptCounts: TRegistryWorkerAccountRoot["webhookAttemptCounts"],
  webhookId: string,
  providerEventId: string,
  currentRetryCount: number,
): Promise<void> => {
  const isAttemptCountsLoaded = attemptCounts !== null && attemptCounts.$isLoaded === true;
  if (isAttemptCountsLoaded === false) {
    return;
  }

  const webhookCounts = attemptCounts[webhookId];
  const hasWebhookCounts = webhookCounts !== null && webhookCounts !== undefined;
  if (hasWebhookCounts === false) {
    attemptCounts.$jazz.set(webhookId, {
      [providerEventId]: 1,
    });
    await attemptCounts.$jazz.waitForSync();
    return;
  }

  const isWebhookCountsLoaded = webhookCounts.$isLoaded === true;
  const loadedWebhookCounts =
    isWebhookCountsLoaded === true
      ? await webhookCounts.$jazz.ensureLoaded({
          resolve: { $each: true },
        })
      : null;

  if (loadedWebhookCounts === null) {
    attemptCounts.$jazz.set(webhookId, {
      [providerEventId]: 1,
    });
    await attemptCounts.$jazz.waitForSync();
    return;
  }

  loadedWebhookCounts.$jazz.set(providerEventId, currentRetryCount + 1);
  await loadedWebhookCounts.$jazz.waitForSync();
};
