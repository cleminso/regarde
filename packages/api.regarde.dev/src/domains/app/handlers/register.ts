import {
  RegistryWorkerAccount,
  type TAllRegistryAppsSchema,
  type TAppsByUserRecord,
  RegistryAppMetadata,
} from "@regarde-dev/sdk/registry";
import { App, type TApp } from "@regarde-dev/sdk/payments";
import { RegardeAccount, type TRegardeAccount } from "@regarde-dev/sdk/auth";
import { Loaded, co } from "jazz-tools";
import { randomBytes } from "node:crypto";
import { verifyRegardeAuth } from "#/domains/auth/handlers/verify";

type HonoContext = {
  req: {
    header: (name: string) => string | undefined;
    json: () => Promise<{ appId: string }>;
  };
  json: (data: unknown, status?: number) => Response;
};

export const registerAppHandler = (
  appsRecord: TAllRegistryAppsSchema,
  appsByUserRecord: TAppsByUserRecord,
  worker: Loaded<typeof RegistryWorkerAccount>,
) => {
  return async (c: HonoContext) => {
    try {
      const regardeAuth = c.req.header("X-Regarde-Token");
      const regardeAuthId = c.req.header("X-Regarde-Token-Id");

      const hasToken = regardeAuth !== undefined;
      const hasTokenId = regardeAuthId !== undefined;
      const bothHeadersPresent = hasToken && hasTokenId;

      if (bothHeadersPresent === false) {
        console.log(
          "[ERROR] Missing authentication headers for register-app endpoint",
        );
        return c.json({ error: "Missing authentication headers" }, 401);
      }

      const { appId } = await c.req.json();

      if (!appsRecord[appId]) {
        return c.json({ error: "App not found in registry" }, 404);
      }

      const appMetadata = appsRecord[appId];
      if (appMetadata === undefined || appMetadata.$isLoaded === false) {
        return c.json({ error: "App not found in registry" }, 404);
      }

      const resolved = await appMetadata.$jazz.ensureLoaded({
        resolve: {
          app: true,
        },
      });
      const app = resolved.app;
      const $appIsLoaded = app !== undefined && app.$isLoaded === true;

      if ($appIsLoaded === false) {
        return c.json({ error: "Failed to load app details" }, 500);
      }

      const ownerAccountId = app.ownerAccountId;
      const paymentProvider = app.paymentProvider;

      console.log(`[AUTH] Verifying token for account: ${ownerAccountId}`);
      const verificationResult = await verifyRegardeAuth(
        ownerAccountId,
        regardeAuth as string,
        regardeAuthId as string,
      );

      if (verificationResult.isValid === false) {
        console.log(
          `[ERROR] Authentication failed for AccountID "${ownerAccountId}": ${verificationResult.error}`,
        );
        return c.json(
          { error: `Authentication failed: ${verificationResult.error}` },
          403,
        );
      }

      console.log(
        `[AUTH] Authentication successful for AccountID "${ownerAccountId}"`,
      );

      const userAccount = await RegardeAccount.load(ownerAccountId, {
        loadAs: worker,
        resolve: { root: true },
      });

      const userAccountValid = userAccount.$isLoaded === true;

      if (userAccountValid === false) {
        return c.json({ error: "Failed to load user account" }, 500);
      }

      const regardeSDK = userAccount.root["regarde-sdk"];
      const regardeSDKValid =
        regardeSDK !== undefined && regardeSDK.$isLoaded === true;

      if (regardeSDKValid === false) {
        return c.json(
          {
            error:
              "Your account is not properly initialized. Please initialize your account first.",
          },
          400,
        );
      }

      const myApps = regardeSDK.myApps;
      if (myApps === undefined) {
        return c.json({ error: "Apps list not found" }, 400);
      }
      if (myApps.$isLoaded === false) {
        await regardeSDK.$jazz.ensureLoaded({ resolve: { myApps: true } });
        const loadedMyApps = regardeSDK.myApps;
        if (loadedMyApps === undefined || loadedMyApps.$isLoaded === false) {
          return c.json({ error: "Failed to load apps list" }, 500);
        }
        const userApps = Array.from(loadedMyApps) as (TApp | undefined)[];
        const loadedApps = userApps.filter(
          (userApp): userApp is TApp =>
            userApp !== undefined && userApp.$isLoaded === true,
        );
        const appIsInList = loadedApps.some(
          (userApp) => userApp.$jazz.id === appId,
        );
        if (appIsInList === false) {
          return c.json({ error: "App not in user's apps list" }, 403);
        }
      } else {
        const userApps = Array.from(myApps) as (TApp | undefined)[];
        const loadedApps = userApps.filter(
          (userApp): userApp is TApp =>
            userApp !== undefined && userApp.$isLoaded === true,
        );
        const appIsInList = loadedApps.some(
          (userApp) => userApp.$jazz.id === appId,
        );
        if (appIsInList === false) {
          return c.json({ error: "App not in user's apps list" }, 403);
        }
      }

      let webhookSecret: string;

      if (!app.webhookSecret) {
        webhookSecret = randomBytes(20).toString("hex");
        app.$jazz.set("webhookSecret", webhookSecret);
        await app.$jazz.waitForSync();
      } else {
        webhookSecret = app.webhookSecret;
      }

      const webhookUrl = `https://api.regarde.dev/webhooks/${paymentProvider}/${appId}`;

      const existingAppRegistration = appsRecord[appId];
      if (
        existingAppRegistration !== undefined &&
        existingAppRegistration.$isLoaded === true
      ) {
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

      if (!appsByUserRecord[ownerAccountId]) {
        appsByUserRecord.$jazz.set(
          ownerAccountId,
          co.list(RegistryAppMetadata).create([], registryOwner),
        );
        await appsByUserRecord.$jazz.waitForSync();
      }

      const userAppsList = appsByUserRecord[ownerAccountId];

      const userAppsListValid =
        userAppsList !== undefined && userAppsList.$isLoaded === true;

      if (userAppsListValid === true) {
        userAppsList.$jazz.push(
          RegistryAppMetadata.create(
            {
              app: app,
              isVerified: true,
              hasAccess: false,
              webhookConfigured: false,
              createdAt: Date.now(),
              version: 1,
            },
            registryOwner,
          ),
        );
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
