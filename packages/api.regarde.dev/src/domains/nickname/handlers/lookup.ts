import { useLogging, type TNicknameRegistry } from "@regarde-dev/core";

const logger = useLogging({
  module: __filename,
});

export const lookupHandler = (nicknameRegistry: TNicknameRegistry) => {
  return async (c: any) => {
    const { nickname } = c.req.valid("param");

    logger.debug({
      message: "lookup for nickname",
      data: {
        nickname,
      },
    });

    const accountId = nicknameRegistry[nickname];

    const isNicknameInRegistry = accountId !== null && accountId !== undefined;
    if (!isNicknameInRegistry) {
      logger.debug({
        message: "nickname not resolved",
        data: {
          nickname,
          accountId,
        },
      });
      return c.json({ error: "Nickname not resolved" }, 404);
    }

    logger.info({
      message: "nickname resolved",
      data: {
        nickname,
        accountId,
      },
    });

    return c.json(
      {
        nickname,
        accountId,
      },
      200,
    );
  };
};
