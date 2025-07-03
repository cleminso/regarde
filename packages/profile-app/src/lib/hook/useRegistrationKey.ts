import { co, Group, Loaded } from 'jazz-tools';
import { useAccount } from 'jazz-tools/react';

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

  const getValidKey = async (): Promise<string | null> => {
    if (!account?.profile) {
      console.error('Account not loaded yet');
      return null;
    }

    const currentKey = account.profile.registrationKey;

    if (!currentKey || isKeyExpired(currentKey)) {
      console.log('Key missing or expired, generating new one...');
      return await storeRegistrationKey(
        account as Loaded<typeof OnboardingAccount>,
      );
    }

    return currentKey.key;
  };

  const currentKey = account?.profile?.registrationKey?.key;
  const keyExpiresAt = account?.profile?.registrationKey?.expiresAt;

  return {
    getValidKey,
    currentKey,
    keyExpiresAt,
    hasKey: Boolean(currentKey),
    isAccountLoaded: Boolean(account?.profile),
    generateAndStore: async () => {
      if (!account?.profile) return null;
      return await storeRegistrationKey(
        account as Loaded<typeof OnboardingAccount>,
      );
    },
  };
}
