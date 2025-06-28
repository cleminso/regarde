import { co, Group, Loaded } from 'jazz-tools';
import { useAccount } from 'jazz-tools/react';

import { WORKER_JAZZ_ID } from './apiKey';
import { OnboardingAccount, RegistrationKey } from './schema';

export function generateRegistrationKey(): string {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*"[]{}';
  let result = '';
  for (let i = 0; i < 16; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function storeRegistrationKey(
  account: Loaded<typeof OnboardingAccount>,
): Promise<string | null> {
  if (!account?.root) {
    console.error('Account root not available');
    return null;
  }

  const key = generateRegistrationKey();

  try {
    const keyGroup = Group.create({ owner: account });

    const workerAccount = await co.account().load(WORKER_JAZZ_ID);
    if (!workerAccount) {
      console.error('Failed to load worker account');
      return null;
    }

    keyGroup.addMember(workerAccount, 'reader');

    const registrationKey = RegistrationKey.create(
      { key: key },
      { owner: keyGroup },
    );

    account.root.registrationKey = registrationKey;

    return key;
  } catch (error) {
    console.error('Failed to store registration key:', error);
    return null;
  }
}

export function useRegistrationKey() {
  const { me: account } = useAccount<typeof OnboardingAccount>();

  const generateAndStore = async (): Promise<string | null> => {
    if (!account || !account.root) {
      console.error('Account not loaded yet');
      return null;
    }

    return await storeRegistrationKey(
      account as Loaded<typeof OnboardingAccount>,
    );
  };

  const currentKey = account?.root?.registrationKey?.key;

  return {
    generateAndStore,
    currentKey,
    hasKey: Boolean(currentKey),
    isAccountLoaded: Boolean(account?.root),
  };
}
