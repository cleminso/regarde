// Focused on registration key state
import { useCoState } from 'jazz-tools/react';

import { RegistrationKey } from '../schema';
import { useMyJazz } from './useMyJazz';

export function useRegistrationKeyData() {
  const { jazzAppProfile: appRoot } = useMyJazz();

  const registrationKeyId = appRoot?.registrationKey?.id;

  const registrationKey = useCoState(RegistrationKey, registrationKeyId);

  return {
    registrationKey,
    isLoading: registrationKey === undefined,
    isAccessible: registrationKey !== null,
    isAvailable: Boolean(registrationKey),
  };
}
