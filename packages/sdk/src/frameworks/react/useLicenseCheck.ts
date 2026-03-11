import type { MaybeLoaded, ID } from "jazz-tools";
import { useCoState } from "jazz-tools/react";

import { LicenseEvent } from "#schemas/licenseEvent";
import type { TLicenseEvent, TLicenseStatus } from "#schemas/licenseEvent";

export interface TUseLicenseCheckOptions {
  licenseEventId: ID<typeof LicenseEvent>;
}

export interface TUseLicenseCheckResult {
  license: MaybeLoaded<TLicenseEvent>;
  status: TLicenseStatus | null;
  isValid: boolean;
  isLoading: boolean;
}

/**
 * React hook for checking a license's real-time status.
 *
 * Jazz sync propagates license changes from the worker automatically.
 *
 * @param options - Options containing the license event ID
 * @returns The license, status, and loading state
 */
export function useLicenseCheck(options: TUseLicenseCheckOptions): TUseLicenseCheckResult {
  const license = useCoState(LicenseEvent, options.licenseEventId);

  const isLoading = license === undefined;

  const status =
    license !== null && license !== undefined && license.$isLoaded === true ? license.status : null;

  const isValid = status === "active";

  return {
    license,
    status,
    isValid,
    isLoading,
  };
}
