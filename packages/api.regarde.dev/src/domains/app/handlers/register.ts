import { App, RegistryWorkerAccount, AppsRecord, AppsByUserRecord, RegistryAppMetadata, type App as AppType } from "@regarde-dev/sdk/registry";
import { Loaded, co, CoList } from "jazz-tools";
import { randomBytes } from "crypto";
import { RegisterAppRequestSchema } from "../schemas";

export const registerAppHandler = (
    appsRecord: AppsRecord,
    appsByUserRecord: AppsByUserRecord,
    worker: Loaded<typeof RegistryWorkerAccount>
) => {
    return async (c: any) => {
        try {
            const { name, paymentProvider, ownerAccountId } = await c.req.json();

            // Generate Webhook Secret
            const webhookSecret = randomBytes(32).toString("hex");

            const newApp = App.create({
                name,
                description: "",
                ownerAccountId,
                paymentProvider,
                isEnabled: false,
                createdAt: Date.now(),
                metadata: {},
                webhookSecret,
                payments: [],
                paymentsByUser: {}
            }, worker);

            // Access ID via $jazz object as .id direct access defaults to undefined on strict proxied creation
            const appId = newApp.$jazz.id;

            if (!appId) throw new Error("Failed to resolve App ID");

            // Use $jazz.set as per Jazz requirement for CoMaps in this version
            appsRecord.$jazz.set(appId, RegistryAppMetadata.create({
                app: newApp,
                isVerified: true,
                hasAccess: false,
                webhookConfigured: false,
                createdAt: Date.now(),
                version: 1,
            }, worker));

            if (!appsByUserRecord[ownerAccountId]) {
                // Ensure the record is loaded before mutation
                await (appsByUserRecord as any).$jazz.ensureLoaded({});
                const newList = co.list(RegistryAppMetadata).create([], { owner: worker });
                (appsByUserRecord as any).$jazz.set(ownerAccountId, newList);
            }

            // Push to the list
            const userAppsList = appsByUserRecord[ownerAccountId];
            if (userAppsList) {
                // Ensured loaded via native Jazz method.
                // Using 'as any' because the current MaybeLoaded type definition 
                // does not expose $jazz on the unloaded union branch, even though the proxy handles it.
                // Casting to CoList results in 'never' return type from ensureLoaded due to type inference issues.
                const loadedList = await (userAppsList as any).$jazz.ensureLoaded();

                loadedList.$jazz.push(RegistryAppMetadata.create({
                    app: newApp,
                    isVerified: true,
                    hasAccess: false,
                    webhookConfigured: false,
                    createdAt: Date.now(),
                    version: 1,
                }, worker));
            }

            const webhookUrl = `https://api.regarde.dev/webhooks/${paymentProvider}/${appId}`;

            return c.json({
                appId,
                webhookUrl,
                webhookSecret
            }, 200);

        } catch (error: any) {
            console.error("Register App Error:", error);
            return c.json({ error: error.message || "Internal Server Error" }, 500);
        }
    };
};
