import { co, z } from "jazz-tools";

export const NicknameRegistryCoRecord = co.record(z.string(), z.string());
export type NicknameRegistry = z.infer<typeof NicknameRegistryCoRecord>;

export const ReverseNicknameRegistryCoRecord = co.record(
  z.string(),
  z.string(),
);
export type ReverseNicknameRegistry = z.infer<
  typeof ReverseNicknameRegistryCoRecord
>;

export const RegistryAuditEntry = co.map({
  monotonicId: z.string(),
  timestamp: z.number(),
  jazzAccountId: z.string(),
  oldNickname: z.optional(z.string()),
  newNickname: z.optional(z.string()),
  changedBy: z.string(),
  source: z.enum(["admin-cli", "user-app", "worker"]),
});
export type RegistryAuditEntry = z.infer<typeof RegistryAuditEntry>;

export const RegistryAuditLog = co.list(RegistryAuditEntry);
export type RegistryAuditLog = z.infer<typeof RegistryAuditLog>;

export const RegistryWorkerAccountRoot = co.map({
  registry: NicknameRegistryCoRecord,
  reverseRegistry: ReverseNicknameRegistryCoRecord,
  auditLog: RegistryAuditLog,
});
export type RegistryWorkerAccountRoot = z.infer<
  typeof RegistryWorkerAccountRoot
>;

export const RegistryWorkerAccount: ReturnType<typeof co.account> = co
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

      // Ensure root exists after loading
      if (!loadedAccount.root) {
        const newRoot = RegistryWorkerAccountRoot.create({
          registry: NicknameRegistryCoRecord.create({}),
          reverseRegistry: ReverseNicknameRegistryCoRecord.create({}),
          auditLog: RegistryAuditLog.create([]),
        });
        loadedAccount.root = newRoot;
        console.log("Root created after ensureLoaded since it was missing.");
        return;
      }

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
      // Initialize audit log if missing
      if (loadedAccount.root.auditLog === undefined) {
        const newAuditLog = RegistryAuditLog.create([]);
        loadedAccount.root.auditLog = newAuditLog;
        console.log("AuditLog created in worker account root.");
      }
    } catch (e) {
      console.log("EnsureLoaded Root failed, fallback", account, e);

      // Handle the case where root is null or undefined
      if (!account.root) {
        const newRoot = RegistryWorkerAccountRoot.create({
          registry: NicknameRegistryCoRecord.create({}),
          reverseRegistry: ReverseNicknameRegistryCoRecord.create({}),
          auditLog: RegistryAuditLog.create([]),
        });
        account.root = newRoot;

        console.log(
          "Root created with NicknameRegistry, ReverseNicknameRegistry, and AuditLog in worker account since it was missing.",
        );
      } else {
        if (account.root.registry === undefined) {
          const newRegistry = NicknameRegistryCoRecord.create({});
          account.root.registry = newRegistry;
          console.log(
            "NicknameRegistry created in existing root during fallback.",
          );
        }
        if (account.root.reverseRegistry === undefined) {
          const newReverseRegistry = ReverseNicknameRegistryCoRecord.create({});
          account.root.reverseRegistry = newReverseRegistry;
          console.log(
            "ReverseNicknameRegistry created in existing root during fallback.",
          );
        }
        if (account.root.auditLog === undefined) {
          const newAuditLog = RegistryAuditLog.create([]);
          account.root.auditLog = newAuditLog;
          console.log("AuditLog created in existing root during fallback.");
        }
      }
    }
  });
