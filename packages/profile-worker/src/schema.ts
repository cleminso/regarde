import { co, z } from "jazz-tools";

export const NicknameRegistryCoRecord = co.record(z.string(), z.string());
export type NicknameRegistry = z.infer<typeof NicknameRegistryCoRecord>;

export const RegistryWorkerAccountRoot = co.map({
  registry: NicknameRegistryCoRecord,
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
    } catch (e) {
      console.log("EnsureLoaded Root failed, fallback", account, e);

      if (account.root === undefined) {
        const newRoot = RegistryWorkerAccountRoot.create({
          registry: NicknameRegistryCoRecord.create({}),
        });
        account.root = newRoot;

        console.log(
          "Root created with NicknameRegistry in worker account since it was missing.",
        );
      }
    }
  });
export type RegistryWorkerAccountType = z.infer<typeof RegistryWorkerAccount>;
