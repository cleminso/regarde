import { Loaded, ID } from "jazz-tools";

import { getMyApps } from "#managers/app/appManager";
import { RegardeSDK } from "#schemas/regardeSDK";
import { TRegardeApp, RegardeApp } from "#schemas/regardeUserApp";

export interface AppQueryParams {
  appId?: string;
  paymentProvider?: "stripe" | "polar";
}

export const useMyApps = (regardeSDK: Loaded<typeof RegardeSDK> | null) => {
  const getAllApps = async (): Promise<TRegardeApp[]> => {
    const isSdkExists = regardeSDK !== null;
    if (isSdkExists === false) return [];
    return getMyApps(regardeSDK);
  };

  const getAppById = async (appId: string): Promise<TRegardeApp | undefined> => {
    const isSdkExists = regardeSDK !== null;
    if (isSdkExists === false) return undefined;
    const apps = await getMyApps(regardeSDK);
    return apps.find((app) => app.$jazz.id === appId);
  };

  return {
    getAllApps,
    getAppById,
  };
};

export function useAppById(
  regardeSDK: Loaded<typeof RegardeSDK> | undefined,
  appId: ID<typeof RegardeApp> | null,
): TRegardeApp | undefined {
  const isSdkReady = regardeSDK !== undefined && regardeSDK.$isLoaded === true;
  if (isSdkReady === false) return undefined;

  const myApps = regardeSDK.myApps;
  const isAppsLoaded = myApps?.$isLoaded === true;
  if (isAppsLoaded === false) return undefined;

  if (appId === null) return undefined;

  const foundApp = myApps.find((item) => item.$jazz.id === appId);
  return foundApp?.$isLoaded === true ? foundApp : undefined;
}
