import { co } from "jazz-tools";

/**
 * ProfileWorkerAccount - Worker account for api.regarde.bio service
 *
 * This worker is used by api.regarde.bio to load user profiles (RegardeAccount and RegardeProfile).
 * It has read-only access to user data and does not manage any registries.
 *
 * Separation from RegistryWorkerAccount:
 * - RegistryWorkerAccount (api.regarde.dev): Manages nickname registries, has write access
 * - ProfileWorkerAccount (api.regarde.bio): Reads user profiles, no registry access
 */

export const ProfileWorkerAccountRoot = co.map({
  // Empty root - this worker only needs read access to user profiles
  // No registries, no audit logs - just profile loading capabilities
});

export type ProfileWorkerAccountRoot = co.loaded<typeof ProfileWorkerAccountRoot>;

export const ProfileWorkerAccount = co.account({
  profile: co.profile(),
  root: ProfileWorkerAccountRoot,
});

export type ProfileWorkerAccount = co.loaded<typeof ProfileWorkerAccount>;
