import { z } from "jazz-tools";
export declare const NicknameRegistryCoRecord: import("jazz-tools/dist/internal").CoRecordSchema<z.z.ZodString, z.z.ZodString>;
export type NicknameRegistry = z.infer<typeof NicknameRegistryCoRecord>;
export declare const ReverseNicknameRegistryCoRecord: import("jazz-tools/dist/internal").CoRecordSchema<z.z.ZodString, z.z.ZodString>;
export type ReverseNicknameRegistry = z.infer<typeof ReverseNicknameRegistryCoRecord>;
export declare const RegistryWorkerAccountRoot: import("jazz-tools").CoMapSchema<{
    registry: import("jazz-tools/dist/internal").CoRecordSchema<z.z.ZodString, z.z.ZodString>;
    reverseRegistry: import("jazz-tools/dist/internal").CoRecordSchema<z.z.ZodString, z.z.ZodString>;
}>;
export type RegistryWorkerAccountRoot = z.infer<typeof RegistryWorkerAccountRoot>;
export declare const RegistryWorkerAccount: import("jazz-tools").AccountSchema<{
    profile: import("jazz-tools/dist/internal").CoProfileSchema<{
        name: z.z.core.$ZodString<string>;
        inbox?: z.z.core.$ZodOptional<z.z.core.$ZodString>;
        inboxInvite?: z.z.core.$ZodOptional<z.z.core.$ZodString>;
    }>;
    root: import("jazz-tools").CoMapSchema<{
        registry: import("jazz-tools/dist/internal").CoRecordSchema<z.z.ZodString, z.z.ZodString>;
        reverseRegistry: import("jazz-tools/dist/internal").CoRecordSchema<z.z.ZodString, z.z.ZodString>;
    }>;
}>;
export type RegistryWorkerAccountType = z.infer<typeof RegistryWorkerAccount>;
