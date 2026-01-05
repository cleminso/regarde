import { Loaded } from "jazz-tools";
import { RegardeSDK } from "#schemas/regardeSDK";
import { TApp } from "#schemas/regardeUserApp";
import { getMyApps } from "#managers/app/appManager";

export interface AppQueryParams {
  appId?: string;
  paymentProvider?: "lemonsqueezy" | "stripe";
}

export const useMyApps = (regardeSDK: Loaded<typeof RegardeSDK> | null) => {
  const getAllApps = async (): Promise<TApp[]> => {
    const sdkExists = regardeSDK !== null;
    if (sdkExists === false) return [];
    return getMyApps(regardeSDK);
  };

  const getAppById = async (appId: string): Promise<TApp | undefined> => {
    const sdkExists = regardeSDK !== null;
    if (sdkExists === false) return undefined;
    const apps = await getMyApps(regardeSDK);
    return apps.find((app) => app.$jazz.id === appId);
  };

  const getAppsByProvider = async (
    paymentProvider: "lemonsqueezy" | "stripe",
  ): Promise<TApp[]> => {
    const sdkExists = regardeSDK !== null;
    if (sdkExists === false) return [];
    const apps = await getMyApps(regardeSDK);
    return apps.filter((app) => app.paymentProvider === paymentProvider);
  };

  return {
    getAllApps,
    getAppById,
    getAppsByProvider,
  };
};
