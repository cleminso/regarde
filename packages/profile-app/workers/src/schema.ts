import { co, z } from 'jazz-tools';

export const NicknameRegistryCoRecord = co.record(z.string(), z.string());

export const RegistryWorkerAccountRoot = co.map({
  registry: NicknameRegistryCoRecord,
});

export const RegistryWorkerAccount = co
  .account({
    profile: co.profile(),
    root: RegistryWorkerAccountRoot,
  })
  .withMigration(async (account) => {
    const loadedAccount = await account.ensureLoaded({
      resolve: { root: true },
    });

    if (loadedAccount.root.registry === undefined) {
      const newRegistry = NicknameRegistryCoRecord.create({});
      loadedAccount.root.registry = newRegistry;
      console.log('NicknameRegistry created in worker account root.');
    } else {
      console.log('NicknameRegistry already exists in worker account root.');
    }
  });

export type NicknameRegistry = z.infer<typeof NicknameRegistryCoRecord>;
export type RegistryWorkerAccountRoot = z.infer<
  typeof RegistryWorkerAccountRoot
>;
export type RegistryWorkerAccountType = z.infer<typeof RegistryWorkerAccount>;
