import {
  RegistryWorkerAccount,
  type TAllRegistryAppsSchema,
  type TAppsByUserRecord,
  RegistryAppMetadata,
} from "@regarde-dev/sdk/registry";
import { type TApp, App } from "@regarde-dev/sdk/payments";
import { RegardeAccount } from "@regarde-dev/sdk/auth";
import { Loaded, co } from "jazz-tools";
import { randomBytes } from "node:crypto";
import { verifyRegardeAuth } from "#/domains/auth/handlers/verify";

export const registerAppHandler = (
  appsRecord: TAllRegistryAppsSchema,
  appsByUserRecord: TAppsByUserRecord,
  worker: Loaded<typeof RegistryWorkerAccount>,
) => {
  return async (c: any) => {
    try {
      const regardeAuth = c.req.header("X-Regarde-Token");
      const regardeAuthId = c.req.header("X-Regarde-Token-Id");

      if (!regardeAuth) {
        console.log("[ERROR] Missing registration token header");
        return c.json({ error: "Missing registration token header" }, 401);
      }

      const { appId } = await c.req.json();

      console.log(`[INFO] Processing registration for appId: ${appId}`);

      console.log("[INFO] Loading app by ID to extract ownership");

      // Load the App directly using the provided appId
      const app = await App.load(appId, {
        loadAs: worker,
        resolve: true,
      });

      const appLoaded = app !== null && app.$isLoaded === true;
      if (appLoaded === false) {
        return c.json({ error: "App not found or not accessible" }, 404);
      }

      console.log("[INFO] App loaded successfully");

      // Extract jazzAccountId from the App's owner context
      const appOwnerGroup = app.$jazz.owner as any;
      const jazzAccountId = appOwnerGroup.$jazz.owner.$jazz.id;

      console.log(
        `[INFO] Extracted jazzAccountId: ${jazzAccountId} from App ownership`,
      );

      // Verify authentication using the extracted jazzAccountId
      const verificationResult = await verifyRegardeAuth(
        jazzAccountId,
        regardeAuth,
        regardeAuthId,
        worker,
      );

      if (verificationResult.isValid === false) {
        console.log(
          `[ERROR] Authentication failed: ${verificationResult.error}`,
        );
        return c.json(
          { error: `Authentication failed: ${verificationResult.error}` },
          403,
        );
      }

      console.log(
        "[INFO] Authentication verified - proceeding with registration",
      );

      // Load the user's RegardeAccount to validate App ownership
      const userAccount = await RegardeAccount.load(jazzAccountId, {
        loadAs: worker,
        resolve: { root: true },
      });

      const userAccountLoaded =
        userAccount !== null && userAccount.$isLoaded === true;
      if (userAccountLoaded === false) {
        return c.json(
          { error: "User account not found or not accessible" },
          404,
        );
      }

      console.log("[INFO] User account loaded successfully");

      // Verify user's RegardeSDK is properly initialized
      const userRegardeSDK = userAccount.root["regarde-sdk"];
      const userRegardeSDKValid =
        userRegardeSDK !== undefined && userRegardeSDK.$isLoaded === true;
      if (userRegardeSDKValid === false) {
        return c.json(
          {
            error:
              "Your account is not properly initialized. Please initialize your account first.",
          },
          400,
        );
      }

      // Load user's apps list to verify this App is properly stored there
      const userMyApps = userRegardeSDK.myApps;
      if (userMyApps === undefined) {
        return c.json({ error: "Apps list not found in user account" }, 400);
      }
      if (userMyApps.$isLoaded === false) {
        await userRegardeSDK.$jazz.ensureLoaded({ resolve: { myApps: true } });
      }

      const loadedUserMyApps = userRegardeSDK.myApps;
      if (
        loadedUserMyApps === undefined ||
        loadedUserMyApps.$isLoaded === false
      ) {
        return c.json({ error: "Failed to load user's apps list" }, 500);
      }

      // Verify the App exists in user's RegardeSDK.myApps
      const allUserApps = Array.from(loadedUserMyApps) as (TApp | undefined)[];
      const userLoadedApps = allUserApps.filter(
        (userApp): userApp is TApp =>
          userApp !== undefined && userApp.$isLoaded === true,
      );

      const appBelongsToUser = userLoadedApps.some(
        (userApp) => userApp.$jazz.id === appId,
      );

      if (appBelongsToUser === false) {
        return c.json(
          {
            error:
              "App exists but is not properly linked to your account. Please ensure the App was created through the proper SDK flow.",
          },
          403,
        );
      }

      console.log(
        "[INFO] App ownership verified - App properly linked to user account",
      );

      let webhookSecret: string;

      if (!app.webhookSecret) {
        webhookSecret = randomBytes(20).toString("hex");
        app.$jazz.set("webhookSecret", webhookSecret);
        await app.$jazz.waitForSync();
      } else {
        webhookSecret = app.webhookSecret;
      }

      const webhookUrl = `https://api.regarde.dev/webhooks/${app.paymentProvider}/${appId}`;

      const existingUserAppsList = appsByUserRecord[jazzAccountId];
      const alreadyRegistered =
        existingUserAppsList !== undefined &&
        existingUserAppsList.$isLoaded === true &&
        existingUserAppsList.some(
          (entry) =>
            entry?.$isLoaded === true &&
            entry.app?.$isLoaded === true &&
            (entry.app.$jazz.id === appId || entry.app.name === app.name),
        );

      if (alreadyRegistered === true) {
        return c.json(
          {
            message: "App already registered",
            appId,
            webhookUrl,
            webhookSecret,
          },
          200,
        );
      }

      const registryOwner = worker.$jazz.owner;
      const registryOwnerValid = registryOwner !== undefined;

      if (registryOwnerValid === false) {
        return c.json({ error: "Failed to load registry owner group" }, 500);
      }

      const metadata = RegistryAppMetadata.create(
        {
          app: app,
          isVerified: true,
          hasAccess: false,
          webhookConfigured: false,
          createdAt: Date.now(),
          version: 1,
        },
        registryOwner,
      );

      appsRecord.$jazz.set(appId, metadata);
      await appsRecord.$jazz.waitForSync();

      if (!appsByUserRecord[jazzAccountId]) {
        appsByUserRecord.$jazz.set(
          jazzAccountId,
          co.list(RegistryAppMetadata).create([], registryOwner),
        );
        await appsByUserRecord.$jazz.waitForSync();
      }

      const userAppsList = appsByUserRecord[jazzAccountId];

      const userAppsListValid =
        userAppsList !== undefined && userAppsList.$isLoaded === true;

      if (userAppsListValid === true) {
        userAppsList.$jazz.push(metadata);
        await appsByUserRecord.$jazz.waitForSync();
      }

      return c.json(
        {
          appId,
          webhookUrl,
          webhookSecret,
        },
        200,
      );
    } catch (error: unknown) {
      console.error("Register App Error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Internal Server Error";
      return c.json({ error: errorMessage }, 500);
    }
  };
};
