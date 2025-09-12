import { Loaded } from 'jazz-tools';
import { useCallback } from 'react';

import { OnboardingAccount } from '../schema';
import { useMyJazz } from './useMyJazz';

export type GetValidKeyFunctionOutput = Promise<{
  key: string;
  registrationKeyId: string;
} | null>;

export type GetValidKeyFunction = () => GetValidKeyFunctionOutput;

const KEY_LIFETIME_SECONDS = 24 * 60 * 60;

export function generateRegistrationKey(): string {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*"[]{}';
  let result = '';
  for (let i = 0; i < 16; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function isKeyExpired(registrationKey: any): boolean {
  if (!registrationKey?.expiresAt) return true;
  return Date.now() > registrationKey.expiresAt;
}

export async function storeRegistrationKey(
  account: Loaded<typeof OnboardingAccount>,
): Promise<string | null> {
  if (!account?.root || !account.root['auth.regarde.dev']) {
    console.error('Account root or auth.regarde.dev not available');
    return null;
  }

  await account.$jazz.ensureLoaded({
    resolve: {
      root: {
        'auth.regarde.dev': true,
      },
    },
  });

  const key = generateRegistrationKey();

  try {
    account.root['auth.regarde.dev'].$jazz.set('key', key);
    account.root['auth.regarde.dev'].$jazz.set('expiresAt', Date.now() + KEY_LIFETIME_SECONDS * 1000);

    await account.$jazz.waitForSync();

    return key;
  } catch (error) {
    console.error('Failed to store registration key:', error);
    return null;
  }
}

export function useRegistrationKey() {
  const { account, isAccountReady } = useMyJazz();

  // Access registration key from account.root['auth.regarde.dev']
  const registrationKey = account?.root?.['auth.regarde.dev'];
  const isLoading = account === undefined;
  const isAccessible = registrationKey !== null;

  const getValidKey = useCallback(async (): GetValidKeyFunctionOutput => {
    if (!account?.root || !isAccountReady) {
      return null;
    }

    if (isLoading) {
      return null;
    }

    const keyExpired = registrationKey ? isKeyExpired(registrationKey) : true;

    if (!registrationKey || keyExpired) {
      const key = await storeRegistrationKey(
        account as Loaded<typeof OnboardingAccount>,
      );
      if (!key || registrationKey === undefined) return null;
      return { key, registrationKeyId: registrationKey.$jazz.id };
    }

    return { key: registrationKey.key, registrationKeyId: registrationKey.$jazz.id };
  }, [account, isAccountReady, registrationKey, isLoading]);

  return {
    getValidKey,
    isAccountReady,
    hasRegistrationKey: Boolean(registrationKey),
    isKeyExpired: registrationKey ? isKeyExpired(registrationKey) : true,

    isRegistrationKeyLoading: isLoading,
    isRegistrationKeyAccessible: isAccessible,
  };
}
