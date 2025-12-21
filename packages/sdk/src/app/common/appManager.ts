import { co, Loaded } from "jazz-tools";
import { App } from "../../payments/schemas/payments";
import { RegardeSDK } from "../../auth/schemas/auth";

/**
 * Generates a random hex string for webhook secret
 * Browser-compatible alternative to crypto.randomBytes
 */
function generateWebhookSecret(length: number = 20): string {
  const chars = "0123456789abcdef";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Creates a new App and adds it to the user's myApps list in RegardeSDK
 *
 * This function provides a client-side way to create an app without needing to go through the API.
 * The app is created with the user's own group as the owner and added to their myApps list.
 *
 * @param regardeSDK The user's loaded RegardeSDK instance
 * @param appData The data for the new app (name, description, paymentProvider)
 * @returns The newly created App instance
 */
export const createApp = async (
  regardeSDK: Loaded<typeof RegardeSDK>,
  appData: {
    name: string;
    description?: string;
    paymentProvider: "lemonsqueezy" | "stripe";
  },
): Promise<App> => {
  // Get the user's personal group that owns their RegardeSDK
  const userGroup = regardeSDK.$jazz.owner;

  // Generate webhook secret
  const webhookSecret = generateWebhookSecret(20);

  // Create the new App with the user's group as owner
  const newApp = App.create(
    {
      name: appData.name,
      description: appData.description || "",
      ownerAccountId: regardeSDK.$jazz.owner.$jazz.id,
      paymentProvider: appData.paymentProvider,
      isEnabled: false,
      createdAt: Date.now(),
      metadata: {},
      webhookSecret,
      payments: [],
      paymentsByUser: {},
    },
    { owner: userGroup },
  );

  // Add the new app to the user's myApps list
  if (regardeSDK.myApps && regardeSDK.myApps.$isLoaded) {
    regardeSDK.myApps.$jazz.push(newApp);
  } else {
    throw new Error("RegardeSDK.myApps is not loaded");
  }

  return newApp;
};

/**
 * Gets all apps from the user's myApps list in RegardeSDK
 *
 * This function provides a client-side way to retrieve all the user's apps
 * from their local RegardeSDK without needing to query the registry.
 *
 * @param regardeSDK The user's loaded RegardeSDK instance
 * @returns Array of the user's apps
 */
export const getMyApps = async (
  regardeSDK: Loaded<typeof RegardeSDK>,
): Promise<App[]> => {
  if (!regardeSDK.myApps || !regardeSDK.myApps.$isLoaded) {
    return [];
  }

  // Wait for myApps to be fully loaded
  await regardeSDK.myApps.$jazz.ensureLoaded({
    resolve: {},
  });

  // Convert the list to an array and filter for loaded apps
  return Array.from(regardeSDK.myApps).filter(
    (app): app is App => app?.$isLoaded,
  );
};

/**
 * Finds an app by ID from the user's myApps list
 *
 * @param regardeSDK The user's loaded RegardeSDK instance
 * @param appId The ID of the app to find
 * @returns The app with the matching ID or undefined if not found
 */
export const findMyApp = async (
  regardeSDK: Loaded<typeof RegardeSDK>,
  appId: string,
): Promise<App | undefined> => {
  const myApps = await getMyApps(regardeSDK);
  return myApps.find((app) => app.$jazz.id === appId);
};
