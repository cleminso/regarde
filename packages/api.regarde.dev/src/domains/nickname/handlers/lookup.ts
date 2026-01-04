import { type TNicknameRegistry } from "@regarde-dev/core";

export const lookupHandler = (nicknameRegistry: TNicknameRegistry) => {
  return async (c: any) => {
    try {
      const { nickname } = c.req.valid("param");

      console.log(`Looking up nickname: "${nickname}"`);

      const accountId = nicknameRegistry[nickname];

      if (!accountId) {
        console.log(`Nickname "${nickname}" not found in registry`);
        return c.json({ error: "Nickname not found" }, 404);
      }

      console.log(`Nickname "${nickname}" resolved to accountId: ${accountId}`);

      return c.json(
        {
          nickname,
          accountId,
        },
        200,
      );
    } catch (error: any) {
      console.error(`Error processing /lookup request: ${error}`);
      return c.json({ error: error.message || "Internal server error" }, 500);
    }
  };
};
