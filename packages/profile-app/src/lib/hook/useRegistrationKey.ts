import { co, Group, Loaded } from 'jazz-tools';
import { useAccount } from 'jazz-tools/react';
import { useCallback, useMemo } from 'react';

import { WORKER_JAZZ_ID } from '../config/apiKey';
import { OnboardingAccount, RegistrationKey } from '../schema';

const KEY_LIFETIME_HOURS = 24;

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
  if (!account?.profile) {
    console.error('Account profile not available');
    return null;
  }

  const key = generateRegistrationKey();
  const expiresAt = Date.now() + KEY_LIFETIME_HOURS * 60 * 60 * 1000;

  try {
    const keyGroup = Group.create({ owner: account });

    const workerAccount = await co.account().load(WORKER_JAZZ_ID);
    if (!workerAccount) {
      console.error('Failed to load worker account');
      return null;
    }

    keyGroup.addMember(workerAccount, 'reader');

    const registrationKey = RegistrationKey.create(
      {
        key: key,
        expiresAt: expiresAt,
      },
      { owner: keyGroup },
    );

    account.profile.registrationKey = registrationKey;

    console.log(
      'Registration key stored, expires at:',
      new Date(expiresAt).toISOString(),
    );
    return key;
  } catch (error) {
    console.error('Failed to store registration key:', error);
    return null;
  }
}

export function useRegistrationKey() {
  const { me: account } = useAccount<typeof OnboardingAccount>();

  // Memoize the current registration key - to prevents re-accessing nested properties on every render
  const currentRegistrationKey = useMemo(
    () => account?.profile?.registrationKey,
    [account?.profile?.registrationKey],
  );

  // Memoize derived values into one memorized object
  const keyInfo = useMemo(
    () => ({
      currentKey: currentRegistrationKey?.key,
      keyExpiresAt: currentRegistrationKey?.expiresAt,
      hasKey: Boolean(currentRegistrationKey?.key),
      isAccountLoaded: Boolean(account?.profile),
      isKeyExpired: currentRegistrationKey
        ? isKeyExpired(currentRegistrationKey)
        : true,
    }),
    [currentRegistrationKey, account?.profile],
  );

  // Memoize the getValidKey function - to prevents function recreation
  const getValidKey = useCallback(async (): Promise<string | null> => {
    if (!account?.profile) {
      console.error('Account not loaded yet');
      return null;
    }

    // Use the memoized registration key
    if (!currentRegistrationKey || keyInfo.isKeyExpired) {
      console.log('Key missing or expired, generating new one...');
      return await storeRegistrationKey(
        account as Loaded<typeof OnboardingAccount>,
      );
    }

    return currentRegistrationKey.key;
  }, [account, currentRegistrationKey, keyInfo.isKeyExpired]);

  // Memoize the generateAndStore function
  const generateAndStore = useCallback(async (): Promise<string | null> => {
    if (!account?.profile) return null;
    return await storeRegistrationKey(
      account as Loaded<typeof OnboardingAccount>,
    );
  }, [account]);

  return {
    getValidKey,
    generateAndStore,
    ...keyInfo,
  };
}
