// Focused on registration key state
import { useCoState } from 'jazz-tools/react';

import { RegistrationKey } from '../schema';
import { useMyAccount } from './useMyAccount';

export function useRegistrationKeyData() {
  const { profile, isAccountReady } = useMyAccount();

  const registrationKeyId =
    isAccountReady && profile?.registrationKey?.id
      ? profile.registrationKey.id
      : undefined;

  const registrationKey = useCoState(RegistrationKey, registrationKeyId);

  return {
    registrationKey,
    isLoading: registrationKey === undefined,
    isAccessible: registrationKey !== null,
    isAvailable: Boolean(registrationKey),
  };
}
