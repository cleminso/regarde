import { useCoState } from 'jazz-tools/react';

import { RegistrationKey } from '../schema';
import { useMyAccount } from './useMyAccount';

export function useRegistrationKeyData() {
  const { profile, hasStableProfile } = useMyAccount();

  const registrationKeyId =
    hasStableProfile && profile?.registrationKey?.id
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
