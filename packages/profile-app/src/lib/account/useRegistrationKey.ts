import { useCallback } from 'react';

import { useRegardeAuth as useSDKRegardeAuth } from '@regarde-dev/sdk/react';
import {
  generateRegardeAuth,
  getRegardeAuth,
  isKeyExpired,
} from '@regarde-dev/sdk/auth';

import { useMyJazz } from './useMyJazz';

export type GetValidKeyFunctionOutput = Promise<{
  key: string;
  regardeAuthId: string;
} | null>;

export type GetValidKeyFunction = () => GetValidKeyFunctionOutput;

// Re-export SDK utilities for backward compatibility
export { generateRegardeAuth, isKeyExpired, getRegardeAuth };

export function useRegardeAuth() {
  const { account, isAccountReady } = useMyJazz();

  const regardeAuth = account?.root?.['auth.regarde.bio'];
  const isLoading = account === undefined;
  const isAccessible = regardeAuth !== null;

  // Use SDK hook for core registration key functionality
  const sdkHook = useSDKRegardeAuth(regardeAuth);

  const getValidKey = useCallback(async (): GetValidKeyFunctionOutput => {
    if (!account?.root || !isAccountReady) {
      return null;
    }

    if (isLoading) {
      return null;
    }

    // Check if key is expired or missing
    if (!regardeAuth || sdkHook.isExpired) {
      // Refresh the key using SDK's refresh function
      await sdkHook.refresh();

      // After refresh, get the updated registration key
      const updatedRegardeAuth = account.root?.['auth.regarde.bio'];
      if (!updatedRegardeAuth?.key) return null;

      return {
        key: updatedRegardeAuth.key,
        regardeAuthId: updatedRegardeAuth.$jazz.id,
      };
    }

    // Return existing valid key
    return {
      key: regardeAuth.key,
      regardeAuthId: regardeAuth.$jazz.id,
    };
  }, [account, isAccountReady, regardeAuth, isLoading, sdkHook]);

  return {
    getValidKey,
    isAccountReady,
    hasRegardeAuth: Boolean(regardeAuth),
    isKeyExpired: sdkHook.isExpired,
    isRegardeAuthLoading: isLoading,
    isRegardeAuthAccessible: isAccessible,
  };
}
