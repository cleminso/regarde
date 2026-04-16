import type { WebhookContext, WebhookQueryContext } from "#payments/adapters/types";

import { StripeEventSchema } from "./schema";

export const extractStripeContext = (
  payload: unknown,
  queryContext?: WebhookQueryContext,
): WebhookContext => {
  const parsed = StripeEventSchema.parse(payload);
  const obj = parsed.data.object;

  const metadata = obj.metadata ?? {};
  const appId = metadata.regarde_app_id ?? metadata.app_id ?? queryContext?.pathAppId;
  const jazzAccountId = metadata.regarde_user_id ?? metadata.user_id ?? queryContext?.regarde_user_id;
  const regardeSDKId = metadata.regarde_sdk_id ?? queryContext?.regarde_sdk_id;

  if (typeof appId !== "string" || appId === "") {
    throw new Error("Missing regarde_app_id in Stripe metadata or URL path");
  }
  if (typeof jazzAccountId !== "string" || jazzAccountId === "") {
    throw new Error(
      "Missing regarde_user_id in Stripe metadata or query params (regarde_user_id)",
    );
  }
  if (typeof regardeSDKId !== "string" || regardeSDKId === "") {
    throw new Error("Missing regarde_sdk_id in Stripe metadata or query params (regarde_sdk_id)");
  }

  return { appId, jazzAccountId, regardeSDKId };
};
