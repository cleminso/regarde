import { useCallback } from 'react';

import { useRegardeAuth as useSDKRegardeAuth } from '@regarde-dev/sdk/react';

import { useMyRegardeAccount } from './useMyRegardeAccount';

export type GetValidKeyFunctionOutput = Promise<{
  token: string;
  tokenId: string;
} | null>;

export type GetValidKeyFunction = () => GetValidKeyFunctionOutput;

export function useRegardeAuth() {
  const { account, isAccountReady } = useMyRegardeAccount();

  const regardeAuth = account?.root?.['api.regarde.dev'];
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

    // Check if token is expired or missing
    if (!regardeAuth || sdkHook.isExpired) {
      // Refresh the token using SDK's refresh function
      await sdkHook.refresh();

      // After refresh, get the updated token from SDK hook
      // The SDK hook will have the latest values after refresh
      if (!sdkHook.token || !sdkHook.tokenId) return null;

      return {
        token: sdkHook.token,
        tokenId: sdkHook.tokenId,
      };
    }

    // Return existing valid token from SDK hook
    if (!sdkHook.token || !sdkHook.tokenId) return null;

    return {
      token: sdkHook.token,
      tokenId: sdkHook.tokenId,
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
