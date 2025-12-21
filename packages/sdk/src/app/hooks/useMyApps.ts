import { Loaded } from "jazz-tools";
import { RegardeSDK } from "../../auth/schemas/auth";
import { App } from "../../payments/schemas/payments";
import { getMyApps, findMyApp } from "../common/appManager";

/**
 * React hook for accessing the user's apps from RegardeSDK
 *
 * This hook provides a convenient way to access the user's apps in React components.
 * It returns the apps array along with helper functions to find specific apps.
 *
 * @param regardeSDK The user's loaded RegardeSDK instance
 * @returns Object with apps array and helper functions
 */
export const useMyApps = (regardeSDK: Loaded<typeof RegardeSDK> | null) => {
  // In a real implementation, we would use React state and effects here
  // For now, we'll just provide the function implementations

  /**
   * Gets all apps from the user's myApps list
   * @returns Promise<App[]> Array of the user's apps
   */
  const getAllApps = async (): Promise<App[]> => {
    if (!regardeSDK) return [];
    return getMyApps(regardeSDK);
  };

  /**
   * Finds an app by ID from the user's myApps list
   * @param appId The ID of the app to find
   * @returns Promise<App | undefined> The app with the matching ID or undefined if not found
   */
  const getAppById = async (appId: string): Promise<App | undefined> => {
    if (!regardeSDK) return undefined;
    return findMyApp(regardeSDK, appId);
  };

  /**
   * Finds apps by payment provider from the user's myApps list
   * @param paymentProvider The payment provider to filter by
   * @returns Promise<App[]> Array of apps with the specified payment provider
   */
  const getAppsByProvider = async (
    paymentProvider: "lemonsqueezy" | "stripe",
  ): Promise<App[]> => {
    if (!regardeSDK) return [];
    const apps = await getMyApps(regardeSDK);
    return apps.filter((app) => app.paymentProvider === paymentProvider);
  };

  return {
    getAllApps,
    getAppById,
    getAppsByProvider,
  };
};
