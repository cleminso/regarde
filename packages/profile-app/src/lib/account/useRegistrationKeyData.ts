// Focused on registration key state
import { useCoState } from 'jazz-tools/react';

import { RegistrationKey } from '../schema';
import { useMyAccount } from './useMyAccount';

export function useRegistrationKeyData() {
  const { jazzAppProfile: appRoot } = useMyAccount();

  const registrationKeyId = appRoot?.registrationKey?.id;

  const registrationKey = useCoState(RegistrationKey, registrationKeyId);

  return {
    registrationKey,
    isLoading: registrationKey === undefined,
    isAccessible: registrationKey !== null,
    isAvailable: Boolean(registrationKey),
  };
}
