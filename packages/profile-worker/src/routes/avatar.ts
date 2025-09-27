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

export const avatarHandler = (nicknameRegistry: any) => {
  return async (c: any) => {
    const { nickname } = c.req.valid("param");

    try {
      // Get profile and serve avatar
      const accountId = nicknameRegistry[nickname];
      if (!accountId) {
        return c.notFound();
      }

      // Load profile data to get avatar
      const { OnboardingAccount, JazzAppProfile } = await import(
        "@regarde/shared-schemas/profile"
      );

      const jazzUserAccount = await OnboardingAccount.load(accountId, {
        resolve: { profile: { "regarde.bio": true } },
      });

      if (!jazzUserAccount?.profile?.["regarde.bio"]) {
        return c.notFound();
      }

      const profileData = await JazzAppProfile.load(
        jazzUserAccount.profile["regarde.bio"],
        {
          resolve: {
            avatarImage: { original: true },
          },
        },
      );

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
