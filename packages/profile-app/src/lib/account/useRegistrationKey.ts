import { useCallback } from 'react';

import { useRegistrationKey as useSDKRegistrationKey } from '@regarde-dev/sdk/react';
import {
  generateRegistrationKey,
  getRegistrationKey,
  isKeyExpired,
} from '@regarde-dev/sdk/auth';

import { useMyJazz } from './useMyJazz';

export type GetValidKeyFunctionOutput = Promise<{
  key: string;
  registrationKeyId: string;
} | null>;

export type GetValidKeyFunction = () => GetValidKeyFunctionOutput;

// Re-export SDK utilities for backward compatibility
export { generateRegistrationKey, isKeyExpired, getRegistrationKey };

export function useRegistrationKey() {
  const { account, isAccountReady } = useMyJazz();

  const registrationKey = account?.root?.['auth.regarde.bio'];
  const isLoading = account === undefined;
  const isAccessible = registrationKey !== null;

  // Use SDK hook for core registration key functionality
  const sdkHook = useSDKRegistrationKey(registrationKey);

  const getValidKey = useCallback(async (): GetValidKeyFunctionOutput => {
    if (!account?.root || !isAccountReady) {
      return null;
    }

    if (isLoading) {
      return null;
    }

    // Check if key is expired or missing
    if (!registrationKey || sdkHook.isExpired) {
      // Refresh the key using SDK's refresh function
      await sdkHook.refresh();

      // After refresh, get the updated registration key
      const updatedRegistrationKey = account.root?.['auth.regarde.bio'];
      if (!updatedRegistrationKey?.key) return null;

      return {
        key: updatedRegistrationKey.key,
        registrationKeyId: updatedRegistrationKey.$jazz.id,
      };
    }

    // Return existing valid key
    return {
      key: registrationKey.key,
      registrationKeyId: registrationKey.$jazz.id,
    };
  }, [account, isAccountReady, registrationKey, isLoading, sdkHook]);

  return {
    getValidKey,
    isAccountReady,
    hasRegistrationKey: Boolean(registrationKey),
    isKeyExpired: sdkHook.isExpired,
    isRegistrationKeyLoading: isLoading,
    isRegistrationKeyAccessible: isAccessible,
  };
}
