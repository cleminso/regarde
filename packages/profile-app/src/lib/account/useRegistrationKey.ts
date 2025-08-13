// Registration key management
import { co, Group, Loaded } from 'jazz-tools';
import { useCallback } from 'react';

import { WORKER_JAZZ_ID } from '../config/apiKey';
import { OnboardingAccount, RegistrationKey } from '../schema';
import { useMyAccount } from './useMyAccount';
import { useRegistrationKeyData } from './useRegistrationKeyData';

const KEY_LIFETIME_SECONDS = 60;

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
  const expiresAt = Date.now() + KEY_LIFETIME_SECONDS * 1000;

  try {
    const keyGroup = Group.create({ owner: account });

    const workerAccount = await co.account().load(WORKER_JAZZ_ID);
    if (!workerAccount) {
      console.error('Failed to load worker account');
      return null;
    }

    keyGroup.addMember(workerAccount, 'reader');

    const registrationKey = RegistrationKey.create(
      { key, expiresAt },
      { owner: keyGroup },
    );

    account.profile.registrationKey = registrationKey;
    console.log('Registration key stored successfully');
    return key;
  } catch (error) {
    console.error('Failed to store registration key:', error);
    return null;
  }
}

export function useRegistrationKey() {
  const { account, isAccountReady } = useMyAccount();

  // TODO: Replace with code from useRegistrationKeyData
  const { registrationKey, isLoading, isAccessible } = useRegistrationKeyData();

  const getValidKey = useCallback(async (): Promise<string | null> => {
    if (!account?.profile || !isAccountReady) {
      console.log('Account not ready yet');
      return null;
    }

    // Wait for registration key to load if it's still loading
    if (isLoading) {
      console.log('Registration key loading...');
      return null;
    }

    const keyExpired = registrationKey ? isKeyExpired(registrationKey) : true;

    if (!registrationKey || keyExpired) {
      console.log('Key missing or expired, generating new one...');
      return await storeRegistrationKey(
        account as Loaded<typeof OnboardingAccount>,
      );
    }

    return registrationKey.key;
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
