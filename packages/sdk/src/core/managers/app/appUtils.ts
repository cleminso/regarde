import { Loaded, ID } from "jazz-tools";

import { getMyApps } from "#managers/app/appManager";
import { RegardeSDK } from "#schemas/regardeSDK";
import { TApp, App } from "#schemas/regardeUserApp";

export interface AppQueryParams {
  appId?: string;
  paymentProvider?: "lemonsqueezy" | "stripe" | "polar";
}

export const useMyApps = (regardeSDK: Loaded<typeof RegardeSDK> | null) => {
  const getAllApps = async (): Promise<TApp[]> => {
    const isSdkExists = regardeSDK !== null;
    if (isSdkExists === false) return [];
    return getMyApps(regardeSDK);
  };

  const getAppById = async (appId: string): Promise<TApp | undefined> => {
    const isSdkExists = regardeSDK !== null;
    if (isSdkExists === false) return undefined;
    const apps = await getMyApps(regardeSDK);
    return apps.find((app) => app.$jazz.id === appId);
  };

  const getAppsByProvider = async (
    paymentProvider: "lemonsqueezy" | "stripe" | "polar",
  ): Promise<TApp[]> => {
    const isSdkExists = regardeSDK !== null;
    if (isSdkExists === false) return [];
    const apps = await getMyApps(regardeSDK);
    return apps.filter((app) => app.paymentProvider === paymentProvider);
  };

  return {
    getAllApps,
    getAppById,
    getAppsByProvider,
  };
};

export function useAppById(
  regardeSDK: Loaded<typeof RegardeSDK> | undefined,
  appId: ID<typeof App> | null,
): TApp | undefined {
  const isSdkReady = regardeSDK !== undefined && regardeSDK.$isLoaded === true;
  if (isSdkReady === false) return undefined;

  const myApps = regardeSDK.myApps;
  const isAppsLoaded = myApps?.$isLoaded === true;
  if (isAppsLoaded === false) return undefined;

  if (appId === null) return undefined;

  const app = myApps.find((app) => app.$jazz.id === appId);
  return app?.$isLoaded === true ? app : undefined;
}
