import { useCoState } from "jazz-tools/react";
import type { MaybeLoaded } from "jazz-tools";

import { LicenseEvent } from "#schemas/licenseEvent";
import type { TLicenseEvent, TLicenseStatus } from "#schemas/licenseEvent";

export interface TUseLicenseCheckOptions {
  licenseEventId: string;
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
export function useLicenseCheck(
  options: TUseLicenseCheckOptions,
): TUseLicenseCheckResult {
  const license = useCoState(LicenseEvent, options.licenseEventId as any);

  const isLoading = license === undefined;

  const status =
    license !== null && license !== undefined && license.$isLoaded === true
      ? license.status
      : null;

  const isValid = status === "active";

  return {
    license,
    status,
    isValid,
    isLoading,
  };
}