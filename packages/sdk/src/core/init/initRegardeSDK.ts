import { co, z, Group, type ID } from "jazz-tools";
import { RegardeAuth } from "#schemas/regardeAuth";
import { RegardeAccount } from "#schemas/regardeAccount";
import { RegardeSDK } from "#schemas/regardeSDK";
import { UserHandle } from "#schemas/regardeUserHandle";
import { App } from "#schemas/regardeUserApp";
import { getRegardeAuth } from "#managers/auth/refreshAuthToken";
import { generateRegardeToken } from "#managers/auth/generateToken";
import { TOKEN_LIFETIME_SECONDS } from "#managers/auth/";
import { useLogging } from "#core/logger";

export type InitRegardeSDKMode = "ensure" | "create";

const logger = useLogging({
  module: __filename,
});

export const initRegardeSDK = async (
  account: co.loaded<typeof RegardeAccount>,
  mode: InitRegardeSDKMode = "ensure",
  /** The AppId you get when creating your Regarde App */
  appId: ID<string> | "no-app",
): Promise<co.loaded<typeof RegardeSDK>> => {
  const accountValid = account !== null && account.$isLoaded === true;
  const REGARDE_REGISTRY_GROUP = "co_zoppoxWWJaHYKPgSgUkuCCXQX21";

  logger.debug({
    message: "starting InitRegardeSDK",
    data: {
      metadata: {
        appId,
      },
      account,
      accountIsLoaded: account.$isLoaded,
      accountValid,
      mode,
      ["process.env.REGARDE_REGISTRY_GROUP"]:
        process.env.REGARDE_REGISTRY_GROUP,
      REGARDE_REGISTRY_GROUP,
    },
  });

  if (accountValid === false) {
    throw new Error("Account must be loaded before calling initRegardeSDK");
  }

  // build RegardeSDK from scratch
  if (mode === "create") {
    const regardeProfileWorkerGroup = await co
      .group()
      .load(REGARDE_REGISTRY_GROUP, {
        loadAs: account,
      });
    const isGroupLoaded = regardeProfileWorkerGroup.$isLoaded === true;

    logger.debug({
      message: "starting creation",
      data: {
        mode,
        groupJazzId: regardeProfileWorkerGroup.$jazz.id,
        isGroupLoaded,
      },
    });

    if (isGroupLoaded === false) {
      throw new Error("regardeProfileWorkerGroup not available"); // TODO: what not available mean here?
    }

    const userGroup = Group.create({
      owner: account,
    });

    userGroup.addMember(regardeProfileWorkerGroup, "writer");

    await userGroup.$jazz.waitForSync();

    logger.debug({
      message: "User Group Created",
      data: {
        groupJazzId: userGroup.$jazz.id,
        directMembers: userGroup.getDirectMembers(),
        allMembers: userGroup.members,
        myRole: userGroup.myRole,
      },
    });

    const regardeAdminOtherReadersGroup = Group.create({
      owner: account,
    });
    regardeAdminOtherReadersGroup.addMember(regardeProfileWorkerGroup, "admin");
    regardeAdminOtherReadersGroup.addMember(account, "reader");

    await regardeAdminOtherReadersGroup.$jazz.waitForSync();

    logger.debug({
      message: "RegardeAdminOthersReaderGroup created",
      data: {
        groupJazzId: regardeAdminOtherReadersGroup.$jazz.id,
        directMembers: regardeAdminOtherReadersGroup.getDirectMembers(),
        allMembers: regardeAdminOtherReadersGroup.members,
        myRole: regardeAdminOtherReadersGroup.myRole,
      },
    });

    const newSDK = RegardeSDK.create(
      {
        myUserHandle: UserHandle.create(
          {
            nickname: "not-yet",
            registeredAt: 0,
            lastModified: 0,
            isActive: false,
          },
          {
            owner: userGroup,
          },
        ),
        auth: RegardeAuth.create(
          {
            token: generateRegardeToken(),
            expiresAt: Date.now() + TOKEN_LIFETIME_SECONDS * 1000,
          },
          {
            owner: userGroup,
          },
        ),
        myApps: co.list(App).create([], { owner: userGroup }),
        myPayments: co
          .map({
            all: co.record(z.string(), z.string()), // prefixedProviderEventUUID -> PaymentEvent.id
            byApp: co.record(z.string(), co.record(z.string(), z.string())), // App.id -> prefixedProviderEventUUID -> PaymentEvent.id
          })
          .create(
            {
              all: {},
              byApp: {},
            },
            { owner: regardeAdminOtherReadersGroup },
          ),
        version: 3,
      },
      {
        owner: userGroup,
      },
    );

    logger.debug({
      message: "RegardeSDK created",
      data: {
        regardeSdkJazzId: newSDK.$jazz.id,
        regardeSdkIsLoaded: newSDK.$isLoaded,
        newSDK: newSDK.toJSON(),
      },
    });

    return newSDK;
  }

  // I ensure regardeSDK exist and if found nothing I create it
  const { root } = await account.$jazz.ensureLoaded({
    resolve: {
      root: {
        "regarde-sdk": true,
      },
    },
  });

  const rootLoaded = root.$isLoaded === true;
  if (rootLoaded === false) {
    throw new Error("Account root not loaded");
  }

  const regardeSDK = root["regarde-sdk"];

  const sdkValid = regardeSDK !== null && regardeSDK.$isLoaded === true;
  if (sdkValid === false) {
    logger.debug({
      message: "RegardeSDK missing, preparing fallback creation",
      data: {
        metadata: { operation: "ensureFallbackCreate" },
        accountJazzId: account.$jazz.id,
        accountLoaded: account.$isLoaded,
        regardeSdkIsLoaded: regardeSDK?.$isLoaded,
      },
    });

    const regardeProfileWorkerGroup = await co
      .group()
      .load(REGARDE_REGISTRY_GROUP, {
        loadAs: account,
      });

    const isGroupLoaded = regardeProfileWorkerGroup.$isLoaded === true;
    if (isGroupLoaded === false) {
      logger.debug({
        message: "regardeProfileWorkerGroup not loaded",
        data: {
          metadata: { operation: "ensureFallbackCreate" },
          groupJazzId: regardeProfileWorkerGroup.$jazz?.id,
          isGroupLoaded,
        },
      });
      throw new Error("regardeProfileWorkerGroup not loaded");
    }

    const userGroup = Group.create({
      owner: account,
    });

    userGroup.addMember(regardeProfileWorkerGroup as Group, "writer");

    await userGroup.$jazz.waitForSync();

    logger.debug({
      message: "User Group created for fallback SDK",
      data: {
        metadata: { operation: "ensureFallbackCreate" },
        groupJazzId: userGroup.$jazz.id,
        directMembers: userGroup.getDirectMembers(),
        allMembers: userGroup.members,
        myRole: userGroup.myRole,
      },
    });

    const regardeAdminOtherReadersGroup = Group.create({
      owner: account,
    });
    regardeAdminOtherReadersGroup.addMember(regardeProfileWorkerGroup, "admin");
    regardeAdminOtherReadersGroup.addMember(account, "reader");

    await regardeAdminOtherReadersGroup.$jazz.waitForSync();

    logger.debug({
      message: "RegardeAdminOthersReaderGroup created",
      data: {
        groupJazzId: regardeAdminOtherReadersGroup.$jazz.id,
        directMembers: regardeAdminOtherReadersGroup.getDirectMembers(),
        allMembers: regardeAdminOtherReadersGroup.members,
        myRole: regardeAdminOtherReadersGroup.myRole,
      },
    });

    const newSDK = RegardeSDK.create(
      {
        myUserHandle: UserHandle.create(
          {
            nickname: "not-yet",
            registeredAt: 0,
            lastModified: 0,
            isActive: false,
          },
          {
            owner: userGroup,
          },
        ),
        auth: RegardeAuth.create(
          {
            token: generateRegardeToken(),
            expiresAt: Date.now() + TOKEN_LIFETIME_SECONDS * 1000,
          },
          {
            owner: userGroup,
          },
        ),
        myApps: co.list(App).create([], { owner: userGroup }),
        myPayments: {
          all: co
            .record(z.string(), z.string())
            .create({}, { owner: regardeAdminOtherReadersGroup }), // prefixedProviderEventUUID -> PaymentEvent.id
          byApp: co
            .record(z.string(), co.record(z.string(), z.string()))
            .create({}, { owner: regardeAdminOtherReadersGroup }), // App.id -> prefixedProviderEventUUID -> PaymentEvent.id
        },
        version: 3,
      },
      {
        owner: userGroup,
      },
    );

    root.$jazz.set("regarde-sdk", newSDK);
    await newSDK.$jazz.waitForSync();
    await account.$jazz.waitForSync();

    logger.debug({
      message: "RegardeSDK created",
      data: {
        metadata: { operation: "ensureFallbackCreate" },
        regardeSdkJazzId: newSDK.$jazz.id,
        regardeSdkIsLoaded: newSDK.$isLoaded,
        newSDK: newSDK.toJSON(),
        userAccountIsLoaded: account.$isLoaded,
      },
    });

    return newSDK;
  }

  await regardeSDK.$jazz.ensureLoaded({
    resolve: {
      auth: true,
      myApps: true,
      myUserHandle: true,
      myPayments: true,
    },
  });

  const authLoaded =
    regardeSDK.auth !== null && regardeSDK.auth.$isLoaded === true;
  if (authLoaded === false) {
    logger.warn({
      message: "RegardeSDK auth not loaded",
      data: {
        mode,
        authNull: regardeSDK.auth === null,
        authLoaded: regardeSDK.auth?.$isLoaded,
      },
    });
    throw new Error("RegardeSDK auth must be loaded...");
  }

  const hasToken = regardeSDK.auth.$jazz.has("token") === true;
  const hasExpiresAt = regardeSDK.auth.$jazz.has("expiresAt") === true;
  const bothFieldsPresent = hasToken && hasExpiresAt;

  if (bothFieldsPresent === false) {
    logger.warn({
      message: "RegardeSDK auth missing fields",
      data: {
        mode,
        hasToken,
        hasExpiresAt,
      },
    });
    throw new Error(
      "RegardeSDK auth must have both token and expiresAt fields",
    );
  }

  const tokenValue = regardeSDK.auth.token;
  const tokenPresent = tokenValue !== null && tokenValue.length > 0;

  if (tokenPresent === false) {
    logger.warn({
      message: "RegardeSDK auth token empty",
      data: {
        mode,
        tokenValue,
      },
    });
    throw new Error("RegardeSDK auth token must be present");
  }

  const isExpired = Date.now() > regardeSDK.auth.expiresAt;
  if (isExpired === true) {
    logger.debug({
      message: "RegardeSDK auth token expired, refreshing",
      data: {
        mode,
        expiredAt: regardeSDK.auth.expiresAt,
        now: Date.now(),
      },
    });
    const newToken = await getRegardeAuth({
      loadedRegardeAuthCoMap: regardeSDK.auth,
    });
    if (newToken === null) {
      logger.error({
        message: "Token refresh failed",
        data: {
          mode,
          authId: regardeSDK.auth.$jazz.id,
        },
      });
      throw new Error("Failed to refresh authentication token");
    }
    await regardeSDK.auth.$jazz.waitForSync();
  }

  return regardeSDK;
};
