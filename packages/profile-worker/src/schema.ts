import { co, z } from "jazz-tools";

export const NicknameRegistryCoRecord = co.record(z.string(), z.string());
export type NicknameRegistry = z.infer<typeof NicknameRegistryCoRecord>;

export const ReverseNicknameRegistryCoRecord = co.record(z.string(), z.string());
export type ReverseNicknameRegistry = z.infer<typeof ReverseNicknameRegistryCoRecord>;

export const RegistryWorkerAccountRoot = co.map({
  registry: NicknameRegistryCoRecord,
  reverseRegistry: ReverseNicknameRegistryCoRecord,
});
export type RegistryWorkerAccountRoot = z.infer<
  typeof RegistryWorkerAccountRoot
>;

export const RegistryWorkerAccount = co
  .account({
    profile: co.profile(),
    root: RegistryWorkerAccountRoot,
  })
  .withMigration(async (account) => {
    try {
      const loadedAccount = await account.ensureLoaded({
        resolve: {
          root: true,
        },
      });

      console.dir("Loaded via ensureLoaded", loadedAccount);

      if (loadedAccount.root.registry === undefined) {
        const newRegistry = NicknameRegistryCoRecord.create({});
        loadedAccount.root.registry = newRegistry;
        console.log("NicknameRegistry created in worker account root.");
      }
      if (loadedAccount.root.reverseRegistry === undefined) {
        const newReverseRegistry = ReverseNicknameRegistryCoRecord.create({});
        loadedAccount.root.reverseRegistry = newReverseRegistry;
        console.log("ReverseNicknameRegistry created in worker account root.");
      }
    } catch (e) {
      console.log("EnsureLoaded Root failed, fallback", account, e);

      if (account.root === undefined) {
        const newRoot = RegistryWorkerAccountRoot.create({
          registry: NicknameRegistryCoRecord.create({}),
          reverseRegistry: ReverseNicknameRegistryCoRecord.create({}),
        });
        account.root = newRoot;

        console.log(
          "Root created with NicknameRegistry and ReverseNicknameRegistry in worker account since it was missing.",
        );
      } else {
        // If root exists but one of the registries is missing (pre-migration case)
        if (account.root.registry === undefined) {
          const newRegistry = NicknameRegistryCoRecord.create({});
          account.root.registry = newRegistry;
          console.log("NicknameRegistry created in existing root during fallback.");
        }
        if (account.root.reverseRegistry === undefined) {
          const newReverseRegistry = ReverseNicknameRegistryCoRecord.create({});
          account.root.reverseRegistry = newReverseRegistry;
          console.log("ReverseNicknameRegistry created in existing root during fallback.");
        }
      }
    }
  });
export type RegistryWorkerAccountType = z.infer<typeof RegistryWorkerAccount>;
