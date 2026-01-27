import { co } from "jazz-tools";
import { startWorker } from "jazz-tools/worker";

import { RegardeAccount, RegardeSDK, initRegardeSDK } from "@regarde-dev/core";

import { getStoredCredentials } from "./auth.js";

export async function loadAuthenticatedRegardeSDK(): Promise<{
  regardeSDK: co.loaded<typeof RegardeSDK>;
  account: co.loaded<typeof RegardeAccount>;
}> {
  const credsStr = await getStoredCredentials();
  if (!credsStr) {
    throw new Error("Not logged in. Please run 'regarde login' first.");
  }

  let creds: { accountID: string; accountSecret: string };
  try {
    const parsed = JSON.parse(credsStr);
    creds = {
      accountID: String(parsed.accountID || ""),
      accountSecret: String(parsed.accountSecret || ""),
    };
  } catch (e) {
    throw new Error("Invalid credentials format. Please re-login.", {
      cause: e,
    });
  }

  const { accountID: credsAccountID, accountSecret } = creds;
  if (!credsAccountID || !accountSecret) {
    throw new Error("Incomplete credentials. Please re-login.");
  }

  const syncServer = process.env.JAZZ_SYNC_SERVER_URL || "wss://cloud.jazz.tools";

  const workerOptions = {
    AccountSchema: RegardeAccount,
    syncServer: syncServer,
    accountID: credsAccountID,
    accountSecret: creds.accountSecret,
  };

  const { worker } = await startWorker(workerOptions);

  await worker.$jazz.ensureLoaded({
    resolve: { profile: true, root: true },
  });

  if (!worker.$isLoaded) throw new Error("Account not loaded");

  const regardeSDK = await initRegardeSDK(worker);

  if (!regardeSDK.$isLoaded) throw new Error("regardSDK not loaded");

  console.log("account", worker);

  return { regardeSDK, account: worker };
}

export function isAuthenticationValid(regardeSDK: co.loaded<typeof RegardeSDK>): boolean {
  if (!regardeSDK || !regardeSDK.$isLoaded) {
    return false;
  }

  if (!regardeSDK.auth?.$isLoaded) {
    return false;
  }

  return Date.now() <= regardeSDK.auth.expiresAt;
}

export function getAuthenticationHeaders(regardeSDK: co.loaded<typeof RegardeSDK>) {
  if (!isAuthenticationValid(regardeSDK)) {
    throw new Error("Authentication not valid. Please re-login.");
  }

  if (!regardeSDK.auth.$isLoaded) {
    throw new Error("Authentication not properly loaded");
  }

  return {
    "X-Regarde-Token": regardeSDK.auth.token,
    "X-Regarde-Token-Id": regardeSDK.auth.$jazz.id,
  };
}
