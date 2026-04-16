import type { WebhookContext, WebhookQueryContext } from "#payments/adapters/types";

import { PolarWebhookSchema } from "./schema";

export const extractPolarContext = (
  payload: unknown,
  queryContext?: WebhookQueryContext,
): WebhookContext => {
  const parsed = PolarWebhookSchema.parse(payload);
  const data = parsed.data;
  const metadata = data.metadata ?? {};

  const appId = metadata.regarde_app_id ?? metadata.app_id ?? queryContext?.pathAppId;
  const jazzAccountId = metadata.regarde_user_id ?? metadata.user_id ?? queryContext?.regarde_user_id;
  const regardeSDKId = metadata.regarde_sdk_id ?? queryContext?.regarde_sdk_id;

  if (typeof appId !== "string" || appId === "") {
    throw new Error("Missing regarde_app_id in Polar metadata or URL path");
  }
  if (typeof jazzAccountId !== "string" || jazzAccountId === "") {
    throw new Error(
      "Missing regarde_user_id in Polar metadata or query params (regarde_user_id)",
    );
  }
  if (typeof regardeSDKId !== "string" || regardeSDKId === "") {
    throw new Error("Missing regarde_sdk_id in Polar metadata or query params (regarde_sdk_id)");
  }

  return { appId, jazzAccountId, regardeSDKId };
};
