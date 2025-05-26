import { co, Group, z, Profile } from 'jazz-tools';
import { Account, AccountRoot } from 'jazz-tools/dist/coValues/account'; // Importing Account and AccountRoot specifically

// Schema for the nickname registry
// Stores a mapping of: nickname (string) -> jazzAccountID (string)
export const NicknameRegistry = co.record(z.string(), z.string());

// Schema for the worker's account root
// This will hold the NicknameRegistry CoMap
export const RegistryWorkerAccountRoot = co.map({
  registry: NicknameRegistry,
});

// Schema for the worker's account
export const RegistryWorkerAccount = co
  .account({
    profile: Profile, // Using a standard Profile schema for the worker
    root: RegistryWorkerAccountRoot,
  })
  .withMigration(async (account) => {
    // This migration runs when the worker starts, ensuring the registry exists.
    // We need to load the root first to check if the registry CoMap exists.
    const loadedAccount = await account.ensureLoaded({ resolve: { root: true } });

    if (loadedAccount.root.registry === undefined) {
      // If the registry doesn't exist, create it.
      // It will be owned by the worker's account by default.
      // A group is not strictly necessary here if only the worker itself accesses this registry directly,
      // but if other accounts/workers needed to read it, a group with appropriate permissions would be better.
      // For now, default ownership by the worker account is fine.
      const newRegistry = NicknameRegistry.create({});
      loadedAccount.root.registry = newRegistry;
      console.log('NicknameRegistry created in worker account root.');
    } else {
      console.log('NicknameRegistry already exists in worker account root.');
    }
  });

export type NicknameRegistry = z.infer<typeof NicknameRegistry>;
export type RegistryWorkerAccountRoot = z.infer<typeof RegistryWorkerAccountRoot>;
export type RegistryWorkerAccount = z.infer<typeof RegistryWorkerAccount>;
