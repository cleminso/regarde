import { createRoute } from "@hono/zod-openapi";
import { z } from "zod";

export const avatarRoute = createRoute({
  method: "get",
  path: "/avatar/{nickname}",
  request: {
    params: z.object({
      nickname: z.string(),
    }),
  },
  responses: {
    200: {
      content: {
        "image/*": {
          schema: { type: "string", format: "binary" },
        },
      },
      description: "User avatar image",
    },
  },
});

export const avatarHandler = () => {
  return async (c: any) => {
    const { nickname } = c.req.valid("param");

    try {
      // Call api.regarde.dev /lookup endpoint to resolve nickname
      const authServiceUrl = process.env.AUTH_SERVICE_URL || "https://api.regarde.dev";
      const lookupUrl = `${authServiceUrl}/lookup/${encodeURIComponent(nickname)}`;

      const lookupResponse = await fetch(lookupUrl);

      if (lookupResponse.status === 404) {
        return c.notFound();
      }

      if (!lookupResponse.ok) {
        console.error(`api.regarde.dev lookup API returned error: ${lookupResponse.status}`);
        return c.notFound();
      }

      const lookupData = await lookupResponse.json();
      const accountId = lookupData.accountId;

      if (!accountId) {
        return c.notFound();
      }

      // Load profile data to get avatar
      const { RegardeAccount, RegardeProfile } = await import("@regarde-dev/jazz-schemas");

      const jazzUserAccount = await RegardeAccount.load(accountId, {
        resolve: { profile: { "regarde.bio": true } },
      });

      if (!jazzUserAccount?.profile?.["regarde.bio"]) {
        return c.notFound();
      }

      const profileData = await RegardeProfile.load(jazzUserAccount.profile["regarde.bio"], {
        resolve: {
          avatarImage: { original: true },
        },
      });

      if (!profileData?.avatarImage?.original) {
        return c.notFound();
      }

      const blob = profileData.avatarImage.original.toBlob();
      if (!blob) {
        return c.notFound();
      }

      const arrayBuffer = await blob.arrayBuffer();
      const mimeType = blob.type || "image/jpeg";

      return c.body(arrayBuffer, 200, {
        "Content-Type": mimeType,
        "Cache-Control": "public, max-age=86400", // 24 hours
        "Content-Length": arrayBuffer.byteLength.toString(),
      });
    } catch (error) {
      console.error(`Error serving avatar for ${nickname}:`, error);
      return c.notFound();
    }
  };
};
