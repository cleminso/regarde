import { describe, expect, it, beforeAll } from "vitest";

const JAZZ_SYNC_SERVER_URL =
  process.env.JAZZ_SYNC_SERVER_URL || "ws://localhost:4200";

// Node doesn't have WebSocket in Vitest node env by default
(globalThis as any).WebSocket =
  (globalThis as any).WebSocket || class WebSocket {};

describe("jazz sync integration", () => {
  beforeAll(() => {
    console.log(
      `Jazz integration tests running against: ${JAZZ_SYNC_SERVER_URL}`,
    );
    console.log(
      `REGARDE_REGISTRY_GROUP: ${process.env.REGARDE_REGISTRY_GROUP}`,
    );
  });

  it("requires REGARDE_REGISTRY_GROUP to be set", () => {
    const registryGroup = process.env.REGARDE_REGISTRY_GROUP;
    expect(registryGroup).toBeDefined();
    expect(registryGroup).toMatch(/^co_/);
  });

  it("creates a new account and syncs to local Jazz server", async () => {
    const { createWebSocketPeer } = await import("cojson-transport-ws");
    const { createJazzContextForNewAccount, MockSessionProvider } =
      await import("jazz-tools");
    const { NapiCrypto } = await import("jazz-tools/napi");
    const { RegardeAccount } = await import("@regarde-dev/core");
    const { generateMnemonic, mnemonicToEntropy } =
      await import("@scure/bip39");
    const { wordlist } = await import("@scure/bip39/wordlists/english.js");

    const crypto = await NapiCrypto.create();
    const sessionProvider = new MockSessionProvider();

    // Generate a real passphrase and derive secret
    const passphrase = generateMnemonic(wordlist, 256);
    console.log(`Generated 24-word passphrase for test account`);

    const seed = mnemonicToEntropy(passphrase, wordlist);
    const accountSecret = crypto.agentSecretFromSecretSeed(seed);

    // Connect to local Jazz sync server
    const peer = createWebSocketPeer({
      id: "upstream",
      websocket: new WebSocket(JAZZ_SYNC_SERVER_URL),
      role: "server",
    });

    // Create a new account
    const jazzContext = await createJazzContextForNewAccount({
      creationProps: { name: "Integration Test User" },
      crypto,
      peers: [peer],
      sessionProvider,
      initialAgentSecret: accountSecret,
      AccountSchema: RegardeAccount,
    });

    // Wait for sync
    await jazzContext.account.$jazz.waitForAllCoValuesSync();

    const accountId = jazzContext.account.$jazz.id;
    console.log(`Created account: ${accountId}`);

    // Verify account was created with expected format
    expect(accountId).toBeDefined();
    expect(accountId).toMatch(/^co_/);
  });

  it("loads an existing account from credentials", async () => {
    const { startWorker } = await import("jazz-tools/worker");
    const { RegardeAccount } = await import("@regarde-dev/core");
    const { NapiCrypto } = await import("jazz-tools/napi");
    const { generateMnemonic, mnemonicToEntropy } =
      await import("@scure/bip39");
    const { wordlist } = await import("@scure/bip39/wordlists/english.js");
    const { createWebSocketPeer } = await import("cojson-transport-ws");
    const { createJazzContextForNewAccount, MockSessionProvider } =
      await import("jazz-tools");

    const crypto = await NapiCrypto.create();
    const sessionProvider = new MockSessionProvider();

    // First create an account
    const passphrase = generateMnemonic(wordlist, 256);
    const seed = mnemonicToEntropy(passphrase, wordlist);
    const accountSecret = crypto.agentSecretFromSecretSeed(seed);

    const peer = createWebSocketPeer({
      id: "upstream",
      websocket: new WebSocket(JAZZ_SYNC_SERVER_URL),
      role: "server",
    });

    const jazzContext = await createJazzContextForNewAccount({
      creationProps: { name: "Test User for Loading" },
      crypto,
      peers: [peer],
      sessionProvider,
      initialAgentSecret: accountSecret,
      AccountSchema: RegardeAccount,
    });

    await jazzContext.account.$jazz.waitForAllCoValuesSync();
    const accountId = jazzContext.account.$jazz.id;
    console.log(`Created account for loading test: ${accountId}`);

    // Now load the account using startWorker
    const { worker } = await startWorker({
      AccountSchema: RegardeAccount,
      syncServer: JAZZ_SYNC_SERVER_URL,
      accountID: accountId,
      accountSecret,
    });

    await worker.$jazz.ensureLoaded({ resolve: { root: true } });

    // Verify the loaded account matches
    expect(worker.$jazz.id).toBe(accountId);
    expect(worker.$isLoaded).toBe(true);
    console.log(`Successfully loaded account: ${worker.$jazz.id}`);
  });
});
