import { co, Group, Loaded } from 'jazz-tools';
import { useCallback } from 'react';

import { WORKER_JAZZ_ID } from '../config/apiKey';
import { OnboardingAccount, RegistrationKey } from '../schema';
import { useMyAccount } from './useMyAccount';

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
  const { account, profile, isAccountReady } = useMyAccount();

  const currentRegistrationKey = isAccountReady
    ? profile?.registrationKey
    : undefined;

  const getValidKey = useCallback(async (): Promise<string | null> => {
    if (!account?.profile || !isAccountReady) {
      console.log('Account not ready yet');
      return null;
    }

    const keyExpired = currentRegistrationKey
      ? isKeyExpired(currentRegistrationKey)
      : true;

    if (!currentRegistrationKey || keyExpired) {
      console.log('Key missing or expired, generating new one...');
      return await storeRegistrationKey(
        account as Loaded<typeof OnboardingAccount>,
      );
    }

    return currentRegistrationKey.key;
  }, [account, isAccountReady, currentRegistrationKey]);

  return {
    getValidKey,
    isAccountLoaded: Boolean(account?.profile),
    isAccountReady,
    hasRegistrationKey: Boolean(currentRegistrationKey),
    isKeyExpired: currentRegistrationKey
      ? isKeyExpired(currentRegistrationKey)
      : true,
  };
}
